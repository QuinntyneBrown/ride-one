using Wattzup.Ble.Abstractions;

namespace Wattzup.Core.Bluetooth;

/// <summary>The open, initialised bike connection, or null. Read by resistance commands and the workout engine.</summary>
public sealed class ActiveConnectionRegistry
{
    private IBikeConnection? _current;

    public IBikeConnection? Current => Volatile.Read(ref _current);

    public bool IsConnected => Current is { IsConnected: true };

    public void Set(IBikeConnection connection) => Volatile.Write(ref _current, connection);

    public void Clear() => Volatile.Write(ref _current, null);
}
