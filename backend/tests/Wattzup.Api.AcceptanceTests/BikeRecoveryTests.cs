// Acceptance Test
// Traces to: L2-004, L2-039
// Description: The backend recovers on its own from a dropped link, a Bluetooth exception, a switched-off adapter
// and a bike left off for an hour, and POST /api/bike/reconnect cuts a wait short.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class BikeRecoveryTests
{
    private static string Ble(JsonElement s) => s.GetProperty("ble").GetString()!;

    private static async Task<(WattzupApiFactory Factory, HttpClient Client, EventStreamReader Stream)> ConnectedAsync()
    {
        var factory = new WattzupApiFactory();
        var client = factory.CreateClient();
        var stream = await EventStreamReader.OpenAsync(client);
        await stream.WaitForAsync(s => Ble(s) == "connected", "ble connected");
        while (!await factory.Simulation.WaitForWritesAsync(3, TimeSpan.FromMilliseconds(300)))
        {
            factory.Time.Advance(TimeSpan.FromMilliseconds(300));
        }

        return (factory, client, stream);
    }

    [Fact]
    public async Task Given_the_bike_is_connected_when_it_disconnects_then_ble_is_disconnected_and_scanning_restarts()
    {
        var (factory, client, stream) = await ConnectedAsync();
        await using var _ = stream;
        using var __ = factory;
        using var ___ = client;

        factory.Simulation.DropLink();

        await stream.WaitForAsync(s => Ble(s) == "disconnected", "ble disconnected");
        await stream.WaitForAsync(s => Ble(s) == "scanning", "scanning again");
    }

    [Fact]
    public async Task Given_a_Bluetooth_exception_then_ble_is_error_with_type_and_message_and_scanning_resumes_after_3_seconds()
    {
        var (factory, client, stream) = await ConnectedAsync();
        await using var _ = stream;
        using var __ = factory;
        using var ___ = client;
        factory.Simulation.ThrowOnNextWrite = "the GATT write failed";

        var error = await stream.AdvanceUntilAsync(factory.Time, s => Ble(s) == "error", "ble error", TimeSpan.FromSeconds(1), maxSteps: 3);
        Assert.Equal("IOException: the GATT write failed", error.GetProperty("error").GetString());

        factory.Time.Advance(TimeSpan.FromSeconds(2));
        Assert.Equal("error", Ble(await GetStatusAsync(client)));
        await stream.AdvanceUntilAsync(factory.Time, s => Ble(s) == "scanning", "scanning after the 3 s backoff", TimeSpan.FromSeconds(1), maxSteps: 2);
    }

    [Fact]
    public async Task Given_the_backoff_is_running_when_reconnect_is_requested_then_it_answers_202_and_scans_at_once()
    {
        var (factory, client, stream) = await ConnectedAsync();
        await using var _ = stream;
        using var __ = factory;
        using var ___ = client;
        factory.Simulation.ThrowOnNextWrite = "the GATT write failed";
        await stream.AdvanceUntilAsync(factory.Time, s => Ble(s) == "error", "ble error", TimeSpan.FromSeconds(1), maxSteps: 3);

        using var response = await client.PostAsync(new Uri("/api/bike/reconnect", UriKind.Relative), null);

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        await stream.WaitForAsync(s => Ble(s) == "scanning", "scanning without the clock moving");
    }

    [Fact]
    public async Task Given_the_bike_is_connected_when_reconnect_is_requested_then_it_answers_409_already_connected()
    {
        var (factory, client, stream) = await ConnectedAsync();
        await using var _ = stream;
        using var __ = factory;
        using var ___ = client;

        using var response = await client.PostAsync(new Uri("/api/bike/reconnect", UriKind.Relative), null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("already_connected", problem.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Given_the_adapter_is_switched_off_and_on_then_the_backend_reports_it_and_reconnects()
    {
        var (factory, client, stream) = await ConnectedAsync();
        await using var _ = stream;
        using var __ = factory;
        using var ___ = client;

        factory.Simulation.AdapterOn = false;
        var off = await stream.WaitForAsync(s => Ble(s) == "error", "ble error with the adapter off");
        Assert.Equal("off", off.GetProperty("adapter").GetString());
        Assert.Equal("BluetoothUnavailableException: Bluetooth is off.", off.GetProperty("error").GetString());

        factory.Simulation.AdapterOn = true;
        await stream.WaitForAsync(s => s.GetProperty("adapter").GetString() == "on", "adapter on");
        await stream.AdvanceUntilAsync(factory.Time, s => Ble(s) == "connected", "connected again", TimeSpan.FromSeconds(1), maxSteps: 5);
    }

    [Fact]
    public async Task Given_the_adapter_is_off_at_start_up_then_the_API_serves_and_ble_is_error()
    {
        using var factory = new WattzupApiFactory();
        factory.Simulation.AdapterOn = false;
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);

        var state = await stream.WaitForAsync(s => Ble(s) == "error", "ble error");

        Assert.Equal("off", state.GetProperty("adapter").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(new Uri("/health", UriKind.Relative))).StatusCode);
    }

    [Fact]
    public async Task Given_the_bike_is_off_for_an_hour_then_the_backend_still_scans_and_connects_once_it_is_on()
    {
        using var factory = new WattzupApiFactory();
        factory.Simulation.PoweredOn = false;
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);
        await stream.WaitForAsync(s => Ble(s) == "scanning", "scanning");

        for (var scan = 0; scan < 180; scan++)
        {
            stream.Drain();
            factory.Time.Advance(TimeSpan.FromSeconds(20));
            await stream.WaitForAsync(s => Ble(s) == "scanning" && s.GetProperty("error").ValueKind == JsonValueKind.String, $"scan {scan} timing out");
        }

        factory.Simulation.PoweredOn = true;
        await stream.WaitForAsync(s => Ble(s) == "connected", "connected within the scan in progress");
    }

    private static async Task<JsonElement> GetStatusAsync(HttpClient client)
    {
        using var response = await client.GetAsync(new Uri("/api/status", UriKind.Relative));
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.Clone();
    }
}
