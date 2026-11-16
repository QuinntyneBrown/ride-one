using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using Wattzup.Api.Endpoints;
using Wattzup.Core.Workouts;

namespace Wattzup.Api.OpenApi;

/// <summary>
/// Makes /openapi/v1.json state the contract exactly, so the generated frontend types need no hand-written
/// additions (L2-014, L2-052):
/// every property of a Wattzup type is required (nulls are always written); <c>WorkoutSnapshot.status</c> is an enum
/// of its strings; a trace sample is a pair; problems carry the <c>code</c> and <c>error</c> extensions.
/// </summary>
public sealed class ContractSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(OpenApiSchema schema, OpenApiSchemaTransformerContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(schema);
        ArgumentNullException.ThrowIfNull(context);
        var type = context.JsonTypeInfo.Type;
        if (type.Namespace?.StartsWith("Wattzup", StringComparison.Ordinal) == true && schema.Properties is { Count: > 0 } properties)
        {
            schema.Required ??= new HashSet<string>(StringComparer.Ordinal);
            foreach (var name in properties.Keys)
            {
                schema.Required.Add(name);
            }
        }

        if (type == typeof(WorkoutSnapshot) && Property(schema, "status") is OpenApiSchema status)
        {
            status.Enum = [.. WorkoutStatus.All.Select(s => (JsonNode)JsonValue.Create(s))];
        }

        if (type == typeof(PowerTrace) && Property(schema, "samples") is OpenApiSchema { Items: OpenApiSchema pair })
        {
            pair.MinItems = 2;
            pair.MaxItems = 2;
        }

        if (type == typeof(ProblemDetails) || type == typeof(HttpValidationProblemDetails))
        {
            schema.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);
            schema.Properties["code"] = new OpenApiSchema
            {
                Type = JsonSchemaType.String | JsonSchemaType.Null,
                Description = "What a client branches on, e.g. bike_not_connected, invalid_workout, rate_limited.",
            };
            schema.Properties["error"] = new OpenApiSchema
            {
                Type = JsonSchemaType.String | JsonSchemaType.Null,
                Description = "The rider-facing message, where the prototype returned one.",
            };
        }

        return Task.CompletedTask;
    }

    private static IOpenApiSchema? Property(OpenApiSchema schema, string name) =>
        schema.Properties is { } properties && properties.TryGetValue(name, out var property) ? property : null;
}
