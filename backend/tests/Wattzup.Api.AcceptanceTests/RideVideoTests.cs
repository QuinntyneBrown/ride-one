// Acceptance Test
// Traces to: L2-010, L2-014
// Description: A plan's optional ride-along video (ADR 0012): a YouTube link is accepted and reported as its video id
// and start point, no video reports null, and a link that is not YouTube or a start point out of range is refused.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class RideVideoTests
{
    private static object Flat(object? video) =>
        new { kind = "flat", level = 12, minutes = 1, cadence = 85, video };

    [Theory]
    [InlineData("https://www.youtube.com/watch?v=QUoToFsMNig")]
    [InlineData("m.youtube.com/watch?v=QUoToFsMNig&t=40")]
    public async Task Given_a_plan_with_a_YouTube_link_then_the_workout_reports_its_video_id_and_start_point(string url)
    {
        await using var bike = await Bike.StartAsync();

        var workout = await Ride.StartAsync(bike, Flat(new { url, start_seconds = 12 }));

        var video = workout.GetProperty("plan").GetProperty("video");
        Assert.Equal("QUoToFsMNig", video.GetProperty("video_id").GetString());
        Assert.Equal(12.0, video.GetProperty("start_seconds").GetDouble());
        Assert.False(video.TryGetProperty("url", out _));
    }

    [Fact]
    public async Task Given_a_plan_with_no_video_then_plan_video_is_null()
    {
        await using var bike = await Bike.StartAsync();

        var workout = await Ride.StartAsync(bike, Ride.Flat);

        Assert.Equal(JsonValueKind.Null, workout.GetProperty("plan").GetProperty("video").ValueKind);
    }

    [Fact]
    public async Task Given_a_Vimeo_link_then_the_answer_is_400_naming_video_url()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync("/api/workout", Flat(new { url = "https://vimeo.com/76979871", start_seconds = 0 }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("That doesn't look like a YouTube link.", problem.GetProperty("errors").GetProperty("video.url")[0].GetString());
    }

    [Fact]
    public async Task Given_a_start_point_above_12_hours_then_the_answer_is_400_naming_video_start_seconds()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync(
            "/api/workout", Flat(new { url = "https://youtu.be/QUoToFsMNig", start_seconds = 43200.1 }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal(
            "Start point must be 0:00 to 12:00:00.",
            problem.GetProperty("errors").GetProperty("video.start_seconds")[0].GetString());
    }
}
