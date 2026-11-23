using MediatR;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Application.Classes;

namespace Telo.Ride.Api.Classes;

/// <summary>
/// The class catalogue, read-only and public (ADR 0028): it holds nothing personal, and Telo Ride 1 has no account
/// to ask for (ADR 0039). Each action sends one MediatR request.
/// </summary>
[ApiController]
[Route("api/classes")]
public sealed class ClassesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public Task<ClassCatalogueDto> List(CancellationToken cancellationToken) =>
        sender.Send(new GetClassesQuery(), cancellationToken);

    [HttpGet("{id}")]
    public Task<ClassDto> Get(string id, CancellationToken cancellationToken) =>
        sender.Send(new GetClassQuery(id), cancellationToken);
}
