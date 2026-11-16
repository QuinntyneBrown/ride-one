namespace Wattzup.Protocol;

/// <summary>Picks an Echelon bike out of a BLE scan (L2-001).</summary>
public static class EchelonDeviceFilter
{
    /// <summary>True when the name starts with <c>ECH</c> or the services include the Echelon service, ignoring case.</summary>
    public static bool Matches(string? name, IEnumerable<string> serviceUuids)
    {
        ArgumentNullException.ThrowIfNull(serviceUuids);
        return (name ?? string.Empty).StartsWith("ECH", StringComparison.OrdinalIgnoreCase)
            || serviceUuids.Any(u => string.Equals(u, EchelonUuids.Service, StringComparison.OrdinalIgnoreCase));
    }
}
