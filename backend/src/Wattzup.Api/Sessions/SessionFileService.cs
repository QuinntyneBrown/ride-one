using System.Threading.Channels;
using Microsoft.Extensions.Options;
using Wattzup.Core.Sessions;

namespace Wattzup.Api.Sessions;

/// <summary>
/// Loads the sessions file into the <see cref="SessionStore"/> at start-up and writes it after each save (L2-082). Writes
/// run on their own loop, so ending a ride never waits for the disk; a failed write is logged and the session is still
/// served until the backend stops. Pending writes are finished on shutdown.
/// </summary>
public sealed partial class SessionFileService(
    SessionStore store,
    IOptions<SessionsOptions> options,
    IHostEnvironment environment,
    ILogger<SessionFileService> logger) : IHostedService
{
    private readonly Channel<IReadOnlyList<SessionRecord>> _pending =
        Channel.CreateUnbounded<IReadOnlyList<SessionRecord>>(new UnboundedChannelOptions { SingleReader = true });

    private Task? _writer;
    private volatile bool _keepUnread;

    /// <summary>The sessions file's full path: the setting, resolved against the content root when relative.</summary>
    public string FilePath { get; } = ResolvePath(environment.ContentRootPath, options.Value);

    /// <summary>Raised after each write: true when the file was written, false when the write failed.</summary>
    public event EventHandler<bool>? Written;

    public static string ResolvePath(string contentRoot, SessionsOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        return Path.GetFullPath(Path.Combine(contentRoot, options.Path));
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        Load();
        store.Saved += OnSaved;
        _writer = Task.Run(WriteLoopAsync, CancellationToken.None);
        return Task.CompletedTask;
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        store.Saved -= OnSaved;
        _pending.Writer.TryComplete();
        if (_writer is { } writer)
        {
            await writer.WaitAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private void Load()
    {
        var result = SessionFile.Read(FilePath);
        if (result.Sessions is { } sessions)
        {
            store.Load(sessions);
            LogLoaded(sessions.Count, FilePath);
            return;
        }

        try
        {
            SessionFile.SetAside(FilePath);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            // The file stays where it is and is never written over unread: sessions are kept in memory only.
            _keepUnread = true;
        }

        LogUnreadable(FilePath, result.Error ?? "unknown");
    }

    private void OnSaved(object? sender, IReadOnlyList<SessionRecord> sessions)
    {
        if (!_keepUnread)
        {
            _pending.Writer.TryWrite(sessions);
        }
    }

    private async Task WriteLoopAsync()
    {
        while (await _pending.Reader.WaitToReadAsync().ConfigureAwait(false))
        {
            IReadOnlyList<SessionRecord>? latest = null;
            while (_pending.Reader.TryRead(out var sessions))
            {
                latest = sessions;
            }

            if (latest is null)
            {
                continue;
            }

            bool ok;
            try
            {
                SessionFile.Write(FilePath, latest);
                ok = true;
            }
            catch (Exception e) when (e is IOException or UnauthorizedAccessException)
            {
                LogWriteFailed(FilePath, e.Message);
                ok = false;
            }

            Written?.Invoke(this, ok);
        }
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Sessions: {Count} loaded from {Path}")]
    private partial void LogLoaded(int count, string path);

    [LoggerMessage(Level = LogLevel.Error, Message = "Couldn't read the sessions file {Path}: {Reason}. It was renamed to .unreadable and Wattzup starts with no sessions.")]
    private partial void LogUnreadable(string path, string reason);

    [LoggerMessage(Level = LogLevel.Error, Message = "Couldn't write the sessions file {Path}: {Reason}")]
    private partial void LogWriteFailed(string path, string reason);
}
