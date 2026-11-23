// Acceptance test
// Traces to: L2-129 AC1, AC4
// Description: a request with a field that breaks its rule is refused with 400, code validation_failed and errors
// keyed by the field as the app sends it, before its handler runs: a number sent as text, a catalogue id that is not
// one, an id longer than any the catalogue holds. The refusal names no .NET type.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Telo.Ride.Api.Tests;

public sealed class InputValidationTests(SignedInProbeApi api) : IClassFixture<SignedInProbeApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private static async Task<JsonElement> Refused(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync(Cancel);
        var problem = JsonDocument.Parse(body).RootElement.Clone();
        Assert.Equal("validation_failed", problem.GetProperty("code").GetString());
        Assert.True(problem.GetProperty("errors").GetProperty(field).GetArrayLength() > 0, body);
        Assert.DoesNotContain("System.", body);
        Assert.DoesNotContain("Telo.Ride", body);
        Assert.Equal(JsonValueKind.String, problem.GetProperty("traceId").ValueKind);
        return problem;
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task A_number_sent_as_text_is_refused_naming_its_field()
    {
        using var client = api.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/rides", new { elapsedSeconds = "six minutes" }, Cancel);

        var problem = await Refused(response, "elapsedSeconds");
        Assert.Equal(["elapsedSeconds"], problem.GetProperty("errors").EnumerateObject().Select(field => field.Name));
    }

    [Fact]
    public async Task A_body_that_is_not_JSON_is_refused()
    {
        using var client = api.CreateClient();
        using var content = new StringContent("{ \"kind\": ", System.Text.Encoding.UTF8, "application/json");

        using var response = await client.PostAsync("/api/rides", content, Cancel);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement;
        Assert.Equal("validation_failed", problem.GetProperty("code").GetString());
    }

    [Theory]
    [InlineData("/api/classes/HIIT%20%3Cb%3E", "id")]
    [InlineData("/api/classes/a-class-id-far-longer-than-any-the-catalogue-holds-or-ever-will-hold-x", "id")]
    public async Task A_catalogue_id_that_breaks_its_rule_is_refused_naming_its_field(string path, string field)
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync(path, Cancel);

        await Refused(response, field);
    }

    [Fact]
    public async Task Marking_an_unlock_seen_with_an_id_that_breaks_its_rule_is_refused()
    {
        using var client = api.CreateClient();

        using var response = await client.PostAsync("/api/progress/unlocks/Vice%20City!/seen", null, Cancel);

        await Refused(response, "mapId");
    }

    [Fact]
    public async Task A_catalogue_id_that_keeps_its_rule_but_names_nothing_is_still_not_found()
    {
        using var client = api.CreateClient();

        using var response = await client.GetAsync("/api/classes/no-such-class", Cancel);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
