using MediatR;

namespace Telo.Ride.Application.Classes;

/// <summary>Lists the class catalogue (L2-080).</summary>
public sealed record GetClassesQuery : IRequest<ClassCatalogueDto>;

public sealed class GetClassesQueryHandler(IClassCatalogue catalogue) : IRequestHandler<GetClassesQuery, ClassCatalogueDto>
{
    public Task<ClassCatalogueDto> Handle(GetClassesQuery request, CancellationToken cancellationToken) =>
        Task.FromResult(new ClassCatalogueDto(
            [.. catalogue.Shelves.Select(shelf => new ShelfDto(shelf.Id, shelf.Title, shelf.Tagline))],
            [.. catalogue.Classes.Select(ClassDto.From)]));
}
