using System.Runtime.CompilerServices;

namespace Wattzup.Api.AcceptanceTests;

/// <summary>
/// Process-wide settings for the test hosts, applied before any host is built. Every test starts its own host and
/// the classes run in parallel; with configuration reload on, each host watches the content root for changes to
/// appsettings.json, and dozens of those watchers at once cost more kernel time than the tests themselves. No test
/// changes appsettings.json while a host runs (the class catalogue has its own watcher, L2-077).
/// </summary>
internal static class TestHostDefaults
{
    [ModuleInitializer]
    internal static void Apply() => Environment.SetEnvironmentVariable("DOTNET_hostBuilder__reloadConfigOnChange", "false");
}
