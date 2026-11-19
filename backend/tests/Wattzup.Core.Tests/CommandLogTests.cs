// Unit Test
// Traces to: L2-048
// Description: The command log keeps the 5 newest entries and acknowledges only matching, unblocked entries.

using System.Collections.Immutable;
using Wattzup.Core.State;

namespace Wattzup.Core.Tests;

public sealed class CommandLogTests
{
    private static CommandEntry Sending(int level, long writtenMs = 1_000) =>
        new(At: writtenMs / 1000.0, RideSeconds: null, Level: level, Source: CommandSource.Manual,
            Status: CommandStatus.Sending, AckMs: null) { WrittenUnixMs = writtenMs };

    [Fact]
    public void Add_puts_the_entry_first_and_keeps_the_5_newest()
    {
        var log = ImmutableArray<CommandEntry>.Empty;
        for (var level = 1; level <= 6; level++)
        {
            log = CommandLog.Add(log, Sending(level));
        }

        Assert.Equal([6, 5, 4, 3, 2], log.Select(e => e.Level));
    }

    [Fact]
    public void Acknowledge_marks_the_matching_entry_ack_with_its_latency()
    {
        var log = CommandLog.Add([], Sending(22, writtenMs: 1_000));

        log = CommandLog.Acknowledge(log, 22, nowUnixMs: 1_038);

        Assert.Equal(CommandStatus.Ack, log[0].Status);
        Assert.Equal(38, log[0].AckMs);
    }

    [Fact]
    public void A_newer_command_for_another_level_blocks_the_older_entry()
    {
        var log = CommandLog.Add([], Sending(20));
        log = CommandLog.Add(log, Sending(22));

        log = CommandLog.Acknowledge(log, 20, nowUnixMs: 1_050);

        Assert.All(log, e => Assert.Equal(CommandStatus.Sending, e.Status));
    }

    [Fact]
    public void A_report_for_another_level_acknowledges_nothing()
    {
        var log = CommandLog.Add([], Sending(22));

        log = CommandLog.Acknowledge(log, 12, nowUnixMs: 1_050);

        Assert.Equal(CommandStatus.Sending, log[0].Status);
    }

    [Fact]
    public void Fail_marks_only_that_entry_failed()
    {
        var first = Sending(20);
        var second = Sending(22, writtenMs: 2_000);
        var log = CommandLog.Add(CommandLog.Add([], first), second);

        log = CommandLog.Fail(log, second);

        Assert.Equal(CommandStatus.Failed, log[0].Status);
        Assert.Equal(CommandStatus.Sending, log[1].Status);
    }
}
