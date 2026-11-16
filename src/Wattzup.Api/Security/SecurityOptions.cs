namespace Wattzup.Api.Security;

/// <summary><c>Wattzup:Security</c> (L2-034 to L2-036).</summary>
public sealed class SecurityOptions
{
    public const string SectionName = "Wattzup:Security";

    /// <summary>When set, every <c>/api/*</c> request needs it as <c>X-Api-Key</c>; required off loopback.</summary>
    public string? ApiKey { get; set; }

    public int ControlPermits { get; set; } = 20;

    public TimeSpan ControlWindow { get; set; } = TimeSpan.FromSeconds(1);
}
