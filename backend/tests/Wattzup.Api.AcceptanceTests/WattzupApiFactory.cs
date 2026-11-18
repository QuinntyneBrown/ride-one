using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using Wattzup.Ble.Simulated;

namespace Wattzup.Api.AcceptanceTests;

/// <summary>
/// The API host under test, in memory, on a <see cref="FakeTimeProvider"/>, writing its files to a per-test
/// temporary directory. Extra settings override the defaults, e.g. <c>Wattzup:Security:ApiKey</c>.
/// </summary>
public sealed class WattzupApiFactory(IDictionary<string, string?>? settings = null) : WebApplicationFactory<Program>
{
    public FakeTimeProvider Time { get; } = new(DateTimeOffset.FromUnixTimeSeconds(1_794_784_639));

    /// <summary>The simulated bike; set its knobs before the first request to shape start-up.</summary>
    public SimulationControl Simulation { get; } = new();

    /// <summary>Every log entry the host wrote.</summary>
    public CapturingLoggerProvider Logs { get; } = new();

    /// <summary>When true, the Bluetooth loop does not run, so the state stays as it was at start-up.</summary>
    public bool WithoutBluetooth { get; init; }

    public string Directory { get; } = System.IO.Directory.CreateTempSubdirectory("wattzup-tests-").FullName;

    /// <summary>The sessions file, in <see cref="Directory"/> unless a setting names another (L2-082 criterion 8).</summary>
    public string SessionsPath => Path.Combine(Directory, "sessions.json");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Wattzup:Ble:Transport", "Simulated");
        builder.UseSetting("Wattzup:RawPacketLog:Path", Path.Combine(Directory, "raw_packets.log"));
        builder.UseSetting("Wattzup:StatusSnapshot:Path", Path.Combine(Directory, "status.json"));
        builder.UseSetting("Wattzup:Sessions:Path", SessionsPath);
        foreach (var (key, value) in settings ?? new Dictionary<string, string?>())
        {
            builder.UseSetting(key, value);
        }

        builder.ConfigureLogging(logging => logging.AddProvider(Logs));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(Time);
            services.RemoveAll<SimulationControl>();
            services.AddSingleton(Simulation);
            if (WithoutBluetooth)
            {
                var loop = services.Single(d => d.ServiceType == typeof(Microsoft.Extensions.Hosting.IHostedService)
                    && d.ImplementationFactory?.Method.ReturnType == typeof(Wattzup.Api.Bluetooth.BikeConnectionService));
                services.Remove(loop);
            }
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            try
            {
                System.IO.Directory.Delete(Directory, recursive: true);
            }
            catch (IOException)
            {
            }
        }
    }
}
