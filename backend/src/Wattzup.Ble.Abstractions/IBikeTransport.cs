namespace Wattzup.Ble.Abstractions;

/// <summary>The operating system's Bluetooth stack, as Wattzup needs it (L2-042). One per process.</summary>
public interface IBikeTransport
{
    /// <summary>Reported as <c>transport</c>: <c>CoreBluetooth</c>, <c>BlueZ</c>, <c>WinRT</c> or <c>Simulated</c>.</summary>
    string Name { get; }

    BluetoothAdapterState AdapterState { get; }

    event Action<BluetoothAdapterState>? AdapterStateChanged;

    /// <summary>Returns the first advertisement <paramref name="filter"/> accepts, or null after <paramref name="timeout"/>.</summary>
    /// <exception cref="BluetoothUnavailableException">The adapter is missing, off or unauthorised.</exception>
    Task<BikeAdvertisement?> ScanAsync(Func<BikeAdvertisement, bool> filter, TimeSpan timeout, CancellationToken cancellationToken);

    Task<IBikeConnection> ConnectAsync(BikeAdvertisement advertisement, CancellationToken cancellationToken);
}

/// <summary>An open GATT link to the Echelon service of the bike or the treadmill.</summary>
public interface IBikeConnection : IAsyncDisposable
{
    bool IsConnected { get; }

    /// <summary>Raised once when the link drops. Never raised on a native callback thread.</summary>
    event Action? Disconnected;

    /// <summary>
    /// Subscribes to each of <paramref name="notifyCharacteristicUuids"/> the service has (the bike's one, the
    /// treadmill's two; L2-002, L2-063); frames from any of them are handed to <paramref name="onNotify"/>, in arrival
    /// order. Throws when the service has none of them.
    /// </summary>
    Task SubscribeAsync(IReadOnlyList<string> notifyCharacteristicUuids, Action<ReadOnlyMemory<byte>> onNotify, CancellationToken cancellationToken);

    /// <summary>Writes to the write characteristic.</summary>
    Task WriteAsync(ReadOnlyMemory<byte> bytes, bool withResponse, CancellationToken cancellationToken);
}
