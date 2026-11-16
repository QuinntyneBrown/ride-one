using Wattzup.Ble.Abstractions;

namespace Wattzup.Api.Bluetooth;

/// <summary>Stands in when this build has no transport for the operating system; every scan reports Bluetooth unavailable.</summary>
public sealed class UnavailableBikeTransport(string name) : IBikeTransport
{
    public string Name => name;

    public BluetoothAdapterState AdapterState => BluetoothAdapterState.Off;

    public event Action<BluetoothAdapterState>? AdapterStateChanged
    {
        add { }
        remove { }
    }

    public Task<BikeAdvertisement?> ScanAsync(Func<BikeAdvertisement, bool> filter, TimeSpan timeout, CancellationToken cancellationToken) =>
        throw new BluetoothUnavailableException($"This build of Wattzup has no {name} Bluetooth transport. Run with --simulate, or use the Wattzup.Mac app on macOS.");

    public Task<IBikeConnection> ConnectAsync(BikeAdvertisement advertisement, CancellationToken cancellationToken) =>
        throw new BluetoothUnavailableException($"This build of Wattzup has no {name} Bluetooth transport.");
}
