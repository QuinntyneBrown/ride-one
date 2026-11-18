using Wattzup.Core.Workouts;

namespace Wattzup.Core.Sessions;

/// <summary>The streak: consecutive ridden days (L2-087).</summary>
public sealed record StreakFigures(int Current, int Best, bool RodeToday);

/// <summary>This week's rides against the goal.</summary>
public sealed record WeekFigures(int Rides, int Goal);

/// <summary>All-time totals.</summary>
public sealed record TotalFigures(int Rides, int RiddenSeconds, double DistanceKm);

/// <summary>A class with its finished attempts, oldest first, titled by its latest attempt.</summary>
public sealed record ClassAttempts(string ClassId, string Title, IReadOnlyList<SessionSummary> Attempts);

/// <summary>One achievement and how close it is (L2-087).</summary>
public sealed record AchievementFigures(string Id, string Title, string Detail, int Goal, string? Unit, double Value, bool Unlocked);

/// <summary>Everything <c>GET /api/progress</c> serves (L2-083 criterion 4).</summary>
public sealed record ProgressReport(
    DateOnly Today,
    StreakFigures Streak,
    IReadOnlyList<DateOnly> RideDays,
    WeekFigures Week,
    TotalFigures Totals,
    IReadOnlyList<ClassAttempts> Classes,
    IReadOnlyList<AchievementFigures> Achievements);

/// <summary>
/// Computes streaks, the weekly goal, the previous attempt, personal bests and achievements from the sessions (newest
/// first) and the time now, in the rider's local time zone (L2-087). Pure.
/// </summary>
public static class ProgressCalculator
{
    public const int WeeklyGoal = 4;

    /// <summary>The calendar shows this week and the five before it.</summary>
    public const int CalendarWeeks = 6;

    public const string BestMinute = "Best 1-minute power";
    public const string BestOnClass = "Best average on this class";
    public const string NoDips = "No cadence dips";

    private sealed record AchievementRule(string Id, string Title, string Detail, int Goal, string? Unit, Func<IReadOnlyList<SessionRecord>, StreakFigures, double> Value);

    private static readonly AchievementRule[] Rules =
    [
        new("seven-straight", "Seven straight", "Ride seven days in a row", 7, "days", (_, streak) => streak.Best),
        new("century", "Century", "Ride 100 km in total", 100, "km", (all, _) => Math.Round(all.Sum(s => s.DistanceKm), 2)),
        new("long-hour", "The long hour", "Finish five rides of an hour or more", 5, null, (all, _) => all.Count(s => s.Completed && s.PlannedSeconds >= 3600)),
        new("interval-regular", "Interval regular", "Finish eight interval rides", 8, null, (all, _) => all.Count(s => s.Completed && s.Plan is HiitPlan or IntervalsPlan)),
        new("metronome", "Metronome", "Hold cadence target 97% of a ride", 97, "%", (all, _) => all.Where(s => s.Completed).Select(s => s.OnTargetPct).DefaultIfEmpty(0).Max()),
        new("clean-sheet", "Clean sheet", "Finish an interval ride with no cadence dips", 1, null, (all, _) => all.Count(IsClean)),
    ];

    public static DateOnly LocalDay(DateTimeOffset at, TimeZoneInfo zone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(at, zone).DateTime);

    /// <summary>The local dates on which a session ended.</summary>
    public static IReadOnlySet<DateOnly> RiddenDays(IEnumerable<SessionRecord> sessions, TimeZoneInfo zone) =>
        sessions.Select(s => LocalDay(s.EndedAt, zone)).ToHashSet();

    public static StreakFigures Streak(IReadOnlyList<SessionRecord> sessions, DateTimeOffset now, TimeZoneInfo zone)
    {
        var days = RiddenDays(sessions, zone);
        var today = LocalDay(now, zone);
        var rodeToday = days.Contains(today);
        var current = 0;
        for (var day = rodeToday ? today : today.AddDays(-1); days.Contains(day); day = day.AddDays(-1))
        {
            current++;
        }

        int best = 0, run = 0;
        DateOnly? previous = null;
        foreach (var day in days.Order())
        {
            run = previous is { } p && p.AddDays(1) == day ? run + 1 : 1;
            best = Math.Max(best, run);
            previous = day;
        }

        return new StreakFigures(current, Math.Max(best, current), rodeToday);
    }

