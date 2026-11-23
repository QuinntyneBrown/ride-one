namespace Telo.Ride.Application;

/// <summary>
/// The database as handlers see it. Infrastructure implements it with EF Core; tests inject faults
/// through it (AGENTS.md). Telo Ride 1 stores nothing about a rider, so it holds no entity set (ADR 0039).
/// </summary>
public interface IAppDbContext
{
    /// <summary>Whether the database answers; readiness reports it (L2-127 AC4).</summary>
    Task<bool> CanConnectAsync(CancellationToken cancellationToken);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
