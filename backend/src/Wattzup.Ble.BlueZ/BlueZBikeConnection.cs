using Tmds.DBus.Protocol;
using Wattzup.Ble.Abstractions;

namespace Wattzup.Ble.BlueZ;

/// <summary>An open link to the bike through BlueZ's <c>Device1</c> and its Echelon GATT characteristics.</summary>
internal sealed class BlueZBikeConnection : IBikeConnection
{
    // GATT addressing of the Echelon service (see docs/protocol/echelon-ble-frames.md). The transport needs it to
    // find the characteristics; it does not reference Wattzup.Protocol (dependency rule), so it keeps its own copy.
    private const string WriteCharacteristicUuid = "0bf669f2-45f2-11e7-9598-0800200c9a66";

    private readonly BlueZBus _bus;
    private readonly string _devicePath;
    private readonly TaskCompletionSource _servicesResolved = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private readonly Dictionary<string, string> _characteristics = new(StringComparer.OrdinalIgnoreCase);
    private string? _writePath;
    private string[] _notifyPaths = [];
    private Action<ReadOnlyMemory<byte>>? _onNotify;
    private int _connected;
    private int _disposed;

    public BlueZBikeConnection(BlueZBus bus, string devicePath)
    {
        _bus = bus;
        _devicePath = devicePath;
        bus.EventReceived += OnEvent;
    }

    public bool IsConnected => Volatile.Read(ref _connected) == 1;

    public event Action? Disconnected;

    /// <summary>Connects, waits for GATT services to resolve and finds the write and notify characteristics.</summary>
    public async Task OpenAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _bus.CallAsync(_devicePath, BlueZBus.Device1, "Connect", cancellationToken).ConfigureAwait(false);
        }
        catch (DBusErrorReplyException ex) when (ex.ErrorName == "org.bluez.Error.AlreadyConnected")
        {
            // BlueZ kept the link from an earlier session; use it.
        }

        var resolved = await _bus.GetPropertyAsync(_devicePath, BlueZBus.Device1, "ServicesResolved", cancellationToken).ConfigureAwait(false);
        if (resolved.Type == VariantValueType.Bool && resolved.GetBool())
        {
            _servicesResolved.TrySetResult();
        }

        await _servicesResolved.Task.WaitAsync(cancellationToken).ConfigureAwait(false);

        var objects = await _bus.GetManagedObjectsAsync(cancellationToken).ConfigureAwait(false);
        var prefix = _devicePath + "/";
        foreach (var (path, interfaces) in objects)
        {
            if (!path.StartsWith(prefix, StringComparison.Ordinal)
                || !interfaces.TryGetValue(BlueZBus.GattCharacteristic1, out var properties)
                || !properties.TryGetValue("UUID", out var uuid)
                || uuid.Type != VariantValueType.String)
            {
                continue;
            }

            _characteristics[uuid.GetString()] = path;
        }

        if (!_characteristics.TryGetValue(WriteCharacteristicUuid, out var writePath))
        {
            throw new InvalidOperationException("The device does not expose the Echelon write characteristic.");
        }

        _writePath = writePath;

        Volatile.Write(ref _connected, 1);
    }

    public async Task SubscribeAsync(IReadOnlyList<string> notifyCharacteristicUuids, Action<ReadOnlyMemory<byte>> onNotify, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(notifyCharacteristicUuids);
        ArgumentNullException.ThrowIfNull(onNotify);
        if (_writePath is null)
        {
            throw new InvalidOperationException("The bike is not connected.");
        }

        var paths = notifyCharacteristicUuids
            .Select(uuid => _characteristics.TryGetValue(uuid, out var path) ? path : null)
            .OfType<string>()
            .ToArray();
        if (paths.Length == 0)
        {
            throw new InvalidOperationException("The device does not expose the Echelon notify characteristic.");
        }

        _onNotify = onNotify;
        Volatile.Write(ref _notifyPaths, paths);
        foreach (var path in paths)
        {
            await _bus.CallAsync(path, BlueZBus.GattCharacteristic1, "StartNotify", cancellationToken).ConfigureAwait(false);
        }
    }

    public Task WriteAsync(ReadOnlyMemory<byte> bytes, bool withResponse, CancellationToken cancellationToken)
    {
        if (!IsConnected || _writePath is not { } writePath)
        {
            throw new InvalidOperationException("The bike is not connected.");
        }

        var type = withResponse ? "request" : "command";
        return _bus.CallAsync(writePath, BlueZBus.GattCharacteristic1, "WriteValue", cancellationToken, "aya{sv}", (ref MessageWriter w) =>
        {
            w.WriteArray(bytes.Span);
            w.WriteDictionary(new Dictionary<string, VariantValue> { ["type"] = VariantValue.String(type) });
        });
    }

    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _disposed, 1) == 1)
        {
            return;
        }

        _bus.EventReceived -= OnEvent;
        Volatile.Write(ref _connected, 0);
        _onNotify = null;
        _servicesResolved.TrySetCanceled();
        if (_bus.IsClosed)
        {
            return;
        }

        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        foreach (var notifyPath in Volatile.Read(ref _notifyPaths))
        {
            await BestEffortAsync(notifyPath, BlueZBus.GattCharacteristic1, "StopNotify", timeout.Token).ConfigureAwait(false);
        }

        await BestEffortAsync(_devicePath, BlueZBus.Device1, "Disconnect", timeout.Token).ConfigureAwait(false);
    }

    private async Task BestEffortAsync(string path, string @interface, string member, CancellationToken cancellationToken)
    {
        try
        {
            await _bus.CallAsync(path, @interface, member, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is DBusExceptionBase or BluetoothUnavailableException or OperationCanceledException or TimeoutException)
        {
            // The link may already be down; disposing must not fail because of it.
        }
    }

    // Runs on the bus pump (a thread-pool thread), never on the D-Bus receive loop.
    private void OnEvent(BusEvent busEvent)
    {
        switch (busEvent)
        {
            case PropertiesChanged changed when changed.Path == _devicePath && changed.Interface == BlueZBus.Device1:
                if (changed.Changed.TryGetValue("ServicesResolved", out var resolved) && resolved.Type == VariantValueType.Bool && resolved.GetBool())
                {
                    _servicesResolved.TrySetResult();
                }

                if (changed.Changed.TryGetValue("Connected", out var connected) && connected.Type == VariantValueType.Bool && !connected.GetBool())
                {
                    Drop();
                }

                break;
            case PropertiesChanged changed when Volatile.Read(ref _notifyPaths).Contains(changed.Path) && changed.Interface == BlueZBus.GattCharacteristic1
                && changed.Changed.TryGetValue("Value", out var value) && value.Type == VariantValueType.Array:
                if (IsConnected && _onNotify is { } onNotify)
                {
                    onNotify(value.GetArray<byte>());
                }

                break;
            case InterfacesRemoved removed when removed.Path == _devicePath && removed.Interfaces.Contains(BlueZBus.Device1):
                Drop();
                break;
            case BusClosed:
                Drop();
                break;
        }
    }

    private void Drop()
    {
        _servicesResolved.TrySetException(new IOException("The bike disconnected before its services were resolved."));
        if (Interlocked.Exchange(ref _connected, 0) == 1)
        {
            Disconnected?.Invoke();
        }
    }
}
