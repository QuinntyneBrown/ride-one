using Microsoft.EntityFrameworkCore;
using Telo.Ride.Application;
using Telo.Ride.Domain.Accounts;

namespace Telo.Ride.Infrastructure;

/// <summary>The Telo Ride database through EF Core: Azure SQL when deployed (ADR 0025).</summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<SignInCode> SignInCodes => Set<SignInCode>();

    public DbSet<Rider> Riders => Set<Rider>();

    public DbSet<RiderSession> RiderSessions => Set<RiderSession>();

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
        modelBuilder.Entity<Rider>(rider =>
        {
            rider.HasKey(r => r.Id);
            // A deleted account has no email; the unique index leaves those out (L2-006 AC4).
            rider.Property(r => r.Email).HasMaxLength(320);
            rider.HasIndex(r => r.Email).IsUnique();
            rider.Property(r => r.DisplayName).HasMaxLength(40);
        });
        modelBuilder.Entity<RiderSession>(session =>
        {
            session.HasKey(s => s.Id);
            session.Property(s => s.KeyHash).HasMaxLength(64).IsRequired();
            session.HasIndex(s => s.KeyHash).IsUnique();
            session.HasIndex(s => s.RiderId);
            session.HasOne<Rider>().WithMany().HasForeignKey(s => s.RiderId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
