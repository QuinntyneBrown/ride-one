using Microsoft.AspNetCore.Http.Features;
using Wattzup.Core.State;

namespace Wattzup.Api.Endpoints;

/// <summary><c>GET /api/events</c>: the Server-Sent Events stream of the full state (L2-015).</summary>
public static partial class EventsEndpoints
{
    public static readonly TimeSpan PingInterval = TimeSpan.FromSeconds(15);

    public static RouteGroupBuilder MapEventsEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/events", StreamAsync)
            .WithName("GetEvents")
            .WithSummary("Server-Sent Events: every state change as one data message with ts; ': ping' every 15 s when quiet.")
            .Produces(StatusCodes.Status200OK, contentType: "text/event-stream");
        return api;
    }

    private static async Task StreamAsync(
        HttpContext context,
        StateBroadcaster broadcaster,
        TimeProvider time,
        IHostApplicationLifetime lifetime,
        ILogger<StateBroadcaster> logger)
    {
        context.Response.Headers.ContentType = "text/event-stream";
        context.Response.Headers.CacheControl = "no-cache";
        context.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

        using var stopping = CancellationTokenSource.CreateLinkedTokenSource(context.RequestAborted, lifetime.ApplicationStopping);
        var client = broadcaster.Register();
        try
        {
            await context.Response.Body.FlushAsync(stopping.Token);
            while (!stopping.IsCancellationRequested)
            {
                using var quiet = new CancellationTokenSource(PingInterval, time);
                using var wait = CancellationTokenSource.CreateLinkedTokenSource(stopping.Token, quiet.Token);
                string text;
                try
                {
                    text = await client.Messages.ReadAsync(wait.Token) is { } message
                        ? $"data: {message}\n\n"
                        : string.Empty;
                }
                catch (OperationCanceledException) when (quiet.IsCancellationRequested && !stopping.IsCancellationRequested)
                {
                    text = ": ping\n\n";
                }

                await context.Response.WriteAsync(text, stopping.Token);
                await context.Response.Body.FlushAsync(stopping.Token);
            }
        }
        catch (Exception e) when (e is OperationCanceledException or IOException or System.Threading.Channels.ChannelClosedException)
        {
            LogStreamClosed(logger, client.Id, e);
        }
        finally
        {
            broadcaster.Unregister(client);
        }
    }

    [LoggerMessage(Level = LogLevel.Debug, Message = "Event stream {ClientId} closed.")]
    private static partial void LogStreamClosed(ILogger logger, Guid clientId, Exception reason);
}
