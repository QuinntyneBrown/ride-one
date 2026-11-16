using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Wattzup.Core.Resistance;
using Wattzup.Core.State;

namespace Wattzup.Core.Workouts;

/// <summary>The one Core service behind <c>POST /api/resistance</c> (L2-016, L2-047).</summary>
public interface IResistanceControl
{
    Task<SendResult> SetManualAsync(int level, CancellationToken cancellationToken);
}

/// <summary>
/// Owns at most one workout run. Commands and ticks run one at a time on one loop, so no lock guards the run
/// (run-interval-workout design).
/// </summary>
public sealed class WorkoutEngine(IResistanceCommander commander, BikeStateStore store) : BackgroundService, IResistanceControl
{
    private readonly Channel<Func<Task>> _inbox = Channel.CreateBounded<Func<Task>>(64);

    public Task<SendResult> SetManualAsync(int level, CancellationToken cancellationToken) =>
        PostAsync(() => commander.SendAsync(level, CommandSource.Manual, cancellationToken), cancellationToken);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var command in _inbox.Reader.ReadAllAsync(stoppingToken).ConfigureAwait(false))
        {
            await command().ConfigureAwait(false);
        }
    }

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
        _ = store;
        return await reply.Task.WaitAsync(cancellationToken).ConfigureAwait(false);
    }
}
