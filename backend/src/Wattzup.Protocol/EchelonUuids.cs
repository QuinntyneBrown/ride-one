namespace Wattzup.Protocol;

/// <summary>The Echelon GATT identifiers (L2 protocol constants, L2-063).</summary>
public static class EchelonUuids
{
    public const string Service = "0bf669f1-45f2-11e7-9598-0800200c9a66";
    public const string WriteCharacteristic = "0bf669f2-45f2-11e7-9598-0800200c9a66";
    public const string NotifyCharacteristic = "0bf669f4-45f2-11e7-9598-0800200c9a66";

    /// <summary>The treadmill's second notify characteristic (L2-063).</summary>
    public const string TreadmillNotifyCharacteristic = "0bf669f3-45f2-11e7-9598-0800200c9a66";

    /// <summary>The service the treadmill advertises; its Echelon service is <see cref="Service"/> (L2-063).</summary>
    public const string TreadmillAdvertisedService = "0bf669f0-45f2-11e7-9598-0800200c9a66";

    /// <summary>The first 8 hex digits of the service UUID, shown as <c>connection_id</c> (L2-014).</summary>
    public const string ConnectionId = "0bf669f1";

    /// <summary>The bike's notify characteristics (L2-002).</summary>
    public static IReadOnlyList<string> BikeNotifyCharacteristics { get; } = [NotifyCharacteristic];

    /// <summary>The treadmill's notify characteristics, both subscribed (L2-063).</summary>
    public static IReadOnlyList<string> TreadmillNotifyCharacteristics { get; } = [NotifyCharacteristic, TreadmillNotifyCharacteristic];
}
