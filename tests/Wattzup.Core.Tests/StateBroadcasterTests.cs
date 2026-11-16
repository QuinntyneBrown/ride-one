// Unit Test
// Traces to: L2-015
// Description: Each broadcast reaches every client once; a slow client loses messages past 50 without affecting others.

using System.Text.Json;
using Microsoft.Extensions.Time.Testing;
using Wattzup.Core.State;

namespace Wattzup.Core.Tests;

public sealed class StateBroadcasterTests
{
    private static BikeStateStore Store() =>
        new(new BikeState { Transport = "Simulated", BindAddress = "127.0.0.1:8787" }, new FakeTimeProvider(), null);

    [Fact]
    public void Registering_counts_ui_clients_and_each_message_carries_ts()
    {
        var store = Store();
        var broadcaster = new StateBroadcaster(store);

        var client = broadcaster.Register();

        Assert.Equal(1, store.Current.UiClients);
        Assert.True(client.Messages.TryRead(out var message));
        using var json = JsonDocument.Parse(message);
        Assert.Equal(1, json.RootElement.GetProperty("ui_clients").GetInt32());
        Assert.Equal(JsonValueKind.Number, json.RootElement.GetProperty("ts").ValueKind);

        broadcaster.Unregister(client);
        Assert.Equal(0, store.Current.UiClients);
    }

    [Fact]
    public void A_slow_client_keeps_50_messages_while_a_fast_client_receives_every_one()
    {
        var store = Store();
        var broadcaster = new StateBroadcaster(store);
        var slow = broadcaster.Register();
        var fast = broadcaster.Register();
        var received = 0;
        while (fast.Messages.TryRead(out _))
        {
        }

        for (var i = 1; i <= 60; i++)
        {
            store.Update(s => s with { Packets = s.Packets + 1 });
            while (fast.Messages.TryRead(out _))
            {
                received++;
            }
        }

        Assert.Equal(60, received);
        Assert.Equal(StateBroadcaster.ClientCapacity, slow.Messages.Count);
        Assert.True(slow.Dropped > 0);
    }
}
