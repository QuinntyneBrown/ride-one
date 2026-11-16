using Wattzup.Ble.Abstractions;

namespace Wattzup.Ble.Simulated;

/// <summary>
/// A synthetic Echelon bike and treadmill for tests and demos (<c>--simulate</c>, L2-043, ADR 0009). It advertises
/// the bike <c>ECHSIM-0001</c> at −68 dBm, which sends a 0xD1 workout frame every second and echoes each set-resistance write with
/// a 0xD2 frame, and the treadmill <c>STRIDE-SIM-0001</c> at −55 dBm (<see cref="SimulatedTreadmillConnection"/>), each once a
/// second while a scan runs; the scan's filter hears both and picks one (L2-074). All timing comes from the injected <see cref="TimeProvider"/>.
/// </summary>
public sealed class SimulatedBikeTransport : IBikeTransport
{
    public const string DeviceName = "ECHSIM-0001";
    public const string DeviceAddress = "00:00:5E:00:53:01";
    public const string TreadmillName = "STRIDE-SIM-0001";
    public const string TreadmillAddress = "00:00:5E:00:53:02";
    public const int DeviceRssi = -68;
    public const int TreadmillRssi = -55;
    private const string OtherAddress = "00:00:5E:00:53:03";
    private static readonly TimeSpan AdvertisingInterval = TimeSpan.FromSeconds(1);
    private const string EchelonService = "0bf669f1-45f2-11e7-9598-0800200c9a66";
    private const string TreadmillAdvertisedService = "0bf669f0-45f2-11e7-9598-0800200c9a66";

    private readonly SimulationControl _control;
    private readonly TimeProvider _time;
    private BluetoothAdapterState _adapter = BluetoothAdapterState.Unknown;

    public SimulatedBikeTransport(SimulationControl control, TimeProvider time)
    {
        ArgumentNullException.ThrowIfNull(control);
        _control = control;
        _time = time;
        control.Changed += OnChanged;
        OnChanged();
    }

    public string Name => "Simulated";

    public BluetoothAdapterState AdapterState => _adapter;

    public event Action<BluetoothAdapterState>? AdapterStateChanged;

    /// <summary>
    /// Offers every advertising device to <paramref name="filter"/> (so it hears them all, L2-074), returns the first it
    /// accepts, and otherwise advertises again on each change and once a second until the timeout.
    /// </summary>
    public async Task<BikeAdvertisement?> ScanAsync(Func<BikeAdvertisement, bool> filter, TimeSpan timeout, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(filter);
        using var deadline = new CancellationTokenSource(timeout, _time);
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, deadline.Token);
        while (true)
        {
            ThrowIfAdapterOff();
            var changed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            void Signal() => changed.TrySetResult();
            _control.Changed += Signal;
            try
            {
                if (Offer(filter) is { } accepted)
                {
                    return accepted;
                }

                if (!_control.AdapterOn)
                {
                    continue;
                }

                await changed.Task.WaitAsync(AdvertisingInterval, _time, linked.Token).ConfigureAwait(false);
            }
            catch (TimeoutException)
            {
                // Advertise again.
            }
            catch (OperationCanceledException) when (deadline.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
            {
                return null;
            }
            finally
            {
                _control.Changed -= Signal;
            }
        }
    }

    public Task<IBikeConnection> ConnectAsync(BikeAdvertisement advertisement, CancellationToken cancellationToken)
    {
        ThrowIfAdapterOff();
        if (!_control.PoweredOn)
        {
            throw new TimeoutException("The simulated bike did not answer.");
        }

        ArgumentNullException.ThrowIfNull(advertisement);
        _control.Record("connect");
        return Task.FromResult<IBikeConnection>(advertisement.Address == TreadmillAddress
            ? new SimulatedTreadmillConnection(_control, _time)
            : new SimulatedBikeConnection(_control, _time));
    }

    /// <summary>One round of advertisements: each device is offered once; the first accepted is returned.</summary>
    private BikeAdvertisement? Offer(Func<BikeAdvertisement, bool> filter)
    {
        if (!_control.PoweredOn)
        {
            return null;
        }

        BikeAdvertisement? accepted = null;
        foreach (var (name, rssi) in _control.Advertising)
        {
            var advertisement = name switch
            {
                DeviceName => new BikeAdvertisement(name, DeviceAddress, [EchelonService], rssi),
                TreadmillName => new BikeAdvertisement(name, TreadmillAddress, [TreadmillAdvertisedService], rssi),
                _ => new BikeAdvertisement(name, OtherAddress, [], rssi),
            };
            if (filter(advertisement) && accepted is null)
            {
                accepted = advertisement;
            }
        }

        return accepted;
    }

    private void ThrowIfAdapterOff()
    {
        if (!_control.AdapterOn)
        {
            throw new BluetoothUnavailableException("Bluetooth is off.");
        }
    }

    private void OnChanged()
    {
        var next = _control.AdapterOn ? BluetoothAdapterState.On : BluetoothAdapterState.Off;
        if (next != _adapter)
        {
            _adapter = next;
            AdapterStateChanged?.Invoke(next);
        }
    }
}
