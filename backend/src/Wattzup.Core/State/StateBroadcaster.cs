using System.Collections.Concurrent;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;

namespace Wattzup.Core.State;

/// <summary>One event-stream connection: its bounded message channel and a dropped-message counter (L2-015).</summary>
public sealed class SseClient
{
    private long _dropped;

    internal SseClient(Channel<string> channel)
    {
        Channel = channel;
    }

    public Guid Id { get; } = Guid.NewGuid();

    public ChannelReader<string> Messages => Channel.Reader;

    public long Dropped => Interlocked.Read(ref _dropped);

    internal Channel<string> Channel { get; }

    internal void CountDrop() => Interlocked.Increment(ref _dropped);
}

/// <summary>
/// Pushes every state change to every event-stream client: serialised once with <c>ts</c>, then offered to each
/// client's channel of 50; a full channel drops that message for that client only (L2-015, ADR 0004).
/// </summary>
public sealed class StateBroadcaster
{
    public const int ClientCapacity = 50;

    private readonly ConcurrentDictionary<Guid, SseClient> _clients = new();
    private readonly BikeStateStore _store;

    public StateBroadcaster(BikeStateStore store)
    {
        ArgumentNullException.ThrowIfNull(store);
        _store = store;
        store.StateChanged += Broadcast;
    }

    /// <summary>Adds a client; the resulting <c>ui_clients</c> change is its first message.</summary>
    public SseClient Register()
    {
        var client = new SseClient(Channel.CreateBounded<string>(new BoundedChannelOptions(ClientCapacity)
        {
            FullMode = BoundedChannelFullMode.DropWrite,
            SingleReader = true,
        }));
        _clients[client.Id] = client;
        _store.Update(s => s with { UiClients = _clients.Count });
        return client;
    }

    public void Unregister(SseClient client)
    {
        ArgumentNullException.ThrowIfNull(client);
        if (_clients.TryRemove(client.Id, out _))
        {
            client.Channel.Writer.TryComplete();
            _store.Update(s => s with { UiClients = _clients.Count });
        }
    }

    /// <summary>The state as a stream message: the contract plus <c>ts</c>.</summary>
    public static string Serialise(BikeState state, double ts)
    {
        var json = JsonSerializer.Serialize(state, WattzupJson.Options);
        var builder = new StringBuilder(json.Length + 24);
        builder.Append(json, 0, json.Length - 1);
        builder.Append(",\"ts\":").Append(ts.ToString("R", CultureInfo.InvariantCulture)).Append('}');
        return builder.ToString();
    }

    private void Broadcast(BikeState state)
    {
        if (_clients.IsEmpty)
        {
            return;
        }

        var message = Serialise(state, _store.Now);
        foreach (var client in _clients.Values)
        {
            // DropWrite reports success even when it drops, so a full channel is counted here.
            if (client.Channel.Reader.Count >= ClientCapacity || !client.Channel.Writer.TryWrite(message))
            {
                client.CountDrop();
            }
        }
    }
}
