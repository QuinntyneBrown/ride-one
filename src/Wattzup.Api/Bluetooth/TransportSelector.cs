using Wattzup.Ble.Abstractions;
using Wattzup.Ble.Simulated;

namespace Wattzup.Api.Bluetooth;

/// <summary>Registers exactly one <see cref="IBikeTransport"/> (bluetooth-platform-transports design).</summary>
public static class TransportSelector
{
    public const string Simulated = "Simulated";

    /// <summary>Platform transports contributed by the host, keyed by name, e.g. <c>CoreBluetooth</c> from Wattzup.Mac.</summary>
    private static readonly Dictionary<string, Func<IServiceProvider, IBikeTransport>> Platform = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Lets a host (Wattzup.Mac) or a referenced transport project contribute a platform transport.</summary>
    public static void Contribute(string name, Func<IServiceProvider, IBikeTransport> factory) => Platform[name] = factory;

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
        else if (Platform.TryGetValue(name, out var factory))
        {
            services.AddSingleton(factory);
        }
        else
        {
            services.AddSingleton<IBikeTransport>(new UnavailableBikeTransport(name));
        }

        return services;
    }
}
