namespace Wattzup.Core.Workouts;

/// <summary>The class a ride was started from: its id and title, kept for the session (L2-081 criterion 7).</summary>
public sealed record RideOrigin(string ClassId, string Title);
