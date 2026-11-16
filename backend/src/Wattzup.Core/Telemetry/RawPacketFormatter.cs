using System.Globalization;
using System.Text;

namespace Wattzup.Core.Telemetry;

/// <summary>The raw-log line: <c>&lt;epoch seconds, 3 decimals&gt; &lt;lowercase hex bytes, space-separated&gt;</c> (L2-030).</summary>
public static class RawPacketFormatter
{
    public static string Format(RawPacket packet)
    {
        var builder = new StringBuilder(16 + (packet.Bytes.Length * 3));
        builder.Append(Math.Floor(packet.EpochSeconds * 1000 + 1e-6) / 1000 is var s ? s.ToString("F3", CultureInfo.InvariantCulture) : string.Empty);
        foreach (var b in packet.Bytes)
        {
            builder.Append(' ').Append(b.ToString("x2", CultureInfo.InvariantCulture));
        }

        return builder.ToString();
    }
}
