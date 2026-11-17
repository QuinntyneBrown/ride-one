// Acceptance Test
// Traces to: L2-062, L2-065, L2-069, L2-070
// Description: POST /api/speed and /api/incline write the treadmill's commands, log them and answer like the
// resistance endpoint; each machine's endpoints refuse the other machine; POST /api/machine switches machines.

using System.Net;
using System.Text.Json;
using Wattzup.Ble.Simulated;

namespace Wattzup.Api.AcceptanceTests;

public sealed class TreadmillControlTests
{
    private static string? FirstCommandStatus(JsonElement state) =>
        state.GetProperty("commands") is { } commands && commands.GetArrayLength() > 0 ? commands[0].GetProperty("status").GetString() : null;

    private static async Task<Bike> TreadmillAsync(bool connected = true) =>
        await Bike.StartAsync(TreadmillConnectionTests.TreadmillFactory(), connected);

    [Fact]
    public async Task Given_the_treadmill_is_connected_when_speed_8_5_is_posted_then_it_is_written_and_logged()
    {
        await using var treadmill = await TreadmillAsync();

        using var response = await treadmill.PostAsync("/api/speed", new { speed = 8.5 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(8.5, (await Bike.JsonAsync(response)).GetProperty("sent").GetDouble());
        var write = treadmill.Factory.Simulation.Writes.Last(w => w.Bytes is [0xF0, 0xB2, ..]);
        Assert.Equal("F0B2022134F9", Convert.ToHexString(write.Bytes));
        Assert.True(write.WithResponse);
        var state = await treadmill.Stream.WaitForAsync(s => s.GetProperty("target_speed").ValueKind == JsonValueKind.Number, "a target speed");
        Assert.Equal(8.5, state.GetProperty("target_speed").GetDouble());
        var entry = state.GetProperty("commands")[0];
        Assert.Equal("speed", entry.GetProperty("command").GetString());
        Assert.Equal(8.5, entry.GetProperty("value").GetDouble());
        Assert.Equal(JsonValueKind.Null, entry.GetProperty("level").ValueKind);
        Assert.Equal("manual", entry.GetProperty("source").GetString());
    }

    [Fact]
    public async Task Given_a_speed_command_when_the_treadmill_reports_that_speed_then_the_entry_is_acknowledged()
    {
        await using var treadmill = await TreadmillAsync();
        using var response = await treadmill.PostAsync("/api/speed", new { speed = 9.0 });

        treadmill.Factory.Simulation.Notify(Convert.FromHexString("F0D302232810"));

        var state = await treadmill.Stream.WaitForAsync(s => FirstCommandStatus(s) == "ack", "an acknowledged speed");
        Assert.Equal(9.0, state.GetProperty("speed_kmh").GetDouble());
    }

    [Fact]
    public async Task Given_the_treadmill_is_connected_when_incline_3_is_posted_then_it_is_written_and_acknowledged()
    {
        await using var treadmill = await TreadmillAsync();

        using var response = await treadmill.PostAsync("/api/incline", new { incline = 3 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(3, (await Bike.JsonAsync(response)).GetProperty("sent").GetInt32());
        Assert.Contains(treadmill.Factory.Simulation.Writes, w => Convert.ToHexString(w.Bytes) == "F0B10103A5" && w.WithResponse);
        var state = await treadmill.Stream.WaitForAsync(
            s => s.GetProperty("incline").ValueKind == JsonValueKind.Number && s.GetProperty("incline").GetInt32() == 3 && FirstCommandStatus(s) == "ack"
                && s.GetProperty("target_incline").ValueKind == JsonValueKind.Number,
            "incline 3 acknowledged");
        Assert.Equal(3, state.GetProperty("target_incline").GetInt32());
        Assert.Equal("incline", state.GetProperty("commands")[0].GetProperty("command").GetString());
    }

    [Fact]
    public async Task Given_the_treadmill_when_the_Strides_top_speed_and_incline_are_posted_then_they_are_written()
    {
        await using var treadmill = await TreadmillAsync();

        using var speed = await treadmill.PostAsync("/api/speed", new { speed = 19.3 });
        using var incline = await treadmill.PostAsync("/api/incline", new { incline = 10 });

        Assert.Equal(HttpStatusCode.OK, speed.StatusCode);
        Assert.Equal(HttpStatusCode.OK, incline.StatusCode);
        Assert.Contains(treadmill.Factory.Simulation.Writes, w => Convert.ToHexString(w.Bytes) == "F0B2024B6453");
        Assert.Contains(treadmill.Factory.Simulation.Writes, w => Convert.ToHexString(w.Bytes) == "F0B1010AAC");
    }

    [Theory]
    [InlineData("{\"speed\":0.7}")]
    [InlineData("{\"speed\":19.4}")]
    [InlineData("{\"speed\":9.25}")]
    [InlineData("{\"speed\":\"9\"}")]
    [InlineData("{}")]
    [InlineData("")]
    public async Task Given_an_invalid_speed_then_the_answer_is_400_invalid_speed(string body)
    {
        await using var treadmill = await TreadmillAsync();

        using var response = await treadmill.PostRawAsync("/api/speed", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("invalid_speed", problem.GetProperty("code").GetString());
        Assert.Equal("speed must be 0.8-19.3", problem.GetProperty("error").GetString());
    }

    [Theory]
    [InlineData("{\"incline\":-1}")]
    [InlineData("{\"incline\":11}")]
    [InlineData("{\"incline\":2.5}")]
    [InlineData("{}")]
    public async Task Given_an_invalid_incline_then_the_answer_is_400_invalid_incline(string body)
    {
        await using var treadmill = await TreadmillAsync();

        using var response = await treadmill.PostRawAsync("/api/incline", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("invalid_incline", problem.GetProperty("code").GetString());
        Assert.Equal("incline must be 0-10", problem.GetProperty("error").GetString());
    }

    [Fact]
    public async Task Given_the_treadmill_is_not_connected_then_a_valid_speed_answers_503()
    {
        await using var treadmill = await TreadmillAsync(connected: false);

        using var response = await treadmill.PostAsync("/api/speed", new { speed = 7.0 });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("treadmill_not_connected", problem.GetProperty("code").GetString());
        Assert.Equal("treadmill not connected", problem.GetProperty("error").GetString());
        Assert.DoesNotContain(treadmill.Factory.Simulation.Writes, w => w.Bytes is [0xF0, 0xB2, ..]);
    }

    [Fact]
    public async Task Given_the_bike_is_chosen_then_speed_and_incline_answer_409_wrong_machine()
    {
        await using var bike = await Bike.StartAsync(TreadmillConnectionTests.BikeWithTreadmill());

        using var speed = await bike.PostAsync("/api/speed", new { speed = 7.0 });
        using var incline = await bike.PostAsync("/api/incline", new { incline = 1 });

        Assert.Equal(HttpStatusCode.Conflict, speed.StatusCode);
        Assert.Equal("wrong_machine", (await Bike.JsonAsync(speed)).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Conflict, incline.StatusCode);
        Assert.Equal("wrong_machine", (await Bike.JsonAsync(incline)).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Given_the_treadmill_is_chosen_then_resistance_answers_409_wrong_machine()
    {
        await using var treadmill = await TreadmillAsync();

        using var response = await treadmill.PostAsync("/api/resistance", new { level = 12 });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("wrong_machine", (await Bike.JsonAsync(response)).GetProperty("code").GetString());
        Assert.DoesNotContain(treadmill.Factory.Simulation.Writes, w => Convert.ToHexString(w.Bytes) == "F0B1010CAE");
    }

    [Fact]
    public async Task Given_the_bike_is_connected_when_the_treadmill_is_chosen_then_the_backend_switches_and_connects_to_it()
    {
        await using var bike = await Bike.StartAsync(TreadmillConnectionTests.BikeWithTreadmill());

        using var response = await bike.PostAsync("/api/machine", new { machine = "treadmill" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("treadmill", (await Bike.JsonAsync(response)).GetProperty("machine").GetString());
        var state = await bike.Stream.WaitForAsync(
            s => s.GetProperty("machine").GetString() == "treadmill" && s.GetProperty("ble").GetString() == "connected",
            "connected to the treadmill");
        Assert.Equal(SimulatedBikeTransport.TreadmillName, state.GetProperty("device").GetString());
        Assert.Contains("disconnect", bike.Factory.Simulation.Events);
    }

    [Fact]
    public async Task Given_the_machine_changes_then_the_other_machines_fields_are_reset_before_the_scan()
    {
        await using var bike = await Bike.StartAsync(TreadmillConnectionTests.BikeWithTreadmill());
        await bike.Stream.AdvanceUntilAsync(bike.Factory.Time, s => s.GetProperty("cadence").ValueKind == JsonValueKind.Number, "a cadence", TimeSpan.FromSeconds(1));

        using var response = await bike.PostAsync("/api/machine", new { machine = "treadmill" });

        var state = await bike.Stream.WaitForAsync(s => s.GetProperty("machine").GetString() == "treadmill", "the treadmill chosen");
        Assert.Equal("scanning", state.GetProperty("ble").GetString());
        foreach (var field in new[] { "device", "device_label", "cadence", "speed_kmh", "power", "distance_km", "kcal", "climb_m", "workout" })
        {
            Assert.Equal(JsonValueKind.Null, state.GetProperty(field).ValueKind);
        }

        Assert.Equal(0, state.GetProperty("commands").GetArrayLength());
    }

    [Fact]
    public async Task Given_the_chosen_machine_is_posted_then_the_answer_is_200_and_the_link_stays()
    {
        await using var treadmill = await TreadmillAsync();
        var events = treadmill.Factory.Simulation.Events.Count;

        using var response = await treadmill.PostAsync("/api/machine", new { machine = "treadmill" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain("disconnect", treadmill.Factory.Simulation.Events.Skip(events));
    }

    [Theory]
    [InlineData("{\"machine\":\"rower\"}")]
    [InlineData("{}")]
    [InlineData("")]
    public async Task Given_an_invalid_machine_then_the_answer_is_400_invalid_machine(string body)
    {
        await using var bike = await Bike.StartAsync(TreadmillConnectionTests.BikeWithTreadmill());

        using var response = await bike.PostRawAsync("/api/machine", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("invalid_machine", problem.GetProperty("code").GetString());
        Assert.Equal("machine must be bike or treadmill", problem.GetProperty("error").GetString());
    }

    [Fact]
    public async Task Given_a_workout_is_active_then_choosing_the_other_machine_answers_409_workout_active()
    {
        await using var bike = await Bike.StartAsync(TreadmillConnectionTests.BikeWithTreadmill());
        await Ride.StartAsync(bike, Ride.ShortHiit);

        using var response = await bike.PostAsync("/api/machine", new { machine = "treadmill" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("workout_active", (await Bike.JsonAsync(response)).GetProperty("code").GetString());
        Assert.Equal("bike", bike.Stream.Last!.Value.GetProperty("machine").GetString());
    }
}
