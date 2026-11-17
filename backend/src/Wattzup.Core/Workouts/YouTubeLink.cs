using System.Text.RegularExpressions;

namespace Wattzup.Core.Workouts;

/// <summary>
/// Reads the video id from the YouTube link forms of the plan table (L2-010 criteria 14 and 16, ADR 0012):
/// <c>youtube.com/watch?v=&lt;id&gt;</c>, <c>youtu.be/&lt;id&gt;</c>, <c>youtube.com/shorts/&lt;id&gt;</c> and
/// <c>youtube.com/embed/&lt;id&gt;</c>, with or without <c>https://</c>, <c>www.</c> or <c>m.</c>. It never fetches the link.
/// </summary>
public static partial class YouTubeLink
{
    public const int MaxLength = 2048;

    public static bool TryParseId(string? url, out string id)
    {
        id = string.Empty;
        if (string.IsNullOrWhiteSpace(url) || url.Length > MaxLength)
        {
            return false;
        }

        var match = Link().Match(url.Trim());
        if (!match.Success)
        {
            return false;
        }

        var candidate = match.Groups["id"].Success ? match.Groups["id"].Value : WatchId(match.Groups["query"].Value);
        if (candidate is null || !Id().IsMatch(candidate))
        {
            return false;
        }

        id = candidate;
        return true;
    }

    /// <summary>The <c>v</c> parameter of a watch link's query, or null.</summary>
    private static string? WatchId(string query)
    {
        foreach (var pair in query.Split('&'))
        {
            if (pair.StartsWith("v=", StringComparison.Ordinal))
            {
                return pair[2..];
            }
        }

        return null;
    }

    [GeneratedRegex(
        @"^(?:https?://)?(?:www\.|m\.)?(?:youtube\.com/(?:watch\?(?<query>[^#]*)|(?:shorts|embed)/(?<id>[A-Za-z0-9_-]{11}))|youtu\.be/(?<id>[A-Za-z0-9_-]{11}))(?:[?#].*)?$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.ExplicitCapture,
        matchTimeoutMilliseconds: 100)]
    private static partial Regex Link();

    [GeneratedRegex("^[A-Za-z0-9_-]{11}$", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 100)]
    private static partial Regex Id();
}
