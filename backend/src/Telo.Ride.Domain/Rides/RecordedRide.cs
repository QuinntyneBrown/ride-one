namespace Telo.Ride.Domain.Rides;

/// <summary>
/// A finished ride the backend has recorded for a rider, once for its ride id (L2-044 AC2, L2-125 AC3). It is named
/// <c>RecordedRide</c>, not <c>Ride</c>, because <c>Telo.Ride</c> is the solution's namespace. Its key is the rider and
/// the ride id together, which the app assigned when the ride started.
/// </summary>
public sealed class RecordedRide
{
    public required Guid RiderId { get; init; }

    public required Guid Id { get; init; }

    public required RideKind Kind { get; init; }

    /// <summary>The race's map; none for a class.</summary>
    public string? MapId { get; init; }

    /// <summary>The race's mode: <c>solo</c> or <c>bots</c>.</summary>
    public string? Mode { get; init; }

    /// <summary>The bots' pack strength; none in a solo race.</summary>
    public string? Pack { get; init; }

    public int? Place { get; init; }

    public int? FieldSize { get; init; }

    /// <summary>The class ridden; none for a race.</summary>
    public string? ClassId { get; init; }

    public required int ElapsedSeconds { get; init; }

    public required double DistanceMeters { get; init; }

    public required double OutputKj { get; init; }

    public required int MaxPowerWatts { get; init; }

    public required double MaxSpeedKmh { get; init; }

    /// <summary>The share of its running seconds within 10 % of target power, from 0 to 1 (L2-037 AC3).</summary>
    public double OnTargetShare { get; init; }

    /// <summary>The XP the ride earned, line by line (L2-037), kept so a repeat of its ride id answers the same.</summary>
    public IReadOnlyList<XpLine> XpLines { get; init; } = [];

    /// <summary>The rider's total XP once this ride was added, part of the same answer.</summary>
    public int TotalXp { get; init; }

    /// <summary>When the ride ended on the device, and the device's IANA time zone for the rider's local day.</summary>
    public required DateTimeOffset FinishedAt { get; init; }

    public required string TimeZoneId { get; init; }

    /// <summary>When the backend recorded it; part of the answer every repeat of the ride id gets.</summary>
    public required DateTimeOffset RecordedAt { get; init; }
}
