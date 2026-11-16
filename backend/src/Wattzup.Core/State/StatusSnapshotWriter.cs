using System.Text.Json;
using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Wattzup.Core.State;

/// <summary><c>Wattzup:StatusSnapshot</c> (L2-031).</summary>
public sealed class StatusSnapshotOptions
{
    public const string SectionName = "Wattzup:StatusSnapshot";

    /// <summary>Relative paths are under the content root.</summary>
    public string Path { get; set; } = "status.json";

    public TimeSpan MinInterval { get; set; } = TimeSpan.FromMilliseconds(500);

    public bool Enabled { get; set; } = true;
}

/// <summary>Writes a file by writing a temporary sibling and renaming it over the target, so readers never see it partial.</summary>
public static class AtomicFile
{
    public static async Task WriteAllTextAsync(string path, string text, CancellationToken cancellationToken)
    {
        var tmp = path + ".tmp";
        await using (var stream = new FileStream(tmp, FileMode.Create, FileAccess.Write, FileShare.None))
        await using (var writer = new StreamWriter(stream))
        {
            await writer.WriteAsync(text.AsMemory(), cancellationToken).ConfigureAwait(false);
            await writer.FlushAsync(cancellationToken).ConfigureAwait(false);
            stream.Flush(flushToDisk: true);
        }

        File.Move(tmp, path, overwrite: true);
    }
}

/// <summary>
/// Mirrors the state to <c>status.json</c> (indented, no <c>ts</c>) at most twice a second, always writing the final
/// state, and once more on shutdown (L2-031).
/// </summary>
public sealed partial class StatusSnapshotWriter : BackgroundService
{
    private readonly BikeStateStore _store;
    private readonly StatusSnapshotOptions _options;
    private readonly string _path;
    private readonly ILogger<StatusSnapshotWriter> _logger;
    private readonly Channel<bool> _dirty = Channel.CreateBounded<bool>(new BoundedChannelOptions(1) { FullMode = BoundedChannelFullMode.DropWrite });
    private DateTimeOffset _lastWrite = DateTimeOffset.MinValue;

    public StatusSnapshotWriter(BikeStateStore store, IOptions<StatusSnapshotOptions> options, IHostEnvironment environment, ILogger<StatusSnapshotWriter> logger)
    {
        ArgumentNullException.ThrowIfNull(store);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(environment);
        _store = store;
        _options = options.Value;
        _logger = logger;
        _path = Path.IsPathRooted(_options.Path) ? _options.Path : Path.Combine(environment.ContentRootPath, _options.Path);
        if (_options.Enabled)
        {
            store.StateChanged += _ => _dirty.Writer.TryWrite(true);
        }
    }

    /// <summary>Raised after each write with the state written.</summary>
    public event Action<BikeState>? Written;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            return;
        }

        try
        {
            while (await _dirty.Reader.WaitToReadAsync(stoppingToken).ConfigureAwait(false))
            {
                var wait = _lastWrite + _options.MinInterval - _store.Time.GetUtcNow();
                if (wait > TimeSpan.Zero)
                {
                    await Task.Delay(wait, _store.Time, stoppingToken).ConfigureAwait(false);
                }

                _dirty.Reader.TryRead(out _);
                await WriteAsync(stoppingToken).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            await WriteAsync(CancellationToken.None).ConfigureAwait(false);
        }
    }

    private async Task WriteAsync(CancellationToken cancellationToken)
    {
        var state = _store.Current;
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(_path))!);
            await AtomicFile.WriteAllTextAsync(_path, JsonSerializer.Serialize(state, WattzupJson.Indented), cancellationToken).ConfigureAwait(false);
            _lastWrite = _store.Time.GetUtcNow();
            Written?.Invoke(state);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            LogWriteFailed(_logger, e);
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Writing status.json failed; retrying on the next change.")]
    private static partial void LogWriteFailed(ILogger logger, Exception exception);
}
