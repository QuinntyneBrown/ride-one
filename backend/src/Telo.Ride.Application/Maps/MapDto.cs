using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Application.Maps;

/// <summary>
/// One map as the Ride app reads it (L2-045, L2-046, L2-047): its facts, world, thumbnail and photo, the goal that opens
/// it, or none, and the map that goal is earned on, or none for a level goal.
/// </summary>
public sealed record MapDto(
    string Id,
    string Name,
    string? RouteName,
    string Place,
    double DistanceKm,
    int ClimbingM,
    string Rating,
    string World,
    string ThumbnailUrl,
    string PhotoUrl,
    string? UnlockGoal,
    string? UnlockMapId)
{
    public static MapDto From(MapDefinition map, IReadOnlyDictionary<string, string> names) => new(
        map.Id, map.Name, map.RouteName, map.Place, map.DistanceKm, map.ClimbingM, map.Rating, map.World,
        map.ThumbnailUrl, map.PhotoUrl, map.Unlock.Goal(names), map.Unlock.MapId);
}
