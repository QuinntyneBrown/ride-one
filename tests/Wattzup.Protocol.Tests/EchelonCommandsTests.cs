// Unit Test
// Traces to: L2-002, L2-003, L2-008
// Description: Command bytes: the init sequence, keepalive and set-resistance with its checksum.

namespace Wattzup.Protocol.Tests;

public sealed class EchelonCommandsTests
{
    [Theory]
    [InlineData(1, "F0B10101A3")]
    [InlineData(12, "F0B1010CAE")]
    [InlineData(32, "F0B10120C2")]
    public void Set_resistance_appends_the_checksum(int level, string expected)
    {
        Assert.Equal(expected, Convert.ToHexString(EchelonCommands.SetResistance(level)));
    }

    [Fact]
    public void The_init_sequence_is_device_info_resistance_range_then_start_stream()
    {
        Assert.Equal(
            ["F0A10091", "F0A30093", "F0B00101A2"],
            EchelonCommands.InitSequence.Select(c => Convert.ToHexString(c.ToArray())));
    }

    [Fact]
    public void The_keepalive_is_F0_A0_01_01_92()
    {
        Assert.Equal("F0A0010192", Convert.ToHexString(EchelonCommands.Keepalive.ToArray()));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(33)]
    public void Set_resistance_rejects_levels_outside_1_to_32(int level)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => EchelonCommands.SetResistance(level));
    }

    [Fact]
    public void The_connection_id_is_the_first_8_hex_digits_of_the_service()
    {
        Assert.Equal("0bf669f1", EchelonUuids.ConnectionId);
    }
}
