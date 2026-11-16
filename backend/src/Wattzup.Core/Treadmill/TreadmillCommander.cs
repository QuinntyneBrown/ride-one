using Microsoft.Extensions.Logging;
using Wattzup.Core.Bluetooth;
using Wattzup.Core.Resistance;
using Wattzup.Core.State;
using Wattzup.Protocol;

namespace Wattzup.Core.Treadmill;

/// <summary>Why the belt was started or stopped, logged with each belt command (L2-066 criterion 11).</summary>
public enum BeltReason
{
    Start,
    Pause,
    Stop,
    Replace,
    End,
    Timeout,
}

/// <summary>Writes the treadmill's speed, incline and belt commands (L2-065, L2-066).</summary>
public interface ITreadmillCommander
{
    /// <summary>Sends <paramref name="kmh"/>; <paramref name="rideSeconds"/> is the ride time logged with it, null with no workout.</summary>
    Task<SendResult> SendSpeedAsync(double kmh, CommandSource source, int? rideSeconds, CancellationToken cancellationToken);

    Task<SendResult> SendInclineAsync(int percent, CommandSource source, int? rideSeconds, CancellationToken cancellationToken);

    Task<SendResult> StartBeltAsync(BeltReason reason, CancellationToken cancellationToken);

    Task<SendResult> StopBeltAsync(BeltReason reason, CancellationToken cancellationToken);
}

/// <summary>
/// Writes each command with response, logs speed and incline in <c>commands</c> and sets <c>target_speed</c> /
/// <c>target_incline</c>; belt commands are logged through <see cref="ILogger"/>. Writes are serialised.
/// </summary>
public sealed partial class TreadmillCommander(BikeStateStore store, ActiveConnectionRegistry registry, ILogger<TreadmillCommander> logger)
    : ITreadmillCommander, IDisposable
{
    private readonly SemaphoreSlim _gate = new(1, 1);

    public Task<SendResult> SendSpeedAsync(double kmh, CommandSource source, int? rideSeconds, CancellationToken cancellationToken) =>
        SendLoggedAsync(CommandKind.Speed, kmh, EchelonTreadmillCommands.SetSpeed(kmh), source, rideSeconds, s => s with { TargetSpeed = kmh }, cancellationToken);

    public Task<SendResult> SendInclineAsync(int percent, CommandSource source, int? rideSeconds, CancellationToken cancellationToken) =>
        SendLoggedAsync(CommandKind.Incline, percent, EchelonTreadmillCommands.SetIncline(percent), source, rideSeconds, s => s with { TargetIncline = percent }, cancellationToken);

    public async Task<SendResult> StartBeltAsync(BeltReason reason, CancellationToken cancellationToken)
    {
        var result = await WriteAsync(EchelonTreadmillCommands.StartBelt, cancellationToken).ConfigureAwait(false);
        Log("start", reason, result);
        return result;
    }

    public async Task<SendResult> StopBeltAsync(BeltReason reason, CancellationToken cancellationToken)
    {
        var result = await WriteAsync(EchelonTreadmillCommands.StopBelt, cancellationToken).ConfigureAwait(false);
        Log("stop", reason, result);
        return result;
    }

    public void Dispose() => _gate.Dispose();

    private void Log(string command, BeltReason reason, SendResult result)
    {
        if (logger.IsEnabled(LogLevel.Information))
        {
#pragma warning disable CA1873 // Guarded by IsEnabled above.
            LogBelt(logger, command, reason.ToString().ToLowerInvariant(), Outcome(result));
#pragma warning restore CA1873
        }
    }

    private static string Outcome(SendResult result) => result switch
    {
        SendResult.SentResult => "sent",
        SendResult.NotConnectedResult => "not connected",
        SendResult.FailedResult f => $"failed: {f.Message}",
        _ => "unknown",
    };

    private async Task<SendResult> WriteAsync(ReadOnlyMemory<byte> bytes, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (registry.Current is not { IsConnected: true } connection)
            {
                return SendResult.NotConnected;
            }

            try
            {
                await connection.WriteAsync(bytes, withResponse: true, cancellationToken).ConfigureAwait(false);
                return SendResult.Sent;
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                return SendResult.Failed(e.Message);
            }
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<SendResult> SendLoggedAsync(
        CommandKind kind,
        double value,
        byte[] bytes,
        CommandSource source,
        int? rideSeconds,
        Func<BikeState, BikeState> onSent,
        CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var connection = registry.Current;
            var nowMs = store.Time.GetUtcNow().ToUnixTimeMilliseconds();
            var entry = new CommandEntry(nowMs / 1000.0, rideSeconds, null, source, CommandStatus.Sending, null, kind, value)
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
                await connection.WriteAsync(bytes, withResponse: true, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                store.Update(s => s with { Commands = CommandLog.Fail(s.Commands, entry) });
                return SendResult.Failed(e.Message);
            }

            store.Update(onSent);
            return SendResult.Sent;
        }
        finally
        {
            _gate.Release();
        }
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Belt {Command} ({Reason}): {Outcome}.")]
    private static partial void LogBelt(ILogger logger, string command, string reason, string outcome);
}
