using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Application.Progress;

/// <summary>
/// The rider's standing as the header shows it (L2-032 AC2): their level, total XP and the next level's threshold, null
/// at level 30 (L2-038), and their streak as it reads today in their time zone (L2-042).
/// </summary>
public sealed record ProgressDto(int Level, int TotalXp, int? NextLevelXp, int StreakDays);

/// <summary>Reads the signed-in rider's progress (L2-044 AC1).</summary>
public sealed record GetProgressQuery(Guid RiderId) : IRequest<ProgressDto>;

/// <summary>Resolves the rider's level from their total XP with <see cref="LevelTable"/>.</summary>
public sealed class GetProgressQueryHandler(IAppDbContext db, TimeProvider time) : IRequestHandler<GetProgressQuery, ProgressDto>
{
    public async Task<ProgressDto> Handle(GetProgressQuery request, CancellationToken cancellationToken)
    {
        var rider = await db.Riders.AsNoTracking().FirstOrDefaultAsync(known => known.Id == request.RiderId, cancellationToken)
            ?? throw new DomainRuleException("rider_not_found", RuleKind.NotFound, "No such rider.");
        var progress = LevelTable.Progress(rider.TotalXp);
        return new(progress.Level, progress.TotalXp, progress.NextThresholdXp, rider.StreakDaysAt(time.GetUtcNow()));
    }
}
