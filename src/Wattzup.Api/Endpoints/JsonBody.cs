using System.Text.Json;

namespace Wattzup.Api.Endpoints;

/// <summary>Reads a POST body as JSON without model binding, so each endpoint answers malformed input itself (L2-036).</summary>
public static class JsonBody
{
    /// <summary>The body's root element, or null when it is empty or not valid JSON.</summary>
    public static async Task<JsonElement?> ReadAsync(HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        try
        {
            using var document = await JsonDocument.ParseAsync(request.Body, cancellationToken: request.HttpContext.RequestAborted).ConfigureAwait(false);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>True when the request declares a JSON body, or none at all.</summary>
    public static bool IsJsonOrEmpty(HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        return request.ContentLength is 0 || string.IsNullOrEmpty(request.ContentType) || request.HasJsonContentType();
    }
}
