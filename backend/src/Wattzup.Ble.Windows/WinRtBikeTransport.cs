using System.Globalization;
using Wattzup.Ble.Abstractions;
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.Advertisement;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Devices.Radios;

namespace Wattzup.Ble.Windows;

/// <summary>
/// The Windows transport (L2-043): WinRT <c>Windows.Devices.Bluetooth</c>. The Bluetooth <see cref="Radio"/> state is
/// the adapter state; a scan is an active <see cref="BluetoothLEAdvertisementWatcher"/>; the link is a
/// <see cref="BluetoothLEDevice"/> and its Echelon GATT characteristics. Not yet a supported transport: it has not
/// passed its hardware smoke test.
/// </summary>
public sealed class WinRtBikeTransport : IBikeTransport, IDisposable
{
    // GATT addressing of the Echelon service (see docs/protocol/echelon-ble-frames.md). The transport needs it to
    // find the service; it does not reference Wattzup.Protocol (dependency rule), so it keeps its own copy.
    internal static readonly Guid ServiceUuid = Guid.Parse("0bf669f1-45f2-11e7-9598-0800200c9a66");
    internal static readonly Guid WriteCharacteristicUuid = Guid.Parse("0bf669f2-45f2-11e7-9598-0800200c9a66");

    private readonly SemaphoreSlim _radioGate = new(1, 1);
    private readonly Lock _stateLock = new();
    private Radio? _radio;
    private bool _radioLooked;
    private BluetoothAdapterState _adapterState = BluetoothAdapterState.Unknown;

    public string Name => "WinRT";

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
        await RequireRadioOnAsync(cancellationToken).ConfigureAwait(false);

        var found = new TaskCompletionSource<BikeAdvertisement>(TaskCreationOptions.RunContinuationsAsynchronously);
        var seen = new Dictionary<ulong, (string? Name, HashSet<string> Uuids)>();
        var stopping = 0;

