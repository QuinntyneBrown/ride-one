namespace Wattzup.Protocol;

/// <summary>Picks an Echelon bike out of a BLE scan (L2-001), never an Echelon treadmill.</summary>
public static class EchelonDeviceFilter
{
    /// <summary>The name prefix of Echelon's Stride treadmills, which share the Echelon service but are not bikes.</summary>
    private const string TreadmillNamePrefix = "STRIDE";

    /// <summary>
    /// True when the name starts with <c>ECH</c> or the services include the Echelon service, ignoring case, and the
    /// name does not start with a treadmill's <c>STRIDE</c>.
    /// </summary>
    public static bool Matches(string? name, IEnumerable<string> serviceUuids)
    {
        ArgumentNullException.ThrowIfNull(serviceUuids);
        var text = name ?? string.Empty;
        if (text.StartsWith(TreadmillNamePrefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return text.StartsWith("ECH", StringComparison.OrdinalIgnoreCase)
            || serviceUuids.Any(u => string.Equals(u, EchelonUuids.Service, StringComparison.OrdinalIgnoreCase));
    }
}
