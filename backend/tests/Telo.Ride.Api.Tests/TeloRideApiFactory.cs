using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Telo.Ride.Infrastructure;

namespace Telo.Ride.Api.Tests;

/// <summary>
/// The Telo Ride API hosted in memory for one test class: one fixture, one EF Core InMemory store,
/// never a real database or file (AGENTS.md, L2-148). Subclasses override <see cref="ConfigureServices"/> to inject faults.
/// </summary>
public class TeloRideApiFactory : WebApplicationFactory<Program>
{
    private readonly string store = $"telo-ride-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(store));
            ConfigureServices(services);
        });

    /// <summary>Changes the host's services after the in-memory store is in place.</summary>
    protected virtual void ConfigureServices(IServiceCollection services)
    {
    }
}
