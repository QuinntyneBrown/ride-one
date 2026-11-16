using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Wattzup.Core.Security;

namespace Wattzup.Api.Security;

/// <summary>Accepts <c>X-Api-Key</c>, or a single-use <c>?token=</c> on <c>GET /api/events</c> (L2-035).</summary>
public sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IOptions<SecurityOptions> security,
    EventTokenService tokens) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "ApiKey";
    public const string Header = "X-Api-Key";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var key = security.Value.ApiKey;
        if (string.IsNullOrEmpty(key))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        if (Request.Headers.TryGetValue(Header, out var supplied))
        {
            return Task.FromResult(ApiKeys.Matches(key, supplied.ToString()) ? Success("key") : AuthenticateResult.Fail("wrong key"));
        }

        if (HttpMethods.IsGet(Request.Method)
            && Request.Path.Equals("/api/events", StringComparison.Ordinal)
            && Request.Query.TryGetValue("token", out var token))
        {
            return Task.FromResult(tokens.TryConsume(token.ToString()) ? Success("event-token") : AuthenticateResult.Fail("bad token"));
        }

        return Task.FromResult(AuthenticateResult.NoResult());
    }

    private static AuthenticateResult Success(string method) =>
        AuthenticateResult.Success(new AuthenticationTicket(
            new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.AuthenticationMethod, method)], SchemeName)),
            SchemeName));
}

/// <summary>Stops the host before Kestrel binds when it would listen off loopback without an API key (L2-034).</summary>
public sealed partial class BindAddressGuard(IOptions<WattzupOptions> wattzup, IOptions<SecurityOptions> security, ILogger<BindAddressGuard> logger) : IHostedLifecycleService
{
    public Task StartingAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(security.Value.ApiKey) && !Bluetooth.HostFacts.IsLoopback(wattzup.Value.Urls))
        {
            LogRefused(logger);
            throw new InvalidOperationException("Refusing to listen on a non-loopback address without Wattzup:Security:ApiKey.");
        }

        return Task.CompletedTask;
    }

    public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StartedAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StoppingAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StoppedAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    [LoggerMessage(Level = LogLevel.Critical, Message = "Wattzup:Urls is not loopback and no Wattzup:Security:ApiKey is set; refusing to start.")]
    private static partial void LogRefused(ILogger logger);
}
