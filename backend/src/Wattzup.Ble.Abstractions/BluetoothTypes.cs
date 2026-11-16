namespace Wattzup.Ble.Abstractions;

/// <summary>Whether the computer's Bluetooth adapter is usable; <c>adapter</c> in the state (L2-014).</summary>
public enum BluetoothAdapterState
{
    Unknown,
    On,
    Off,
}

/// <summary>A device as seen during a scan.</summary>
public sealed record BikeAdvertisement(string? Name, string Address, IReadOnlyList<string> ServiceUuids)
{
    /// <summary>The advertised name, or the address when the name is empty (L2-002).</summary>
    public string DisplayName => string.IsNullOrEmpty(Name) ? Address : Name;
}

/// <summary>Thrown by every transport when the adapter is missing, off or unauthorised (L2-039).</summary>
public sealed class BluetoothUnavailableException : Exception
{
    public BluetoothUnavailableException()
        : this("Bluetooth is unavailable.")
    {
    }

    public BluetoothUnavailableException(string message)
        : base(message)
    {
    }

    public BluetoothUnavailableException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