    /// <summary>Monday 00:00 of this week, local; a week starts on Monday.</summary>
    public static DateTimeOffset WeekStart(DateTimeOffset now, TimeZoneInfo zone)
    {
        var today = LocalDay(now, zone);
        var monday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var midnight = monday.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        return new DateTimeOffset(midnight, zone.GetUtcOffset(midnight));
    }

    /// <summary>The sessions that ended since Monday 00:00 of this week.</summary>
    public static int WeekRides(IReadOnlyList<SessionRecord> sessions, DateTimeOffset now, TimeZoneInfo zone)
    {
        var start = WeekStart(now, zone);
        return sessions.Count(s => s.EndedAt >= start);
    }

    /// <summary>The latest finished attempt at the same class that ended before <paramref name="session"/>.</summary>
    public static SessionRecord? PreviousAttempt(IReadOnlyList<SessionRecord> sessions, SessionRecord session)
    {
        ArgumentNullException.ThrowIfNull(session);
        return session.ClassId is null
            ? null
            : sessions
                .Where(s => s.ClassId == session.ClassId && s.Completed && s.EndedAt < session.EndedAt)
                .MaxBy(s => s.EndedAt);
    }

    /// <summary>The personal bests <paramref name="session"/> set, in the table's order; never invented (criterion 4).</summary>
    public static IReadOnlyList<string> BestsSetBy(IReadOnlyList<SessionRecord> sessions, SessionRecord session)
    {
        ArgumentNullException.ThrowIfNull(session);
        var earlier = sessions.Where(s => s.EndedAt < session.EndedAt && s.Id != session.Id).ToList();
        var bests = new List<string>();
        if (earlier.Count > 0 && session.BestMinutePower > earlier.Max(s => s.BestMinutePower))
        {
            bests.Add(BestMinute);
        }

        var attempts = earlier.Where(s => session.ClassId is not null && s.ClassId == session.ClassId && s.Completed).ToList();
        if (session.Completed && attempts.Count > 0 && session.AvgPower > attempts.Max(s => s.AvgPower))
        {
            bests.Add(BestOnClass);
        }

        if (IsClean(session))
        {
            bests.Add(NoDips);
        }

        return bests;
    }

    /// <summary>The six achievements, unlocked first, then by progress, then in the table's order.</summary>
    public static IReadOnlyList<AchievementFigures> Achievements(IReadOnlyList<SessionRecord> sessions, StreakFigures streak) =>
        [.. Rules
            .Select((rule, order) => (rule, order, value: rule.Value(sessions, streak)))
            .OrderByDescending(a => a.value >= a.rule.Goal)
            .ThenByDescending(a => Math.Min(1, a.value / a.rule.Goal))
            .ThenBy(a => a.order)
            .Select(a => new AchievementFigures(a.rule.Id, a.rule.Title, a.rule.Detail, a.rule.Goal, a.rule.Unit, a.value, a.value >= a.rule.Goal))];

    public static ProgressReport Report(IReadOnlyList<SessionRecord> sessions, DateTimeOffset now, TimeZoneInfo zone)
    {
        ArgumentNullException.ThrowIfNull(sessions);
        var streak = Streak(sessions, now, zone);
        var from = LocalDay(WeekStart(now, zone), zone).AddDays(-7 * (CalendarWeeks - 1));
        var classes = sessions
            .Where(s => s.ClassId is not null && s.Completed)
            .GroupBy(s => s.ClassId!)
            .Select(g =>
            {
                var attempts = g.OrderBy(s => s.EndedAt).ToList();
                return (latest: attempts[^1].EndedAt, value: new ClassAttempts(g.Key, attempts[^1].Title, [.. attempts.Select(s => s.ToSummary())]));
            })
            .OrderByDescending(c => c.latest)
            .Select(c => c.value)
            .ToList();
        return new ProgressReport(
            LocalDay(now, zone),
            streak,
            [.. RiddenDays(sessions, zone).Where(d => d >= from).Order()],
            new WeekFigures(WeekRides(sessions, now, zone), WeeklyGoal),
            new TotalFigures(sessions.Count, sessions.Sum(s => s.RiddenSeconds), Math.Round(sessions.Sum(s => s.DistanceKm), 2)),
            classes,
            Achievements(sessions, streak));
    }

    private static bool IsClean(SessionRecord session) =>
        session.Completed && session.Dips.Count == 0 && session.Segments.Any(s => s.Kind == SegmentKind.Work);
}
