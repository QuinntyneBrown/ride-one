using System.Text.Json;
using System.Text.Json.Serialization;

namespace Wattzup.Core.State;

/// <summary>The state contract's JSON shape: snake_case names, nulls written, enums as snake_case strings, numbers
/// only as JSON numbers (L2-014).</summary>
public static class WattzupJson
{
    public static JsonSerializerOptions Options { get; } = Configure(new JsonSerializerOptions());

    public static JsonSerializerOptions Indented { get; } = new(Options) { WriteIndented = true };

    public static JsonSerializerOptions Configure(JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        options.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
        options.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
        options.NumberHandling = JsonNumberHandling.Strict;
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower));
        return options;
    }
}
