namespace Telo.Ride.Api.Hosting;

/// <summary>
/// The headers of L2-131 on every response, the app's files and the backend's answers alike (ADR 0026).
/// They are added as the response starts, so an error page the exception handler writes carries them too.
/// </summary>
internal static class SecurityHeaders
{
    /// <summary>
    /// Scripts from the app and the YouTube player; frames only from youtube-nocookie; connections to the
    /// app's own origin (its backend and hub) and Google's Map Tiles API; images from the app, YouTube's
    /// covers and the tiles. The 3D Tiles mesh decoder runs WebAssembly in a <c>blob:</c> worker, and a tile's
    /// embedded textures load through <c>blob:</c> URLs the page makes from bytes it holds, so neither admits a
    /// foreign origin. <c>style-src 'unsafe-inline'</c> stays for Angular's component styles until slice 22.4
    /// gives them a nonce.
    /// </summary>
    public const string ContentSecurityPolicy =
        "default-src 'self'; " +
        "script-src 'self' https://www.youtube.com 'wasm-unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "font-src 'self'; " +
        "img-src 'self' https://i.ytimg.com https://tile.googleapis.com blob:; " +
        "connect-src 'self' https://tile.googleapis.com blob:; " +
        "worker-src 'self' blob:; " +
        "frame-src https://www.youtube-nocookie.com; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'";

    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var headers = context.Response.Headers;
                headers.ContentSecurityPolicy = ContentSecurityPolicy;
                headers.XContentTypeOptions = "nosniff";
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                return Task.CompletedTask;
            });
            await next(context);
        });
}
