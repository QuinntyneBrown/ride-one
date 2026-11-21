using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Telo.Ride.Api.Authentication;

internal static class AuthenticationSetup
{
    /// <summary>
    /// Cookie authentication and a fallback policy requiring a signed-in rider on every endpoint
    /// that declares no policy of its own (L2-127 AC1). An API never redirects to a sign-in page:
    /// a request without a session gets 401 and one without permission 403, each as ProblemDetails.
    /// </summary>
    public static IServiceCollection AddTeloRideAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Events.OnRedirectToLogin = context =>
                    Refuse(context.HttpContext, StatusCodes.Status401Unauthorized, "Sign in to continue.", "unauthenticated");
                options.Events.OnRedirectToAccessDenied = context =>
                    Refuse(context.HttpContext, StatusCodes.Status403Forbidden, "This is not yours to see.", "forbidden");
            });
        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
        return services;
    }

    private static async Task Refuse(HttpContext http, int status, string title, string code)
    {
        http.Response.StatusCode = status;
        var problem = new ProblemDetails { Status = status, Title = title, Extensions = { ["code"] = code } };
        await http.RequestServices.GetRequiredService<IProblemDetailsService>()
            .WriteAsync(new ProblemDetailsContext { HttpContext = http, ProblemDetails = problem });
    }
}
