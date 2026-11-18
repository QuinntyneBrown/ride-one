using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Wattzup.Core.Bluetooth;
using Wattzup.Core.Machines;
using Wattzup.Core.Resistance;
using Wattzup.Core.Sessions;
using Wattzup.Core.State;
using Wattzup.Core.Telemetry;
using Wattzup.Core.Treadmill;

namespace Wattzup.Core.Workouts;

/// <summary>The one Core service behind <c>POST /api/resistance</c> (L2-016, L2-047).</summary>
public interface IResistanceControl
{
    Task<SendResult> SetManualAsync(int level, CancellationToken cancellationToken);
}

/// <summary>The one Core service behind <c>POST /api/speed</c> and <c>POST /api/incline</c> (L2-068, L2-069).</summary>
public interface ITreadmillControl
{
    Task<SendResult> SetManualSpeedAsync(double kmh, CancellationToken cancellationToken);

    Task<SendResult> SetManualInclineAsync(int percent, CancellationToken cancellationToken);
}

/// <summary>The outcome of choosing a machine (L2-062).</summary>
public enum MachineChoice
{
    Changed,
    Unchanged,
    WorkoutActive,
}

/// <summary>The one Core service behind <c>POST /api/machine</c> (L2-062).</summary>
public interface IMachineControl
{
    Task<MachineChoice> ChooseAsync(Machine machine, CancellationToken cancellationToken);
}

