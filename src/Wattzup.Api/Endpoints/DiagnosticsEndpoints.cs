using Wattzup.Core.Telemetry;

namespace Wattzup.Api.Endpoints;

/// <summary>The answer of <c>GET /api/diagnostics/packets</c>.</summary>
public sealed record RecentPackets(IReadOnlyList<string> Lines);

/// <summary><c>GET /api/diagnostics/packets</c>: the newest 60 raw lines, oldest first (L2-057).</summary>
public static class DiagnosticsEndpoints
{
    public static RouteGroupBuilder MapDiagnosticsEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/diagnostics/packets", (RecentPacketBuffer buffer) => TypedResults.Ok(new RecentPackets(buffer.Snapshot())))
            .WithName("GetRecentPackets")
            .WithSummary("The newest 60 notifications in the raw_packets.log format, oldest first.");
        return api;
    }
}
