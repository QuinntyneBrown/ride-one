// Acceptance Test
// Traces to: L2-082
// Description: Sessions are written to the configured file in the test's own folder and survive a restart; an
// unreadable file is set aside with one error and the backend starts empty; a file that cannot be written is logged
// and the ride still ends with its session; with no setting the content root's sessions.json is used.

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Wattzup.Api.Sessions;
using Wattzup.Core.Sessions;

namespace Wattzup.Api.AcceptanceTests;

public sealed class SessionStorageTests
{
    /// <summary>Rides a minute of the default HIIT, stops it and waits until the file service has written.</summary>
    internal static async Task<string> RideAndSaveAsync(Bike bike, bool expectWritten = true)
    {
        var written = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        bike.Factory.Services.GetRequiredService<SessionFileService>().Written += (_, ok) => written.TrySetResult(ok);
        await Ride.StartAsync(bike, Ride.DefaultHiit);
        await Ride.RunToAsync(bike, 60);
        using var stop = await bike.PostAsync("/api/workout/stop");
        var id = (await Bike.JsonAsync(stop)).GetProperty("session_id").GetString()!;
        Assert.Equal(expectWritten, await written.Task.WaitAsync(TimeSpan.FromSeconds(5)));
        return id;
    }

    [Fact]
    public async Task Given_a_saved_session_when_the_backend_restarts_then_it_is_still_served()
    {
        using var second = new WattzupApiFactory { WithoutBluetooth = true };
        string id;
        await using (var bike = await Bike.StartAsync(new WattzupApiFactory(new Dictionary<string, string?> { ["Wattzup:Sessions:Path"] = second.SessionsPath })))
        {
            id = await RideAndSaveAsync(bike);
        }

        using var client = second.CreateClient();

        var session = second.Services.GetRequiredService<SessionStore>().Find(id);
        Assert.NotNull(session);
        Assert.Equal(60, session.RiddenSeconds);
    }

    [Fact]
    public async Task Given_an_unreadable_file_then_it_is_set_aside_and_the_backend_starts_empty()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        await File.WriteAllTextAsync(factory.SessionsPath, "{ not json");

        using var client = factory.CreateClient();

        Assert.Empty(factory.Services.GetRequiredService<SessionStore>().All);
        Assert.Equal("{ not json", await File.ReadAllTextAsync(factory.SessionsPath + ".unreadable"));
        Assert.False(File.Exists(factory.SessionsPath));
        Assert.Single(factory.Logs.Entries, e => e.Level == LogLevel.Error && e.Message.Contains(factory.SessionsPath, StringComparison.Ordinal));
    }

    [Fact]
    public async Task Given_a_file_that_cannot_be_written_then_the_error_is_logged_and_the_ride_still_ends_with_its_session()
    {
        var settings = new Dictionary<string, string?>();
        var factory = new WattzupApiFactory(settings);
        var blocked = Path.Combine(factory.Directory, "not-a-folder");
        await File.WriteAllTextAsync(blocked, "a file where a folder should be");
        settings["Wattzup:Sessions:Path"] = Path.Combine(blocked, "sessions.json");
        await using var bike = await Bike.StartAsync(factory);

        var id = await RideAndSaveAsync(bike, expectWritten: false);

        Assert.NotNull(factory.Services.GetRequiredService<SessionStore>().Find(id));
        Assert.Contains(factory.Logs.Entries, e => e.Level == LogLevel.Error && e.Message.Contains("sessions", StringComparison.Ordinal));
    }

    [Fact]
    public void Given_no_setting_then_the_content_roots_sessions_json_is_used()
    {
        // Resolved without starting a host, so no test touches the content root's sessions.json (L2-082 criterion 8).
        var root = Path.Combine(Path.GetTempPath(), "content-root");

        Assert.Equal(Path.Combine(root, "sessions.json"), SessionFileService.ResolvePath(root, new SessionsOptions()));
        Assert.Equal("/data/rides.json", SessionFileService.ResolvePath(root, new SessionsOptions { Path = "/data/rides.json" }));
    }
}
