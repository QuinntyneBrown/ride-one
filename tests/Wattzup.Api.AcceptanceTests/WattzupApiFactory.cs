using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Time.Testing;

namespace Wattzup.Api.AcceptanceTests;

/// <summary>
/// The API host under test, in memory, on a <see cref="FakeTimeProvider"/>, writing its files to a per-test
/// temporary directory. Extra settings override the defaults, e.g. <c>Wattzup:Security:ApiKey</c>.
/// </summary>
public sealed class WattzupApiFactory(IDictionary<string, string?>? settings = null) : WebApplicationFactory<Program>
{
    public FakeTimeProvider Time { get; } = new(DateTimeOffset.FromUnixTimeSeconds(1_794_784_639));

    public string Directory { get; } = System.IO.Directory.CreateTempSubdirectory("wattzup-tests-").FullName;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Wattzup:RawPacketLog:Path", Path.Combine(Directory, "raw_packets.log"));
        builder.UseSetting("Wattzup:StatusSnapshot:Path", Path.Combine(Directory, "status.json"));
        foreach (var (key, value) in settings ?? new Dictionary<string, string?>())
        {
            builder.UseSetting(key, value);
        }

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(Time);
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
