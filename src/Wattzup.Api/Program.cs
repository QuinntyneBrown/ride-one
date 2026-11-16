using Wattzup.Api;
using Wattzup.Api.Endpoints;
using Wattzup.Core.State;

var builder = WebApplication.CreateBuilder(args);

var options = builder.Configuration.GetSection(WattzupOptions.SectionName).Get<WattzupOptions>() ?? new WattzupOptions();
builder.WebHost.UseUrls(options.Urls);

// The state contract keeps the prototype's snake_case names, and writes nulls (L2-014).
builder.Services.ConfigureHttpJsonOptions(json => WattzupJson.Configure(json.SerializerOptions));
builder.Services.AddOpenApi();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton(sp => new BikeStateStore(
    new BikeState
    {
        Transport = "none",
        BindAddress = new Uri(options.Urls).Authority,
    },
    sp.GetRequiredService<TimeProvider>(),
    null));
builder.Services.AddSingleton<StateBroadcaster>();

var app = builder.Build();

app.MapOpenApi();
app.MapStatusEndpoints();
app.MapGroup("/api").MapEventsEndpoints();

app.Run();

/// <summary>The host's entry point, visible to the acceptance tests.</summary>
public partial class Program;
