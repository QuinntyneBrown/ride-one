namespace Telo.Ride.Domain.Accounts;

/// <summary>
/// A rider's account: created the first time a code for an unknown address is confirmed (L2-001 AC4). It has no password
/// (L2-001 AC6); the display name comes later (L2-005).
/// </summary>
public sealed class Rider
{
    private Rider()
    {
    }

    public Guid Id { get; private set; }

    public string Email { get; private set; } = string.Empty;

    public string? DisplayName { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public static Rider Create(EmailAddress email, DateTimeOffset now) =>
        new() { Id = Guid.NewGuid(), Email = email.Value, CreatedAt = now };
}
