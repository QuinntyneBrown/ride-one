using Microsoft.EntityFrameworkCore;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Application;

/// <summary>
/// The database as handlers see it. Infrastructure implements it with EF Core; tests inject faults
/// through it (AGENTS.md). Entity sets join it as slices add entities.
/// </summary>
public interface IAppDbContext
{
    /// <summary>The sign-in codes sent, as hashes (sign-in with an email code).</summary>
    DbSet<SignInCode> SignInCodes { get; }

    /// <summary>The riders' accounts.</summary>
    DbSet<Rider> Riders { get; }

    /// <summary>The sessions riders hold on their devices (Stay signed in).</summary>
    DbSet<RiderSession> RiderSessions { get; }

    /// <summary>Whether the database answers; readiness reports it (L2-127 AC4).</summary>
    Task<bool> CanConnectAsync(CancellationToken cancellationToken);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
