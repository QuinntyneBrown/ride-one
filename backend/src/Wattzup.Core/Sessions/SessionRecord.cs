using Wattzup.Core.Workouts;

namespace Wattzup.Core.Sessions;

/// <summary>One running second on the bike as it reported it; a missing value is 0 (L2-081).</summary>
public readonly record struct RideSample(int Power, int Cadence);

/// <summary>A run of at least 6 consecutive seconds under target within one counted segment (L2-081).</summary>
public sealed record Dip(int Start, int Duration, int Target, int Low, SegmentKind Kind, int? Round);

/// <summary>A saved ride, a <em>session</em> (L2-081, ADR 0015). Serialised in snake_case with nulls written.</summary>
public record SessionRecord
{
    public required string Id { get; init; }

    public required DateTimeOffset EndedAt { get; init; }

    public required string? ClassId { get; init; }

    public required string Title { get; init; }

    public required WorkoutPlan Plan { get; init; }

    public required IReadOnlyList<Segment> Segments { get; init; }

    public required int PlannedSeconds { get; init; }

    public required int RiddenSeconds { get; init; }

    public required bool Completed { get; init; }

    public required int AvgPower { get; init; }

    public required int MaxPower { get; init; }

    public required int BestMinutePower { get; init; }

    public required int AvgCadence { get; init; }

    public required double DistanceKm { get; init; }

    public required int Kcal { get; init; }

    public required int OnTargetPct { get; init; }

    public required IReadOnlyList<Dip> Dips { get; init; }

    public required IReadOnlyList<int> PowerTrace { get; init; }

    public required IReadOnlyList<int> CadenceTrace { get; init; }

    public SessionSummary ToSummary() =>
        new(Id, EndedAt, ClassId, Title, RiddenSeconds, PlannedSeconds, Completed, AvgPower, OnTargetPct, Dips.Count);
}

/// <summary>A session as the lists show it (L2-083).</summary>
public sealed record SessionSummary(
    string Id,
    DateTimeOffset EndedAt,
    string? ClassId,
    string Title,
    int RiddenSeconds,
    int PlannedSeconds,
    bool Completed,
    int AvgPower,
    int OnTargetPct,
    int DipCount);

/// <summary>What the workout engine hands the builder when a ride on the bike ends.</summary>
public sealed record SessionInput(
    string Id,
    DateTimeOffset EndedAt,
    string? ClassId,
    string Title,
    WorkoutPlan Plan,
    IReadOnlyList<Segment> Segments,
    IReadOnlyList<RideSample> Samples,
    RideTotals Totals);

/// <summary>A session as <c>GET /api/sessions/{id}</c> answers it: the whole record, its previous attempt and the bests it set (L2-083).</summary>
public sealed record SessionDetail : SessionRecord
{
    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public SessionDetail(SessionRecord session, SessionSummary? previous, IReadOnlyList<string> bests)
        : base(session)
    {
        Previous = previous;
        Bests = bests;
    }

    public SessionSummary? Previous { get; init; }

    public IReadOnlyList<string> Bests { get; init; }
}
