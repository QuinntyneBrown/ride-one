// Unit Test
// Traces to: L2-064
// Description: Treadmill notifications, one case per row of docs/protocol/echelon-treadmill-frames.md: D3 speed in
// metres per hour, D2 incline, and frames that change no metric.

namespace Wattzup.Protocol.Tests;

public sealed class TreadmillPacketDecoderTests
{
    [Theory]
    [InlineData("F0D302232810", 9.0, 5.6)]
    [InlineData("F0D3021B5838", 7.0, 4.3)]
    [InlineData("F0D3020000C5", 0.0, 0.0)]
    [InlineData("F0D302044C15", 1.1, 0.7)]
    public void D3_is_the_speed(string frame, double kmh, double mph)
    {
        var update = Assert.IsType<SpeedUpdate>(TreadmillPacketDecoder.Decode(Convert.FromHexString(frame)));
        Assert.Equal(kmh, update.Kmh);
        Assert.Equal(mph, update.Mph);
    }

    [Fact]
    public void D2_is_the_incline()
    {
        var update = Assert.IsType<InclineUpdate>(TreadmillPacketDecoder.Decode(Convert.FromHexString("F0D20105C8")));
        Assert.Equal(5, update.Percent);
    }

    [Theory]
    [InlineData("F0D3022328")]
    [InlineData("F0D201")]
    [InlineData("F0D00100C1")]
    [InlineData("F0D1090005000000000050001F")]
    [InlineData("A0D302232810")]
    [InlineData("F0D3")]
    public void Other_frames_change_no_metric(string frame)
    {
        Assert.Null(TreadmillPacketDecoder.Decode(Convert.FromHexString(frame)));
    }
}
