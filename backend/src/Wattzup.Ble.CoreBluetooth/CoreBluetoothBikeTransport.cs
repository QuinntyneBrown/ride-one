using System.Collections.Concurrent;
using System.Runtime.Versioning;
using Wattzup.Ble.Abstractions;
using Wattzup.Ble.CoreBluetooth.Interop;

namespace Wattzup.Ble.CoreBluetooth;

/// <summary>
/// The macOS transport: CBCentralManager on a private serial dispatch queue, reached through the Objective-C runtime
/// from plain net10.0 (ADR 0008). Callbacks are moved to the thread pool before any handler runs.
/// </summary>
[SupportedOSPlatform("macos")]
public sealed class CoreBluetoothBikeTransport : IBikeTransport, IBleCallbacks, IDisposable
{
    internal const string ServiceUuid = "0bf669f1-45f2-11e7-9598-0800200c9a66";
    internal const string WriteUuid = "0bf669f2-45f2-11e7-9598-0800200c9a66";
    internal const string NotifyUuid = "0bf669f4-45f2-11e7-9598-0800200c9a66";
    internal const string SecondNotifyUuid = "0bf669f3-45f2-11e7-9598-0800200c9a66";

    private static readonly TimeSpan StateWait = TimeSpan.FromSeconds(5);

    private readonly IntPtr _central;
    private readonly ConcurrentDictionary<string, IntPtr> _peripherals = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<IntPtr, CoreBluetoothBikeConnection> _connections = new();
    private readonly SemaphoreSlim _scanGate = new(1, 1);
    private volatile int _managerState;
    private Action<BikeAdvertisement>? _onDiscovered;
    private readonly TaskCompletionSource _stateKnown = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public CoreBluetoothBikeTransport()
    {
        using var pool = AutoreleasePool.Push();
        Foundation.EnsureLoaded();
        var queue = Dispatch.dispatch_queue_create("app.wattzup.corebluetooth", IntPtr.Zero);
        var callbacks = BleDelegate.Create(this);
        _central = ObjC.Send(ObjC.Send(ObjC.Class("CBCentralManager"), ObjC.Sel("alloc")), ObjC.Sel("initWithDelegate:queue:"), callbacks, queue);
    }

    public string Name => "CoreBluetooth";

    /// <summary>CBManagerState: PoweredOn is On; PoweredOff, Unauthorized and Unsupported are Off; others Unknown.</summary>
    public BluetoothAdapterState AdapterState => _managerState switch
    {
        5 => BluetoothAdapterState.On,
        2 or 3 or 4 => BluetoothAdapterState.Off,
        _ => BluetoothAdapterState.Unknown,
    };

    public event Action<BluetoothAdapterState>? AdapterStateChanged;

    internal IntPtr Central => _central;

    public async Task<BikeAdvertisement?> ScanAsync(Func<BikeAdvertisement, bool> filter, TimeSpan timeout, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(filter);
        await EnsurePoweredOnAsync(cancellationToken).ConfigureAwait(false);
        await _scanGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        var found = new TaskCompletionSource<BikeAdvertisement?>(TaskCreationOptions.RunContinuationsAsynchronously);
        try
        {
            _onDiscovered = ad =>
            {
                if (filter(ad))
                {
                    found.TrySetResult(ad);
                }
            };
            using (AutoreleasePool.Push())
            {
                ObjC.SendVoid(_central, ObjC.Sel("scanForPeripheralsWithServices:options:"), IntPtr.Zero, IntPtr.Zero);
            }

            using var off = Watch(() => found.TrySetException(Unavailable()));
            return await found.Task.WaitAsync(timeout, cancellationToken).ConfigureAwait(false);
        }
        catch (TimeoutException)
        {
            return null;
        }
        finally
        {
            _onDiscovered = null;
            using (AutoreleasePool.Push())
            {
                ObjC.SendVoid(_central, ObjC.Sel("stopScan"));
            }

            _scanGate.Release();
        }
    }

