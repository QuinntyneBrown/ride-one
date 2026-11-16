namespace Wattzup.Core.Workouts;

/// <summary>The <c>workout.status</c> strings of the state contract (L2-014).</summary>
public static class WorkoutStatus
{
    public const string WaitingForBike = "waiting for bike";
    public const string StartingBelt = "starting belt";
    public const string Running = "running";
    public const string Paused = "paused";
    public const string PausedBikeDisconnected = "paused: bike disconnected";
    public const string PausedBeltStopped = "paused: belt stopped";
    public const string Ended = "ended";
    public const string EndedBikeShutOff = "ended: bike shut off";
    public const string Stopped = "stopped";

    /// <summary>Every status, in the order the contract lists them.</summary>
    public static IReadOnlyList<string> All { get; } = [WaitingForBike, StartingBelt, Running, Paused, PausedBikeDisconnected, PausedBeltStopped, Ended, EndedBikeShutOff, Stopped];

    /// <summary>Ended, shut off and stopped are terminal; any other status is active.</summary>
    public static bool IsActive(string status) =>
        status is not (Ended or EndedBikeShutOff or Stopped);
}
