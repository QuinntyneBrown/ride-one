using System.Globalization;

namespace Wattzup.Core.Workouts;

/// <summary>The workout's short label, <c>workout.summary</c> (L2-060).</summary>
public static class WorkoutSummary
{
    public static string For(WorkoutPlan plan) => plan switch
    {
        HiitPlan { WorkSeconds: < 60 } h => string.Create(CultureInfo.InvariantCulture, $"HIIT · {h.Rounds} × {h.WorkSeconds}s / {h.RestSeconds}s"),
        HiitPlan h => string.Create(CultureInfo.InvariantCulture, $"HIIT · {h.Rounds} × {Clock(h.WorkSeconds)} / {Clock(h.RestSeconds)}"),
        FlatPlan f => string.Create(CultureInfo.InvariantCulture, $"Flat · Level {f.Level} · {f.Minutes} min"),
        _ => throw new ArgumentException($"Unknown plan type {plan?.GetType().Name}.", nameof(plan)),
    };

    /// <summary><c>m:ss</c>.</summary>
    public static string Clock(int seconds) =>
        string.Create(CultureInfo.InvariantCulture, $"{seconds / 60}:{seconds % 60:00}");
}
