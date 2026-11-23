using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Api.Tests.Probe;

namespace Telo.Ride.Api.Tests;

/// <summary>The API with the test-only <see cref="ProbeController"/>, its MediatR handlers and their validators added.</summary>
public class ProbeApi : TeloRideApiFactory
{
    protected override void ConfigureServices(IServiceCollection services)
    {
        services.AddControllers().AddApplicationPart(typeof(ProbeController).Assembly);
        services.AddMediatR(configuration => configuration.RegisterServicesFromAssemblyContaining<ProbeController>());
        services.AddValidatorsFromAssemblyContaining<ProbeController>();
    }
}
