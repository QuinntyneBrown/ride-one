using Wattzup.Ble.Abstractions;

namespace Wattzup.Ble.Simulated;

/// <summary>
/// A synthetic Echelon bike for tests and demos (<c>--simulate</c>, L2-043). It advertises <c>ECHSIM-0001</c>,
/// sends a 0xD1 workout frame every second and echoes each set-resistance write with a 0xD2 frame. All timing
/// comes from the injected <see cref="TimeProvider"/>.
/// </summary>
public sealed class SimulatedBikeTransport : IBikeTransport
{
    public const string DeviceName = "ECHSIM-0001";
    public const string DeviceAddress = "00:00:5E:00:53:01";
    private const string EchelonService = "0bf669f1-45f2-11e7-9598-0800200c9a66";

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

    public async Task<BikeAdvertisement?> ScanAsync(Func<BikeAdvertisement, bool> filter, TimeSpan timeout, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(filter);
        var advertisement = new BikeAdvertisement(DeviceName, DeviceAddress, [EchelonService]);
        using var deadline = new CancellationTokenSource(timeout, _time);
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, deadline.Token);
        while (true)
        {
            ThrowIfAdapterOff();
            if (_control.PoweredOn && filter(advertisement))
            {
                return advertisement;
            }

            var changed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            void Signal() => changed.TrySetResult();
            _control.Changed += Signal;
            try
            {
                if (_control.PoweredOn || !_control.AdapterOn)
                {
                    continue;
                }

                await changed.Task.WaitAsync(linked.Token).ConfigureAwait(false);
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

        _control.Record("connect");
        return Task.FromResult<IBikeConnection>(new SimulatedBikeConnection(_control, _time));
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
