using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Channels;

namespace Wattzup.Api.AcceptanceTests;

/// <summary>
/// Reads <c>GET /api/events</c> from the in-memory host. Each <c>data:</c> message is queued as JSON; each
/// <c>: ping</c> comment as the literal ping. Waits fail naming the last message that did arrive.
/// </summary>
public sealed class EventStreamReader : IAsyncDisposable
{
    public const string Ping = ": ping";
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(10);

    private readonly HttpResponseMessage _response;
    private readonly CancellationTokenSource _stop = new();
    private readonly Channel<string> _messages = Channel.CreateUnbounded<string>();
    private readonly Task _pump;

    private EventStreamReader(HttpResponseMessage response)
    {
        _response = response;
        _pump = Task.Run(PumpAsync);
    }

    public HttpResponseMessage Response => _response;

    /// <summary>The last state message received, if any.</summary>
    public JsonElement? Last { get; private set; }

    public static async Task<EventStreamReader> OpenAsync(HttpClient client, string path = "/api/events")
    {
        var request = new HttpRequestMessage(HttpMethod.Get, new Uri(path, UriKind.Relative));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));
        var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
        return new EventStreamReader(response);
    }

    /// <summary>The next raw message: a state JSON string or <see cref="Ping"/>.</summary>
    public async Task<string> NextRawAsync(TimeSpan? timeout = null)
    {
        using var cts = new CancellationTokenSource(timeout ?? DefaultTimeout);
        try
        {
            return await _messages.Reader.ReadAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            throw new TimeoutException($"No event-stream message arrived. Last state: {Describe(Last)}");
        }
    }

    /// <summary>Waits for a state message matching <paramref name="predicate"/>, skipping pings and other states.</summary>
    public async Task<JsonElement> WaitForAsync(Func<JsonElement, bool> predicate, string what, TimeSpan? timeout = null)
    {
        using var cts = new CancellationTokenSource(timeout ?? DefaultTimeout);
        try
        {
            while (true)
            {
                var raw = await _messages.Reader.ReadAsync(cts.Token);
                if (raw == Ping)
                {
                    continue;
                }

                var state = JsonDocument.Parse(raw).RootElement.Clone();
                Last = state;
                if (predicate(state))
                {
                    return state;
                }
            }
        }
        catch (OperationCanceledException)
        {
            throw new TimeoutException($"Waited for {what}, but the last state was: {Describe(Last)}");
        }
    }

    /// <summary>
    /// Advances the fake clock by <paramref name="step"/> until a state matches, waiting briefly after each step
    /// for the host to react. Fails naming the last state after <paramref name="maxSteps"/>.
    /// </summary>
    public async Task<JsonElement> AdvanceUntilAsync(
        Microsoft.Extensions.Time.Testing.FakeTimeProvider time,
        Func<JsonElement, bool> predicate,
        string what,
        TimeSpan step,
        int maxSteps = 30)
    {
        ArgumentNullException.ThrowIfNull(time);
        if (Last is { } last && predicate(last))
        {
            return last;
        }

        for (var i = 0; i < maxSteps; i++)
        {
            time.Advance(step);
            try
            {
                return await WaitForAsync(predicate, what, TimeSpan.FromMilliseconds(300));
            }
            catch (TimeoutException)
            {
            }
        }

        throw new TimeoutException($"Advanced {maxSteps} × {step} waiting for {what}, but the last state was: {Describe(Last)}");
    }

    /// <summary>True once <see cref="TryPingAsync"/> has seen a ping.</summary>
    public bool SawPing { get; private set; }

    /// <summary>Reads messages for a short while and reports whether a ping was among them.</summary>
    public async Task<bool> TryPingAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(300));
        try
        {
            while (true)
            {
                if (await _messages.Reader.ReadAsync(cts.Token) == Ping)
                {
                    SawPing = true;
                    return true;
                }
            }
        }
        catch (OperationCanceledException)
        {
            return SawPing;
        }
    }

    /// <summary>Drops every message already received.</summary>
    public void Drain()
    {
        while (_messages.Reader.TryRead(out var raw))
        {
            if (raw != Ping)
            {
                Last = JsonDocument.Parse(raw).RootElement.Clone();
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _stop.CancelAsync();
        _response.Dispose();
        try
        {
            await _pump;
        }
        catch (Exception e) when (e is OperationCanceledException or IOException or ObjectDisposedException or HttpRequestException or InvalidOperationException)
        {
        }

        _stop.Dispose();
    }

    private static string Describe(JsonElement? state) => state is { } s ? s.GetRawText() : "(none)";

    private async Task PumpAsync()
    {
        using var stream = await _response.Content.ReadAsStreamAsync(_stop.Token);
        using var reader = new StreamReader(stream);
        while (!_stop.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(_stop.Token);
            if (line is null)
            {
                break;
            }

            if (line.StartsWith("data: ", StringComparison.Ordinal))
            {
                await _messages.Writer.WriteAsync(line["data: ".Length..], _stop.Token);
            }
            else if (line == Ping)
            {
                await _messages.Writer.WriteAsync(Ping, _stop.Token);
            }
        }

        _messages.Writer.TryComplete();
    }
}
