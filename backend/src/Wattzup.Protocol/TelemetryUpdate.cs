namespace Wattzup.Protocol;

/// <summary>What one decoded notification says (L2-006, L2-007).</summary>
public abstract record TelemetryUpdate;

/// <summary>A <c>0xD2</c> frame: the level the bike reports.</summary>
public sealed record ResistanceUpdate(int Level) : TelemetryUpdate;

/// <summary>A <c>0xD1</c> frame: cadence and the speed derived from it.</summary>
public sealed record CadenceUpdate(int Rpm, double SpeedKmh, double SpeedMph) : TelemetryUpdate;

/// <summary>A treadmill <c>0xD3</c> frame: the belt's speed (L2-064).</summary>
public sealed record SpeedUpdate(double Kmh, double Mph) : TelemetryUpdate;

/// <summary>A treadmill <c>0xD2</c> frame: the incline in whole percent (L2-064).</summary>
public sealed record InclineUpdate(int Percent) : TelemetryUpdate;
