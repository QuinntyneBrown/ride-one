using Wattzup.Api;
using Wattzup.Api.Bluetooth;
using Wattzup.Api.Endpoints;
using Wattzup.Api.Security;
using Wattzup.Core.Bluetooth;
using Wattzup.Core.State;
using Wattzup.Core.Resistance;
using Wattzup.Core.Telemetry;
using Wattzup.Core.Workouts;

// --simulate selects the simulated bike (L2-043); it is not a key=value setting, so it is taken out of args.
var simulate = args.Contains("--simulate", StringComparer.OrdinalIgnoreCase);
var builder = WebApplication.CreateBuilder(args.Where(a => !string.Equals(a, "--simulate", StringComparison.OrdinalIgnoreCase)).ToArray());
if (simulate)
{
    builder.Configuration["Wattzup:Ble:Transport"] = TransportSelector.Simulated;
}

var options = builder.Configuration.GetSection(WattzupOptions.SectionName).Get<WattzupOptions>() ?? new WattzupOptions();
builder.WebHost.UseUrls(options.Urls);
builder.Services.Configure<ConnectivityOptions>(builder.Configuration.GetSection(ConnectivityOptions.SectionName));
builder.Services.Configure<BikeOptions>(builder.Configuration.GetSection(BikeOptions.SectionName));

// The state contract keeps the prototype's snake_case names, and writes nulls (L2-014).
builder.Services.ConfigureHttpJsonOptions(json => WattzupJson.Configure(json.SerializerOptions));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
var security = builder.Configuration.GetSection(SecurityOptions.SectionName).Get<SecurityOptions>() ?? new SecurityOptions();
builder.Services.AddWattzupRateLimits(security);

var transportName = TransportSelector.Resolve(builder.Configuration[$"{ConnectivityOptions.SectionName}:Transport"]);
var displayName = builder.Configuration[$"{BikeOptions.SectionName}:DisplayName"];
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddBikeTransport(transportName);
builder.Services.AddSingleton(sp =>
{
    var facts = HostFacts.For(sp.GetRequiredService<Wattzup.Ble.Abstractions.IBikeTransport>().Name, options.Urls);
    return new BikeStateStore(
        new BikeState
        {
            Transport = facts.Transport,
            Simulated = facts.Simulated,
            BindAddress = facts.BindAddress,
            Exposed = facts.Exposed,
        },
        sp.GetRequiredService<TimeProvider>(),
        displayName);
});
builder.Services.AddSingleton<StateBroadcaster>();
builder.Services.AddSingleton<ActiveConnectionRegistry>();
builder.Services.AddSingleton<TelemetryIngestor>();
builder.Services.AddSingleton<IResistanceCommander, ResistanceCommander>();
builder.Services.AddSingleton<PowerTraceHistory>();
builder.Services.AddSingleton<WorkoutEngine>();
builder.Services.AddSingleton<IResistanceControl>(sp => sp.GetRequiredService<WorkoutEngine>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<WorkoutEngine>());
builder.Services.AddSingleton<BikeConnectionService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<BikeConnectionService>());

var app = builder.Build();

app.UseRateLimiter();
app.MapOpenApi();
app.MapStatusEndpoints();
var api = app.MapGroup("/api");
api.MapEventsEndpoints();
api.MapBikeEndpoints();
api.MapResistanceEndpoints();
api.MapWorkoutEndpoints();

app.Run();

/// <summary>The host's entry point, visible to the acceptance tests.</summary>
public partial class Program;
