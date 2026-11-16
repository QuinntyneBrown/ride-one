namespace Wattzup.Protocol;

/// <summary>Speed derived from cadence; the bike has no wheel sensor (L2-007).</summary>
public static class SpeedCalculator
{
    public const double KmhPerRpm = 0.37497622;
    public const double KmPerMile = 1.609344;

    /// <summary>Banker's rounding to 1 decimal, matching the prototype's Python <c>round</c>.</summary>
    public static double ToKmh(int rpm) => Math.Round(rpm * KmhPerRpm, 1, MidpointRounding.ToEven);

    /// <summary>From the unrounded km/h value.</summary>
    public static double ToMph(int rpm) => Math.Round(rpm * KmhPerRpm / KmPerMile, 1, MidpointRounding.ToEven);
}
