namespace Wattzup.Core.Machines;

/// <summary>RSSI to signal bars (L2-074 criterion 2).</summary>
public static class SignalBars
{
    /// <summary>4 from −60 dBm, 3 from −70, 2 from −80, 1 from −90, else 0 (also for no RSSI).</summary>
    public static int FromRssi(int? rssi) => rssi switch
    {
        >= -60 => 4,
        >= -70 => 3,
        >= -80 => 2,
        >= -90 => 1,
        _ => 0,
    };
}
