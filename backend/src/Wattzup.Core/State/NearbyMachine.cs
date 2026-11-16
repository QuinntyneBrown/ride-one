namespace Wattzup.Core.State;

/// <summary>
/// One Echelon machine heard advertising (L2-074, L2-014): its advertised name, the label to show, its RSSI in dBm,
/// 0 to 4 signal bars and when it was last heard, in Unix seconds.
/// </summary>
public sealed record NearbyMachine(Machine Machine, string? Name, string Label, int? Rssi, int Signal, double SeenAt);
