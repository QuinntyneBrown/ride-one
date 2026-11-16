// Acceptance Test
// Traces to: L2-014, L2-052
// Description: /openapi/v1.json describes the state contract the frontend generates its types from: snake_case names,
// every field required, nullable fields nullable, enums as their contract strings, and every endpoint's bodies.

using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class OpenApiTests
{
    private static async Task<JsonElement> DocumentAsync()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();
        using var response = await client.GetAsync(new Uri("/openapi/v1.json", UriKind.Relative));
        response.EnsureSuccessStatusCode();
        return await Bike.JsonAsync(response);
    }

    private static JsonElement Schema(JsonElement doc, string name) => doc.GetProperty("components").GetProperty("schemas").GetProperty(name);

    private static bool IsNullable(JsonElement property) =>
        property.TryGetProperty("type", out var type) && type.ValueKind == JsonValueKind.Array && type.EnumerateArray().Any(t => t.GetString() == "null")
        || property.TryGetProperty("oneOf", out var oneOf) && oneOf.EnumerateArray().Any(o => o.TryGetProperty("type", out var t) && t.GetString() == "null")
        || property.TryGetProperty("anyOf", out var anyOf) && anyOf.EnumerateArray().Any(o => o.TryGetProperty("type", out var t) && t.GetString() == "null");

    [Fact]
    public async Task The_state_schema_requires_every_field_and_marks_the_nullable_ones()
    {
        var doc = await DocumentAsync();
        var state = Schema(doc, "BikeState");
        var required = state.GetProperty("required").EnumerateArray().Select(r => r.GetString()).ToHashSet();
        var properties = state.GetProperty("properties");

        foreach (var property in properties.EnumerateObject())
        {
            Assert.Contains(property.Name, required);
        }

        Assert.True(IsNullable(properties.GetProperty("resistance")));
        Assert.True(IsNullable(properties.GetProperty("workout")));
        Assert.False(IsNullable(properties.GetProperty("packets")));
    }

    [Fact]
    public async Task The_ble_enum_is_described_by_its_contract_strings()
    {
        var doc = await DocumentAsync();
        var ble = Schema(doc, "BikeState").GetProperty("properties").GetProperty("ble");
        var values = (ble.TryGetProperty("$ref", out var r) ? Schema(doc, r.GetString()!.Split('/')[^1]) : ble).GetProperty("enum").EnumerateArray().Select(v => v.GetString()).ToList();

        Assert.Equal(["starting", "scanning", "connecting", "connected", "disconnected", "error"], values);
    }

    [Theory]
    [InlineData("/api/status", "get")]
    [InlineData("/api/events/token", "post")]
    [InlineData("/api/resistance", "post")]
    [InlineData("/api/bike/reconnect", "post")]
    [InlineData("/api/workout", "post")]
    [InlineData("/api/workout/stop", "post")]
    [InlineData("/api/workout/pause", "post")]
    [InlineData("/api/workout/resume", "post")]
    [InlineData("/api/workout/back-to-plan", "post")]
    [InlineData("/api/workout/trace", "get")]
    [InlineData("/api/diagnostics/packets", "get")]
    [InlineData("/health", "get")]
    public async Task Every_endpoint_is_described(string path, string method)
    {
        var doc = await DocumentAsync();

        Assert.True(doc.GetProperty("paths").GetProperty(path).TryGetProperty(method, out _), $"{method} {path}");
    }

    [Fact]
    public async Task The_workout_plan_is_a_kind_discriminated_union_of_hiit_and_flat()
    {
        var doc = await DocumentAsync();
        var schemas = doc.GetProperty("components").GetProperty("schemas");

        Assert.True(schemas.TryGetProperty("WorkoutPlanHiitPlan", out var hiit));
        Assert.True(schemas.TryGetProperty("WorkoutPlanFlatPlan", out _));
        Assert.Equal("kind", schemas.GetProperty("WorkoutPlan").GetProperty("discriminator").GetProperty("propertyName").GetString());
        Assert.Contains("work_seconds", hiit.GetProperty("properties").EnumerateObject().Select(p => p.Name));
        Assert.True(schemas.TryGetProperty("WorkoutSnapshot", out var snapshot));
        Assert.Contains("ended_reason", snapshot.GetProperty("required").EnumerateArray().Select(r => r.GetString()));
    }

    [Fact]
    public async Task The_workout_status_is_an_enum_of_its_contract_strings()
    {
        var doc = await DocumentAsync();
        var status = Schema(doc, "WorkoutSnapshot").GetProperty("properties").GetProperty("status");

        Assert.Equal(
            ["waiting for bike", "starting belt", "running", "paused", "paused: bike disconnected", "paused: belt stopped", "ended", "ended: bike shut off", "stopped"],
            status.GetProperty("enum").EnumerateArray().Select(v => v.GetString()).ToList());
    }

    [Fact]
    public async Task Problems_describe_the_code_and_error_extensions_clients_branch_on()
    {
        var doc = await DocumentAsync();

        foreach (var name in new[] { "ProblemDetails", "HttpValidationProblemDetails" })
        {
            var properties = Schema(doc, name).GetProperty("properties");
            Assert.True(properties.TryGetProperty("code", out _), name);
            Assert.True(properties.TryGetProperty("error", out _), name);
        }
    }

    [Fact]
    public async Task A_trace_sample_is_a_pair_of_integers()
    {
        var doc = await DocumentAsync();
        var sample = Schema(doc, "PowerTrace").GetProperty("properties").GetProperty("samples").GetProperty("items");

        Assert.Equal(2, sample.GetProperty("minItems").GetInt32());
        Assert.Equal(2, sample.GetProperty("maxItems").GetInt32());
    }
}
