using System.Net.Http.Json;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

/// <summary>A started host with the simulated bike connected and initialised, plus request helpers.</summary>
public sealed class Bike : IAsyncDisposable
{
    private Bike(WattzupApiFactory factory, HttpClient client, EventStreamReader stream)
    {
        Factory = factory;
        Client = client;
        Stream = stream;
    }

    public WattzupApiFactory Factory { get; }

    public HttpClient Client { get; }

    public EventStreamReader Stream { get; }

    public static async Task<Bike> StartAsync(WattzupApiFactory? factory = null, bool connected = true)
    {
        factory ??= new WattzupApiFactory();
        factory.Simulation.PoweredOn = connected;
        var client = factory.CreateClient();
        var stream = await EventStreamReader.OpenAsync(client);
        var bike = new Bike(factory, client, stream);
        if (connected)
        {
            await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "ble connected");
            await InitialisedAsync(factory);
        }
        else
        {
            await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "scanning", "scanning");
        }

        return bike;
    }

    /// <summary>
    /// Waits for the three initialisation writes, which the backend spaces 300 ms apart on the fake clock. Each
    /// write after the first can only come once the clock moves, so the clock moves first and the wait follows; if
    /// the backend had not yet set its timer, the wait times out and the clock moves again.
    /// </summary>
    private static async Task InitialisedAsync(WattzupApiFactory factory)
    {
        var spacing = TimeSpan.FromMilliseconds(300);
        while (!await factory.Simulation.WaitForWritesAsync(1, spacing))
        {
            factory.Time.Advance(spacing);
        }

        for (var count = 2; count <= 3; count++)
        {
            do
            {
                factory.Time.Advance(spacing);
            }
            while (!await factory.Simulation.WaitForWritesAsync(count, spacing));
        }
    }

    public Task<HttpResponseMessage> PostAsync(string path, object? body = null) =>
        body is null
            ? Client.PostAsync(new Uri(path, UriKind.Relative), null)
            : Client.PostAsJsonAsync(new Uri(path, UriKind.Relative), body);

    public Task<HttpResponseMessage> PostRawAsync(string path, string body, string contentType = "application/json") =>
        Client.PostAsync(new Uri(path, UriKind.Relative), new StringContent(body, System.Text.Encoding.UTF8, contentType));

    public static async Task<JsonElement> JsonAsync(HttpResponseMessage response)
    {
        ArgumentNullException.ThrowIfNull(response);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.Clone();
    }

    public async ValueTask DisposeAsync()
    {
        await Stream.DisposeAsync();
        Client.Dispose();
        Factory.Dispose();
    }
}
