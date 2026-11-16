using Wattzup.Core.Bluetooth;
using Wattzup.Core.State;
using Wattzup.Protocol;

namespace Wattzup.Core.Resistance;

/// <summary>The outcome of one command send (L2-008, L2-065).</summary>
public abstract record SendResult
{
    public static SendResult Sent { get; } = new SentResult();

    public static SendResult NotConnected { get; } = new NotConnectedResult();

    public static SendResult Failed(string message) => new FailedResult(message);

    /// <summary>The command belongs to the other machine (L2-069 criterion 5).</summary>
    public static SendResult WrongMachine { get; } = new WrongMachineResult();

    public sealed record SentResult : SendResult;

    public sealed record NotConnectedResult : SendResult;

    public sealed record FailedResult(string Message) : SendResult;

    public sealed record WrongMachineResult : SendResult;
}

/// <summary>Writes set-resistance commands to the bike (L2-008, L2-009, L2-048).</summary>
public interface IResistanceCommander
{
    /// <summary>Sends <paramref name="level"/>; <paramref name="rideSeconds"/> is the ride time logged with it, null with no workout.</summary>
    Task<SendResult> SendAsync(int level, CommandSource source, int? rideSeconds, CancellationToken cancellationToken);
}

/// <summary>
/// Writes <c>F0 B1 01 &lt;level&gt; &lt;checksum&gt;</c> with response, sets <c>target_resistance</c> and logs every attempt.
/// Writes are serialised so a manual and a plan command never interleave on the link.
/// </summary>
public sealed class ResistanceCommander(BikeStateStore store, ActiveConnectionRegistry registry) : IResistanceCommander, IDisposable
{
    private readonly SemaphoreSlim _gate = new(1, 1);

    public async Task<SendResult> SendAsync(int level, CommandSource source, int? rideSeconds, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var connection = registry.Current;
            var nowMs = store.Time.GetUtcNow().ToUnixTimeMilliseconds();
            var entry = CommandEntry.ForResistance(nowMs / 1000.0, rideSeconds, level, source, CommandStatus.Sending, null) with
            {
                WrittenUnixMs = nowMs,
            };

            if (connection is not { IsConnected: true })
            {
                var failed = entry with { Status = CommandStatus.Failed };
                store.Update(s => s with { Commands = CommandLog.Add(s.Commands, failed) });
                return SendResult.NotConnected;
            }

            // The entry is in the state before the write, so a fast report cannot arrive before it.
            store.Update(s => s with { Commands = CommandLog.Add(s.Commands, entry) });
            try
            {
                await connection.WriteAsync(EchelonCommands.SetResistance(level), withResponse: true, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                store.Update(s => s with { Commands = CommandLog.Fail(s.Commands, entry) });
                return SendResult.Failed(e.Message);
            }

            store.Update(s => s with { TargetResistance = level });
            return SendResult.Sent;
        }
        finally
        {
            _gate.Release();
        }
    }

    public void Dispose() => _gate.Dispose();
}
