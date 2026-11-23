using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application;

namespace Telo.Ride.Infrastructure;

/// <summary>
/// The Telo Ride database through EF Core: Azure SQL when deployed (ADR 0025). Telo Ride 1 has no account and
/// records nothing about a rider, so it holds no table (ADR 0039); readiness still asks whether it answers.
/// </summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public Task<bool> CanConnectAsync(CancellationToken cancellationToken) =>
        Database.CanConnectAsync(cancellationToken);
}
