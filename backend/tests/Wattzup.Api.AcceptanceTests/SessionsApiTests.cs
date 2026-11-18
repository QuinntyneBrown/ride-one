// Acceptance Test
// Traces to: L2-083, L2-087
// Description: GET /api/sessions lists summaries newest first, GET /api/sessions/{id} answers the whole session with its
// previous attempt and bests or 404 session_not_found, and GET /api/progress answers the streak, week, totals, classes
// and achievements in the rider's local days. Read-only, key-protected and in the OpenAPI document.

using System.Net;
using System.Text.Json;
using Wattzup.Core.Sessions;
using Wattzup.Core.Workouts;

namespace Wattzup.Api.AcceptanceTests;

public sealed class SessionsApiTests
{
    private static readonly IntervalsPlan Plan = new(new Stretch(60, 9, 80), [new IntervalSet(2, 60, 22, 100, 60, 7, 72)], new Stretch(60, 6, 70));

    /// <summary>A session of <see cref="Plan"/> ending <paramref name="endedAt"/>, built by the real rules.</summary>
    private static SessionRecord Session(string id, DateTimeOffset endedAt, string? classId, int power, int ridden = 360, int dipAt = -1)
    {
        var segments = PlanExpander.Expand(Plan);
        var samples = Enumerable.Range(0, ridden).Select(t => new RideSample(power, t >= dipAt && t < dipAt + 8 ? 80 : segments.First(s => t >= s.Start && t < s.Start + s.Duration).Cadence ?? 85)).ToArray();
        var totals = samples.Aggregate(RideTotals.Empty, (acc, s) => acc.Tick(s.Power, 30));
        return SessionBuilder.Build(new SessionInput(id, endedAt, classId, classId is null ? WorkoutSummary.For(Plan) : "20 Minute Power Intervals", Plan, segments, samples, totals));
    }

    /// <summary>A host whose sessions file holds <paramref name="sessions"/> and whose clock reads <paramref name="now"/>, in UTC.</summary>
    private static (WattzupApiFactory Factory, HttpClient Client) Host(DateTimeOffset now, params SessionRecord[] sessions)
    {
        var factory = new WattzupApiFactory { WithoutBluetooth = true };
        SessionFile.Write(factory.SessionsPath, [.. sessions.OrderByDescending(s => s.EndedAt)]);
        factory.Time.SetLocalTimeZone(TimeZoneInfo.Utc);
        factory.Time.AdjustTime(now);
        return (factory, factory.CreateClient());
    }

    private static readonly DateTimeOffset Now = new(2026, 11, 18, 12, 0, 0, TimeSpan.Zero);