        // An active scan delivers the advertisement and the scan response separately; merge them per address.
        void Evaluate(ulong address, string? name, string[] uuids)
        {
            string? mergedName;
            string[] mergedUuids;
            lock (seen)
            {
                if (!seen.TryGetValue(address, out var entry))
                {
                    entry = (null, new HashSet<string>(StringComparer.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrEmpty(name))
                {
                    entry.Name = name;
                }

                entry.Uuids.UnionWith(uuids);
                seen[address] = entry;
                mergedName = entry.Name;
                mergedUuids = [.. entry.Uuids];
            }

            var advertisement = new BikeAdvertisement(mergedName, FormatAddress(address), mergedUuids);
            try
            {
                if (filter(advertisement))
                {
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

        // Native callback: copy what is needed and leave; the filter runs on the thread pool.
        void OnReceived(BluetoothLEAdvertisementWatcher sender, BluetoothLEAdvertisementReceivedEventArgs args)
        {
            var address = args.BluetoothAddress;
            var name = args.Advertisement.LocalName;
            var uuids = args.Advertisement.ServiceUuids.Select(u => u.ToString("D")).ToArray();
            _ = Task.Run(() => Evaluate(address, name, uuids), CancellationToken.None);
        }

        void OnStopped(BluetoothLEAdvertisementWatcher sender, BluetoothLEAdvertisementWatcherStoppedEventArgs args)
        {
            if (Volatile.Read(ref stopping) == 0)
            {
                var error = args.Error;
                _ = Task.Run(() => found.TrySetException(new BluetoothUnavailableException($"Bluetooth scanning stopped: {error}.")), CancellationToken.None);
            }
        }

        var watcher = new BluetoothLEAdvertisementWatcher { ScanningMode = BluetoothLEScanningMode.Active };
        watcher.Received += OnReceived;
        watcher.Stopped += OnStopped;
        try
        {
            try
            {
                watcher.Start();
            }
            catch (Exception ex) when (ex is UnauthorizedAccessException or System.Runtime.InteropServices.COMException)
            {
                throw new BluetoothUnavailableException("Bluetooth scanning could not start.", ex);
            }

            if (watcher.Status == BluetoothLEAdvertisementWatcherStatus.Aborted)
            {
                throw new BluetoothUnavailableException("Bluetooth scanning was refused.");
            }

            return await found.Task.WaitAsync(timeout, cancellationToken).ConfigureAwait(false);
        }
        catch (TimeoutException) when (!found.Task.IsCompleted)
        {
            return null;
        }
        finally
        {
            Volatile.Write(ref stopping, 1);
            watcher.Received -= OnReceived;
            watcher.Stopped -= OnStopped;
            if (watcher.Status == BluetoothLEAdvertisementWatcherStatus.Started)
            {
                watcher.Stop();
            }
        }
    }

    public async Task<IBikeConnection> ConnectAsync(BikeAdvertisement advertisement, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(advertisement);
        await RequireRadioOnAsync(cancellationToken).ConfigureAwait(false);
        var address = ParseAddress(advertisement.Address);

        var device = await BluetoothLEDevice.FromBluetoothAddressAsync(address).AsTask(cancellationToken).ConfigureAwait(false)
            ?? throw new IOException("The bike is not reachable.");
        GattSession? session = null;
        GattDeviceService? service = null;
        try
        {
            session = await GattSession.FromDeviceIdAsync(device.BluetoothDeviceId).AsTask(cancellationToken).ConfigureAwait(false);
            session.MaintainConnection = true;

            var services = await device.GetGattServicesForUuidAsync(ServiceUuid, BluetoothCacheMode.Uncached)
                .AsTask(cancellationToken).ConfigureAwait(false);
            ThrowIfFailed(services.Status, "find the Echelon service");
            if (services.Services.Count == 0)
            {
                throw new InvalidOperationException("The device does not expose the Echelon service.");
            }

            service = services.Services[0];
            for (var i = 1; i < services.Services.Count; i++)
            {
                services.Services[i].Dispose();
            }

            var write = await FindCharacteristicAsync(service, WriteCharacteristicUuid, cancellationToken).ConfigureAwait(false);
            return new WinRtBikeConnection(device, session, service, write);
        }
        catch
        {
            service?.Dispose();
            session?.Dispose();
            device.Dispose();
            throw;
        }
    }

    public void Dispose()
    {
        lock (_stateLock)
        {
            if (_radio is { } radio)
            {
                radio.StateChanged -= OnRadioStateChanged;
                _radio = null;
            }
        }

        _radioGate.Dispose();
    }

    internal static void ThrowIfFailed(GattCommunicationStatus status, string action)
    {
        switch (status)
        {
            case GattCommunicationStatus.Success:
                return;
            case GattCommunicationStatus.AccessDenied:
                throw new BluetoothUnavailableException($"Bluetooth access was denied when trying to {action}.");
            default:
                throw new IOException($"Could not {action}: {status}.");
        }
    }

    /// <summary>The characteristic with <paramref name="uuid"/>, or null when the service has none.</summary>
    internal static async Task<GattCharacteristic?> TryFindCharacteristicAsync(GattDeviceService service, Guid uuid, CancellationToken cancellationToken)
    {
        var result = await service.GetCharacteristicsForUuidAsync(uuid, BluetoothCacheMode.Uncached).AsTask(cancellationToken).ConfigureAwait(false);
        ThrowIfFailed(result.Status, $"find characteristic {uuid:D}");
        return result.Characteristics.Count > 0 ? result.Characteristics[0] : null;
    }

    private static async Task<GattCharacteristic> FindCharacteristicAsync(GattDeviceService service, Guid uuid, CancellationToken cancellationToken)
    {
        var result = await service.GetCharacteristicsForUuidAsync(uuid, BluetoothCacheMode.Uncached).AsTask(cancellationToken).ConfigureAwait(false);
        ThrowIfFailed(result.Status, $"find characteristic {uuid:D}");
        return result.Characteristics.Count > 0
            ? result.Characteristics[0]
            : throw new InvalidOperationException($"The device does not expose characteristic {uuid:D}.");
    }

    private static string FormatAddress(ulong address)
    {
        var hex = address.ToString("X12", CultureInfo.InvariantCulture);
        return string.Join(':', Enumerable.Range(0, 6).Select(i => hex.Substring(i * 2, 2)));
    }

    private static ulong ParseAddress(string address)
    {
        var hex = address.Replace(":", string.Empty, StringComparison.Ordinal).Replace("-", string.Empty, StringComparison.Ordinal);
        return ulong.TryParse(hex, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var value)
            ? value
            : throw new ArgumentException($"'{address}' is not a Bluetooth address.", nameof(address));
    }

    private static BluetoothAdapterState Map(RadioState state) => state switch
    {
        RadioState.On => BluetoothAdapterState.On,
        RadioState.Off or RadioState.Disabled => BluetoothAdapterState.Off,
        _ => BluetoothAdapterState.Unknown,
    };

    private async Task RequireRadioOnAsync(CancellationToken cancellationToken)
    {
        var radio = await EnsureRadioAsync(cancellationToken).ConfigureAwait(false);
        if (radio is null)
        {
            throw new BluetoothUnavailableException("No Bluetooth adapter found.");
        }

        var state = Map(radio.State);
        SetState(state);
        if (state != BluetoothAdapterState.On)
        {
            throw new BluetoothUnavailableException("Bluetooth is off.");
        }
    }

    private async Task<Radio?> EnsureRadioAsync(CancellationToken cancellationToken)
    {
        await _radioGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (_radioLooked)
            {
                return _radio;
            }

            IReadOnlyList<Radio> radios;
            try
            {
                radios = await Radio.GetRadiosAsync().AsTask(cancellationToken).ConfigureAwait(false);
            }
            catch (UnauthorizedAccessException ex)
            {
                SetState(BluetoothAdapterState.Off);
                throw new BluetoothUnavailableException("Access to the Bluetooth radio was denied.", ex);
            }

            var radio = radios.FirstOrDefault(r => r.Kind == RadioKind.Bluetooth);
            _radioLooked = true;
            if (radio is null)
            {
                SetState(BluetoothAdapterState.Off);
                return null;
            }

            radio.StateChanged += OnRadioStateChanged;
            lock (_stateLock)
            {
                _radio = radio;
            }

            return radio;
        }
        finally
        {
            _radioGate.Release();
        }
    }

    // Native callback: read the state and hand the event to the thread pool.
    private void OnRadioStateChanged(Radio sender, object args)
    {
        var state = Map(sender.State);
        _ = Task.Run(() => SetState(state), CancellationToken.None);
    }

    private void SetState(BluetoothAdapterState state)
    {
        bool changed;
        lock (_stateLock)
        {
            changed = _adapterState != state;
            _adapterState = state;
        }

        if (changed)
        {
            AdapterStateChanged?.Invoke(state);
        }
    }
}
