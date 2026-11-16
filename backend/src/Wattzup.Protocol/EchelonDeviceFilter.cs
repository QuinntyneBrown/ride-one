namespace Wattzup.Protocol;

/// <summary>Picks an Echelon bike out of a BLE scan (L2-001), never the treadmill (L2-063).</summary>
public static class EchelonDeviceFilter
{
    /// <summary>
    /// True when the name starts with <c>ECH</c> or the services include the Echelon service, ignoring case, and the
    /// name does not start with the treadmill's <c>STRIDE</c>.
    /// </summary>
    public static bool Matches(string? name, IEnumerable<string> serviceUuids)
    {
        ArgumentNullException.ThrowIfNull(serviceUuids);
        var text = name ?? string.Empty;
        if (text.StartsWith(EchelonTreadmillFilter.NamePrefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return text.StartsWith("ECH", StringComparison.OrdinalIgnoreCase)
            || serviceUuids.Any(u => string.Equals(u, EchelonUuids.Service, StringComparison.OrdinalIgnoreCase));
    }
}

/// <summary>Picks an Echelon treadmill out of a BLE scan, never the bike (L2-063).</summary>
public static class EchelonTreadmillFilter
{
    public const string NamePrefix = "STRIDE";

    /// <summary>
    /// True when the name starts with <c>STRIDE</c>, or the services include the treadmill's advertised service and
    /// the name does not start with the bike's <c>ECH</c>, ignoring case.
    /// </summary>
    public static bool Matches(string? name, IEnumerable<string> serviceUuids)
    {
        ArgumentNullException.ThrowIfNull(serviceUuids);
        var text = name ?? string.Empty;
        if (text.StartsWith(NamePrefix, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return !text.StartsWith("ECH", StringComparison.OrdinalIgnoreCase)
            && serviceUuids.Any(u => string.Equals(u, EchelonUuids.TreadmillAdvertisedService, StringComparison.OrdinalIgnoreCase));
    }
}
