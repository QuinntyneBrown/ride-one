namespace Wattzup.Core.Workouts;

/// <summary>A ride's running totals (L2-049, L2-064). Immutable; the engine replaces it each running second.</summary>
public sealed record RideTotals(int RunningSeconds, long PowerSum, double DistanceKm, double ClimbM = 0, double EnergyKcal = 0)
{
    public static RideTotals Empty { get; } = new(0, 0, 0);

    /// <summary>Adds one running second: power (0 when null) and speed ÷ 3600 km.</summary>
    public RideTotals Tick(int? power, double? speedKmh) =>
        this with { RunningSeconds = RunningSeconds + 1, PowerSum = PowerSum + (power ?? 0), DistanceKm = DistanceKm + ((speedKmh ?? 0) / 3600) };

    /// <summary>Adds one running second on the treadmill: distance, climb and energy (null counts as 0; L2-064 criteria 9 to 11).</summary>
    public RideTotals TickTreadmill(double? speedKmh, int? incline)
    {
        var kmh = speedKmh ?? 0;
        var percent = incline ?? 0;
        return this with
        {
            RunningSeconds = RunningSeconds + 1,
            DistanceKm = DistanceKm + (kmh / 3600),
            ClimbM = ClimbM + (kmh / 3600 * 1000 * percent / 100),
            EnergyKcal = EnergyKcal + TreadmillEnergy.KcalPerSecond(kmh, percent),
        };
    }

    /// <summary><c>climb_m</c>: the climb in whole metres.</summary>
    public int ClimbMRounded => (int)Math.Round(ClimbM, MidpointRounding.AwayFromZero);

    /// <summary>The treadmill's <c>kcal</c>: the estimate in whole kilocalories.</summary>
    public int TreadmillKcal => (int)Math.Round(EnergyKcal, MidpointRounding.AwayFromZero);

    public int AvgPower => RunningSeconds == 0 ? 0 : (int)Math.Round((double)PowerSum / RunningSeconds, MidpointRounding.AwayFromZero);

    public double DistanceKmRounded => Math.Round(DistanceKm, 2, MidpointRounding.AwayFromZero);

    public int Kcal => (int)Math.Round(AvgPower * RunningSeconds / 1000.0 / 0.24 / 4.184, MidpointRounding.AwayFromZero);
}
