using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application.Maps;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Application.Rides;

/// <summary>
/// A finished ride as the app submits it: facts only, never XP, stars or unlocks (L2-044 AC4). A race names its map,
/// mode, pack, place and field; a class names its class. The speed of each second ridden is in km/h; a class ride covers
/// no distance and sends none.
/// </summary>
public sealed record SubmitRideRequest(
    Guid RideId,
    string? Kind,
    string? MapId,
    string? Mode,
    string? Pack,
    int? Place,
    int? FieldSize,
    string? ClassId,
    int ElapsedSeconds,
    double DistanceMeters,
    double OutputKj,
    int MaxPowerWatts,
    double MaxSpeedKmh,
    IReadOnlyList<double>? SpeedSamplesKmh,
    DateTimeOffset? FinishedAt,
    string? TimeZoneId)
{
    /// <summary>What the plausibility rule checks.</summary>
    public RideFacts Facts => new(ElapsedSeconds, DistanceMeters, MaxPowerWatts, MaxSpeedKmh, SpeedSamplesKmh ?? []);
}

/// <summary>What the backend answers for a recorded ride, the same for every repeat of its ride id (L2-125 AC3).</summary>
public sealed record RideRecordedDto(Guid RideId, DateTimeOffset RecordedAt)
{
    public static RideRecordedDto From(RecordedRide ride) => new(ride.Id, ride.RecordedAt);
}

/// <summary>The answer, and whether this submission recorded the ride or repeated one already recorded.</summary>
public sealed record RideSubmission(RideRecordedDto Answer, bool Recorded);

/// <summary>Records the signed-in rider's finished ride once for its ride id (Record a ride, L2-044 AC2).</summary>
public sealed record SubmitRideCommand(Guid RiderId, SubmitRideRequest Ride) : IRequest<RideSubmission>;

/// <summary>
/// A ride already recorded under its ride id answers as it did the first time. A new one is refused with 422
/// <c>ride_not_plausible</c> when no one could have ridden it (L2-125 AC2), and otherwise recorded. Two first submissions
/// at once both find nothing; the key refuses the second insert, which then answers with the first's ride.
/// </summary>
public sealed class SubmitRideCommandHandler(IAppDbContext db, IMapCatalogue maps, TimeProvider time)
    : IRequestHandler<SubmitRideCommand, RideSubmission>
{
    public async Task<RideSubmission> Handle(SubmitRideCommand request, CancellationToken cancellationToken)
    {
        var ride = request.Ride;
        if (await Recorded(request, cancellationToken) is { } recorded) return new(RideRecordedDto.From(recorded), false);

        var raceMeters = ride.Kind == "race" ? maps.Maps.Single(map => map.Id == ride.MapId).DistanceKm * 1000 : (double?)null;
        if (!RidePlausibilityRule.IsPlausible(ride.Facts, raceMeters))
        {
            throw new DomainRuleException("ride_not_plausible", RuleKind.Unprocessable, "No one could have ridden this ride.");
        }

        var recording = new RecordedRide
        {
            RiderId = request.RiderId,
            Id = ride.RideId,
            Kind = ride.Kind == "race" ? RideKind.Race : RideKind.Class,
            MapId = ride.MapId,
            Mode = ride.Mode,
            Pack = ride.Pack,
            Place = ride.Place,
            FieldSize = ride.FieldSize,
            ClassId = ride.ClassId,
            ElapsedSeconds = ride.ElapsedSeconds,
            DistanceMeters = ride.DistanceMeters,
            OutputKj = ride.OutputKj,
            MaxPowerWatts = ride.MaxPowerWatts,
            MaxSpeedKmh = ride.MaxSpeedKmh,
            FinishedAt = ride.FinishedAt!.Value,
            TimeZoneId = ride.TimeZoneId!,
            RecordedAt = time.GetUtcNow(),
        };
        db.Rides.Add(recording);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return new(RideRecordedDto.From(recording), true);
        }
        catch (DbUpdateException)
        {
            db.Rides.Entry(recording).State = EntityState.Detached;
            var first = await Recorded(request, cancellationToken) ?? throw new InvalidOperationException("The ride was neither recorded nor found.");
            return new(RideRecordedDto.From(first), false);
        }
    }

    private Task<RecordedRide?> Recorded(SubmitRideCommand request, CancellationToken cancellationToken) =>
        db.Rides.AsNoTracking().FirstOrDefaultAsync(
            ride => ride.RiderId == request.RiderId && ride.Id == request.Ride.RideId, cancellationToken);
}
