namespace Wattzup.Core.Workouts;

/// <summary>The kind of a plan segment (L2-045). Work and steady are effort; the rest are easy (L2-025).</summary>
public enum SegmentKind
{
    Warmup,
    Work,
    Rest,
    Cooldown,
    Steady,
}

/// <summary>Who chose the level the engine holds (L2-047).</summary>
public enum ResistanceMode
{
    Plan,
    Manual,
}

/// <summary>
/// One segment of an expanded plan (L2-045, L2-068). <see cref="Start"/> is the second offset from the start of the
/// ride. The bike's segments carry a level and cadence aim; the treadmill's a speed (km/h) and incline (%).
/// </summary>
public sealed record Segment(SegmentKind Kind, int Start, int Duration, int? Level, int? Cadence, int? Round, double? Speed = null, int? Incline = null);
