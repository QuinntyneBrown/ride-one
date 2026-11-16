// Acceptance Test
// Traces to: L2-015, L2-014
// Description: GET /api/events is an SSE stream: current state first, every broadcast after, pings when quiet,
// and ui_clients following the open streams.

namespace Wattzup.Api.AcceptanceTests;

public sealed class EventStreamTests
{
    [Fact]
    public async Task Given_a_client_connects_then_the_first_message_is_the_current_state_with_ts()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();

        await using var stream = await EventStreamReader.OpenAsync(client);

        Assert.Equal("text/event-stream", stream.Response.Content.Headers.ContentType?.MediaType);
        Assert.True(stream.Response.Headers.CacheControl?.NoCache);
        var first = await stream.WaitForAsync(_ => true, "the first state");
        Assert.True(first.TryGetProperty("ts", out _));
        Assert.True(first.TryGetProperty("ble", out _));
    }

    [Fact]
    public async Task Given_two_streams_open_and_one_closes_then_ui_clients_follows_and_each_change_is_pushed()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();
        await using var first = await EventStreamReader.OpenAsync(client);
        await first.WaitForAsync(s => s.GetProperty("ui_clients").GetInt32() == 1, "ui_clients 1");

        var second = await EventStreamReader.OpenAsync(client);
        await first.WaitForAsync(s => s.GetProperty("ui_clients").GetInt32() == 2, "ui_clients 2 pushed to the first stream");
        await second.DisposeAsync();

        await first.WaitForAsync(s => s.GetProperty("ui_clients").GetInt32() == 1, "ui_clients back to 1");
    }

    [Fact]
    public async Task Given_no_message_for_15_seconds_then_the_client_receives_a_ping()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);
        await stream.WaitForAsync(_ => true, "the first state");
        stream.Drain();

        // The server arms its 15 s wait just after writing a message; step past it if the first advance was early.
        factory.Time.Advance(TimeSpan.FromSeconds(15));
        for (var extra = 0; extra < 4 && !await stream.TryPingAsync(); extra++)
        {
            factory.Time.Advance(TimeSpan.FromSeconds(1));
        }

        Assert.True(await stream.TryPingAsync() || stream.SawPing, "no ': ping' arrived after 15 s without messages");
    }
}
