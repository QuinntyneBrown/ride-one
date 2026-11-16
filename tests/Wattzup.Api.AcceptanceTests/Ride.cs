using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

/// <summary>Plans and clock helpers for workout tests.</summary>
public static class Ride
{
    /// <summary>2 rounds of 5 s work at 18 and 5 s recover at 6, no warm-up or cool-down: 4 segments, 20 s.</summary>
    public static readonly object ShortHiit = new
    {
        kind = "hiit", rounds = 2, work_seconds = 5, rest_seconds = 5, work_level = 18, rest_level = 6, warmup = false, cooldown = false,
    };

    public static readonly object DefaultHiit = new
    {
        kind = "hiit", rounds = 8, work_seconds = 40, rest_seconds = 20, work_level = 18, rest_level = 6, warmup = true, cooldown = true,
    };

    public static readonly object Flat = new { kind = "flat", level = 12, minutes = 1, cadence = 85 };

    public static JsonElement Workout(JsonElement state) => state.GetProperty("workout");

    public static string? Status(JsonElement state) =>
        state.GetProperty("workout").ValueKind == JsonValueKind.Object ? state.GetProperty("workout").GetProperty("status").GetString() : null;

    public static int Elapsed(JsonElement state) => Workout(state).GetProperty("elapsed_seconds").GetInt32();

    /// <summary>Levels written with set-resistance commands, in order.</summary>
    public static IReadOnlyList<int> LevelsWritten(Bike bike) =>
        [.. bike.Factory.Simulation.Writes.Where(w => w.Bytes.Length == 5 && w.Bytes[1] == 0xB1).Select(w => (int)w.Bytes[3])];

    public static async Task<JsonElement> StartAsync(Bike bike, object plan)
    {
        ArgumentNullException.ThrowIfNull(bike);
        using var response = await bike.PostAsync("/api/workout", plan);
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        return (await Bike.JsonAsync(response)).GetProperty("started");
    }

    /// <summary>
    /// Advances the clock one second at a time until the ride's elapsed time reaches <paramref name="elapsed"/>. The
    /// engine's timer is always armed, so each 1 s advance is exactly one tick; each is awaited before the next.
    /// </summary>
    public static async Task<JsonElement> RunToAsync(Bike bike, int elapsed)
    {
        ArgumentNullException.ThrowIfNull(bike);
        JsonElement state = default;
        var current = bike.Stream.Last is { } last && Status(last) is not null ? Elapsed(last) : 0;
        for (var target = current + 1; target <= elapsed; target++)
        {
            var t = target;
            bike.Factory.Time.Advance(TimeSpan.FromSeconds(1));
            state = await bike.Stream.WaitForAsync(s => Status(s) is not null && Elapsed(s) == t, $"elapsed {t}");
        }

        return state;
    }

    /// <summary>Advances the clock in steps and returns the last state seen after the engine has ticked.</summary>
    public static async Task<JsonElement> AdvanceAsync(Bike bike, TimeSpan total, TimeSpan step)
    {
        ArgumentNullException.ThrowIfNull(bike);
        for (var passed = TimeSpan.Zero; passed < total; passed += step)
        {
            bike.Factory.Time.Advance(step);
            var now = bike.Factory.Time.GetUtcNow().ToUnixTimeMilliseconds() / 1000.0;
            await bike.Stream.WaitForAsync(s => s.GetProperty("ts").GetDouble() >= now && Status(s) is not null, $"a state at {now}");
        }

        await bike.Stream.WaitForAsync(_ => true, "one more state", TimeSpan.FromSeconds(2)).ContinueWith(_ => { }, TaskScheduler.Default);
        return bike.Stream.Last!.Value;
    }
}
