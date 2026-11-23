using FluentValidation;

namespace Telo.Ride.Application;

/// <summary>
/// The shapes the request validators share (L2-129 AC1): a catalogue id. A value that breaks one is
/// refused before its handler runs, naming its field.
/// </summary>
public static class InputRules
{
    /// <summary>A class id as the catalogue writes it, such as <c>hiit-cardio-30</c>: 1 to 64 of a-z, 0-9 and -.</summary>
    public static IRuleBuilderOptions<T, string?> CatalogueId<T>(this IRuleBuilder<T, string?> rule) =>
        rule.NotEmpty().MaximumLength(64).Matches("^[a-z0-9-]+$")
            .WithMessage("An id of lowercase letters, digits and hyphens.");
}