/// <summary>
/// Owns at most one workout run. Commands and the 1-second ticks run one at a time on one loop, so no lock guards
/// the run (L2-011 to L2-013, L2-046, L2-047, L2-049, L2-050).
/// </summary>
public sealed class WorkoutEngine(
    IResistanceCommander commander,
    ITreadmillCommander treadmill,
    MachineSelector machines,
    BikeStateStore store,
    ActiveConnectionRegistry registry,
    PowerTraceHistory trace,
    SessionStore sessions) : BackgroundService, IResistanceControl, ITreadmillControl, IMachineControl
{
    public static readonly TimeSpan TickInterval = TimeSpan.FromSeconds(1);
    public static readonly TimeSpan ShutOffGrace = TimeSpan.FromSeconds(90);
    public static readonly TimeSpan BeltCountdownStep = TimeSpan.FromSeconds(1);
    public static readonly TimeSpan BeltStartTimeout = TimeSpan.FromSeconds(10);
    private const double SpeedTolerance = 0.05;

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
            async () =>
            {
                if (_run is not { IsActive: true } run)
                {
                    return null;
                }

                await StopBeltAsync(run, BeltReason.Stop, cancellationToken).ConfigureAwait(false);
                run.Status = WorkoutStatus.Stopped;
                Finish(run);
                Publish(run);
                return run.ToSnapshot();
            },
            cancellationToken);

    /// <summary>Pauses the active ride; on the treadmill the belt is stopped (L2-046, L2-066). Null with no active workout.</summary>
    public Task<WorkoutSnapshot?> PauseAsync(CancellationToken cancellationToken) =>
        PostAsync(
            async () =>
            {
                if (_run is not { IsActive: true } run)
                {
                    return null;
                }

                run.PausedByRider = true;
                if (registry.IsConnected)
                {
                    await StopBeltAsync(run, BeltReason.Pause, cancellationToken).ConfigureAwait(false);
                    run.Status = WorkoutStatus.Paused;
                    run.DisconnectedSince = null;
                }

                Publish(run);
                return run.ToSnapshot();
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
                    await RunOrCountDownAsync(run, cancellationToken).ConfigureAwait(false);
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
                if (store.Current.Machine != Machine.Bike)
                {
                    return SendResult.WrongMachine;
                }

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

    /// <summary>A manual speed: during a ride it overrides the plan until the next segment (L2-068).</summary>
    public Task<SendResult> SetManualSpeedAsync(double kmh, CancellationToken cancellationToken) =>
        PostAsync(
            async () =>
            {
                if (store.Current.Machine != Machine.Treadmill)
                {
                    return SendResult.WrongMachine;
                }

                var result = await treadmill.SendSpeedAsync(kmh, CommandSource.Manual, _run?.Elapsed, cancellationToken).ConfigureAwait(false);
                if (result is SendResult.SentResult && _run is { IsActive: true } run)
                {
                    run.EnterManual();
                    run.LastSentSpeed = kmh;
                    Publish(run);
                }

                return result;
            },
            cancellationToken);

    /// <summary>A manual incline: during a ride it overrides the plan until the next segment (L2-068).</summary>
    public Task<SendResult> SetManualInclineAsync(int percent, CancellationToken cancellationToken) =>
        PostAsync(
            async () =>
            {
                if (store.Current.Machine != Machine.Treadmill)
                {
                    return SendResult.WrongMachine;
                }

                var result = await treadmill.SendInclineAsync(percent, CommandSource.Manual, _run?.Elapsed, cancellationToken).ConfigureAwait(false);
                if (result is SendResult.SentResult && _run is { IsActive: true } run)
                {
                    run.EnterManual();
                    run.LastSentIncline = percent;
                    Publish(run);
                }

                return result;
            },
            cancellationToken);

    /// <summary>Chooses the machine; refused while a workout is active (L2-062).</summary>
    public Task<MachineChoice> ChooseAsync(Machine machine, CancellationToken cancellationToken) =>
        PostAsync(
            () =>
            {
                if (store.Current.Machine == machine)
                {
                    return Task.FromResult(MachineChoice.Unchanged);
                }

                if (_run is { IsActive: true })
                {
                    return Task.FromResult(MachineChoice.WorkoutActive);
                }

                _run = null;
                trace.Reset();
                machines.Select(machine);
                return Task.FromResult(MachineChoice.Changed);
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
        if (_run is { IsActive: true } previous && registry.IsConnected)
        {
            await StopBeltAsync(previous, BeltReason.Replace, cancellationToken).ConfigureAwait(false);
        }

        var run = new WorkoutRun(plan, origin);
        _run = run;
        trace.Reset();
        if (registry.IsConnected)
        {
            await RunOrCountDownAsync(run, cancellationToken).ConfigureAwait(false);
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
            run.BeltCountdown = null;
            run.BeltStartWrittenAt = null;
            if (OnTreadmill && run.HasStarted)
            {
                // The belt is never restarted without the rider (L2-066 criterion 8).
                run.PausedByRider = true;
            }

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
        if (run.Status == WorkoutStatus.StartingBelt)
        {
            await CountDownAsync(run, now, cancellationToken).ConfigureAwait(false);
            Publish(run);
            return;
        }

        if (run.Status == WorkoutStatus.PausedBeltStopped)
        {
            return;
        }

        if (run.Status != WorkoutStatus.Running)
        {
            if (run.PausedByRider)
            {
                run.Status = WorkoutStatus.Paused;
            }
            else
            {
                await RunOrCountDownAsync(run, cancellationToken).ConfigureAwait(false);
            }

            Publish(run);
            return;
        }

        var state = store.Current;
        if (OnTreadmill && state.Belt != BeltState.Running)
        {
            // Stopped from the console or the safety key: wait for the rider (L2-066 criterion 7).
            run.Status = WorkoutStatus.PausedBeltStopped;
            Publish(run);
            return;
        }

        run.HasStarted = true;
        run.Elapsed++;
        run.Remaining--;
        run.Totals = OnTreadmill ? run.Totals.TickTreadmill(state.SpeedKmh, state.Incline) : run.Totals.Tick(state.Power, state.SpeedKmh);
        if (!OnTreadmill)
        {
            // The treadmill reports no power; its trace stays empty (L2-064).
            trace.Append(run.Elapsed, state.Power ?? 0);
            run.Samples.Add(new RideSample(state.Power ?? 0, state.Cadence ?? 0));
        }

        if (run.Remaining <= 0)
        {
            if (run.IsLastSegment || run.Elapsed >= run.TotalSeconds)
            {
                run.Remaining = 0;
                run.Status = WorkoutStatus.Ended;
                await StopBeltAsync(run, BeltReason.End, cancellationToken).ConfigureAwait(false);
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

    private bool OnTreadmill => store.Current.Machine == Machine.Treadmill;

    /// <summary>
    /// Saves a ride on the bike that has just ended, when it ran a minute or more (L2-081 criteria 1 to 3). Runs on the
    /// engine loop before the ended state is published, so that state already carries the session id.
    /// </summary>
    private void Finish(WorkoutRun run)
    {
        if (run.Finished || OnTreadmill)
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

    /// <summary>
    /// Runs the ride at once on the bike; on the treadmill only when the belt already runs, otherwise through the
    /// 3-second countdown (L2-066 criterion 1).
    /// </summary>
    private async Task RunOrCountDownAsync(WorkoutRun run, CancellationToken cancellationToken)
    {
        if (OnTreadmill && store.Current.Belt != BeltState.Running)
        {
            run.Status = WorkoutStatus.StartingBelt;
            run.BeltCountdown = 3;
            run.CountdownShownAt = store.Time.GetUtcNow();
            run.BeltStartWrittenAt = null;
            store.Update(s => s with { Belt = BeltState.Starting });
            return;
        }

        run.Status = WorkoutStatus.Running;
        await DriveAsync(run, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>One tick of <c>starting belt</c>: count 3, 2, 1, write start-belt, then wait up to 10 s for the belt (L2-066).</summary>
    private async Task CountDownAsync(WorkoutRun run, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (run.BeltCountdown is { } count)
        {
            if (now - run.CountdownShownAt < BeltCountdownStep)
            {
                return;
            }

            run.CountdownShownAt = now;
            if (count > 1)
            {
                run.BeltCountdown = count - 1;
                return;
            }

            run.BeltCountdown = null;
            run.BeltStartWrittenAt = now;
            await treadmill.StartBeltAsync(BeltReason.Start, cancellationToken).ConfigureAwait(false);
            return;
        }

        if (store.Current.Belt == BeltState.Running)
        {
            run.Status = WorkoutStatus.Running;
            run.SentForSegment = null;
            await DriveAsync(run, cancellationToken).ConfigureAwait(false);
            return;
        }

        if (now - run.BeltStartWrittenAt >= BeltStartTimeout)
        {
            await treadmill.StopBeltAsync(BeltReason.Timeout, cancellationToken).ConfigureAwait(false);
            run.BeltStartWrittenAt = null;
            run.Status = WorkoutStatus.PausedBeltStopped;
            store.Update(s => s with { Belt = BeltState.Stopped, Error = "The belt did not start." });
        }
    }

    /// <summary>On the treadmill, writes stop-belt for <paramref name="reason"/> (L2-066 criteria 5 and 11).</summary>
    private async Task StopBeltAsync(WorkoutRun run, BeltReason reason, CancellationToken cancellationToken)
    {
        run.BeltCountdown = null;
        run.BeltStartWrittenAt = null;
        if (OnTreadmill && registry.IsConnected)
        {
            await treadmill.StopBeltAsync(reason, cancellationToken).ConfigureAwait(false);
        }
    }

    private Task DriveAsync(WorkoutRun run, CancellationToken cancellationToken) =>
        OnTreadmill ? DriveTreadmillAsync(run, cancellationToken) : DriveBikeAsync(run, cancellationToken);

    /// <summary>
    /// Sends the segment's speed and incline once, and again on multiples of 5 s while the treadmill reports otherwise;
    /// in manual mode the rider's values are resent the same way (L2-068).
    /// </summary>
    private async Task DriveTreadmillAsync(WorkoutRun run, CancellationToken cancellationToken)
    {
        run.PlanLevel = null;
        var reported = store.Current;
        var resendDue = run.Remaining % 5 == 0;
        var source = run.Mode == ResistanceMode.Manual ? CommandSource.Manual : CommandSource.Plan;
        double? speed = run.Mode == ResistanceMode.Manual ? run.LastSentSpeed : run.Current.Speed;
        int? incline = run.Mode == ResistanceMode.Manual ? run.LastSentIncline : run.Current.Incline;
        var firstForSegment = run.Mode == ResistanceMode.Plan && run.SentForSegment != run.Segment;
        run.SentForSegment = run.Mode == ResistanceMode.Plan ? run.Segment : run.SentForSegment;

        if (speed is { } kmh && (firstForSegment || (resendDue && SpeedDiffers(reported.SpeedKmh, kmh))))
        {
            var result = await treadmill.SendSpeedAsync(kmh, source, run.Elapsed, cancellationToken).ConfigureAwait(false);
            run.LastSentSpeed = kmh;
            ReportFailure(result, "set speed failed");
        }

        if (incline is { } percent && (firstForSegment || (resendDue && reported.Incline != percent)))
        {
            var result = await treadmill.SendInclineAsync(percent, source, run.Elapsed, cancellationToken).ConfigureAwait(false);
            run.LastSentIncline = percent;
            ReportFailure(result, "set incline failed");
        }
    }

    private static bool SpeedDiffers(double? reported, double sent) =>
        reported is not { } r || Math.Abs(r - sent) > SpeedTolerance;

    private void ReportFailure(SendResult result, string what)
    {
        if (result is SendResult.FailedResult failed)
        {
            store.Update(s => s with { Error = $"{what}: {failed.Message}" });
        }
    }

    /// <summary>Sends the segment's level once, and again on multiples of 5 s while the bike reports otherwise (L2-012).</summary>
    private async Task DriveBikeAsync(WorkoutRun run, CancellationToken cancellationToken)
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
        if (due && run.PlanLevel is { } level)
        {
            await SendAsync(run, level, CommandSource.Plan, cancellationToken).ConfigureAwait(false);
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
        store.Update(s => s.Machine == Machine.Treadmill
            ? s with
            {
                Workout = run.ToSnapshot(),
                TargetPower = null,
                AvgPower = null,
                DistanceKm = run.Totals.DistanceKmRounded,
                ClimbM = run.Totals.ClimbMRounded,
                Kcal = run.Totals.TreadmillKcal,
                BeltCountdown = run.Status == WorkoutStatus.StartingBelt ? run.BeltCountdown : null,
            }
            : s with
            {
                Workout = run.ToSnapshot(),
                TargetPower = run.Status == WorkoutStatus.Running && run.Current is { Cadence: { } cadence, Level: { } level }
                    ? PowerEstimator.EstimateWatts(cadence, level)
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
