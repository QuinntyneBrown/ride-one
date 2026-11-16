namespace Wattzup.Core.Workouts;

/// <summary>A ride's running totals (L2-049). Immutable; the engine replaces it each running second.</summary>
public sealed record RideTotals(int RunningSeconds, long PowerSum, double DistanceKm)
{
    public static RideTotals Empty { get; } = new(0, 0, 0);

    /// <summary>Adds one running second: power (0 when null) and speed ÷ 3600 km.</summary>
    public RideTotals Tick(int? power, double? speedKmh) =>
        new(RunningSeconds + 1, PowerSum + (power ?? 0), DistanceKm + ((speedKmh ?? 0) / 3600));

    public int AvgPower => RunningSeconds == 0 ? 0 : (int)Math.Round((double)PowerSum / RunningSeconds, MidpointRounding.AwayFromZero);

    public double DistanceKmRounded => Math.Round(DistanceKm, 2, MidpointRounding.AwayFromZero);

    public int Kcal => (int)Math.Round(AvgPower * RunningSeconds / 1000.0 / 0.24 / 4.184, MidpointRounding.AwayFromZero);
}
