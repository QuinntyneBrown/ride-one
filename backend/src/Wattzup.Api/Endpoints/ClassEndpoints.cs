using Wattzup.Core.Classes;
using Wattzup.Core.Workouts;

namespace Wattzup.Api.Endpoints;

/// <summary>The shelf a class is filed on.</summary>
public sealed record ShelfRef(string Id, string Title, string Tagline);

/// <summary>A class as served: its text, its shelf and the accepted plan as <c>workout.plan</c> carries it (L2-078).</summary>
public sealed record ClassResponse(string Id, string Title, string Channel, string Focus, string Description, ShelfRef Shelf, WorkoutPlan Plan);

/// <summary>A shelf with its classes, in file order.</summary>
public sealed record ClassShelfResponse(string Id, string Title, string Tagline, IReadOnlyList<ClassResponse> Classes);

/// <summary>The answer of <c>GET /api/classes</c>: every shelf that has a class.</summary>
public sealed record ClassCatalogueResponse(IReadOnlyList<ClassShelfResponse> Shelves);

/// <summary><c>GET /api/classes</c> and <c>GET /api/classes/{id}</c>: the catalogue, read-only (L2-078, ADR 0014).</summary>
public static class ClassEndpoints
{
    public static RouteGroupBuilder MapClassEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/classes", (ClassCatalogueStore store) => TypedResults.Ok(ToResponse(store.Current)))
            .WithName("ListClasses")
            .WithSummary("The class catalogue: every shelf that has a class, with its classes, in file order.")
            .Produces<ClassCatalogueResponse>();
        return api;
    }

    private static ClassCatalogueResponse ToResponse(ClassCatalogue catalogue) =>
        new([.. catalogue.Shelves
            .Select(shelf => new ClassShelfResponse(shelf.Id, shelf.Title, shelf.Tagline, [.. catalogue.ClassesOn(shelf.Id).Select(c => ToResponse(c, shelf))]))
            .Where(shelf => shelf.Classes.Count > 0)]);

    private static ClassResponse ToResponse(ClassEntry entry, Shelf shelf) =>
        new(entry.Id, entry.Title, entry.Channel, entry.Focus, entry.Description, new ShelfRef(shelf.Id, shelf.Title, shelf.Tagline), entry.Plan);
}
