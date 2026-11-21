using Telo.Ride.Domain.Maps;

namespace Telo.Ride.Application.Maps;

/// <summary>One map as the Ride app reads it (L2-045, L2-046): its facts, world and thumbnail, and the goal that opens it, or none.</summary>
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
    string? UnlockGoal)
{
    public static MapDto From(MapDefinition map, IReadOnlyDictionary<string, string> names) => new(
        map.Id, map.Name, map.RouteName, map.Place, map.DistanceKm, map.ClimbingM, map.Rating, map.World,
        map.ThumbnailUrl, map.Unlock.Goal(names));
}
