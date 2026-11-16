using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace Wattzup.Core.Security;

/// <summary>Single-use, 60-second tokens that open the event stream when an API key is set (L2-035).</summary>
public sealed class EventTokenService(TimeProvider time)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromSeconds(60);

    private readonly ConcurrentDictionary<string, DateTimeOffset> _tokens = new(StringComparer.Ordinal);

    public string Issue()
    {
        var now = time.GetUtcNow();
        foreach (var (token, expires) in _tokens)
        {
            if (expires <= now)
            {
                _tokens.TryRemove(token, out _);
            }
        }

        var issued = Base64Url(RandomNumberGenerator.GetBytes(32));
        _tokens[issued] = now + Lifetime;
        return issued;
    }

    /// <summary>True once for an unexpired token; the token is spent either way.</summary>
    public bool TryConsume(string? token) =>
        token is not null && _tokens.TryRemove(token, out var expires) && expires > time.GetUtcNow();

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}

/// <summary>API key comparison in constant time over the UTF-8 bytes (L2-035).</summary>
public static class ApiKeys
{
    public static bool Matches(string expected, string? actual)
    {
        ArgumentNullException.ThrowIfNull(expected);
        return actual is not null
            && CryptographicOperations.FixedTimeEquals(System.Text.Encoding.UTF8.GetBytes(expected), System.Text.Encoding.UTF8.GetBytes(actual));
    }
}
