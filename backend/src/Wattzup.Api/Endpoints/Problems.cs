namespace Wattzup.Api.Endpoints;

/// <summary>ProblemDetails bodies with a generic title and the <c>code</c> a client branches on (L2-036).</summary>
public static class Problems
{
    public static IResult WithCode(int status, string code, string title, IDictionary<string, object?>? extra = null)
    {
        var extensions = new Dictionary<string, object?>(StringComparer.Ordinal) { ["code"] = code };
        foreach (var (key, value) in extra ?? new Dictionary<string, object?>())
        {
            extensions[key] = value;
        }

        return TypedResults.Problem(statusCode: status, title: title, extensions: extensions);
    }
}
