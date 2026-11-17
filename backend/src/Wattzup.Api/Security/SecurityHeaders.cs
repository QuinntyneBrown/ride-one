using System.Security.Cryptography;

namespace Wattzup.Api.Security;

/// <summary>nosniff, no-referrer and a same-origin CSP on every response; the app shell adds a style nonce (L2-036).</summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    private const string NonceKey = "wattzup.csp-nonce";

    /// <summary>A fresh nonce for this response, also placed in its <c>style-src</c>.</summary>
    public static string NonceFor(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        if (context.Items[NonceKey] is not string nonce)
        {
            nonce = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
            context.Items[NonceKey] = nonce;
        }

        return nonce;
    }

    public const string YouTubeScriptOrigin = "https://www.youtube.com";
    public const string YouTubePlayerOrigin = "https://www.youtube-nocookie.com";

    public Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            var style = context.Items[NonceKey] is string nonce ? $"'self' 'nonce-{nonce}'" : "'self'";
            headers.XContentTypeOptions = "nosniff";
            headers["Referrer-Policy"] = "no-referrer";
            // The YouTube player is the one third-party origin: its iframe and its IFrame player API script, for the
            // ride-along video. Connections, styles, fonts and images stay same-origin (L2-036 criterion 4, ADR 0012).
            headers.ContentSecurityPolicy =
                $"default-src 'self'; script-src 'self' {YouTubeScriptOrigin}; style-src {style}; font-src 'self'; connect-src 'self'; img-src 'self' data:; frame-src {YouTubePlayerOrigin}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
            return Task.CompletedTask;
        });
        return next(context);
    }
}

/// <summary>Answers 413 for a body over the limit, whatever the server (L2-036).</summary>
public sealed class BodySizeLimitMiddleware(RequestDelegate next)
{
    public const long Limit = 16 * 1024;

    public Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        if (context.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpMaxRequestBodySizeFeature>() is { IsReadOnly: false } feature)
        {
            feature.MaxRequestBodySize = Limit;
        }

        if (context.Request.ContentLength > Limit)
        {
            return Endpoints.Problems.WithCode(StatusCodes.Status413PayloadTooLarge, "body_too_large", "The request body is too large.").ExecuteAsync(context);
        }

        return next(context);
    }
}
