using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Net.Http.Headers;

namespace Telo.Ride.Api.Hosting;

/// <summary>
/// Serves the production build of the ride app from <c>wwwroot</c> (ADR 0026, L2-149 AC1): its files without
/// a session, <c>index.html</c> for every other address that is not the backend's, and never a stale
/// <c>index.html</c>. Under <c>/api</c>, <c>/hubs</c> and <c>/health</c> an unknown address stays the backend's.
/// </summary>
internal static class AppHosting
{
    private const string Shell = "index.html";
    private static readonly string[] BackendPaths = ["api", "hubs", "health"];

    /// <summary>Marks the app's shell as never cached; options a host or test adds (its file provider) stay.</summary>
    public static IServiceCollection AddAppHosting(this IServiceCollection services) =>
        services.Configure<StaticFileOptions>(options =>
        {
            options.ContentTypeProvider = new FileExtensionContentTypeProvider();
            options.OnPrepareResponse = context =>
            {
                if (context.File.Name == Shell)
                {
                    context.Context.Response.Headers.CacheControl = "no-cache";
                }
            };
        });

    /// <summary>The fallbacks: the app's shell for its routes, ProblemDetails for an unknown backend address.</summary>
    public static void MapApp(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapFallbackToFile(Shell).AllowAnonymous();
        foreach (var path in BackendPaths)
        {
            // Needs a session like every endpoint, so without one the answer is 401; with one, 404.
            endpoints.MapFallback($"{path}/{{**rest}}", () => Results.Problem(
                title: "Not found.",
                statusCode: StatusCodes.Status404NotFound,
                extensions: new Dictionary<string, object?> { ["code"] = "not_found" }));
        }
    }
}
