namespace Wattzup.Core.Workouts;

/// <summary>
/// The treadmill's energy estimate (L2-064 criterion 11, ADR 0010): the ACSM walking equation below 6.5 km/h and the
/// running equation from 6.5 km/h, for a runner of <see cref="RunnerMassKg"/>.
/// </summary>
public static class TreadmillEnergy
{
    /// <summary>The assumed runner's mass; a setting for it needs a requirement first (ADR 0010).</summary>
    public const double RunnerMassKg = 75;

    private const double RunningFromKmh = 6.5;

    /// <summary>Kilocalories spent in one second at <paramref name="speedKmh"/> and <paramref name="incline"/> %.</summary>
    public static double KcalPerSecond(double speedKmh, int incline)
    {
        var metresPerMinute = speedKmh * 1000 / 60;
        var grade = incline / 100.0;
        var vo2 = speedKmh < RunningFromKmh
            ? (0.1 * metresPerMinute) + (1.8 * metresPerMinute * grade) + 3.5
            : (0.2 * metresPerMinute) + (0.9 * metresPerMinute * grade) + 3.5;

        // VO2 (ml/kg/min) × mass → ml/min; 5 kcal per litre of oxygen; per second.
        return vo2 * RunnerMassKg * 5 / 1000 / 60;
    }
}
