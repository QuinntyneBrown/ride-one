using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Wattzup.Core.Telemetry;

/// <summary><c>Wattzup:RawPacketLog</c> (L2-030).</summary>
public sealed class RawPacketLogOptions
{
    public const string SectionName = "Wattzup:RawPacketLog";

    /// <summary>Relative paths are under the content root.</summary>
    public string Path { get; set; } = "raw_packets.log";

    public long MaxBytes { get; set; } = 10 * 1024 * 1024;

    public int RetainedFiles { get; set; } = 5;

    public bool Enabled { get; set; } = true;
}

/// <summary>Queues every notification for the log without awaiting I/O on the notify path (L2-030).</summary>
public sealed class RawPacketLogger : IRawPacketSink
{
    public const int Capacity = 10_000;

    private long _dropped;

    public RawPacketLogger(IOptions<RawPacketLogOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);
        Enabled = options.Value.Enabled;
    }

    public bool Enabled { get; }

    internal Channel<RawPacket> Channel { get; } = System.Threading.Channels.Channel.CreateBounded<RawPacket>(new BoundedChannelOptions(Capacity)
    {
        FullMode = BoundedChannelFullMode.DropOldest,
        SingleReader = true,
    });

    internal long TakeDropped() => Interlocked.Exchange(ref _dropped, 0);

    public void Add(RawPacket packet)
    {
        if (!Enabled)
        {
            return;
        }

        if (Channel.Reader.Count >= Capacity)
        {
            Interlocked.Increment(ref _dropped);
        }

        Channel.Writer.TryWrite(packet);
    }
}

/// <summary>Drains <see cref="RawPacketLogger"/> into the rolling <c>raw_packets.log</c>, flushing after each batch.</summary>
public sealed partial class RawPacketLogWriter(
    RawPacketLogger logger,
    IOptions<RawPacketLogOptions> options,
    IHostEnvironment environment,
    TimeProvider time,
    ILogger<RawPacketLogWriter> log) : BackgroundService
{
    private DateTimeOffset _lastDropReport = DateTimeOffset.MinValue;

    /// <summary>Raised after each flushed batch.</summary>
    public event Action? Flushed;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!logger.Enabled)
        {
            return;
        }

        var o = options.Value;
        var path = System.IO.Path.IsPathRooted(o.Path) ? o.Path : System.IO.Path.Combine(environment.ContentRootPath, o.Path);
        using var file = new RollingFile(path, o.MaxBytes, o.RetainedFiles);
        try
        {
            while (await logger.Channel.Reader.WaitToReadAsync(stoppingToken).ConfigureAwait(false))
            {
                try
                {
                    while (logger.Channel.Reader.TryRead(out var packet))
                    {
                        file.WriteLine(RawPacketFormatter.Format(packet));
                    }

                    file.Flush();
                }
                catch (IOException e)
                {
                    LogWriteFailed(log, e);
                }

                ReportDrops();
                Flushed?.Invoke();
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            file.Flush();
        }
    }

    private void ReportDrops()
    {
        var now = time.GetUtcNow();
        if (now - _lastDropReport < TimeSpan.FromMinutes(1))
        {
            return;
        }

        var dropped = logger.TakeDropped();
        if (dropped > 0)
        {
            _lastDropReport = now;
            LogDropped(log, dropped);
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "The raw packet log fell behind and dropped {Count} lines.")]
    private static partial void LogDropped(ILogger logger, long count);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Writing the raw packet log failed.")]
    private static partial void LogWriteFailed(ILogger logger, Exception exception);
}
