using System.Text.Json;
using System.Text.Json.Serialization;
using Wattzup.Api;
using Wattzup.Api.Endpoints;
using Wattzup.Core.State;

var builder = WebApplication.CreateBuilder(args);

var options = builder.Configuration.GetSection(WattzupOptions.SectionName).Get<WattzupOptions>() ?? new WattzupOptions();
builder.WebHost.UseUrls(options.Urls);

// The state contract keeps the prototype's snake_case names, and writes nulls (L2-014).
builder.Services.ConfigureHttpJsonOptions(json =>
{
    json.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    json.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    json.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower));
});
builder.Services.AddOpenApi();

builder.Services.AddSingleton(new BikeStateStore(new BikeState
{
    Transport = "none",
    BindAddress = new Uri(options.Urls).Authority,
}, TimeProvider.System, null));

var app = builder.Build();

app.MapOpenApi();
app.MapStatusEndpoints();

app.Run();
