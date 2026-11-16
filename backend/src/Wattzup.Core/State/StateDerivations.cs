namespace Wattzup.Core.State;

/// <summary>Fields derived on every update: <c>device_label</c> and displayed time (L2-014, L2-032).</summary>
public static class StateDerivations
{
    public const double LiveDataWindowSeconds = 5;

    public static BikeState Apply(BikeState next, double now, DisplayNames? names)
    {
        ArgumentNullException.ThrowIfNull(next);
        var displayName = names?.For(next.Machine);
        var label = next.Device is null ? null : string.IsNullOrWhiteSpace(displayName) ? next.Device : displayName;

        var live = next.UiClients > 0 && next.LastDataAt is { } last && now - last <= LiveDataWindowSeconds;
        if (!live)
        {
            return next with { DeviceLabel = label, DisplayedSince = null };
        }

        var since = next.DisplayedSince ?? now;
        return next with
        {
            DeviceLabel = label,
            DisplayedSince = since,
            DisplayedSeconds = Math.Round(now - since, 1, MidpointRounding.ToEven),
        };
    }
}
