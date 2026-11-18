// Acceptance Test
// Traces to: L2-077, L2-078
// Description: The class catalogue is a JSON file the backend reads and serves read-only at GET /api/classes and
// GET /api/classes/{id}: shelves and classes in file order, invalid classes left out, a missing file an empty catalogue.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class ClassCatalogueTests
{
    private const string Catalogue = """
        {
          "shelves": [
            { "id": "short", "title": "20 min", "tagline": "Short and sharp." },
            { "id": "unused", "title": "Unused", "tagline": "" },
            { "id": "long", "title": "60 min", "tagline": "Steady legs." }
          ],
          "classes": [
            { "id": "steady-hour", "title": "Steady Hour", "channel": "Wattzup Scenic", "focus": "Zone 2",
              "description": "One level.", "shelf": "long",
              "plan": { "kind": "flat", "level": 12, "minutes": 60, "cadence": 85 } },
            { "id": "power-intervals", "title": "Power Intervals", "channel": "Wattzup Studio", "focus": "VO2 max",
              "description": "Six efforts.", "shelf": "short",
              "plan": { "kind": "hiit", "rounds": 6, "work_seconds": 60, "rest_seconds": 60, "work_level": 22,
                        "rest_level": 7, "warmup": true, "cooldown": true,
                        "video": { "url": "https://www.youtube.com/watch?v=QUoToFsMNig", "start_seconds": 12 } } }
          ]
        }
        """;

    internal static WattzupApiFactory FactoryWith(string? json, IDictionary<string, string?>? extra = null)
    {
        // Settings are read when the host is built, so the path can name a file in the factory's own directory.
        var settings = new Dictionary<string, string?>(extra ?? new Dictionary<string, string?>());
        var factory = new WattzupApiFactory(settings) { WithoutBluetooth = true };
        var path = Path.Combine(factory.Directory, "classes.json");
        settings["Wattzup:Classes:Path"] = path;
        if (json is not null)
        {
            File.WriteAllText(path, json);
        }

        return factory;
    }

    private static async Task<JsonElement> GetJsonAsync(HttpClient client, string path)
    {
        using var response = await client.GetAsync(new Uri(path, UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await Bike.JsonAsync(response);
    }

    [Fact]
    public async Task Given_a_valid_catalogue_then_GET_classes_serves_its_shelves_and_classes_in_file_order()
    {
        using var factory = FactoryWith(Catalogue);
        using var client = factory.CreateClient();

        var json = await GetJsonAsync(client, "/api/classes");

        var shelves = json.GetProperty("shelves").EnumerateArray().ToList();
        Assert.Equal(["short", "long"], shelves.Select(s => s.GetProperty("id").GetString()));
        Assert.Equal("Short and sharp.", shelves[0].GetProperty("tagline").GetString());
        var power = Assert.Single(shelves[0].GetProperty("classes").EnumerateArray());
        Assert.Equal("power-intervals", power.GetProperty("id").GetString());
        Assert.Equal("VO2 max", power.GetProperty("focus").GetString());
        Assert.Equal("short", power.GetProperty("shelf").GetProperty("id").GetString());
        var plan = power.GetProperty("plan");
        Assert.Equal("hiit", plan.GetProperty("kind").GetString());
        Assert.Equal(22, plan.GetProperty("work_level").GetInt32());
        Assert.Equal(JsonValueKind.Null, plan.GetProperty("work_speed").ValueKind);
        Assert.Equal("QUoToFsMNig", plan.GetProperty("video").GetProperty("video_id").GetString());
        Assert.Equal(12, plan.GetProperty("video").GetProperty("start_seconds").GetDouble());
        Assert.False(plan.GetProperty("video").TryGetProperty("url", out _));
        var steady = Assert.Single(shelves[1].GetProperty("classes").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, steady.GetProperty("plan").GetProperty("video").ValueKind);
    }

    [Fact]
    public async Task Given_no_setting_then_the_default_classes_json_is_served()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();

        var json = await GetJsonAsync(client, "/api/classes");

        var shelves = json.GetProperty("shelves").EnumerateArray().ToList();
        Assert.Equal(["20-min", "30-min", "60-min-endurance"], shelves.Select(s => s.GetProperty("id").GetString()));
        Assert.Equal(6, shelves.Sum(s => s.GetProperty("classes").GetArrayLength()));
        var withVideo = shelves.SelectMany(s => s.GetProperty("classes").EnumerateArray())
            .Where(c => c.GetProperty("plan").GetProperty("video").ValueKind != JsonValueKind.Null)
            .Select(c => c.GetProperty("id").GetString());
        Assert.Equal(["30-minute-hiit-cardio"], withVideo);
    }

    [Fact]
    public async Task Given_a_missing_file_then_the_catalogue_is_empty_and_the_backend_starts()
    {
        using var factory = FactoryWith(null);
        using var client = factory.CreateClient();

        var json = await GetJsonAsync(client, "/api/classes");

        Assert.Equal("""{"shelves":[]}""", json.GetRawText());
        Assert.Single(factory.Logs.Entries, e => e.Level == Microsoft.Extensions.Logging.LogLevel.Error && e.Message.Contains("classes.json", StringComparison.Ordinal));
    }

    [Fact]
    public async Task The_class_endpoints_are_in_the_OpenAPI_document()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();

        var doc = await GetJsonAsync(client, "/openapi/v1.json");

        var paths = doc.GetProperty("paths");
        Assert.True(paths.GetProperty("/api/classes").TryGetProperty("get", out _));
        var schemas = doc.GetProperty("components").GetProperty("schemas");
        var required = schemas.GetProperty("ClassResponse").GetProperty("required").EnumerateArray().Select(r => r.GetString());
        Assert.Equal(["channel", "description", "focus", "id", "plan", "shelf", "title"], required.Order());
    }
}
