using System.Text.Json.Serialization;

namespace Wattzup.Core.State;

/// <summary>Where a resistance command came from (L2-048).</summary>
public enum CommandSource
{
    Plan,
    Manual,
}

/// <summary>How far a resistance command got (L2-048).</summary>
public enum CommandStatus
{
    Sending,
    Ack,
    Failed,
}

/// <summary>One entry of <c>commands</c> (L2-048).</summary>
public sealed record CommandEntry(
    double At,
    int? RideSeconds,
    int Level,
    CommandSource Source,
    CommandStatus Status,
    int? AckMs)
{
    /// <summary>When the command was written, in Unix milliseconds, for the acknowledgement latency. Not serialised.</summary>
    [JsonIgnore]
    public long WrittenUnixMs { get; init; }
}
