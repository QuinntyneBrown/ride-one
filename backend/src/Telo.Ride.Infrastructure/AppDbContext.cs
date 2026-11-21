using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application;

namespace Telo.Ride.Infrastructure;

/// <summary>The Telo Ride database through EF Core: Azure SQL when deployed (ADR 0025).</summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public Task<bool> CanConnectAsync(CancellationToken cancellationToken) =>
        Database.CanConnectAsync(cancellationToken);
}
