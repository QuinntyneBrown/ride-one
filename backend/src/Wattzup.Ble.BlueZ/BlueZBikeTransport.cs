using System.Collections.Concurrent;
using Tmds.DBus.Protocol;
using Wattzup.Ble.Abstractions;

namespace Wattzup.Ble.BlueZ;

/// <summary>
/// The Linux transport (L2-043): BlueZ 5.50 or later over the system D-Bus. <c>Adapter1.Powered</c> is the
/// adapter state; a scan is an LE discovery session; the link is <c>Device1</c> and its GATT characteristics.
/// Not yet a supported transport: it has not passed its hardware smoke test.
/// </summary>
public sealed class BlueZBikeTransport : IBikeTransport, IAsyncDisposable
{
    private static readonly HashSet<string> SightingProperties = new(StringComparer.Ordinal)
    {
        "RSSI", "TxPower", "ManufacturerData", "ServiceData", "Name", "UUIDs",
    };

    private readonly string? _adapterName;
    private readonly SemaphoreSlim _open = new(1, 1);
    private readonly ConcurrentDictionary<string, string> _devicePaths = new(StringComparer.OrdinalIgnoreCase);
    private readonly Lock _stateLock = new();
    private BlueZBus? _bus;
    private string? _adapterPath;
    private BluetoothAdapterState _adapterState = BluetoothAdapterState.Unknown;
    private bool _disposed;

    /// <param name="adapterName">The adapter to use, such as <c>hci0</c>; null uses the first adapter BlueZ reports.</param>
    public BlueZBikeTransport(string? adapterName = null)
    {
        _adapterName = string.IsNullOrWhiteSpace(adapterName) ? null : adapterName;
    }

    public string Name => "BlueZ";

    public BluetoothAdapterState AdapterState
    {
        get
        {
            lock (_stateLock)
            {
                return _adapterState;
            }
        }
    }

    public event Action<BluetoothAdapterState>? AdapterStateChanged;

    public async Task<BikeAdvertisement?> ScanAsync(Func<BikeAdvertisement, bool> filter, TimeSpan timeout, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(filter);
        var bus = await EnsureBusAsync(cancellationToken).ConfigureAwait(false);
        var adapterPath = RequireAdapter();
        var devicePrefix = adapterPath + "/";
        var found = new TaskCompletionSource<BikeAdvertisement>(TaskCreationOptions.RunContinuationsAsynchronously);
        var devices = new Dictionary<string, Dictionary<string, VariantValue>>(StringComparer.Ordinal);

        void Consider(string path, Dictionary<string, VariantValue> properties, bool sighted)
        {
            Dictionary<string, VariantValue> merged;
            lock (devices)
            {
                if (!devices.TryGetValue(path, out merged!))
                {
                    merged = new Dictionary<string, VariantValue>(StringComparer.Ordinal);
                    devices[path] = merged;
                }

                foreach (var (key, value) in properties)
                {
                    merged[key] = value;
                }

                if (!sighted)
                {
                    return;
                }

                merged = new Dictionary<string, VariantValue>(merged, StringComparer.Ordinal);
            }

            var advertisement = ToAdvertisement(path, merged);
            try
            {
                if (filter(advertisement))
                {
                    _devicePaths[advertisement.Address] = path;
                    found.TrySetResult(advertisement);
                }
            }
#pragma warning disable CA1031 // The filter's exception is handed to the caller of ScanAsync.
            catch (Exception ex)
#pragma warning restore CA1031
            {
                found.TrySetException(ex);
            }
        }

        void OnEvent(BusEvent busEvent)
        {
            switch (busEvent)
            {
                case InterfacesAdded added when added.Path.StartsWith(devicePrefix, StringComparison.Ordinal)
                    && added.Interfaces.TryGetValue(BlueZBus.Device1, out var properties):
                    Consider(added.Path, properties, sighted: true);
                    break;
                case PropertiesChanged changed when changed.Interface == BlueZBus.Device1
                    && changed.Path.StartsWith(devicePrefix, StringComparison.Ordinal):
                    Consider(changed.Path, changed.Changed, sighted: changed.Changed.Keys.Any(SightingProperties.Contains));
                    break;
                case PropertiesChanged changed when changed.Path == adapterPath && changed.Interface == BlueZBus.Adapter1
                    && changed.Changed.TryGetValue("Powered", out var powered) && !powered.GetBool():
                    found.TrySetException(new BluetoothUnavailableException("Bluetooth is off."));
                    break;
                case InterfacesRemoved removed when removed.Path == adapterPath && removed.Interfaces.Contains(BlueZBus.Adapter1):
                    found.TrySetException(new BluetoothUnavailableException("The Bluetooth adapter was removed."));
                    break;
                case BusClosed:
                    found.TrySetException(new BluetoothUnavailableException("The D-Bus system bus connection closed."));
                    break;
            }
        }

        bus.EventReceived += OnEvent;
        var discovering = false;
        try
        {
            await bus.CallAsync(adapterPath, BlueZBus.Adapter1, "SetDiscoveryFilter", cancellationToken, "a{sv}", static (ref MessageWriter w) =>
                w.WriteDictionary(new Dictionary<string, VariantValue> { ["Transport"] = VariantValue.String("le") })).ConfigureAwait(false);
            try
            {
                await bus.CallAsync(adapterPath, BlueZBus.Adapter1, "StartDiscovery", cancellationToken).ConfigureAwait(false);
            }
            catch (DBusErrorReplyException ex) when (ex.ErrorName == "org.bluez.Error.InProgress")
            {
                // Another session of this client is already discovering; its results reach us all the same.
            }

            discovering = true;

            // Devices BlueZ already knows raise no InterfacesAdded. Their properties are recorded here, and one
            // with an RSSI has been heard in this discovery; the others count once an advertisement updates them.
            var objects = await bus.GetManagedObjectsAsync(cancellationToken).ConfigureAwait(false);
            foreach (var (path, interfaces) in objects)
            {
                if (path.StartsWith(devicePrefix, StringComparison.Ordinal) && interfaces.TryGetValue(BlueZBus.Device1, out var properties))
                {
                    Consider(path, properties, sighted: properties.ContainsKey("RSSI"));
                }
            }

            return await found.Task.WaitAsync(timeout, cancellationToken).ConfigureAwait(false);
        }
        catch (TimeoutException) when (!found.Task.IsCompleted)
        {
            return null;
        }
        finally
        {
            bus.EventReceived -= OnEvent;
            if (discovering)
            {
                await StopDiscoveryAsync(bus, adapterPath).ConfigureAwait(false);
            }
        }
    }

