// Unit Test
// Traces to: L2-087
// Description: Streaks, the weekly goal, the previous attempt, personal bests and achievements, one case per row of the
// three tables, in the rider's local time zone with the time from FakeTimeProvider.

using Microsoft.Extensions.Time.Testing;
using Wattzup.Core.Sessions;
using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class ProgressCalculatorTests
{
    /// <summary>UTC−5, so a local day's edges differ from UTC's.</summary>
    private static readonly TimeZoneInfo Zone = TimeZoneInfo.CreateCustomTimeZone("Rider", TimeSpan.FromHours(-5), "Rider", "Rider");

    private static readonly HiitPlan Hiit = new(8, 30, 90, 20, 6, true, true);

    private static int _next;

    /// <summary>Wednesday 18 Nov 2026, 12:00 local.</summary>
    private static FakeTimeProvider Clock(int day = 18, int hour = 12, int minute = 0)
    {
        var time = new FakeTimeProvider(Local(day, hour, minute));
        time.SetLocalTimeZone(Zone);
        return time;
    }

    private static DateTimeOffset Local(int day, int hour = 18, int minute = 0) =>
        new(2026, 11, day, hour, minute, 0, TimeSpan.FromHours(-5));

    /// <summary>A completed session ending at <paramref name="day"/> Nov, local; tune it with <c>with</c>.</summary>
    private static SessionRecord S(int day, int hour = 18, int minute = 0, string? classId = null) =>
        SessionFileTests.Session($"{Interlocked.Increment(ref _next):x12}", Local(day, hour, minute).ToUniversalTime(), classId);

    private static SessionRecord Interval(SessionRecord s, bool dips = false) => s with
    {
        Plan = Hiit,
        Segments = [new Segment(SegmentKind.Work, 0, 30, 20, 100, 1), new Segment(SegmentKind.Rest, 30, 570, 6, 72, 1)],
        Dips = dips ? [new Dip(10, 6, 100, 88, SegmentKind.Work, 1)] : [],
    };

    private static IReadOnlyList<SessionRecord> Newest(params SessionRecord[] sessions) =>
        [.. sessions.OrderByDescending(s => s.EndedAt)];

    private static StreakFigures Streak(FakeTimeProvider time, params SessionRecord[] sessions) =>
        ProgressCalculator.Streak(Newest(sessions), time.GetUtcNow(), time.LocalTimeZone);

    // --- streak ---

    [Fact]
    public void A_session_today_means_rode_today()
    {
        Assert.Equal(new StreakFigures(1, 1, true), Streak(Clock(), S(18, 7)));
    }

    [Fact]
    public void A_session_at_23_59_and_one_at_00_01_the_next_local_day_are_two_ridden_days()
    {
        var days = ProgressCalculator.RiddenDays(Newest(S(16, 23, 59), S(17, 0, 1)), Zone);

        Assert.Equal([new DateOnly(2026, 11, 16), new DateOnly(2026, 11, 17)], days.Order());
        Assert.Equal(2, Streak(Clock(), S(16, 23, 59), S(17, 0, 1)).Current);
    }

    [Fact]
    public void Ridden_yesterday_but_not_today_keeps_the_streak()
    {
        Assert.Equal(new StreakFigures(3, 3, false), Streak(Clock(), S(15), S(16), S(17)));
    }

    [Fact]
    public void Last_ridden_two_days_ago_gives_0()
    {
        Assert.Equal(new StreakFigures(0, 2, false), Streak(Clock(), S(15), S(16)));
    }

    [Fact]
    public void The_best_streak_is_the_longest_run_ever_and_never_less_than_the_current()
    {
        Assert.Equal(new StreakFigures(2, 4, true), Streak(Clock(), S(2), S(3), S(4), S(5), S(17), S(18)));
        Assert.Equal(new StreakFigures(2, 2, true), Streak(Clock(), S(17), S(18)));
    }

    // --- week ---

    [Fact]
    public void Two_sessions_on_one_day_count_one_day_but_two_rides_this_week()
    {
        var sessions = Newest(S(17, 7), S(17, 18));
        var now = Clock().GetUtcNow();

        Assert.Single(ProgressCalculator.RiddenDays(sessions, Zone));
        Assert.Equal(2, ProgressCalculator.WeekRides(sessions, now, Zone));
    }

    [Fact]
    public void A_session_on_Sunday_is_not_in_the_week_that_starts_on_Monday()
    {
        var now = Clock().GetUtcNow();

        Assert.Equal(Local(16, 0), ProgressCalculator.WeekStart(now, Zone));
        Assert.Equal(1, ProgressCalculator.WeekRides(Newest(S(15, 23, 59), S(16, 0, 0)), now, Zone));
        Assert.Equal(4, ProgressCalculator.WeeklyGoal);
    }

    [Fact]
    public void On_a_Monday_the_week_starts_that_morning()
    {
        Assert.Equal(Local(16, 0), ProgressCalculator.WeekStart(Clock(16, 9).GetUtcNow(), Zone));
        Assert.Equal(Local(16, 0), ProgressCalculator.WeekStart(Clock(22, 23, 59).GetUtcNow(), Zone));
    }

    // --- previous attempt ---

    [Fact]
    public void The_previous_attempt_is_the_latest_finished_attempt_at_the_class_before_this_one()
    {
        var first = S(10, classId: "hiit");
        var second = S(12, classId: "hiit");
        var unfinished = S(13, classId: "hiit") with { Completed = false };
        var other = S(14, classId: "power");
        var later = S(16, classId: "hiit");
        var all = Newest(first, second, unfinished, other, later);

        Assert.Equal(second, ProgressCalculator.PreviousAttempt(all, later));
        Assert.Null(ProgressCalculator.PreviousAttempt(all, first));
    }

    [Fact]
    public void A_ride_from_setup_has_no_previous_attempt()
    {
        var all = Newest(S(10), S(12));

        Assert.Null(ProgressCalculator.PreviousAttempt(all, all[0]));
    }

    // --- bests ---

    [Fact]
    public void Best_1_minute_power_needs_an_earlier_session_and_a_higher_value_than_every_earlier_one()
    {
        var first = S(10) with { BestMinutePower = 300 };
        var lower = S(11) with { BestMinutePower = 280 };
        var higher = S(12) with { BestMinutePower = 301 };
        var all = Newest(first, lower, higher);

        Assert.DoesNotContain("Best 1-minute power", ProgressCalculator.BestsSetBy(all, first));
        Assert.DoesNotContain("Best 1-minute power", ProgressCalculator.BestsSetBy(all, lower));
        Assert.Contains("Best 1-minute power", ProgressCalculator.BestsSetBy(all, higher));
    }

    [Fact]
    public void Best_average_on_this_class_needs_an_earlier_finished_attempt_and_a_higher_average()
    {
        var first = S(10, classId: "hiit") with { AvgPower = 150 };
        var unfinished = S(11, classId: "hiit") with { AvgPower = 200, Completed = false };
        var better = S(12, classId: "hiit") with { AvgPower = 151 };
        var setup = S(13) with { AvgPower = 400 };
        var all = Newest(first, unfinished, better, setup);

        Assert.DoesNotContain("Best average on this class", ProgressCalculator.BestsSetBy(all, first));
        Assert.DoesNotContain("Best average on this class", ProgressCalculator.BestsSetBy(all, unfinished));
        Assert.Contains("Best average on this class", ProgressCalculator.BestsSetBy(all, better));
        Assert.DoesNotContain("Best average on this class", ProgressCalculator.BestsSetBy(all, setup));
    }

    [Fact]
    public void No_cadence_dips_needs_a_completed_ride_with_a_work_segment_and_no_dips()
    {
        var clean = Interval(S(10));
        var dipped = Interval(S(11), dips: true);
        var steady = S(12);
        var early = Interval(S(13)) with { Completed = false };
        var all = Newest(clean, dipped, steady, early);

        Assert.Equal(["No cadence dips"], ProgressCalculator.BestsSetBy(all, clean));
        Assert.DoesNotContain("No cadence dips", ProgressCalculator.BestsSetBy(all, dipped));
        Assert.DoesNotContain("No cadence dips", ProgressCalculator.BestsSetBy(all, steady));
        Assert.DoesNotContain("No cadence dips", ProgressCalculator.BestsSetBy(all, early));
    }

    [Fact]
    public void Bests_are_in_the_tables_order()
    {
        var first = Interval(S(10, classId: "hiit")) with { BestMinutePower = 200, AvgPower = 150 };
        var best = Interval(S(12, classId: "hiit")) with { BestMinutePower = 250, AvgPower = 160 };

        Assert.Equal(["Best 1-minute power", "Best average on this class", "No cadence dips"], ProgressCalculator.BestsSetBy(Newest(first, best), best));
    }

    // --- achievements ---

    private static AchievementFigures Achievement(IReadOnlyList<SessionRecord> sessions, string id, FakeTimeProvider? time = null)
    {
        time ??= Clock();
        var streak = ProgressCalculator.Streak(sessions, time.GetUtcNow(), Zone);
        return ProgressCalculator.Achievements(sessions, streak).Single(a => a.Id == id);
    }

    [Fact]
    public void Seven_straight_is_the_best_streak_against_7_days()
    {
        var sessions = Newest([.. Enumerable.Range(1, 7).Select(d => S(d))]);

        Assert.Equal(new AchievementFigures("seven-straight", "Seven straight", "Ride seven days in a row", 7, "days", 7, true), Achievement(sessions, "seven-straight"));
        Assert.Equal(6, Achievement(Newest([.. Enumerable.Range(1, 6).Select(d => S(d))]), "seven-straight").Value);
    }

    [Fact]
    public void Century_is_the_total_distance_against_100_km()
    {
        var sessions = Newest(S(10) with { DistanceKm = 60.25 }, S(11) with { DistanceKm = 39.5, Completed = false });

        var century = Achievement(sessions, "century");

        Assert.Equal((99.75, false, "km"), (century.Value, century.Unlocked, century.Unit));
    }

    [Fact]
    public void The_long_hour_counts_completed_rides_planned_an_hour_or_more()
    {
        var hour = S(10) with { PlannedSeconds = 3600 };
        var sessions = Newest(hour, S(11) with { PlannedSeconds = 3600 }, S(12) with { PlannedSeconds = 3599 }, S(13) with { PlannedSeconds = 3600, Completed = false });

        var longHour = Achievement(sessions, "long-hour");

        Assert.Equal((2.0, 5, (string?)null), (longHour.Value, longHour.Goal, longHour.Unit));
    }

    [Fact]
    public void Interval_regular_counts_completed_hiit_and_intervals_rides()
    {
        var intervals = S(12) with { Plan = new IntervalsPlan(null, [new IntervalSet(4, 60, 22, 100, 60, 7, 72)], null) };
        var sessions = Newest(Interval(S(10)), Interval(S(11)) with { Completed = false }, intervals, S(13));

        Assert.Equal(2, Achievement(sessions, "interval-regular").Value);
    }

    [Fact]
    public void Metronome_is_the_highest_on_target_of_a_completed_ride_against_97()
    {
        var sessions = Newest(S(10) with { OnTargetPct = 97 }, S(11) with { OnTargetPct = 100, Completed = false });

        var metronome = Achievement(sessions, "metronome");

        Assert.Equal((97.0, true, "%"), (metronome.Value, metronome.Unlocked, metronome.Unit));
    }

    [Fact]
    public void Clean_sheet_counts_completed_rides_with_a_work_segment_and_no_dips()
    {
        var sessions = Newest(Interval(S(10), dips: true), S(11), Interval(S(12)) with { Completed = false });

        Assert.False(Achievement(sessions, "clean-sheet").Unlocked);
        Assert.True(Achievement(Newest(Interval(S(13))), "clean-sheet").Unlocked);
    }

    [Fact]
    public void Achievements_are_ordered_unlocked_first_then_by_progress_then_by_the_tables_order()
    {
        var sessions = Newest(Interval(S(17)) with { OnTargetPct = 98, DistanceKm = 50 });
        var streak = ProgressCalculator.Streak(sessions, Clock().GetUtcNow(), Zone);

        var order = ProgressCalculator.Achievements(sessions, streak).Select(a => a.Id);

        // Unlocked: metronome, clean-sheet (table order). Then century 0.5, seven-straight 1/7, interval-regular 1/8,
        // long-hour 0.
        Assert.Equal(["metronome", "clean-sheet", "century", "seven-straight", "interval-regular", "long-hour"], order);
    }

    // --- the report ---

    [Fact]
    public void With_no_sessions_every_figure_is_zero_and_every_achievement_locked()
    {
        var time = Clock();

        var report = ProgressCalculator.Report([], time.GetUtcNow(), Zone);

        Assert.Equal(new DateOnly(2026, 11, 18), report.Today);
        Assert.Equal(new StreakFigures(0, 0, false), report.Streak);
        Assert.Empty(report.RideDays);
        Assert.Equal(new WeekFigures(0, 4), report.Week);
        Assert.Equal(new TotalFigures(0, 0, 0), report.Totals);
        Assert.Empty(report.Classes);
        Assert.Equal(6, report.Achievements.Count);
        Assert.All(report.Achievements, a => Assert.Equal((0.0, false), (a.Value, a.Unlocked)));
    }

    [Fact]
    public void The_report_lists_ride_days_of_six_weeks_classes_with_finished_attempts_and_the_totals()
    {
        var old = S(1, classId: "hiit") with { Title = "Old title", DistanceKm = 10, RiddenSeconds = 1800 };
        var tooOld = S(4, classId: "power") with { Completed = false, RiddenSeconds = 600 };
        var latest = S(17, classId: "hiit") with { Title = "30 Minute HIIT Cardio", DistanceKm = 12.5, RiddenSeconds = 1800 };
        var setup = S(18, 7) with { DistanceKm = 0.25, RiddenSeconds = 600 };
        var time = Clock();

        var report = ProgressCalculator.Report(Newest(old, tooOld, latest, setup), time.GetUtcNow(), Zone);

        Assert.Equal([new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 4), new DateOnly(2026, 11, 17), new DateOnly(2026, 11, 18)], report.RideDays);
        Assert.Equal(new TotalFigures(4, 4800, 27.75), report.Totals);
        var hiit = Assert.Single(report.Classes);
        Assert.Equal(("hiit", "30 Minute HIIT Cardio"), (hiit.ClassId, hiit.Title));
        Assert.Equal([old.Id, latest.Id], hiit.Attempts.Select(a => a.Id));
    }

    [Fact]
    public void Ride_days_cover_this_week_and_the_five_before_it_only()
    {
        var time = Clock();

        var report = ProgressCalculator.Report(Newest(S(5, 12), S(4, 12) with { EndedAt = Local(4).AddDays(-30) }), time.GetUtcNow(), Zone);

        // This week starts Mon 16 Nov, so six weeks start Mon 12 Oct.
        Assert.Equal([new DateOnly(2026, 11, 5)], report.RideDays);
    }
}
