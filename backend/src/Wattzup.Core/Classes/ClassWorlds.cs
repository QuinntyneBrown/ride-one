namespace Wattzup.Core.Classes;

/// <summary>
/// The ids of the six scenes built into the frontend, in the order of L2-089. The backend knows only the ids, so it can
/// leave out a class that names an unknown scene (L2-088); a scene's look and road live in the frontend.
/// </summary>
public static class ClassWorlds
{
    public static IReadOnlyList<string> Ids { get; } = ["docklands", "granite", "oldtown", "prairie", "dolomites", "coast"];

    public static bool IsWorld(string? id) => id is not null && Ids.Contains(id, StringComparer.Ordinal);
}
