namespace Telo.Ride.Application;

/// <summary>
/// The database as handlers see it. Infrastructure implements it with EF Core; tests inject faults
/// through it (AGENTS.md). Entity sets join it as slices add entities.
/// </summary>
public interface IAppDbContext
{
    /// <summary>Whether the database answers; readiness reports it (L2-127 AC4).</summary>
    Task<bool> CanConnectAsync(CancellationToken cancellationToken);
}
