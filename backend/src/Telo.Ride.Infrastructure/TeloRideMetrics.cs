using System.Diagnostics.Metrics;

namespace Telo.Ride.Infrastructure;

/// <summary>
/// Telo Ride's own instruments, on the OpenTelemetry meter <see cref="MeterName"/> (L2-147 AC4).
/// No tag carries a contact detail, token, message text, query string or body.
/// </summary>
public sealed class TeloRideMetrics
{
    public const string MeterName = "Telo.Ride";

    private readonly Counter<long> problems;

    public TeloRideMetrics(IMeterFactory meters)
    {
        ArgumentNullException.ThrowIfNull(meters);
        var meter = meters.Create(MeterName);
        problems = meter.CreateCounter<long>("telo.ride.problems", unit: "{problem}", description: "ProblemDetails answered, by code and status.");
    }

    /// <summary>Counts one ProblemDetails answered with <paramref name="code"/> and <paramref name="status"/>.</summary>
    public void ProblemAnswered(string code, int status) =>
        problems.Add(1, new KeyValuePair<string, object?>("code", code), new KeyValuePair<string, object?>("status", status));
}
