using MediatR;
using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain;
using Telo.Ride.Domain.Rides;

namespace Telo.Ride.Application.Progress;

/// <summary>
/// The rider's standing as the header shows it (L2-032 AC2): their level, total XP and the next level's threshold, null
/// at level 30 (L2-038), and their streak, 0 until it is kept (slice 10.4).
/// </summary>
public sealed record ProgressDto(int Level, int TotalXp, int? NextLevelXp, int StreakDays);

/// <summary>Reads the signed-in rider's progress (L2-044 AC1).</summary>
public sealed record GetProgressQuery(Guid RiderId) : IRequest<ProgressDto>;

/// <summary>Resolves the rider's level from their total XP with <see cref="LevelTable"/>.</summary>
public sealed class GetProgressQueryHandler(IAppDbContext db) : IRequestHandler<GetProgressQuery, ProgressDto>
{
    public async Task<ProgressDto> Handle(GetProgressQuery request, CancellationToken cancellationToken)
    {
        var totalXp = await db.Riders.AsNoTracking()
            .Where(rider => rider.Id == request.RiderId)
            .Select(rider => (int?)rider.TotalXp)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new DomainRuleException("rider_not_found", RuleKind.NotFound, "No such rider.");
        var progress = LevelTable.Progress(totalXp);
        return new(progress.Level, progress.TotalXp, progress.NextThresholdXp, StreakDays: 0);
    }
}
