using System.Text.Json;
using Wattzup.Core.State;
using Wattzup.Core.Workouts;

namespace Wattzup.Core.Classes;

/// <summary>Reads a class catalogue file and applies the rules of L2-077.</summary>
public static class ClassCatalogueReader
{
    public const long MaxBytes = 1024 * 1024;

    public static CatalogueLoadResult Read(Stream file, long length)
    {
        ArgumentNullException.ThrowIfNull(file);
        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(file);
        }
        catch (JsonException)
        {
            return new CatalogueLoadResult(null, [], "not valid JSON");
        }

        using (document)
        {
            var problems = new List<CatalogueEntryProblem>();
            var root = document.RootElement;
            var shelves = new List<Shelf>();
            foreach (var shelf in Array(root, "shelves"))
            {
                shelves.Add(new Shelf(Text(shelf, "id"), Text(shelf, "title"), Text(shelf, "tagline")));
            }

            var classes = new List<ClassEntry>();
            var index = 0;
            foreach (var entry in Array(root, "classes"))
            {
                var name = Text(entry, "id") is { Length: > 0 } id ? id : $"classes[{index}]";
                index++;
                var plan = entry.TryGetProperty("plan", out var body) ? WorkoutPlanValidator.Validate(body, Machine.Bike) : null;
                if (plan?.Plan is null)
                {
                    problems.Add(new CatalogueEntryProblem(name, "plan", "The plan is not a valid bike plan."));
                    continue;
                }

                classes.Add(new ClassEntry(name, Text(entry, "title"), Text(entry, "channel"), Text(entry, "focus"), Text(entry, "description"), Text(entry, "shelf"), plan.Plan));
            }

            return new CatalogueLoadResult(new ClassCatalogue(shelves, classes), problems, null);
        }
    }

    private static List<JsonElement> Array(JsonElement root, string name) =>
        root.ValueKind == JsonValueKind.Object && root.TryGetProperty(name, out var array) && array.ValueKind == JsonValueKind.Array
            ? [.. array.EnumerateArray()]
            : [];

    private static string Text(JsonElement entry, string name) =>
        entry.ValueKind == JsonValueKind.Object && entry.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() ?? string.Empty
            : string.Empty;
}
