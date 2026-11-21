using FluentValidation;
using MediatR;

namespace Telo.Ride.Application;

/// <summary>
/// Runs every validator registered for a request before its handler; any failure throws
/// <see cref="RequestValidationException"/> and the handler does not run.
/// </summary>
public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var errors = new List<FieldError>();
        foreach (var validator in validators)
        {
            var result = await validator.ValidateAsync(request, cancellationToken);
            errors.AddRange(result.Errors.Select(failure => new FieldError(ClientName(failure.PropertyName), failure.ErrorMessage)));
        }

        return errors.Count == 0 ? await next(cancellationToken) : throw new RequestValidationException(errors);
    }

    // The client sends camelCase JSON, so a field is named as it sent it: PowerWatts → powerWatts.
    private static string ClientName(string property) =>
        property.Length == 0 ? property : string.Concat(char.ToLowerInvariant(property[0]).ToString(), property.AsSpan(1));
}
