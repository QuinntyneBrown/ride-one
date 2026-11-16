namespace Wattzup.Core.Telemetry;

/// <summary>Estimated power; the bike reports none (L2-049, ADR 0003).</summary>
public static class PowerEstimator
{
    /// <summary><c>max(0, round(cadence × (0.55 + level × 0.155)))</c>, or null when either input is null.</summary>
    public static int? EstimateWatts(int? cadence, int? level) =>
        cadence is { } c && level is { } l
            ? Math.Max(0, (int)Math.Round(c * (0.55 + (l * 0.155)), MidpointRounding.AwayFromZero))
            : null;
}
