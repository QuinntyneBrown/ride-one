// Acceptance Test
// Traces to: L2-014, L2-033
// Description: A freshly started backend reports the starting state through GET /api/status and
// GET /health, with every contract field present, nulls written, and an OpenAPI document.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class StatusEndpointTests
{
    private static readonly string[] NullableFields =
    [
        "device", "device_label", "error", "resistance", "target_resistance", "workout", "cadence",
        "speed_kmh", "speed_mph", "first_data_at", "last_data_at", "displayed_since", "power",
        "target_power", "avg_power", "distance_km", "kcal", "heart_rate",
    ];

    [Fact]
    public async Task Given_a_fresh_start_when_status_is_read_then_it_is_the_starting_state()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri("/api/status", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var state = json.RootElement;
        Assert.Equal("starting", state.GetProperty("ble").GetString());
        Assert.Equal(0, state.GetProperty("packets").GetInt32());
        Assert.Equal(0, state.GetProperty("displayed_seconds").GetDouble());
        Assert.Equal(0, state.GetProperty("ui_clients").GetInt32());
        Assert.Equal(JsonValueKind.Array, state.GetProperty("commands").ValueKind);
        Assert.Equal(0, state.GetProperty("commands").GetArrayLength());
        Assert.Equal("unknown", state.GetProperty("adapter").GetString());
        Assert.Equal("0bf669f1", state.GetProperty("connection_id").GetString());
        Assert.False(state.GetProperty("simulated").GetBoolean());
        Assert.False(state.GetProperty("exposed").GetBoolean());
        Assert.Equal(JsonValueKind.String, state.GetProperty("transport").ValueKind);
        Assert.Equal(JsonValueKind.String, state.GetProperty("bind_address").ValueKind);
        Assert.False(state.TryGetProperty("ts", out _), "ts belongs to stream messages only");
        foreach (var field in NullableFields)
        {
            Assert.True(state.TryGetProperty(field, out var value), $"field '{field}' is missing");
            Assert.Equal(JsonValueKind.Null, value.ValueKind);
        }
    }

    [Fact]
    public async Task Given_the_host_is_up_when_health_is_read_then_it_reports_the_ble_state()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri("/health", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("starting", json.RootElement.GetProperty("ble").GetString());
    }

    [Fact]
    public async Task Given_the_host_is_up_when_the_openapi_document_is_read_then_it_describes_status_and_the_state_schema()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri("/openapi/v1.json", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var paths = json.RootElement.GetProperty("paths");
        Assert.True(paths.TryGetProperty("/api/status", out _), "/api/status is not described");
        Assert.True(paths.TryGetProperty("/health", out _), "/health is not described");
        var schema = json.RootElement.GetProperty("components").GetProperty("schemas").GetProperty("BikeState");
        var properties = schema.GetProperty("properties");
        foreach (var field in NullableFields.Concat(["ble", "packets", "commands", "adapter"]))
        {
            Assert.True(properties.TryGetProperty(field, out _), $"schema property '{field}' is missing");
        }
    }
}
