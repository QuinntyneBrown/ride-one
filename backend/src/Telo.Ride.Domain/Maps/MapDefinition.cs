namespace Telo.Ride.Domain.Maps;

/// <summary>
/// A map of the catalogue (L2-045 AC1): its name, route and place, distance, climbing and rating, the world it rides
/// in, its thumbnail in the app, and how it opens (L2-040). The elevation profile and the 30:00 plan (AC2) join it with
/// the slices that race it (ADR 0029).
/// </summary>
public sealed record MapDefinition(
    string Id,
    string Name,
    string? RouteName,
    string Place,
    double DistanceKm,
    int ClimbingM,
    string Rating,
    string World,
    string ThumbnailUrl,
    MapUnlock Unlock);
