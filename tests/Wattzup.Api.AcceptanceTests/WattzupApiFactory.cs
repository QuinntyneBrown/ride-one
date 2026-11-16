using Microsoft.AspNetCore.Mvc.Testing;

namespace Wattzup.Api.AcceptanceTests;

/// <summary>The API host under test, in memory.</summary>
public sealed class WattzupApiFactory : WebApplicationFactory<Program>;
