namespace Wattzup.Protocol;

/// <summary>Decodes a notify frame (L2-005 to L2-007). The trailing checksum is not checked, as in the prototype.</summary>
public static class PacketDecoder
{
    public const byte Marker = 0xF0;
    public const byte WorkoutData = 0xD1;
    public const byte Resistance = 0xD2;

    public static TelemetryUpdate? Decode(ReadOnlySpan<byte> frame)
    {
        if (frame.Length < 4 || frame[0] != Marker)
        {
            return null;
        }

        switch (frame[1])
        {
            case Resistance:
                return new ResistanceUpdate(frame[3]);
            case WorkoutData when frame.Length >= 13:
                var rpm = (frame[9] << 8) | frame[10];
                return new CadenceUpdate(rpm, SpeedCalculator.ToKmh(rpm), SpeedCalculator.ToMph(rpm));
            default:
                return null;
        }
    }
}
