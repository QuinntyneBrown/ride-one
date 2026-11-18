using System.Text.Json;
using Wattzup.Core.State;

namespace Wattzup.Core.Sessions;

/// <summary>The outcome of reading the sessions file: the sessions, or the reason it cannot be used.</summary>
public sealed record SessionFileResult(IReadOnlyList<SessionRecord>? Sessions, string? Error);

/// <summary>Reads and writes the sessions file <c>{"sessions":[…]}</c> (L2-082, ADR 0015).</summary>
public static class SessionFile
{
    /// <summary>A larger file is not read (L2-082 criterion 6).</summary>
    public const long MaxBytes = 16 * 1024 * 1024;

    private sealed record Contents(IReadOnlyList<SessionRecord> Sessions);

    /// <summary>Reads the file; a missing file is no sessions, an unusable one an error.</summary>
    public static SessionFileResult Read(string path)
    {
        try
        {
            var info = new FileInfo(path);
            if (!info.Exists)
            {
                return new SessionFileResult([], null);
            }

            if (info.Length > MaxBytes)
            {
                return new SessionFileResult(null, "the file is larger than 16 MB");
            }

            using var stream = File.OpenRead(path);
            using var json = JsonDocument.Parse(stream);
            if (json.RootElement.ValueKind != JsonValueKind.Object
                || !json.RootElement.TryGetProperty("sessions", out var list)
                || list.ValueKind != JsonValueKind.Array)
            {
                return new SessionFileResult(null, "it is not a sessions file");
            }

            var sessions = list.Deserialize<List<SessionRecord>>(WattzupJson.Options);
            if (sessions is null || sessions.Any(s => s is null))
            {
                return new SessionFileResult(null, "it is not a sessions file");
            }

            return new SessionFileResult(sessions, null);
        }
        catch (JsonException)
        {
            return new SessionFileResult(null, "it is not valid JSON or not a sessions file");
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            return new SessionFileResult(null, "the file cannot be read");
        }
    }

    /// <summary>
    /// Writes the whole list to <c>&lt;path&gt;.tmp</c> in the same folder and moves it over the file, so a crash leaves
    /// the old file or the new one, never a partial one (L2-082 criterion 3). Throws on an I/O failure.
    /// </summary>
    public static void Write(string path, IReadOnlyList<SessionRecord> sessions)
    {
        var tmp = path + ".tmp";
        try
        {
            using (var stream = File.Create(tmp))
            {
                JsonSerializer.Serialize(stream, new Contents(sessions), WattzupJson.Options);
                stream.Flush(flushToDisk: true);
            }

            File.Move(tmp, path, overwrite: true);
        }
        catch
        {
            TryDelete(tmp);
            throw;
        }
    }

    /// <summary>Renames an unreadable file to <c>&lt;path&gt;.unreadable</c>, replacing an older one.</summary>
    public static void SetAside(string path) => File.Move(path, path + ".unreadable", overwrite: true);

    private static void TryDelete(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
        }
    }
}
