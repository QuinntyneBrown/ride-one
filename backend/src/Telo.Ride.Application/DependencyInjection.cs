using Microsoft.Extensions.DependencyInjection;

namespace Telo.Ride.Application;

public static class DependencyInjection
{
    /// <summary>MediatR with every handler in this assembly: one request per controller action or hub method.</summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(configuration => configuration.RegisterServicesFromAssemblyContaining<IAppDbContext>());
        return services;
    }
}
