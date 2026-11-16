using Wattzup.Api.Security;

namespace Wattzup.Api.Endpoints;

/// <summary>
/// Requests that matched no endpoint: an <c>/api</c> path is a 404 ProblemDetails, and any other GET without a file
/// extension gets the Angular shell with a per-response style nonce (L2-036, L2-044). It is middleware, not a fallback
/// endpoint, so routing keeps its own 405 and 415 answers for known endpoints.
/// </summary>
public static class AppShell
{
    public static IApplicationBuilder UseAppShell(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            if (context.GetEndpoint() is not null)
            {
                await next(context).ConfigureAwait(false);
                return;
            }

            var path = context.Request.Path;
            if (path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
            {
                await Problems.WithCode(StatusCodes.Status404NotFound, "not_found", "No such endpoint.").ExecuteAsync(context).ConfigureAwait(false);
                return;
            }

            if ((HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method))
                && !Path.HasExtension(path.Value)
                && !path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase)
                && !path.StartsWithSegments("/openapi", StringComparison.OrdinalIgnoreCase))
            {
                await (await ServeAsync(context).ConfigureAwait(false)).ExecuteAsync(context).ConfigureAwait(false);
                return;
            }

            await next(context).ConfigureAwait(false);
        });

    private static async Task<IResult> ServeAsync(HttpContext context)
    {
        var environment = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var file = environment.WebRootFileProvider.GetFileInfo("index.html");
        if (!file.Exists)
        {
            return Problems.WithCode(StatusCodes.Status404NotFound, "not_found", "The dashboard is not built.");
        }

        string html;
        await using (var stream = file.CreateReadStream())
        using (var reader = new StreamReader(stream))
        {
            html = await reader.ReadToEndAsync(context.RequestAborted).ConfigureAwait(false);
        }

        var nonce = SecurityHeadersMiddleware.NonceFor(context);
        html = html.Replace("<wz-root", $"<wz-root ngCspNonce=\"{nonce}\"", StringComparison.Ordinal);
        context.Response.Headers.CacheControl = "no-cache";
        return TypedResults.Content(html, "text/html; charset=utf-8");
    }
}