    public async Task<IBikeConnection> ConnectAsync(BikeAdvertisement advertisement, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(advertisement);
        var bus = await EnsureBusAsync(cancellationToken).ConfigureAwait(false);
        var adapterPath = RequireAdapter();
        var devicePath = _devicePaths.TryGetValue(advertisement.Address, out var known)
            ? known
            : $"{adapterPath}/dev_{advertisement.Address.Replace(':', '_').ToUpperInvariant()}";

        var connection = new BlueZBikeConnection(bus, devicePath);
        try
        {
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);
            return connection;
        }
        catch
        {
            await connection.DisposeAsync().ConfigureAwait(false);
            throw;
        }
    }

    public async ValueTask DisposeAsync()
    {
        BlueZBus? bus;
        await _open.WaitAsync().ConfigureAwait(false);
        try
        {
            _disposed = true;
            bus = _bus;
            _bus = null;
        }
        finally
        {
            _open.Release();
        }

        if (bus is not null)
        {
            bus.EventReceived -= OnBusEvent;
            await bus.DisposeAsync().ConfigureAwait(false);
        }

        _open.Dispose();
    }

    private static BikeAdvertisement ToAdvertisement(string path, Dictionary<string, VariantValue> properties)
    {
        var name = properties.TryGetValue("Name", out var n) && n.Type == VariantValueType.String ? n.GetString() : null;
        var address = properties.TryGetValue("Address", out var a) && a.Type == VariantValueType.String
            ? a.GetString()
            : AddressFromPath(path);
        var uuids = properties.TryGetValue("UUIDs", out var u) && u.Type == VariantValueType.Array
            ? u.GetArray<string>()
            : [];
        return new BikeAdvertisement(name, address, uuids);
    }

    private static string AddressFromPath(string path)
    {
        var leaf = path[(path.LastIndexOf('/') + 1)..];
        return leaf.StartsWith("dev_", StringComparison.Ordinal) ? leaf[4..].Replace('_', ':') : leaf;
    }

    private static async Task StopDiscoveryAsync(BlueZBus bus, string adapterPath)
    {
        try
        {
            using var stop = new CancellationTokenSource(TimeSpan.FromSeconds(2));
            await bus.CallAsync(adapterPath, BlueZBus.Adapter1, "StopDiscovery", stop.Token).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is DBusExceptionBase or BluetoothUnavailableException or OperationCanceledException or TimeoutException)
        {
            // Best effort: discovery ends with this client's session anyway, and the adapter may already be gone.
        }
    }

    private string RequireAdapter()
    {
        lock (_stateLock)
        {
            if (_adapterPath is null)
            {
                throw new BluetoothUnavailableException("No Bluetooth adapter found.");
            }

            if (_adapterState != BluetoothAdapterState.On)
            {
                throw new BluetoothUnavailableException("Bluetooth is off.");
            }

            return _adapterPath;
        }
    }

    private async Task<BlueZBus> EnsureBusAsync(CancellationToken cancellationToken)
    {
        await _open.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            ObjectDisposedException.ThrowIf(_disposed, this);
            if (_bus is { IsClosed: false } open)
            {
                return open;
            }

            if (_bus is { } closed)
            {
                closed.EventReceived -= OnBusEvent;
                await closed.DisposeAsync().ConfigureAwait(false);
                _bus = null;
            }

            BlueZBus bus;
            try
            {
                bus = await BlueZBus.OpenAsync(cancellationToken).ConfigureAwait(false);
            }
            catch (BluetoothUnavailableException)
            {
                SetAdapter(null, BluetoothAdapterState.Off);
                throw;
            }

            bus.EventReceived += OnBusEvent;
            try
            {
                var objects = await bus.GetManagedObjectsAsync(cancellationToken).ConfigureAwait(false);
                var adapter = objects
                    .Where(o => o.Value.ContainsKey(BlueZBus.Adapter1) && IsChosenAdapter(o.Key))
                    .OrderBy(o => o.Key, StringComparer.Ordinal)
                    .Select(o => (Path: o.Key, Properties: o.Value[BlueZBus.Adapter1]))
                    .FirstOrDefault();
                if (adapter.Path is null)
                {
                    SetAdapter(null, BluetoothAdapterState.Off);
                }
                else
                {
                    SetAdapter(adapter.Path, IsPowered(adapter.Properties) ? BluetoothAdapterState.On : BluetoothAdapterState.Off);
                }
            }
            catch
            {
                bus.EventReceived -= OnBusEvent;
                await bus.DisposeAsync().ConfigureAwait(false);
                if (!cancellationToken.IsCancellationRequested)
                {
                    SetAdapter(null, BluetoothAdapterState.Off);
                }

                throw;
            }

            _bus = bus;
            return bus;
        }
        finally
        {
            _open.Release();
        }
    }

    private bool IsChosenAdapter(string path)
        => _adapterName is null || path.EndsWith("/" + _adapterName, StringComparison.Ordinal);

    private static bool IsPowered(Dictionary<string, VariantValue> properties)
        => properties.TryGetValue("Powered", out var powered) && powered.Type == VariantValueType.Bool && powered.GetBool();

    // Runs on the bus pump (a thread-pool thread), never on the D-Bus receive loop.
    private void OnBusEvent(BusEvent busEvent)
    {
        string? current;
        lock (_stateLock)
        {
            current = _adapterPath;
        }

        switch (busEvent)
        {
            case PropertiesChanged changed when changed.Path == current && changed.Interface == BlueZBus.Adapter1
                && changed.Changed.TryGetValue("Powered", out var powered) && powered.Type == VariantValueType.Bool:
                SetAdapter(current, powered.GetBool() ? BluetoothAdapterState.On : BluetoothAdapterState.Off);
                break;
            case InterfacesAdded added when current is null && IsChosenAdapter(added.Path)
                && added.Interfaces.TryGetValue(BlueZBus.Adapter1, out var properties):
                SetAdapter(added.Path, IsPowered(properties) ? BluetoothAdapterState.On : BluetoothAdapterState.Off);
                break;
            case InterfacesRemoved removed when removed.Path == current && removed.Interfaces.Contains(BlueZBus.Adapter1):
                SetAdapter(null, BluetoothAdapterState.Off);
                break;
            case BusClosed:
                SetAdapter(null, BluetoothAdapterState.Unknown);
                break;
        }
    }

    private void SetAdapter(string? path, BluetoothAdapterState state)
    {
        bool changed;
        lock (_stateLock)
        {
            _adapterPath = path;
            changed = _adapterState != state;
            _adapterState = state;
        }

        if (changed)
        {
            AdapterStateChanged?.Invoke(state);
        }
    }
}
