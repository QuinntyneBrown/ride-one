using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

/// <summary>The Telo Ride API hosted in memory for one test class (one fixture, one store).</summary>
public sealed class TeloRideApi : WebApplicationFactory<Program>;
