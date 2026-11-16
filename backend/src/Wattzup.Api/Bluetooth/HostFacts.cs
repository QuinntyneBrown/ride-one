using System.Net;

namespace Wattzup.Api.Bluetooth;

/// <summary>The start-up fields of the state: transport, simulated, bind address and exposure (L2-014).</summary>
public sealed record HostFacts(string Transport, bool Simulated, string BindAddress, bool Exposed)
{
    public static HostFacts For(string transport, string urls)
    {
        var first = urls.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)[0];
        var uri = new Uri(first.Replace("://*", "://0.0.0.0", StringComparison.Ordinal).Replace("://+", "://0.0.0.0", StringComparison.Ordinal));
        return new HostFacts(transport, transport == "Simulated", uri.Authority, !IsLoopback(urls));
    }

    /// <summary>True when every configured URL binds a loopback address (L2-034).</summary>
    public static bool IsLoopback(string urls) =>
        urls.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).All(url =>
        {
            var host = new Uri(url.Replace("://*", "://0.0.0.0", StringComparison.Ordinal).Replace("://+", "://0.0.0.0", StringComparison.Ordinal)).Host;
            return string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
                || (IPAddress.TryParse(host.Trim('[', ']'), out var ip) && IPAddress.IsLoopback(ip));
        });
}
