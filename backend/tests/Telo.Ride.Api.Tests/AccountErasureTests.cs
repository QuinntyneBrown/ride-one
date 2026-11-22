// Acceptance test
// Traces to: L2-006 AC3
// Description: a deleted account's personal data is erased within 30 days. The erasure service runs once a day on the
// API's clock: a day after the deletion the rider and its sessions are gone, and a second run finds nothing more.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Application;
using Telo.Ride.Application.Accounts;

namespace Telo.Ride.Api.Tests;

/// <summary>Records the count of every erasure run, so a test can await one instead of sleeping.</summary>
public sealed class ErasureProbe(EventProbe<int> runs) : IPipelineBehavior<ErasePendingAccountsCommand, int>
{
    public async Task<int> Handle(
        ErasePendingAccountsCommand request, RequestHandlerDelegate<int> next, CancellationToken cancellationToken)
    {
        var erased = await next(cancellationToken);
        runs.Record(erased);
        return erased;
    }
}

/// <summary>The sign-in API with the daily erasure service running on its clock, which no other test host runs.</summary>
public sealed class AccountErasureApi : SignInApi
{
    public EventProbe<int> Runs { get; } = new(count => $"erased {count}");

    protected override bool RunsAccountErasure => true;

    protected override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);
        services.AddSingleton(Runs);
        services.AddTransient<IPipelineBehavior<ErasePendingAccountsCommand, int>, ErasureProbe>();
    }
}

public sealed class AccountErasureTests(AccountErasureApi api) : IClassFixture<AccountErasureApi>
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_day_after_deletion_the_rider_and_its_sessions_are_erased()
    {
        using var device = api.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
        });
        const string email = "ada.erased@example.com";
        using var sent = await device.PostAsJsonAsync("/api/auth/code", new { email }, Cancel);
        using var confirmed = await device.PostAsJsonAsync(
            "/api/auth/code/confirm", new { email, code = api.Mailbox.Sent[^1].Code }, Cancel);
        var riderId = Guid.Parse(JsonDocument.Parse(await confirmed.Content.ReadAsStringAsync(Cancel))
            .RootElement.GetProperty("riderId").GetString()!);
        using var deleted = await device.DeleteAsync("/api/riders/me", Cancel);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        api.Clock.Advance(TimeSpan.FromDays(1));

        Assert.Equal(1, await api.Runs.Await(count => count > 0, TimeSpan.FromSeconds(10)));
        using var scope = api.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        Assert.False(await db.Riders.AnyAsync(rider => rider.Id == riderId, Cancel));
        Assert.False(await db.RiderSessions.AnyAsync(session => session.RiderId == riderId, Cancel));
        Assert.Equal(0, await scope.ServiceProvider.GetRequiredService<ISender>().Send(new ErasePendingAccountsCommand(), Cancel));
    }
}
