namespace Telo.Ride.Domain.Accounts;

/// <summary>
/// A rider's account: created the first time a code for an unknown address is confirmed (L2-001 AC4). It has no password
/// (L2-001 AC6); the display name comes later (L2-005). A deleted account keeps neither email nor name, and is erased
/// within 30 days (L2-006).
/// </summary>
public sealed class Rider
{
    private Rider()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>The address it signs in with; <c>null</c> once the account is deleted, so the address is free again.</summary>
    public string? Email { get; private set; }

    public string? DisplayName { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    /// <summary>When the rider deleted the account; it is erased within 30 days of it (L2-006 AC3).</summary>
    public DateTimeOffset? DeletionRequestedAt { get; private set; }

    public static Rider Create(EmailAddress email, DateTimeOffset now) =>
        new() { Id = Guid.NewGuid(), Email = email.Value, CreatedAt = now };

    /// <summary>Sets the name other riders see (L2-005).</summary>
    public void Rename(DisplayName name) => DisplayName = name.Value;

    /// <summary>
    /// Deletes the account (L2-006 AC3): the email and the display name go at once, so a later sign-in with the same
    /// address makes a new, empty account (AC4). The rest goes when the account is erased.
    /// </summary>
    public void RequestDeletion(DateTimeOffset now)
    {
        Email = null;
        DisplayName = null;
        DeletionRequestedAt ??= now;
    }
}
