using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Wattzup.Api.OpenApi;

/// <summary>
/// Every property of a Wattzup contract type is always written (nulls included, L2-014), so the document marks each
/// one required; nullability comes from the type. The generated frontend types then need no optional fields.
/// </summary>
public sealed class ContractSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(OpenApiSchema schema, OpenApiSchemaTransformerContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(schema);
        ArgumentNullException.ThrowIfNull(context);
        if (context.JsonTypeInfo.Type.Namespace?.StartsWith("Wattzup", StringComparison.Ordinal) == true && schema.Properties is { Count: > 0 } properties)
        {
            schema.Required ??= new HashSet<string>(StringComparer.Ordinal);
            foreach (var name in properties.Keys)
            {
                schema.Required.Add(name);
            }
        }

        return Task.CompletedTask;
    }
}
