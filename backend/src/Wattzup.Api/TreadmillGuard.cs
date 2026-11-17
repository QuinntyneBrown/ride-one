using Microsoft.Extensions.Options;

namespace Wattzup.Api;

/// <summary>
/// Stops the host before Kestrel binds when it would start as the treadmill while treadmill support is off (L2-075
/// criterion 2, ADR 0011).
/// </summary>
public sealed partial class TreadmillGuard(IOptions<WattzupOptions> wattzup, IOptions<TreadmillOptions> treadmill, ILogger<TreadmillGuard> logger) : IHostedLifecycleService
{
    public Task StartingAsync(CancellationToken cancellationToken)
    {
        if (!treadmill.Value.Enabled && wattzup.Value.ParsedMachine == Core.State.Machine.Treadmill)
        {
            LogRefused(logger);
            throw new InvalidOperationException("Treadmill support is off; refusing to start as the treadmill.");
        }

        return Task.CompletedTask;
    }

    public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StartedAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StoppingAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StoppedAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    [LoggerMessage(Level = LogLevel.Critical, Message = "Treadmill support is off. Set Wattzup:Treadmill:Enabled to true to use the treadmill.")]
    private static partial void LogRefused(ILogger logger);
}
