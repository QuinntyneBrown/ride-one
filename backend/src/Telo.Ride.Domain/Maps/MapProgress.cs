namespace Telo.Ride.Domain.Maps;

/// <summary>
/// A rider's progress on one map (docs/detailed-designs/progression/earn-stars-and-unlock-maps): the stars held, which
/// are never lost, and the best time. Unlocks join it with slice 12.1.
/// </summary>
public sealed class MapProgress
{
    public required Guid RiderId { get; init; }

    public required string MapId { get; init; }

    public MapStar Stars { get; private set; }

    /// <summary>Whole seconds of the fastest finish; none before the first.</summary>
    public int? BestSeconds { get; private set; }

    public static MapProgress Start(Guid riderId, string mapId) => new() { RiderId = riderId, MapId = mapId };

    /// <summary>Sets the stars and best a rider already has, as a test's starting point.</summary>
    public void Restore(MapStar stars, int? bestSeconds)
    {
        Stars = stars;
        BestSeconds = bestSeconds;
    }

    /// <summary>
    /// Records a finish (L2-039, L2-077): a first finish sets the best, a faster one replaces it, and the stars the finish
    /// earns (<see cref="StarRules"/>) that the rider does not hold are added.
    /// </summary>
    public FinishRecord RecordFinish(RaceFinish finish)
    {
        var previousBest = BestSeconds;
        var isNewBest = previousBest is { } best && finish.Seconds < best;
        var earned = StarRules.Evaluate(finish, previousBest) & ~Stars;
        Stars |= earned;
        BestSeconds = previousBest is { } kept && kept <= finish.Seconds ? kept : finish.Seconds;
        return new FinishRecord(earned, BestSeconds.Value, previousBest, isNewBest);
    }
}
