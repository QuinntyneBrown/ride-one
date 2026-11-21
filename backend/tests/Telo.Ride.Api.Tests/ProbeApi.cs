using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Api.Tests.Probe;

namespace Telo.Ride.Api.Tests;

/// <summary>The API with the test-only <see cref="ProbeController"/> and its MediatR handlers added.</summary>
public class ProbeApi : TeloRideApi
{
    protected override void ConfigureServices(IServiceCollection services)
    {
        services.AddControllers().AddApplicationPart(typeof(ProbeController).Assembly);
        services.AddMediatR(configuration => configuration.RegisterServicesFromAssemblyContaining<ProbeController>());
    }
}
