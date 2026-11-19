using Microsoft.Extensions.Options;
using Wattzup.Ble.Abstractions;
using Wattzup.Core.Bluetooth;
using Wattzup.Core.State;
using Wattzup.Core.Telemetry;
using Wattzup.Protocol;

namespace Wattzup.Api.Bluetooth;

/// <summary>
/// Finds, connects, initialises and keeps the bike alive for the life of the process, recovering from every
/// disconnect and Bluetooth error (L2-001 to L2-004, L2-039). No failure ends the loop; only host shutdown does.
/// </summary>
public sealed partial class BikeConnectionService(
    IBikeTransport transport,
    BikeStateStore store,
    ActiveConnectionRegistry registry,
    TelemetryIngestor ingestor,
    TimeProvider time,
    IOptions<ConnectivityOptions> options,
    ILogger<BikeConnectionService> logger) : BackgroundService
{
    public const string NoBikeFound = "No Echelon bike found yet — pedal to wake it up";

    private readonly ConnectivityOptions _options = options.Value;
    private CancellationTokenSource? _wait;

    /// <summary>Cuts the current scan or error backoff short so a scan starts at once (L2-004 criterion 5).</summary>
    public void RequestReconnect() => Volatile.Read(ref _wait)?.Cancel();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        transport.AdapterStateChanged += OnAdapterStateChanged;
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var wait = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                Volatile.Write(ref _wait, wait);
                try
                {
                    await RunOnceAsync(wait.Token, stoppingToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (OperationCanceledException)
                {
                    // A reconnect request: scan again at once.
                }
                catch (Exception e)
                {
                    registry.Clear();
                    var unavailable = e is BluetoothUnavailableException;
                    store.Update(s => s with
                    {
                        Ble = BleState.Error,
                        Error = $"{e.GetType().Name}: {e.Message}",
                        Adapter = unavailable ? AdapterState.Off : s.Adapter,
                    });
                    LogFailure(logger, e.GetType().Name, e.Message);
                    try
                    {
                        await Task.Delay(_options.ErrorBackoff, time, wait.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
                    {
                        // A reconnect request cut the backoff short.
                    }
                }
                finally
                {
                    Interlocked.CompareExchange(ref _wait, null, wait);
                }
            }
        }
        finally
        {
            transport.AdapterStateChanged -= OnAdapterStateChanged;
            registry.Clear();
        }
    }

    private async Task RunOnceAsync(CancellationToken waitToken, CancellationToken stoppingToken)
    {
        store.Update(s => s with { Ble = BleState.Scanning, Error = null });
        var scan = transport.ScanAsync(a => EchelonDeviceFilter.Matches(a.Name, a.ServiceUuids), _options.ScanTimeout, waitToken);
        store.Update(s => s.Adapter == AdapterState.On ? s : s with { Adapter = AdapterState.On });
        var advertisement = await scan.ConfigureAwait(false);
        if (advertisement is null)
        {
            store.Update(s => s with { Ble = BleState.Scanning, Error = NoBikeFound });
            return;
        }

        store.Update(s => s with { Ble = BleState.Connecting, Device = advertisement.DisplayName });
        var connection = await transport.ConnectAsync(advertisement, stoppingToken).ConfigureAwait(false);
        await using (connection.ConfigureAwait(false))
        {
            using var linkLost = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            void OnDisconnected()
            {
                try
                {
                    linkLost.Cancel();
                }
                catch (ObjectDisposedException)
                {
                }
            }

            connection.Disconnected += OnDisconnected;
            try
            {
                store.Update(s => s with { Ble = BleState.Connected });
                await connection.SubscribeAsync(ingestor.OnNotify, linkLost.Token).ConfigureAwait(false);
                for (var i = 0; i < EchelonCommands.InitSequence.Count; i++)
                {
                    if (i > 0)
                    {
                        await Task.Delay(_options.InitCommandSpacing, time, linkLost.Token).ConfigureAwait(false);
                    }

                    await connection.WriteAsync(EchelonCommands.InitSequence[i], withResponse: true, linkLost.Token).ConfigureAwait(false);
                }

                registry.Set(connection);
                await KeepAliveAsync(connection, linkLost.Token).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested && linkLost.IsCancellationRequested)
            {
                // The link dropped.
            }
            finally
            {
                connection.Disconnected -= OnDisconnected;
                registry.Clear();
            }

            if (!stoppingToken.IsCancellationRequested)
            {
                store.Update(s => s with { Ble = BleState.Disconnected });
            }
        }
    }

    private async Task KeepAliveAsync(IBikeConnection connection, CancellationToken linkLost)
    {
        using var timer = new PeriodicTimer(_options.KeepaliveInterval, time);
        while (connection.IsConnected && await timer.WaitForNextTickAsync(linkLost).ConfigureAwait(false))
        {
            if (!connection.IsConnected)
            {
                break;
            }

            await connection.WriteAsync(EchelonCommands.Keepalive, withResponse: true, linkLost).ConfigureAwait(false);
            store.Touch();
        }
    }

    private void OnAdapterStateChanged(BluetoothAdapterState state) =>
        store.Update(s => s with
        {
            Adapter = state switch
            {
                BluetoothAdapterState.On => AdapterState.On,
                BluetoothAdapterState.Off => AdapterState.Off,
                _ => AdapterState.Unknown,
            },
        });

    [LoggerMessage(Level = LogLevel.Warning, Message = "Bluetooth failure: {ExceptionType}: {Error}. Retrying.")]
    private static partial void LogFailure(ILogger logger, string exceptionType, string error);
}
