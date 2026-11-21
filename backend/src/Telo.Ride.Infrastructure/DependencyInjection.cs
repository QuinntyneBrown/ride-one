using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Application;

namespace Telo.Ride.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// The database (connection string <c>ConnectionStrings:TeloRide</c>, docs/deployment.md) and
    /// <see cref="IAppDbContext"/> over it.
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("TeloRide")));
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        return services;
    }
}
