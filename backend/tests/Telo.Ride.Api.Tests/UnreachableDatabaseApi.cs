using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Telo.Ride.Application;

namespace Telo.Ride.Api.Tests;

/// <summary>The API with a database it cannot reach, injected through <see cref="IAppDbContext"/>.</summary>
public sealed class UnreachableDatabaseApi : TeloRideApiFactory
{
    protected override void ConfigureServices(IServiceCollection services) =>
        services.Replace(ServiceDescriptor.Scoped<IAppDbContext, UnreachableDatabase>());

    private sealed class UnreachableDatabase : IAppDbContext
    {
        public Task<bool> CanConnectAsync(CancellationToken cancellationToken) =>
            throw new InvalidOperationException("The database cannot be reached.");
    }
}
