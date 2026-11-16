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

/// <summary>One entry of the command log in <c>commands</c> (L2-048).</summary>
public sealed record ResistanceCommand(
    double At,
    int? RideSeconds,
    int Level,
    CommandSource Source,
    CommandStatus Status,
    int? AckMs);
