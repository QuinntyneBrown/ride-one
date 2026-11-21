namespace Telo.Ride.Domain.Accounts;

/// <summary>
/// One six-digit code sent to an email address, kept only as a keyed hash (L2-132). It works for 10 minutes and once;
/// a newer code for the same address supersedes it (L2-003 AC2). The network it was asked from is kept as a keyed hash
/// too, so the per-network limit can be counted without storing the address (L2-003 AC5).
/// </summary>
public sealed class SignInCode
{
    /// <summary>The least time between two codes for one address (L2-003 AC1).</summary>
    public static readonly TimeSpan ResendGap = TimeSpan.FromSeconds(30);

    private SignInCode()
    {
    }

    public Guid Id { get; private set; }

    public string Email { get; private set; } = string.Empty;

    public string CodeHash { get; private set; } = string.Empty;

    public string NetworkHash { get; private set; } = string.Empty;

    public DateTimeOffset IssuedAt { get; private set; }

    public DateTimeOffset? SupersededAt { get; private set; }

    public static SignInCode Issue(EmailAddress email, string codeHash, string networkHash, DateTimeOffset now) =>
        new() { Id = Guid.NewGuid(), Email = email.Value, CodeHash = codeHash, NetworkHash = networkHash, IssuedAt = now };

    /// <summary>How long until another code may be sent after this one, or zero.</summary>
    public TimeSpan ResendWait(DateTimeOffset now) =>
        IssuedAt + ResendGap > now ? IssuedAt + ResendGap - now : TimeSpan.Zero;

    public void Supersede(DateTimeOffset now) => SupersededAt ??= now;
}
