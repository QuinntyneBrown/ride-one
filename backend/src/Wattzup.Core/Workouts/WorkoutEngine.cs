using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Wattzup.Core.Bluetooth;
using Wattzup.Core.Resistance;
using Wattzup.Core.Sessions;
using Wattzup.Core.State;
using Wattzup.Core.Telemetry;

namespace Wattzup.Core.Workouts;

/// <summary>The one Core service behind <c>POST /api/resistance</c> (L2-016, L2-047).</summary>
public interface IResistanceControl
{
    Task<SendResult> SetManualAsync(int level, CancellationToken cancellationToken);
}

/// <summary>
/// Owns at most one workout run. Commands and the 1-second ticks run one at a time on one loop, so no lock guards
/// the run (L2-011 to L2-013, L2-046, L2-047, L2-049, L2-050).
/// </summary>
public sealed class WorkoutEngine(
    IResistanceCommander commander,
    BikeStateStore store,
    ActiveConnectionRegistry registry,
    PowerTraceHistory trace,
    SessionStore sessions) : BackgroundService, IResistanceControl
{
    public static readonly TimeSpan TickInterval = TimeSpan.FromSeconds(1);
    public static readonly TimeSpan ShutOffGrace = TimeSpan.FromSeconds(90);

    private readonly Channel<Func<Task>> _inbox = Channel.CreateBounded<Func<Task>>(64);
    private WorkoutRun? _run;

    /// <summary>Starts <paramref name="plan"/>, replacing any active ride (L2-013 criterion 5).</summary>
    public Task<WorkoutSnapshot> StartAsync(WorkoutPlan plan, CancellationToken cancellationToken) =>
        StartAsync(plan, null, cancellationToken);

    /// <summary>Starts <paramref name="plan"/> from the class <paramref name="origin"/> names, or from setup when null.</summary>
    public Task<WorkoutSnapshot> StartAsync(WorkoutPlan plan, RideOrigin? origin, CancellationToken cancellationToken) =>
        PostAsync(() => StartRunAsync(plan, origin, cancellationToken), cancellationToken);

    /// <summary>
    /// Stops the active ride; the bike keeps its level (L2-013 criterion 6) and a ride of a minute or more is saved
    /// (L2-081). Answers the stopped ride, or null when no workout was active.
    /// </summary>
    public Task<WorkoutSnapshot?> StopWorkoutAsync(CancellationToken cancellationToken) =>
        PostAsync(
            () =>
            {
                if (_run is not { IsActive: true } run)
                {
                    return Task.FromResult<WorkoutSnapshot?>(null);
                }

                run.Status = WorkoutStatus.Stopped;
                Finish(run);
                Publish(run);
                return Task.FromResult<WorkoutSnapshot?>(run.ToSnapshot());
            },
            cancellationToken);

    /// <summary>Pauses the active ride (L2-046). Null with no active workout.</summary>
    public Task<WorkoutSnapshot?> PauseAsync(CancellationToken cancellationToken) =>
        PostAsync(
            () =>
            {
                if (_run is not { IsActive: true } run)
                {
                    return Task.FromResult<WorkoutSnapshot?>(null);
                }

                run.PausedByRider = true;
                if (registry.IsConnected)
                {
                    run.Status = WorkoutStatus.Paused;
                    run.DisconnectedSince = null;
                }

                Publish(run);
                return Task.FromResult<WorkoutSnapshot?>(run.ToSnapshot());
            },
            cancellationToken);

    /// <summary>Resumes a paused ride and resends its level (L2-046). Null with no active workout.</summary>
    public Task<WorkoutSnapshot?> ResumeAsync(CancellationToken cancellationToken) =>
        PostAsync(
            async () =>
            {
                if (_run is not { IsActive: true } run)
                {
                    return null;
                }

                run.PausedByRider = false;
                run.SentForSegment = null;
                if (registry.IsConnected)
                {
                    await RunAsync(run, cancellationToken).ConfigureAwait(false);
                }
                else
                {
                    run.Status = run.HasStarted ? WorkoutStatus.PausedBikeDisconnected : WorkoutStatus.WaitingForBike;
                }

                Publish(run);
                return run.ToSnapshot();
            },
            cancellationToken);

    /// <summary>Returns to the plan's level at once (L2-047). Null with no active workout.</summary>
    public Task<WorkoutSnapshot?> BackToPlanAsync(CancellationToken cancellationToken) =>
        PostAsync(
            async () =>
            {
                if (_run is not { IsActive: true } run)
                {
                    return null;
                }

                run.Mode = ResistanceMode.Plan;
                run.SentForSegment = null;
                await DriveAsync(run, cancellationToken).ConfigureAwait(false);
                Publish(run);
                return run.ToSnapshot();
            },
            cancellationToken);

    /// <summary>A manual level: during a ride it overrides the plan until the next segment (L2-047).</summary>
    public Task<SendResult> SetManualAsync(int level, CancellationToken cancellationToken) =>
        PostAsync(
            async () =>
            {
                var result = await commander.SendAsync(level, CommandSource.Manual, _run?.Elapsed, cancellationToken).ConfigureAwait(false);
                if (result is SendResult.SentResult && _run is { IsActive: true } run)
                {
                    run.Mode = ResistanceMode.Manual;
                    run.LastSentLevel = level;
                    Publish(run);
                }

                return result;
            },
            cancellationToken);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TickInterval, store.Time);
        var tick = timer.WaitForNextTickAsync(stoppingToken).AsTask();
        var read = _inbox.Reader.WaitToReadAsync(stoppingToken).AsTask();
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var done = await Task.WhenAny(tick, read).ConfigureAwait(false);
                if (done == read)
                {
                    if (!await read.ConfigureAwait(false))
                    {
                        break;
                    }

                    while (_inbox.Reader.TryRead(out var command))
                    {
                        await command().ConfigureAwait(false);
                    }

                    read = _inbox.Reader.WaitToReadAsync(stoppingToken).AsTask();
                }
                else
                {
                    if (!await tick.ConfigureAwait(false))
                    {
                        break;
                    }

                    await TickAsync(stoppingToken).ConfigureAwait(false);
                    tick = timer.WaitForNextTickAsync(stoppingToken).AsTask();
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Host shutdown: the run is not persisted (ADR 0004).
        }
    }

    private async Task<WorkoutSnapshot> StartRunAsync(WorkoutPlan plan, RideOrigin? origin, CancellationToken cancellationToken)
    {
        var run = new WorkoutRun(plan, origin);
        _run = run;
        trace.Reset();
        if (registry.IsConnected)
        {
            await RunAsync(run, cancellationToken).ConfigureAwait(false);
        }

        Publish(run);
        return run.ToSnapshot();
    }

    private async Task TickAsync(CancellationToken cancellationToken)
    {
        if (_run is not { IsActive: true } run)
        {
            return;
        }

        var now = store.Time.GetUtcNow();
        if (!registry.IsConnected)
        {
            run.SentForSegment = null;
            if (!run.HasStarted)
            {
                run.Status = WorkoutStatus.WaitingForBike;
            }
            else
            {
                run.DisconnectedSince ??= now;
                run.Status = WorkoutStatus.PausedBikeDisconnected;
                if (now - run.DisconnectedSince > ShutOffGrace)
                {
                    run.Status = WorkoutStatus.EndedBikeShutOff;
                    run.EndedReason = "bike shut off";
                    Finish(run);
                }
            }

            Publish(run);
            return;
        }

        run.DisconnectedSince = null;
        if (run.Status != WorkoutStatus.Running)
        {
            if (run.PausedByRider)
            {
                run.Status = WorkoutStatus.Paused;
            }
            else
            {
                await RunAsync(run, cancellationToken).ConfigureAwait(false);
            }

            Publish(run);
            return;
        }

        var state = store.Current;

        run.HasStarted = true;
        run.Elapsed++;
        run.Remaining--;
        run.Totals = run.Totals.Tick(state.Power, state.SpeedKmh);
        trace.Append(run.Elapsed, state.Power ?? 0);
        run.Samples.Add(new RideSample(state.Power ?? 0, state.Cadence ?? 0));

        if (run.Remaining <= 0)
        {
            if (run.IsLastSegment || run.Elapsed >= run.TotalSeconds)
            {
                run.Remaining = 0;
                run.Status = WorkoutStatus.Ended;
                Finish(run);
                Publish(run);
                return;
            }

            run.Segment++;
            run.Remaining = run.Current.Duration;
            run.Mode = ResistanceMode.Plan;
        }

        await DriveAsync(run, cancellationToken).ConfigureAwait(false);
        Publish(run);
    }

    /// <summary>
    /// Saves a ride that has just ended, when it ran a minute or more (L2-081 criteria 1 to 3). Runs on the
    /// engine loop before the ended state is published, so that state already carries the session id.
    /// </summary>
    private void Finish(WorkoutRun run)
    {
        if (run.Finished)
        {
            return;
        }

        run.Finished = true;
        if (run.Samples.Count < SessionBuilder.MinimumSeconds)
        {
            return;
        }

        var session = SessionBuilder.Build(new SessionInput(
            sessions.NewId(),
            store.Time.GetUtcNow(),
            run.Origin?.ClassId,
            run.Origin?.Title ?? run.Summary,
            run.Plan,
            run.Segments,
            [.. run.Samples],
            run.Totals));
        sessions.Add(session);
        run.SessionId = session.Id;
    }

    private Task RunAsync(WorkoutRun run, CancellationToken cancellationToken)
    {
        run.Status = WorkoutStatus.Running;
        return DriveAsync(run, cancellationToken);
    }

    /// <summary>Sends the segment's level once, and again on multiples of 5 s while the bike reports otherwise (L2-012).</summary>
    private async Task DriveAsync(WorkoutRun run, CancellationToken cancellationToken)
    {
        var reported = store.Current.Resistance;
        if (run.Mode == ResistanceMode.Manual)
        {
            if (run.LastSentLevel is { } manual && reported != manual && run.Remaining % 5 == 0)
            {
                await SendAsync(run, manual, CommandSource.Manual, cancellationToken).ConfigureAwait(false);
            }

            return;
        }

        run.PlanLevel = run.Current.Level;
        var due = run.SentForSegment != run.Segment
            || (reported != run.LastSentLevel && run.Remaining % 5 == 0);
        if (due)
        {
            await SendAsync(run, run.PlanLevel, CommandSource.Plan, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task SendAsync(WorkoutRun run, int level, CommandSource source, CancellationToken cancellationToken)
    {
        var result = await commander.SendAsync(level, source, run.Elapsed, cancellationToken).ConfigureAwait(false);
        run.SentForSegment = run.Segment;
        run.LastSentLevel = level;
        if (result is SendResult.FailedResult failed)
        {
            store.Update(s => s with { Error = $"set resistance failed: {failed.Message}" });
        }
    }

    private void Publish(WorkoutRun run) =>
        store.Update(s => s with
        {
            Workout = run.ToSnapshot(),
            TargetPower = run.Status == WorkoutStatus.Running
                ? PowerEstimator.EstimateWatts(run.Current.Cadence, run.Current.Level)
                : null,
            AvgPower = run.Totals.AvgPower,
            DistanceKm = run.Totals.DistanceKmRounded,
            Kcal = run.Totals.Kcal,
        });

    private async Task<T> PostAsync<T>(Func<Task<T>> command, CancellationToken cancellationToken)
    {
        var reply = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        await _inbox.Writer.WriteAsync(
            async () =>
            {
                try
                {
                    reply.TrySetResult(await command().ConfigureAwait(false));
                }
                catch (Exception e)
                {
                    reply.TrySetException(e);
                }
            },
            cancellationToken).ConfigureAwait(false);
        return await reply.Task.WaitAsync(cancellationToken).ConfigureAwait(false);
    }
}
