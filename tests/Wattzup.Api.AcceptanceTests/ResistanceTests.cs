// Acceptance Test
// Traces to: L2-008, L2-009, L2-016, L2-048
// Description: POST /api/resistance writes the set-resistance command, tracks target vs. reported resistance and logs
// each command with its source, status and acknowledgement latency.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class ResistanceTests
{
    [Fact]
    public async Task Given_the_bike_is_connected_when_level_12_is_posted_then_it_is_sent_and_acknowledged()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync("/api/resistance", new { level = 12 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(12, (await Bike.JsonAsync(response)).GetProperty("sent").GetInt32());
        Assert.Equal("F0B1010CAE", Convert.ToHexString(bike.Factory.Simulation.Writes[^1].Bytes));
        var state = await bike.Stream.WaitForAsync(
            s => s.GetProperty("resistance").ValueKind == JsonValueKind.Number && s.GetProperty("target_resistance").ValueKind == JsonValueKind.Number,
            "the target and the bike's report");
        Assert.Equal(12, state.GetProperty("target_resistance").GetInt32());
        Assert.Equal(12, state.GetProperty("resistance").GetInt32());
        var entry = state.GetProperty("commands")[0];
        Assert.Equal(12, entry.GetProperty("level").GetInt32());
        Assert.Equal("manual", entry.GetProperty("source").GetString());
        Assert.Equal("ack", entry.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, entry.GetProperty("ride_seconds").ValueKind);
    }

    [Fact]
    public async Task Given_the_echo_arrives_38_ms_after_the_write_then_the_entry_is_ack_with_ack_ms_38()
    {
        await using var bike = await Bike.StartAsync();
        bike.Factory.Simulation.HoldEchoes = true;

        using var response = await bike.PostAsync("/api/resistance", new { level = 22 });
        await bike.Stream.WaitForAsync(s => s.GetProperty("commands").GetArrayLength() == 1 && s.GetProperty("commands")[0].GetProperty("status").GetString() == "sending", "a sending entry");
        bike.Factory.Time.Advance(TimeSpan.FromMilliseconds(38));
        bike.Factory.Simulation.ReleaseEchoes();

        var state = await bike.Stream.WaitForAsync(s => s.GetProperty("commands")[0].GetProperty("status").GetString() == "ack", "the entry acknowledged");
        Assert.Equal(38, state.GetProperty("commands")[0].GetProperty("ack_ms").GetInt32());
    }

    [Fact]
    public async Task Given_the_bike_ignores_the_level_then_target_and_reported_resistance_differ()
    {
        await using var bike = await Bike.StartAsync();
        await bike.PostAsync("/api/resistance", new { level = 12 });
        await bike.Stream.WaitForAsync(s => s.GetProperty("resistance").ValueKind == JsonValueKind.Number, "resistance 12");
        bike.Factory.Simulation.IgnoreResistance = true;

        await bike.PostAsync("/api/resistance", new { level = 20 });

        var state = await bike.Stream.WaitForAsync(s => s.GetProperty("target_resistance").GetInt32() == 20, "target 20");
        Assert.Equal(12, state.GetProperty("resistance").GetInt32());
        Assert.Equal("sending", state.GetProperty("commands")[0].GetProperty("status").GetString());
    }

    [Theory]
    [InlineData("""{"level":0}""")]
    [InlineData("""{"level":33}""")]
    [InlineData("""{"level":"twelve"}""")]
    [InlineData("""{"level":12.5}""")]
    [InlineData("""{}""")]
    [InlineData("")]
    [InlineData("{not json")]
    public async Task Given_an_invalid_level_then_the_answer_is_400_level_must_be_1_32_and_nothing_is_written(string body)
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostRawAsync("/api/resistance", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("level must be 1-32", problem.GetProperty("error").GetString());
        Assert.Equal("invalid_level", problem.GetProperty("code").GetString());
        Assert.DoesNotContain(bike.Factory.Simulation.Writes, w => w.Bytes[1] == 0xB1);
    }

    [Fact]
    public async Task Given_the_bike_is_not_connected_then_the_answer_is_503_and_the_command_is_logged_failed()
    {
        await using var bike = await Bike.StartAsync(connected: false);

        using var response = await bike.PostAsync("/api/resistance", new { level = 12 });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("bike not connected", problem.GetProperty("error").GetString());
        Assert.Equal("bike_not_connected", problem.GetProperty("code").GetString());
        var state = await bike.Stream.WaitForAsync(s => s.GetProperty("commands").GetArrayLength() == 1, "the failed entry");
        Assert.Equal("failed", state.GetProperty("commands")[0].GetProperty("status").GetString());
        Assert.Empty(bike.Factory.Simulation.Writes);
    }
}
