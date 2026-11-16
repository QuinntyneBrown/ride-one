using Wattzup.Ble.Abstractions;
using Wattzup.Ble.BlueZ;
using Wattzup.Ble.CoreBluetooth;
using Wattzup.Ble.Simulated;

namespace Wattzup.Api.Bluetooth;

/// <summary>Registers exactly one <see cref="IBikeTransport"/> (bluetooth-platform-transports design).</summary>
public static class TransportSelector
{
    public const string Simulated = "Simulated";

    public const string CoreBluetooth = "CoreBluetooth";
    public const string BlueZ = "BlueZ";
    public const string WinRT = "WinRT";

    /// <summary>The transport name for this operating system: CoreBluetooth, BlueZ or WinRT.</summary>
    public static string DefaultForPlatform() =>
        OperatingSystem.IsMacOS() ? "CoreBluetooth" : OperatingSystem.IsLinux() ? "BlueZ" : OperatingSystem.IsWindows() ? "WinRT" : "none";

    public static string Resolve(string? configured) => string.IsNullOrWhiteSpace(configured) ? DefaultForPlatform() : configured;

    public static IServiceCollection AddBikeTransport(this IServiceCollection services, string name)
    {
        if (string.Equals(name, Simulated, StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<SimulationControl>();
            services.AddSingleton<IBikeTransport>(sp => new SimulatedBikeTransport(sp.GetRequiredService<SimulationControl>(), sp.GetRequiredService<TimeProvider>()));
        }
        else if (string.Equals(name, CoreBluetooth, StringComparison.OrdinalIgnoreCase) && OperatingSystem.IsMacOS())
        {
            services.AddSingleton<IBikeTransport>(_ => OperatingSystem.IsMacOS() ? new CoreBluetoothBikeTransport() : throw new PlatformNotSupportedException());
        }
        else if (string.Equals(name, BlueZ, StringComparison.OrdinalIgnoreCase) && OperatingSystem.IsLinux())
        {
            services.AddSingleton<IBikeTransport>(_ => new BlueZBikeTransport());
        }
#if WINDOWS
        else if (string.Equals(name, WinRT, StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IBikeTransport>(_ => new Wattzup.Ble.Windows.WinRtBikeTransport());
        }
#endif
        else
        {
            services.AddSingleton<IBikeTransport>(new UnavailableBikeTransport(name));
        }

        return services;
    }
}
