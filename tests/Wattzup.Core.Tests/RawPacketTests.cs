// Unit Test
// Traces to: L2-030, L2-057
// Description: The raw-log line format, rotation of the rolling file, and the 60-packet ring, oldest first.

using Wattzup.Core.Telemetry;

namespace Wattzup.Core.Tests;

public sealed class RawPacketTests
{
    [Fact]
    public void A_packet_formats_as_epoch_seconds_with_3_decimals_and_lowercase_hex()
    {
        Assert.Equal("1794784639.021 f0 d2 01 0c cf", RawPacketFormatter.Format(new RawPacket(1794784639.0213, [0xF0, 0xD2, 0x01, 0x0C, 0xCF])));
    }

    [Theory]
    [InlineData(0, 0, null)]
    [InlineData(1, 1, 1)]
    [InlineData(60, 60, 1)]
    [InlineData(61, 60, 2)]
    public void The_recent_buffer_keeps_the_newest_60_oldest_first(int added, int expectedCount, int? expectedFirst)
    {
        var buffer = new RecentPacketBuffer();
        for (var i = 1; i <= added; i++)
        {
            buffer.Add(new RawPacket(i, [0xF0]));
        }

        var lines = buffer.Snapshot();
        Assert.Equal(expectedCount, lines.Count);
        if (expectedFirst is { } first)
        {
            Assert.StartsWith($"{first}.000 ", lines[0], StringComparison.Ordinal);
            Assert.StartsWith($"{added}.000 ", lines[^1], StringComparison.Ordinal);
        }
    }

    [Fact]
    public void The_rolling_file_rotates_at_its_limit_and_keeps_the_configured_number_of_files()
    {
        var dir = Directory.CreateTempSubdirectory("wattzup-roll-").FullName;
        try
        {
            var path = Path.Combine(dir, "raw_packets.log");
            using (var file = new RollingFile(path, maxBytes: 40, retainedFiles: 2))
            {
                for (var i = 0; i < 10; i++)
                {
                    file.WriteLine($"line {i} 0123456789");
                }
            }

            var files = Directory.GetFiles(dir).Select(Path.GetFileName).Order().ToList();
            Assert.Equal(["raw_packets.log", "raw_packets.log.1", "raw_packets.log.2"], files);
            Assert.Contains("line 9", File.ReadAllText(path), StringComparison.Ordinal);
            Assert.All(Directory.GetFiles(dir), f => Assert.True(new FileInfo(f).Length <= 40 + 20));
        }
        finally
        {
            Directory.Delete(dir, recursive: true);
        }
    }
}
