using System.Text.Json.Serialization;

namespace Wattzup.Core.State;

/// <summary>Where a resistance command came from (L2-048).</summary>
public enum CommandSource
{
    Plan,
    Manual,
}

/// <summary>What a command sets (L2-048, L2-065).</summary>
public enum CommandKind
{
    Resistance,
    Speed,
    Incline,
}

/// <summary>How far a command got (L2-048).</summary>
public enum CommandStatus
{
    Sending,
    Ack,
    Failed,
}

/// <summary>
/// One entry of <c>commands</c> (L2-048, L2-065). <see cref="Level"/> is the resistance level, null for a speed or
/// incline; <see cref="Value"/> is the requested value of any kind.
/// </summary>
public sealed record CommandEntry(
    double At,
    int? RideSeconds,
    int? Level,
    CommandSource Source,
    CommandStatus Status,
    int? AckMs,
    CommandKind Command,
    double Value)
{
    /// <summary>A resistance entry, as the bike logs it (L2-048).</summary>
    public static CommandEntry ForResistance(double at, int? rideSeconds, int level, CommandSource source, CommandStatus status, int? ackMs) =>
        new(at, rideSeconds, level, source, status, ackMs, CommandKind.Resistance, level);

    /// <summary>When the command was written, in Unix milliseconds, for the acknowledgement latency. Not serialised.</summary>
    [JsonIgnore]
    public long WrittenUnixMs { get; init; }
}
