namespace Wattzup.Core.State;

/// <summary>The configured display name of each machine; empty or null shows the advertised name (L2-014).</summary>
public sealed record DisplayNames(string? Bike = null, string? Treadmill = null)
{
    public string? For(Machine machine) => machine == Machine.Treadmill ? Treadmill : Bike;
}
