using Wattzup.Core.Workouts;

namespace Wattzup.Core.State;

/// <summary>The Bluetooth link state, <c>ble</c> in the contract (L2-014).</summary>
public enum BleState
{
    Starting,
    Scanning,
    Connecting,
    Connected,
    Disconnected,
    Error,
}

/// <summary>Whether the computer's Bluetooth adapter is usable (L2-014, L2-039).</summary>
public enum AdapterState
{
    Unknown,
    On,
    Off,
}

/// <summary>
/// The full live state (L2-014). Immutable: <see cref="BikeStateStore"/> publishes a new instance
/// for every change. Field names are written in snake_case and nulls are always written.
/// </summary>
public sealed record BikeState
{
    public BleState Ble { get; init; } = BleState.Starting;

    public string? Device { get; init; }

    public string? DeviceLabel { get; init; }

    public string? Error { get; init; }

    public int? Resistance { get; init; }

    public int? TargetResistance { get; init; }

    public WorkoutSnapshot? Workout { get; init; }

    public int? Cadence { get; init; }

    public double? SpeedKmh { get; init; }

    public double? SpeedMph { get; init; }

    public int Packets { get; init; }

    public double? FirstDataAt { get; init; }

    public double? LastDataAt { get; init; }

    public int UiClients { get; init; }

    public double? DisplayedSince { get; init; }

    public double DisplayedSeconds { get; init; }

    public AdapterState Adapter { get; init; } = AdapterState.Unknown;

    public required string Transport { get; init; }

    public bool Simulated { get; init; }

    public bool Exposed { get; init; }

    public required string BindAddress { get; init; }

    public string ConnectionId { get; init; } = "0bf669f1";

    public int? Power { get; init; }

    public int? TargetPower { get; init; }

    public int? AvgPower { get; init; }

    public double? DistanceKm { get; init; }

    public int? Kcal { get; init; }

    /// <summary>Always null: Wattzup has no heart-rate source (ADR 0003).</summary>
    public int? HeartRate { get; init; }

    public IReadOnlyList<CommandEntry> Commands { get; init; } = [];
}
