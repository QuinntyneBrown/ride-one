// Acceptance test
// Traces to: L2-132 AC1; ADR 0039
// Description: Telo Ride 1 has no account. Every endpoint the API maps, its controllers, the health checks and the
// fallbacks, is asked without a session: none refuses with 401 or 403, none sets a cookie, and the class catalogue
// answers 200.
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.Extensions.DependencyInjection;

namespace Telo.Ride.Api.Tests;

public sealed class AnonymousEndpointsTests(HostedAppApi api) : IClassFixture<HostedAppApi>
{
    [Fact]
    [Trait("Category", "Critical")]
    public async Task Every_endpoint_answers_without_a_session_and_sets_no_cookie()
    {
        using var client = api.CreateClient(new() { AllowAutoRedirect = false });
        var asked = new List<string>();
        foreach (var (key, path) in Endpoints())
        {
            using var request = new HttpRequestMessage(new HttpMethod(key[..key.IndexOf(' ')]), path);
            using var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
            Assert.False(response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden, $"{key} answered {(int)response.StatusCode}");
            Assert.False(response.Headers.Contains("Set-Cookie"), $"{key} set a cookie");
            asked.Add(key);
        }

        Assert.Contains("GET /api/classes", asked);
        Assert.Contains("GET /api/classes/{id}", asked);
    }

    [Fact]
    [Trait("Category", "Critical")]
    public async Task The_class_catalogue_answers_200_without_a_session()
    {
        using var client = api.CreateClient();
        using var response = await client.GetAsync("/api/classes", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(response.Headers.Contains("Set-Cookie"));
    }

    /// <summary>
    /// Every endpoint the API maps, as "METHOD /route" with an address that reaches it: each method it accepts (GET
    /// when it names none), each route parameter filled with a value its constraint takes.
    /// </summary>
    private IEnumerable<(string Key, string Path)> Endpoints()
    {
        var endpoints = api.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>();
        foreach (var endpoint in endpoints)
        {
            var route = "/" + endpoint.RoutePattern.RawText!.TrimStart('/');
            var methods = endpoint.Metadata.GetMetadata<IHttpMethodMetadata>()?.HttpMethods ?? [];
            foreach (var method in methods.Count == 0 ? ["GET"] : methods)
            {
                yield return ($"{method} {route}", Address(endpoint.RoutePattern));
            }
        }
    }

    private static string Address(RoutePattern pattern) =>
        "/" + string.Join('/', pattern.PathSegments.Select(segment => string.Concat(segment.Parts.Select(part => part switch
        {
            RoutePatternLiteralPart literal => literal.Content,
            RoutePatternParameterPart { IsCatchAll: true } => "a-page",
            RoutePatternParameterPart => "a1",
            RoutePatternSeparatorPart separator => separator.Content,
            _ => "",
        }))));
}
