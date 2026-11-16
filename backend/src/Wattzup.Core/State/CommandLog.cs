using System.Collections.Immutable;

namespace Wattzup.Core.State;

/// <summary>Pure operations over the command log in <c>commands</c> (L2-048).</summary>
public static class CommandLog
{
    public const int Capacity = 5;

    /// <summary>Puts the entry at the front and keeps the 5 newest.</summary>
    public static ImmutableArray<CommandEntry> Add(IReadOnlyList<CommandEntry> log, CommandEntry entry)
    {
        var builder = ImmutableArray.CreateBuilder<CommandEntry>(Capacity);
        builder.Add(entry);
        foreach (var e in log)
        {
            if (builder.Count == Capacity)
            {
                break;
            }

            builder.Add(e);
        }

        return builder.ToImmutable();
    }

    /// <summary>Sets that entry's status to <c>failed</c>.</summary>
    public static ImmutableArray<CommandEntry> Fail(IReadOnlyList<CommandEntry> log, CommandEntry entry) =>
        log.Select(e => e.WrittenUnixMs == entry.WrittenUnixMs && e.Level == entry.Level && e.Source == entry.Source ? e with { Status = CommandStatus.Failed } : e).ToImmutableArray();

    /// <summary>
    /// Acknowledges <c>sending</c> entries of the reported level, walking from the newest and stopping at
    /// the first entry of another level, so an older entry behind a newer different level stays <c>sending</c>.
    /// </summary>
    public static ImmutableArray<CommandEntry> Acknowledge(IReadOnlyList<CommandEntry> log, int level, long nowUnixMs)
    {
        var builder = log.ToImmutableArray().ToBuilder();
        for (var i = 0; i < builder.Count; i++)
        {
            var e = builder[i];
            if (e.Level != level)
            {
                break;
            }

            if (e.Status == CommandStatus.Sending)
            {
                builder[i] = e with { Status = CommandStatus.Ack, AckMs = (int)Math.Max(0, nowUnixMs - e.WrittenUnixMs) };
            }
        }

        return builder.ToImmutable();
    }
}