    public async Task<IBikeConnection> ConnectAsync(BikeAdvertisement advertisement, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(advertisement);
        await EnsurePoweredOnAsync(cancellationToken).ConfigureAwait(false);
        if (!_peripherals.TryGetValue(advertisement.Address, out var peripheral))
        {
            throw new InvalidOperationException("The bike was not seen in a scan.");
        }

        var connection = new CoreBluetoothBikeConnection(this, peripheral);
        _connections[peripheral] = connection;
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

    public void Dispose()
    {
        _scanGate.Dispose();
        foreach (var peripheral in _peripherals.Values)
        {
            ObjC.objc_release(peripheral);
        }

        _peripherals.Clear();
    }

    internal void Forget(IntPtr peripheral) => _connections.TryRemove(peripheral, out _);

    void IBleCallbacks.StateUpdated(IntPtr central)
    {
        var before = AdapterState;
        _managerState = (int)ObjC.SendNInt(central, ObjC.Sel("state"));
        var after = AdapterState;
        if (_managerState is 2 or 3 or 4 or 5)
        {
            _stateKnown.TrySetResult();
        }

        if (after != before)
        {
            ThreadPool.QueueUserWorkItem(_ => AdapterStateChanged?.Invoke(after));
        }

        if (after != BluetoothAdapterState.On)
        {
            StateLost?.Invoke();
        }
    }

    void IBleCallbacks.Discovered(IntPtr peripheral, IntPtr advertisementData)
    {
        var handler = _onDiscovered;
        if (handler is null)
        {
            return;
        }

        var id = Foundation.NsUuidText(ObjC.Send(peripheral, ObjC.Sel("identifier")));
        var name = Foundation.ToManaged(ObjC.Send(peripheral, ObjC.Sel("name")))
            ?? Foundation.ToManaged(Foundation.ObjectForKey(advertisementData, Foundation.CoreBluetoothConstant("CBAdvertisementDataLocalNameKey")));
        var uuids = Foundation.Items(Foundation.ObjectForKey(advertisementData, Foundation.CoreBluetoothConstant("CBAdvertisementDataServiceUUIDsKey")))
            .Select(Foundation.UuidText)
            .ToArray();
        if (!_peripherals.ContainsKey(id))
        {
            _peripherals[id] = ObjC.objc_retain(peripheral);
        }

        var advertisement = new BikeAdvertisement(name, id, uuids);
        ThreadPool.QueueUserWorkItem(_ => handler(advertisement));
    }

    void IBleCallbacks.Connected(IntPtr peripheral) => On(peripheral, c => c.OnConnected());

    void IBleCallbacks.FailedToConnect(IntPtr peripheral, IntPtr error)
    {
        var text = Foundation.ErrorText(error);
        On(peripheral, c => c.OnFailedToConnect(text));
    }

    void IBleCallbacks.DisconnectedPeripheral(IntPtr peripheral, IntPtr error)
    {
        var text = Foundation.ErrorText(error);
        On(peripheral, c => c.OnDisconnected(text));
    }

    void IBleCallbacks.ServicesDiscovered(IntPtr peripheral, IntPtr error)
    {
        var text = Foundation.ErrorText(error);
        On(peripheral, c => c.OnServicesDiscovered(text));
    }

    void IBleCallbacks.CharacteristicsDiscovered(IntPtr peripheral, IntPtr service, IntPtr error)
    {
        var text = Foundation.ErrorText(error);
        On(peripheral, c => c.OnCharacteristicsDiscovered(service, text));
    }

    void IBleCallbacks.ValueUpdated(IntPtr peripheral, IntPtr characteristic, IntPtr error)
    {
        if (error != IntPtr.Zero)
        {
            return;
        }

        var bytes = Foundation.Bytes(ObjC.Send(characteristic, ObjC.Sel("value")));
        On(peripheral, c => c.OnValue(characteristic, bytes));
    }

    void IBleCallbacks.ValueWritten(IntPtr peripheral, IntPtr characteristic, IntPtr error)
    {
        var text = Foundation.ErrorText(error);
        On(peripheral, c => c.OnWritten(text));
    }

    void IBleCallbacks.NotificationStateUpdated(IntPtr peripheral, IntPtr characteristic, IntPtr error)
    {
        var text = Foundation.ErrorText(error);
        On(peripheral, c => c.OnNotifying(text));
    }

    private event Action? StateLost;

    private void On(IntPtr peripheral, Action<CoreBluetoothBikeConnection> call)
    {
        if (_connections.TryGetValue(peripheral, out var connection))
        {
            call(connection);
        }
    }

    private Unsubscribe Watch(Action onLost)
    {
        StateLost += onLost;
        return new Unsubscribe(() => StateLost -= onLost);
    }

    private async Task EnsurePoweredOnAsync(CancellationToken cancellationToken)
    {
        if (_managerState is 0 or 1)
        {
            try
            {
                await _stateKnown.Task.WaitAsync(StateWait, cancellationToken).ConfigureAwait(false);
            }
            catch (TimeoutException)
            {
                // Still unknown; the check below reports it.
            }
        }

        if (AdapterState != BluetoothAdapterState.On)
        {
            throw Unavailable();
        }
    }

    private BluetoothUnavailableException Unavailable() => _managerState switch
    {
        2 => new BluetoothUnavailableException("This Mac does not support Bluetooth Low Energy."),
        3 => new BluetoothUnavailableException("Bluetooth permission was denied. Allow it in System Settings → Privacy & Security → Bluetooth."),
        4 => new BluetoothUnavailableException("Bluetooth is off."),
        _ => new BluetoothUnavailableException("Bluetooth is not ready."),
    };

    private sealed class Unsubscribe(Action action) : IDisposable
    {
        public void Dispose() => action();
    }
}
