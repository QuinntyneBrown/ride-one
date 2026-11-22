using System.Numerics;

namespace Telo.Ride.Domain.Maps;

/// <summary>
/// Which maps a recorded ride opens (L2-040): a locked map not yet opened whose goal the ride meets. A top-3 finish
/// against bots on the goal's map, at any pack (AC2); the stars now held on the goal's map (AC3); or the rider's level
/// after the ride, so a class can open a map too (AC4). A map open from the start never opens.
/// </summary>
public static class UnlockRules
{
    /// <summary>
    /// The maps the ride opens, in unlock order (<paramref name="order"/>): the race's map and finish, none for a class,
    /// the stars the rider holds on each map after the ride, the level after it and the maps already opened.
    /// </summary>
    public static IReadOnlyList<string> Evaluate(
        IReadOnlyList<(string MapId, MapUnlock Unlock)> order,
        string? raceMapId,
        RaceFinish? finish,
        IReadOnlyDictionary<string, MapStar> stars,
        int level,
        IReadOnlySet<string> opened) =>
        order
            .Where(map => !opened.Contains(map.MapId) && Meets(map.Unlock, raceMapId, finish, stars, level))
            .Select(map => map.MapId)
            .ToList();

    private static bool Meets(
        MapUnlock unlock, string? raceMapId, RaceFinish? finish, IReadOnlyDictionary<string, MapStar> stars, int level) =>
        unlock.Kind switch
        {
            MapUnlock.TopThree => raceMapId == unlock.MapId && finish is { Mode: "bots", Place: <= 3 },
            MapUnlock.StarsKind => stars.TryGetValue(unlock.MapId!, out var held)
                && BitOperations.PopCount((uint)held) >= unlock.Stars,
            MapUnlock.LevelKind => level >= unlock.Level,
            _ => false,
        };
}
