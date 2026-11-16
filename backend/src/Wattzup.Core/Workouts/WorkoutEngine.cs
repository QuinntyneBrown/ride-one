using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Wattzup.Core.Bluetooth;
using Wattzup.Core.Machines;
using Wattzup.Core.Resistance;
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
    PowerTraceHistory trace) : BackgroundService, IResistanceControl, ITreadmillControl, IMachineControl
{
    public static readonly TimeSpan TickInterval = TimeSpan.FromSeconds(1);
    public static readonly TimeSpan ShutOffGrace = TimeSpan.FromSeconds(90);

    private readonly Channel<Func<Task>> _inbox = Channel.CreateBounded<Func<Task>>(64);
    private WorkoutRun? _run;

    /// <summary>Starts <paramref name="plan"/>, replacing any active ride (L2-013 criterion 5).</summary>
    public Task<WorkoutSnapshot> StartAsync(WorkoutPlan plan, CancellationToken cancellationToken) =>
        PostAsync(() => StartRunAsync(plan, cancellationToken), cancellationToken);

    /// <summary>Stops the active ride; the bike keeps its level (L2-013 criterion 6). Null with no workout.</summary>
    public Task<WorkoutSnapshot?> StopWorkoutAsync(CancellationToken cancellationToken) =>
        PostAsync(
            () =>
            {
                if (_run is { IsActive: true } run)
                {
                    run.Status = WorkoutStatus.Stopped;
                    Publish(run);
                }

                return Task.FromResult(_run?.ToSnapshot());
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
                    run.Status = WorkoutStatus.Running;
                    await DriveAsync(run, cancellationToken).ConfigureAwait(false);
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
                run.PlanLevel = run.Current.Level;
                await SendAsync(run, run.PlanLevel, CommandSource.Plan, cancellationToken).ConfigureAwait(false);
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

    private async Task<WorkoutSnapshot> StartRunAsync(WorkoutPlan plan, CancellationToken cancellationToken)
    {
        var run = new WorkoutRun(plan);
        _run = run;
        trace.Reset();
        if (registry.IsConnected)
        {
            run.Status = WorkoutStatus.Running;
            await DriveAsync(run, cancellationToken).ConfigureAwait(false);
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
                run.Status = WorkoutStatus.Running;
                await DriveAsync(run, cancellationToken).ConfigureAwait(false);
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
        if (run.Remaining <= 0)
        {
            if (run.IsLastSegment || run.Elapsed >= run.TotalSeconds)
            {
                run.Remaining = 0;
                run.Status = WorkoutStatus.Ended;
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
            TargetPower = run.Status == WorkoutStatus.Running ? PowerEstimator.EstimateWatts(run.Current.Cadence, run.Current.Level) : null,
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
