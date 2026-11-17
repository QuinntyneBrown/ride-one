// Unit Test
// Traces to: L2-063, L2-065, L2-066
// Description: Treadmill command bytes, one case per row of docs/protocol/echelon-treadmill-frames.md: init,
// keepalive counter, belt start and stop, set speed and set incline with their checksums, and the acknowledgement echo.

namespace Wattzup.Protocol.Tests;

public sealed class EchelonTreadmillCommandsTests
{
    [Fact]
    public void The_init_sequence_is_A4_A1_A3_and_never_starts_the_belt()
    {
        var init = EchelonTreadmillCommands.InitSequence.Select(c => Convert.ToHexString(c.ToArray())).ToArray();
        Assert.Equal(["F0A40094", "F0A10091", "F0A30093"], init);
        Assert.DoesNotContain("F0B00101A2", init);
    }

    [Theory]
    [InlineData(1, "F0A0010192")]
    [InlineData(2, "F0A0010293")]
    [InlineData(255, "F0A001FF90")]
    public void The_keepalive_carries_its_counter(byte counter, string expected)
    {
        Assert.Equal(expected, Convert.ToHexString(EchelonTreadmillCommands.Keepalive(counter)));
    }

    [Theory]
    [InlineData(1, 2)]
    [InlineData(254, 255)]
    [InlineData(255, 1)]
    public void The_keepalive_counter_runs_1_to_255_and_skips_0(byte counter, byte next)
    {
        Assert.Equal(next, EchelonTreadmillCommands.NextKeepaliveCounter(counter));
    }

    [Fact]
    public void Start_and_stop_belt_bytes()
    {
        Assert.Equal("F0B00101A2", Convert.ToHexString(EchelonTreadmillCommands.StartBelt.ToArray()));
        Assert.Equal("F0B00100A1", Convert.ToHexString(EchelonTreadmillCommands.StopBelt.ToArray()));
    }

    [Theory]
    [InlineData(1.0, "F0B20203E88F")]
    [InlineData(7.0, "F0B2021B5817")]
    [InlineData(9.0, "F0B2022328EF")]
    [InlineData(0.8, "F0B2020320C7")]
    [InlineData(19.3, "F0B2024B6453")]
    public void Set_speed_is_metres_per_hour_big_endian_with_the_checksum(double kmh, string expected)
    {
        Assert.Equal(expected, Convert.ToHexString(EchelonTreadmillCommands.SetSpeed(kmh)));
    }

    [Theory]
    [InlineData(0, "F0B10100A2")]
    [InlineData(5, "F0B10105A7")]
    [InlineData(10, "F0B1010AAC")]
    public void Set_incline_appends_the_checksum(int percent, string expected)
    {
        Assert.Equal(expected, Convert.ToHexString(EchelonTreadmillCommands.SetIncline(percent)));
    }

    [Theory]
    [InlineData(0.7)]
    [InlineData(19.4)]
    [InlineData(9.25)]
    public void Set_speed_rejects_values_outside_0_8_to_19_3_or_finer_than_a_tenth(double kmh)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => EchelonTreadmillCommands.SetSpeed(kmh));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(11)]
    public void Set_incline_rejects_values_outside_0_to_10(int percent)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => EchelonTreadmillCommands.SetIncline(percent));
    }

    [Theory]
    [InlineData("F0D00100C1", "F0D00100C1")]
    [InlineData("F0D20105C8", "F0D20105C8")]
    [InlineData("F0D3022328 10", "F0D302232810")]
    [InlineData("F0D1090005000000000050001F", null)]
    [InlineData("F0D2", null)]
    [InlineData("A0D20105C8", null)]
    public void D0_D2_and_D3_frames_are_echoed_back_as_the_acknowledgement(string frame, string? expected)
    {
        var ack = EchelonTreadmillCommands.Acknowledgement(Convert.FromHexString(frame.Replace(" ", string.Empty, StringComparison.Ordinal)));
        Assert.Equal(expected, ack is null ? null : Convert.ToHexString(ack));
    }
}
