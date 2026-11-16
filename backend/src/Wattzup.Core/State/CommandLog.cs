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
        log.Select(e => e.WrittenUnixMs == entry.WrittenUnixMs && e.Command == entry.Command && e.Value == entry.Value && e.Source == entry.Source ? e with { Status = CommandStatus.Failed } : e).ToImmutableArray();

    /// <summary>
    /// Acknowledges <c>sending</c> entries of the reported kind and value, walking from the newest entry of that kind
    /// and stopping at the first one with another value, so an older entry behind a newer different value stays
    /// <c>sending</c>. Entries of other kinds are passed over (L2-048 criterion 4, L2-065 criterion 6).
    /// </summary>
    public static ImmutableArray<CommandEntry> Acknowledge(IReadOnlyList<CommandEntry> log, CommandKind kind, double value, long nowUnixMs)
    {
        var builder = log.ToImmutableArray().ToBuilder();
        for (var i = 0; i < builder.Count; i++)
        {
            var e = builder[i];
            if (e.Command != kind)
            {
                continue;
            }

            if (Math.Abs(e.Value - value) > 0.05)
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
