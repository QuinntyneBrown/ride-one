namespace Wattzup.Protocol;

/// <summary>Decodes a treadmill notify frame (L2-064). As on the bike, the trailing checksum is not checked.</summary>
public static class TreadmillPacketDecoder
{
    public const byte Speed = 0xD3;
    public const byte Incline = 0xD2;

    public static TelemetryUpdate? Decode(ReadOnlySpan<byte> frame)
    {
        if (frame.Length < 4 || frame[0] != PacketDecoder.Marker)
        {
            return null;
        }

        switch (frame[1])
        {
            case Incline when frame.Length >= 5:
                return new InclineUpdate(frame[3]);
            case Speed when frame.Length >= 6:
                var kmh = ((frame[3] << 8) | frame[4]) / 1000.0;
                return new SpeedUpdate(
                    Math.Round(kmh, 1, MidpointRounding.ToEven),
                    Math.Round(kmh / SpeedCalculator.KmPerMile, 1, MidpointRounding.ToEven));
            default:
                return null;
        }
    }
}
