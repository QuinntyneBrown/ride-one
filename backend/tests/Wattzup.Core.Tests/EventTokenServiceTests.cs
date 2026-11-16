// Unit Test
// Traces to: L2-035
// Description: Event tokens are single-use and expire after 60 seconds; API keys compare in constant time.

using Microsoft.Extensions.Time.Testing;
using Wattzup.Core.Security;

namespace Wattzup.Core.Tests;

public sealed class EventTokenServiceTests
{
    [Fact]
    public void A_token_is_accepted_once()
    {
        var tokens = new EventTokenService(new FakeTimeProvider());
        var token = tokens.Issue();

        Assert.True(tokens.TryConsume(token));
        Assert.False(tokens.TryConsume(token));
    }

    [Fact]
    public void A_token_expires_after_60_seconds()
    {
        var time = new FakeTimeProvider();
        var tokens = new EventTokenService(time);
        var token = tokens.Issue();

        time.Advance(TimeSpan.FromSeconds(61));

        Assert.False(tokens.TryConsume(token));
    }

    [Theory]
    [InlineData("abc", "abc", true)]
    [InlineData("abc", "abd", false)]
    [InlineData("abc", "abcd", false)]
    [InlineData("abc", null, false)]
    public void Keys_compare_exactly(string expected, string? actual, bool equal)
    {
        Assert.Equal(equal, ApiKeys.Matches(expected, actual));
    }
}
