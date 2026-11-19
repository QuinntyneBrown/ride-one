namespace Wattzup.Protocol;

/// <summary>What one decoded notification says (L2-006, L2-007).</summary>
public abstract record TelemetryUpdate;

/// <summary>A <c>0xD2</c> frame: the level the bike reports.</summary>
public sealed record ResistanceUpdate(int Level) : TelemetryUpdate;

/// <summary>A <c>0xD1</c> frame: cadence and the speed derived from it.</summary>
public sealed record CadenceUpdate(int Rpm, double SpeedKmh, double SpeedMph) : TelemetryUpdate;

