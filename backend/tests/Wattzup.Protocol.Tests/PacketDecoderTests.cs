// Unit Test
// Traces to: L2-005, L2-006, L2-007
// Description: Only well-formed frames decode; resistance and cadence frames give their metrics.

namespace Wattzup.Protocol.Tests;

public sealed class PacketDecoderTests
{
    private static byte[] Hex(string hex) => Convert.FromHexString(hex.Replace(" ", "", StringComparison.Ordinal));

    [Theory]
    [InlineData("F0 D2 01")]                              // shorter than 4 bytes
    [InlineData("E0 D2 01 0C CF")]                        // first byte is not 0xF0
    [InlineData("F0 D0 01 01 C2")]                        // unknown type
    [InlineData("F0 D1 09 00 05 00 00 00 00 00 50 00")]   // 0xD1 of 12 bytes
    public void Malformed_or_unknown_frames_decode_to_nothing(string frame)
    {
        Assert.Null(PacketDecoder.Decode(Hex(frame)));
    }

    [Fact]
    public void A_resistance_frame_carries_byte_3()
    {
        Assert.Equal(new ResistanceUpdate(12), PacketDecoder.Decode(Hex("F0 D2 01 0C CF")));
    }

    [Theory]
    [InlineData("F0 D1 09 00 05 00 00 00 00 00 50 00 1F", 80, 30.0, 18.6)]
    [InlineData("F0 D1 09 00 05 00 00 00 00 01 00 00 1F", 256, 96.0, 59.6)]
    [InlineData("F0 D1 09 00 05 00 00 00 00 00 00 00 1F", 0, 0.0, 0.0)]
    public void A_workout_frame_carries_cadence_and_derived_speed(string frame, int rpm, double kmh, double mph)
    {
        Assert.Equal(new CadenceUpdate(rpm, kmh, mph), PacketDecoder.Decode(Hex(frame)));
    }
}
