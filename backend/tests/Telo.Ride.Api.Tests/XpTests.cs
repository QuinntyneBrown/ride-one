// Acceptance test
// Traces to: L2-037 AC1, AC2, AC3, AC6; L2-044 AC2, AC4; L2-125 AC3
// Description: the backend computes a recorded ride's XP and adds it to the rider's total. 2nd of 10 against bots and
// 84 % on target earns "Finished" +100, "2 of 10" +160, "Podium" +75 and "84% on target" +67, 402 in all, until the
// streak is kept (slice 10.4). A place off the podium has no podium line, and a solo race or a class has no place or
// podium line. A repeat of the ride id answers with the same lines and adds nothing, and XP the body sends is not read.
// An on-target share outside 0 to 1 is refused with 400.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Telo.Ride.Api.Tests;

public sealed class XpTests(SignInApi api) : IClassFixture<SignInApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    private async Task<HttpClient> SignedIn(string email)
    {
        api.Clock.Advance(TimeSpan.FromHours(2));
        var browser = api.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
        });
        using var sent = await browser.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await browser.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        Assert.Equal(HttpStatusCode.OK, confirmed.StatusCode);
        return browser;
    }

    private static async Task<JsonElement> Submit(HttpClient browser, object ride, HttpStatusCode expected = HttpStatusCode.Created)
    {
        using var response = await browser.PostAsJsonAsync("/api/rides", ride, Cancel);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Cancel)).RootElement.Clone();
        Assert.True(response.StatusCode == expected, body.GetRawText());
        return body;
    }

    /// <summary>Each XP line as "label +xp".</summary>
    private static string[] Lines(JsonElement answer) =>
        [.. answer.GetProperty("xpLines").EnumerateArray().Select(line =>
            $"{line.GetProperty("label").GetString()} +{line.GetProperty("xp").GetInt32()}")];

    [Fact]
    [Trait("Category", "Critical")]
    public async Task Second_of_ten_against_bots_and_84_percent_on_target_earns_402_xp()
    {
        using var browser = await SignedIn("xavi.earns@example.com");

        var answer = await Submit(browser, RideBodies.Race(Guid.NewGuid()));

        Assert.Equal(["Finished +100", "2 of 10 +160", "Podium +75", "84% on target +67"], Lines(answer));
        Assert.Equal(402, answer.GetProperty("xpTotal").GetInt32());
        Assert.Equal(402, answer.GetProperty("totalXp").GetInt32());
    }

    [Fact]
    public async Task Each_ride_adds_its_xp_to_the_rider_total()
    {
        using var browser = await SignedIn("xavi.adds@example.com");
        await Submit(browser, RideBodies.Race(Guid.NewGuid()));

        var answer = await Submit(browser, RideBodies.Class(Guid.NewGuid()));

        Assert.Equal(["Finished +100", "50% on target +40"], Lines(answer));
        Assert.Equal(140, answer.GetProperty("xpTotal").GetInt32());
        Assert.Equal(542, answer.GetProperty("totalXp").GetInt32());
    }

    [Fact]
    public async Task A_place_off_the_podium_earns_its_place_and_no_podium()
    {
        using var browser = await SignedIn("xavi.fourth@example.com");

        var answer = await Submit(browser, RideBodies.Race(Guid.NewGuid(), ("place", 4), ("onTargetShare", 0.0)));

        Assert.Equal(["Finished +100", "4 of 10 +120", "0% on target +0"], Lines(answer));
    }

    [Fact]
    public async Task A_solo_race_has_no_place_or_podium_line()
    {
        using var browser = await SignedIn("xavi.solo@example.com");

        var answer = await Submit(browser, RideBodies.Race(Guid.NewGuid(), ("mode", "solo"), ("pack", null), ("place", 1), ("fieldSize", 2)));

        Assert.Equal(["Finished +100", "84% on target +67"], Lines(answer));
    }

    [Fact]
    public async Task A_repeat_answers_with_the_same_lines_and_adds_nothing()
    {
        using var browser = await SignedIn("xavi.twice@example.com");
        var rideId = Guid.NewGuid();
        var first = await Submit(browser, RideBodies.Race(rideId));

        var repeat = await Submit(browser, RideBodies.Race(rideId), HttpStatusCode.OK);
        var next = await Submit(browser, RideBodies.Class(Guid.NewGuid()));

        Assert.Equal(first.GetRawText(), repeat.GetRawText());
        Assert.Equal(542, next.GetProperty("totalXp").GetInt32());
    }

    [Fact]
    public async Task Xp_the_body_sends_is_not_read()
    {
        using var browser = await SignedIn("xavi.claims@example.com");

        var answer = await Submit(browser, RideBodies.Race(Guid.NewGuid(), ("xpTotal", 99_999), ("totalXp", 99_999)));

        Assert.Equal(402, answer.GetProperty("totalXp").GetInt32());
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(1.01)]
    public async Task An_on_target_share_outside_0_to_1_is_refused(double share)
    {
        using var browser = await SignedIn($"xavi.share.{share.GetHashCode():x}@example.com");

        var problem = await Submit(browser, RideBodies.Race(Guid.NewGuid(), ("onTargetShare", share)), HttpStatusCode.BadRequest);

        Assert.True(problem.GetProperty("errors").TryGetProperty("onTargetShare", out _));
    }
}
