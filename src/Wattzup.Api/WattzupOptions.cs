namespace Wattzup.Api;

/// <summary>Settings bound from the <c>Wattzup</c> section (appsettings, WATTZUP__*, command line).</summary>
public sealed class WattzupOptions
{
    public const string SectionName = "Wattzup";

    /// <summary>Where Kestrel listens. Loopback only by default (L2-034).</summary>
    public string Urls { get; set; } = "http://127.0.0.1:8787";
}
