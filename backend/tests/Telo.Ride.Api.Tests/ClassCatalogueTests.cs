// Acceptance test
// Traces to: L2-080 AC1
// Description: the class catalogue, read without a session, lists the seven classes of L2-080 AC1 in
// catalogue order, each with its channel, focus, length and the rider level it opens at.
using System.Net;
using System.Net.Http.Json;

namespace Telo.Ride.Api.Tests;

public sealed class ClassCatalogueTests(TeloRideApiFactory api) : IClassFixture<TeloRideApiFactory>
{
    [Fact]
    public async Task The_catalogue_lists_the_seven_classes_in_order_without_a_session()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/api/classes", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var catalogue = await response.Content.ReadFromJsonAsync<Catalogue>(TestContext.Current.CancellationToken);
        Assert.Equal(
            [
                new Listed("20 Minute Power Intervals", "Telo Ride Studio", "VO₂ max", 1200, 1),
                new Listed("20 Min Threshold Builder", "Telo Ride Studio", "Threshold", 1200, 1),
                new Listed("30 Minute HIIT Cardio", "GCN Training", "HIIT", 1800, 1),
                new Listed("30 Min Tempo Paceline", "Telo Ride Studio", "Tempo", 2160, 5),
                new Listed("30 Min Vice City Pyramid", "Telo Ride Studio", "Pyramid", 1710, 10),
                new Listed("60 Min Dolomites Endurance", "Telo Ride Scenic", "Zone 2", 3600, 10),
                new Listed("60 Min Coastal Endurance + Surges", "Telo Ride Scenic", "Endurance", 3600, 20),
            ],
            catalogue!.Classes.Select(c => new Listed(c.Title, c.Channel, c.Focus, c.LengthSeconds, c.OpensAtLevel)));
    }

    private sealed record Listed(string Title, string Channel, string Focus, int LengthSeconds, int OpensAtLevel);
}

/// <summary>The catalogue as the API serves it, read back by the acceptance tests.</summary>
public sealed record Catalogue(IReadOnlyList<CatalogueShelf> Shelves, IReadOnlyList<CatalogueClass> Classes);

public sealed record CatalogueShelf(string Id, string Title, string Tagline);

public sealed record CatalogueClass(
    string Id,
    string Title,
    string Channel,
    string Focus,
    int LengthSeconds,
    int OpensAtLevel,
    string ShelfId,
    string Summary,
    string World,
    CatalogueVideo Video,
    CataloguePlan Plan);

public sealed record CatalogueVideo(string VideoId, double SyncOffsetSeconds);

public sealed record CataloguePlan(IReadOnlyList<CatalogueSegment> Segments);

public sealed record CatalogueSegment(string Kind, int Duration, int Level, int CadenceAim);
