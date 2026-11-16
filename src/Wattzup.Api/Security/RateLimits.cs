using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Wattzup.Api.Security;

/// <summary>The <c>control</c> policy: 20 control requests per window per client (L2-036).</summary>
public static class RateLimits
{
    public const string Control = "control";

    public static IServiceCollection AddWattzupRateLimits(this IServiceCollection services, SecurityOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        services.AddRateLimiter(limiter =>
        {
            limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            limiter.OnRejected = async (context, cancellationToken) =>
            {
                var problem = Endpoints.Problems.WithCode(StatusCodes.Status429TooManyRequests, "rate_limited", "Too many control requests.");
                await problem.ExecuteAsync(context.HttpContext).ConfigureAwait(false);
            };
            limiter.AddPolicy(Control, http => RateLimitPartition.GetFixedWindowLimiter(
                http.Connection.RemoteIpAddress?.ToString() ?? "local",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = options.ControlPermits,
                    Window = options.ControlWindow,
                    QueueLimit = 0,
                }));
        });
        return services;
    }
}
