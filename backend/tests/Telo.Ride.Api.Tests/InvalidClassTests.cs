// Acceptance test
// Traces to: L2-080 AC4
// Description: a class whose plan has a level outside 1 to 32, whose plan total differs from its length,
// or whose video id is not a YouTube id is left out of the catalogue; the valid classes are still listed.
using System.Net.Http.Json;

namespace Telo.Ride.Api.Tests;

public sealed class InvalidClassTests(StubCatalogueApi api) : IClassFixture<StubCatalogueApi>
{
    [Fact]
    public async Task Only_the_valid_classes_are_listed()
    {
        using var client = api.CreateClient();

        var catalogue = await client.GetFromJsonAsync<Catalogue>("/api/classes", TestContext.Current.CancellationToken);

        Assert.Equal(["valid"], catalogue!.Classes.Select(c => c.Id));
    }
}
