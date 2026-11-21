// Acceptance test
// Traces to: L2-127 AC4, L2-147 AC1
// Description: the API answers its health endpoints without a session, with a status word and
// nothing else.
using System.Net;

namespace Telo.Ride.Api.Tests;

public sealed class HealthTests(TeloRideApi api) : IClassFixture<TeloRideApi>
{
    [Fact]
    public async Task Liveness_answers_Healthy_without_a_session()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/health/live", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }
}
