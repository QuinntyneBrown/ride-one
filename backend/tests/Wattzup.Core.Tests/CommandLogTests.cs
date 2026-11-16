// Unit Test
// Traces to: L2-048, L2-065
// Description: The command log keeps the 5 newest entries and acknowledges only matching, unblocked entries of the
// reported kind (resistance, speed or incline).

using System.Collections.Immutable;
using Wattzup.Core.State;

namespace Wattzup.Core.Tests;

public sealed class CommandLogTests
{
    private static CommandEntry Sending(int level, long writtenMs = 1_000) =>
        CommandEntry.ForResistance(writtenMs / 1000.0, null, level, CommandSource.Manual, CommandStatus.Sending, null) with
        {
            WrittenUnixMs = writtenMs,
        };

    private static CommandEntry SendingTreadmill(CommandKind kind, double value, long writtenMs = 1_000) =>
        new(writtenMs / 1000.0, null, null, CommandSource.Plan, CommandStatus.Sending, null, kind, value) { WrittenUnixMs = writtenMs };

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

        log = CommandLog.Acknowledge(log, CommandKind.Resistance, 22, nowUnixMs: 1_038);

        Assert.Equal(CommandStatus.Ack, log[0].Status);
        Assert.Equal(38, log[0].AckMs);
    }

    [Fact]
    public void A_newer_command_for_another_level_blocks_the_older_entry()
    {
        var log = CommandLog.Add([], Sending(20));
        log = CommandLog.Add(log, Sending(22));

        log = CommandLog.Acknowledge(log, CommandKind.Resistance, 20, nowUnixMs: 1_050);

        Assert.All(log, e => Assert.Equal(CommandStatus.Sending, e.Status));
    }

    [Fact]
    public void A_report_for_another_level_acknowledges_nothing()
    {
        var log = CommandLog.Add([], Sending(22));

        log = CommandLog.Acknowledge(log, CommandKind.Resistance, 12, nowUnixMs: 1_050);

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

    [Fact]
    public void A_speed_report_acknowledges_the_speed_entry_and_passes_over_an_incline_entry()
    {
        var log = CommandLog.Add([], SendingTreadmill(CommandKind.Speed, 9.0));
        log = CommandLog.Add(log, SendingTreadmill(CommandKind.Incline, 2, writtenMs: 1_010));

        log = CommandLog.Acknowledge(log, CommandKind.Speed, 9.0, nowUnixMs: 1_120);

        Assert.Equal(CommandStatus.Sending, log[0].Status);
        Assert.Equal(CommandStatus.Ack, log[1].Status);
        Assert.Equal(120, log[1].AckMs);
    }

    [Fact]
    public void An_incline_report_never_acknowledges_a_speed_entry_of_the_same_value()
    {
        var log = CommandLog.Add([], SendingTreadmill(CommandKind.Speed, 5.0));

        log = CommandLog.Acknowledge(log, CommandKind.Incline, 5, nowUnixMs: 1_050);

        Assert.Equal(CommandStatus.Sending, log[0].Status);
    }

    [Fact]
    public void A_newer_speed_for_another_value_blocks_the_older_speed_entry()
    {
        var log = CommandLog.Add([], SendingTreadmill(CommandKind.Speed, 7.0));
        log = CommandLog.Add(log, SendingTreadmill(CommandKind.Speed, 9.0, writtenMs: 1_010));

        log = CommandLog.Acknowledge(log, CommandKind.Speed, 7.0, nowUnixMs: 1_050);

        Assert.All(log, e => Assert.Equal(CommandStatus.Sending, e.Status));
    }

    [Fact]
    public void A_resistance_entry_logs_its_level_as_the_value()
    {
        var entry = Sending(22);

        Assert.Equal(CommandKind.Resistance, entry.Command);
        Assert.Equal(22, entry.Value);
    }
}