    private static async Task<JsonElement> GetAsync(HttpClient client, string path)
    {
        using var response = await client.GetAsync(new Uri(path, UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await Bike.JsonAsync(response);
    }

    [Fact]
    public async Task Given_no_sessions_then_the_list_is_empty()
    {
        var (factory, client) = Host(Now);
        using var host = factory;

        Assert.Equal("{\"sessions\":[]}", JsonSerializer.Serialize(await GetAsync(client, "/api/sessions")));
    }

    [Fact]
    public async Task Given_sessions_then_the_list_has_their_summaries_newest_first()
    {
        var (factory, client) = Host(Now, Session("aaaaaaaaaaa1", Now.AddDays(-2), "power", 200), Session("aaaaaaaaaaa2", Now.AddDays(-1), null, 210, dipAt: 70));
        using var host = factory;

        var list = (await GetAsync(client, "/api/sessions")).GetProperty("sessions");

        Assert.Equal(["aaaaaaaaaaa2", "aaaaaaaaaaa1"], list.EnumerateArray().Select(s => s.GetProperty("id").GetString()));
        var first = list[0];
        Assert.Equal(
            ["id", "ended_at", "class_id", "title", "ridden_seconds", "planned_seconds", "completed", "avg_power", "on_target_pct", "dip_count"],
            first.EnumerateObject().Select(p => p.Name));
        Assert.Equal(JsonValueKind.Null, first.GetProperty("class_id").ValueKind);
        Assert.Equal(1, first.GetProperty("dip_count").GetInt32());
    }

    [Fact]
    public async Task Given_a_session_id_then_the_whole_session_is_answered_with_its_previous_attempt_and_bests()
    {
        var (factory, client) = Host(Now, Session("aaaaaaaaaaa1", Now.AddDays(-2), "power", 200), Session("aaaaaaaaaaa2", Now.AddDays(-1), "power", 210));
        using var host = factory;

        var session = await GetAsync(client, "/api/sessions/aaaaaaaaaaa2");

        Assert.Equal("aaaaaaaaaaa1", session.GetProperty("previous").GetProperty("id").GetString());
        Assert.Equal(["Best 1-minute power", "Best average on this class", "No cadence dips"], session.GetProperty("bests").EnumerateArray().Select(b => b.GetString()));
        Assert.Equal("intervals", session.GetProperty("plan").GetProperty("kind").GetString());
        Assert.Equal(72, session.GetProperty("cadence_trace").GetArrayLength());
        foreach (var field in new[] { "segments", "planned_seconds", "max_power", "best_minute_power", "avg_cadence", "distance_km", "kcal", "dips", "power_trace" })
        {
            Assert.True(session.TryGetProperty(field, out _), field);
        }

        Assert.False(session.TryGetProperty("heart_rate", out _));
    }

    [Fact]
    public async Task Given_a_first_ride_then_previous_is_null_and_no_best_is_invented()
    {
        var (factory, client) = Host(Now, Session("aaaaaaaaaaa1", Now.AddDays(-1), "power", 200, dipAt: 70));
        using var host = factory;

        var session = await GetAsync(client, "/api/sessions/aaaaaaaaaaa1");

        Assert.Equal(JsonValueKind.Null, session.GetProperty("previous").ValueKind);
        Assert.Equal(0, session.GetProperty("bests").GetArrayLength());
    }

    [Theory]
    [InlineData("/api/sessions/bbbbbbbbbbbb")]
    [InlineData("/api/sessions/..%2Fx")]
    [InlineData("/api/sessions/AAAAAAAAAAA1")]
    public async Task Given_an_id_no_session_has_then_the_answer_is_404_session_not_found(string path)
    {
        var (factory, client) = Host(Now, Session("aaaaaaaaaaa1", Now.AddDays(-1), "power", 200));
        using var host = factory;

        using var response = await client.GetAsync(new Uri(path, UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("session_not_found", (await Bike.JsonAsync(response)).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Given_progress_then_it_answers_the_figures_in_local_days()
    {
        var (factory, client) = Host(
            Now,
            Session("aaaaaaaaaaa1", Now.AddDays(-2), "power", 200),
            Session("aaaaaaaaaaa2", Now.AddDays(-1), "power", 210),
            Session("aaaaaaaaaaa3", Now.AddHours(-2), null, 150, ridden: 100));
        using var host = factory;

        var progress = await GetAsync(client, "/api/progress");

        Assert.Equal("2026-11-18", progress.GetProperty("today").GetString());
        Assert.Equal("{\"current\":3,\"best\":3,\"rode_today\":true}", JsonSerializer.Serialize(progress.GetProperty("streak")));
        Assert.Equal(["2026-11-16", "2026-11-17", "2026-11-18"], progress.GetProperty("ride_days").EnumerateArray().Select(d => d.GetString()));
        Assert.Equal("{\"rides\":3,\"goal\":4}", JsonSerializer.Serialize(progress.GetProperty("week")));
        Assert.Equal(3, progress.GetProperty("totals").GetProperty("rides").GetInt32());
        var power = Assert.Single(progress.GetProperty("classes").EnumerateArray());
        Assert.Equal(["aaaaaaaaaaa1", "aaaaaaaaaaa2"], power.GetProperty("attempts").EnumerateArray().Select(a => a.GetProperty("id").GetString()));
        var achievements = progress.GetProperty("achievements");
        Assert.Equal(6, achievements.GetArrayLength());
        Assert.Equal(
            ["id", "title", "detail", "goal", "unit", "value", "unlocked"],
            achievements[0].EnumerateObject().Select(p => p.Name));
    }

    [Theory]
    [InlineData("/api/sessions")]
    [InlineData("/api/sessions/aaaaaaaaaaa1")]
    [InlineData("/api/progress")]
    public async Task Given_another_method_then_the_answer_is_405(string path)
    {
        var (factory, client) = Host(Now);
        using var host = factory;

        using var response = await client.PostAsync(new Uri(path, UriKind.Relative), null);

        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }

    [Theory]
    [InlineData("/api/sessions")]
    [InlineData("/api/sessions/aaaaaaaaaaa1")]
    [InlineData("/api/progress")]
    public async Task Given_an_api_key_then_a_request_without_it_answers_401(string path)
    {
        using var factory = new WattzupApiFactory(new Dictionary<string, string?> { ["Wattzup:Security:ApiKey"] = "a-long-enough-test-key-0123456789" }) { WithoutBluetooth = true };
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri(path, UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task The_three_endpoints_are_in_the_OpenAPI_document()
    {
        var (factory, client) = Host(Now);
        using var host = factory;

        var paths = (await GetAsync(client, "/openapi/v1.json")).GetProperty("paths");

        Assert.True(paths.TryGetProperty("/api/sessions", out _));
        Assert.True(paths.TryGetProperty("/api/sessions/{id}", out _));
        Assert.True(paths.TryGetProperty("/api/progress", out _));
    }
}
