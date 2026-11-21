using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Infrastructure;

/// <summary>The Telo Ride database through EF Core: Azure SQL when deployed (ADR 0025).</summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<SignInCode> SignInCodes => Set<SignInCode>();

    public Task<bool> CanConnectAsync(CancellationToken cancellationToken) =>
        Database.CanConnectAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SignInCode>(code =>
        {
            code.HasKey(c => c.Id);
            code.Property(c => c.Email).HasMaxLength(320).IsRequired();
            code.Property(c => c.CodeHash).HasMaxLength(64).IsRequired();
            code.Property(c => c.NetworkHash).HasMaxLength(64).IsRequired();
            code.HasIndex(c => new { c.Email, c.IssuedAt });
            code.HasIndex(c => new { c.NetworkHash, c.IssuedAt });
        });
    }
}
