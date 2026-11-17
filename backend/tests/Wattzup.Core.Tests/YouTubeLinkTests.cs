// Unit Test
// Traces to: L2-010
// Description: Every YouTube link form of the plan table is read to its 11-character id; every other link is refused
// (L2-010 criteria 14 and 16, ADR 0012).

using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class YouTubeLinkTests
{
    [Theory]
    [InlineData("https://www.youtube.com/watch?v=QUoToFsMNig")]
    [InlineData("http://www.youtube.com/watch?v=QUoToFsMNig")]
    [InlineData("www.youtube.com/watch?v=QUoToFsMNig")]
    [InlineData("youtube.com/watch?v=QUoToFsMNig")]
    [InlineData("https://m.youtube.com/watch?v=QUoToFsMNig&t=40")]
    [InlineData("m.youtube.com/watch?v=QUoToFsMNig&t=40")]
    [InlineData("https://www.youtube.com/watch?feature=share&v=QUoToFsMNig")]
    [InlineData("https://youtu.be/QUoToFsMNig")]
    [InlineData("youtu.be/QUoToFsMNig?t=12")]
    [InlineData("https://www.youtube.com/shorts/QUoToFsMNig")]
    [InlineData("youtube.com/shorts/QUoToFsMNig")]
    [InlineData("https://www.youtube.com/embed/QUoToFsMNig")]
    [InlineData("www.youtube.com/embed/QUoToFsMNig")]
    [InlineData("  https://youtu.be/QUoToFsMNig  ")]
    [InlineData("https://youtu.be/a-b_C1d2E3f")]
    public void Each_YouTube_link_form_gives_the_video_id(string url)
    {
        Assert.True(YouTubeLink.TryParseId(url, out var id));
        Assert.Equal(url.Contains("a-b_C1d2E3f") ? "a-b_C1d2E3f" : "QUoToFsMNig", id);
    }

    [Theory]
    [InlineData("https://vimeo.com/76979871")]
    [InlineData("https://www.youtube.com/watch?v=short")]
    [InlineData("https://www.youtube.com/watch?v=QUoToFsMNig1")]
    [InlineData("https://www.youtube.com/watch?v=QUoToFs$Nig")]
    [InlineData("javascript:alert(1)")]
    [InlineData("https://www.youtube.com.evil.example/watch?v=QUoToFsMNig")]
    [InlineData("https://evil.example/youtu.be/QUoToFsMNig")]
    [InlineData("ftp://youtu.be/QUoToFsMNig")]
    [InlineData("https://www.youtube.com/channel/QUoToFsMNig")]
    [InlineData("https://www.youtube.com/watch")]
    [InlineData("")]
    public void Every_other_link_is_refused(string url)
    {
        Assert.False(YouTubeLink.TryParseId(url, out _));
    }

    [Fact]
    public void A_link_over_2048_characters_is_refused()
    {
        var url = "https://www.youtube.com/watch?v=QUoToFsMNig&x=" + new string('a', 2048);

        Assert.False(YouTubeLink.TryParseId(url, out _));
    }
}
