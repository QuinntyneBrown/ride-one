// Acceptance Test
// Traces to: L2-039
// Description: A stop signal stops the workout loop, disconnects the bike, closes event streams, writes the final
// status.json and completes within the 5-second shutdown timeout.

using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Wattzup.Api.AcceptanceTests;

public sealed class LifecycleTests
{
    [Fact]
    public async Task A_stop_signal_disconnects_the_bike_ends_streams_writes_the_final_snapshot_and_exits_within_5_seconds()
    {
        var output = Directory.CreateTempSubdirectory("wattzup-stop-").FullName;
        try
        {
            var snapshot = Path.Combine(output, "status.json");
            var factory = new WattzupApiFactory(new Dictionary<string, string?> { ["Wattzup:StatusSnapshot:Path"] = snapshot });
            await using var bike = await Bike.StartAsync(factory);
            await Ride.StartAsync(bike, Ride.Flat);
            await Ride.RunToAsync(bike, 1);
            Assert.Equal(TimeSpan.FromSeconds(5), factory.Services.GetRequiredService<IOptions<HostOptions>>().Value.ShutdownTimeout);

            var clock = Stopwatch.StartNew();
            await factory.DisposeAsync();
            clock.Stop();

            Assert.True(clock.Elapsed < TimeSpan.FromSeconds(5), $"shutdown took {clock.Elapsed}");
            Assert.Equal("disconnect", factory.Simulation.Events[^1]);
            await Assert.ThrowsAsync<System.Threading.Channels.ChannelClosedException>(async () =>
            {
                while (true)
                {
                    await bike.Stream.NextRawAsync(TimeSpan.FromSeconds(2));
                }
            });
            using var json = JsonDocument.Parse(await File.ReadAllTextAsync(snapshot));
            Assert.Equal(JsonValueKind.Object, json.RootElement.GetProperty("workout").ValueKind);
        }
        finally
        {
            Directory.Delete(output, recursive: true);
        }
    }
}
