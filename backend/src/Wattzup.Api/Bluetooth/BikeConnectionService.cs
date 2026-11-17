using Microsoft.Extensions.Options;
using Wattzup.Ble.Abstractions;
using Wattzup.Core.Bluetooth;
using Wattzup.Core.Machines;
using Wattzup.Core.State;
using Wattzup.Core.Telemetry;

namespace Wattzup.Api.Bluetooth;

/// <summary>
/// Finds, connects, initialises and keeps the chosen machine alive for the life of the process, recovering from
/// every disconnect and Bluetooth error (L2-001 to L2-004, L2-039, L2-063). No failure ends the loop; only host
/// shutdown does. Choosing the other machine (L2-062) cancels the current scan, wait or link and starts over.
/// </summary>
public sealed partial class BikeConnectionService(
    IBikeTransport transport,
    BikeStateStore store,
    ActiveConnectionRegistry registry,
    TelemetryIngestor ingestor,
    MachineSelector machines,
    NearbyMachines nearby,
    TimeProvider time,
    IOptions<ConnectivityOptions> options,
    ILogger<BikeConnectionService> logger) : BackgroundService
{
    public const string NoBikeFound = MachineProfile.NoBikeFound;

    private readonly ConnectivityOptions _options = options.Value;
    private CancellationTokenSource? _wait;
    private CancellationTokenSource? _attempt;

    /// <summary>Cuts the current scan or error backoff short so a scan starts at once (L2-004 criterion 5).</summary>
    public void RequestReconnect() => Volatile.Read(ref _wait)?.Cancel();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        transport.AdapterStateChanged += OnAdapterStateChanged;
        machines.Changed += OnMachineChanged;
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var attempt = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                using var wait = CancellationTokenSource.CreateLinkedTokenSource(attempt.Token);
                Volatile.Write(ref _attempt, attempt);
                Volatile.Write(ref _wait, wait);
                try
                {
                    await RunOnceAsync(MachineProfile.For(store.Current.Machine), wait.Token, attempt.Token).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (OperationCanceledException) when (attempt.IsCancellationRequested)
                {
                    // The machine changed: scan for the other one.
                    registry.Clear();
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
                    Interlocked.CompareExchange(ref _attempt, null, attempt);
                }
            }
        }
        finally
        {
            transport.AdapterStateChanged -= OnAdapterStateChanged;
            machines.Changed -= OnMachineChanged;
            registry.Clear();
        }
    }

    private async Task RunOnceAsync(MachineProfile profile, CancellationToken waitToken, CancellationToken stoppingToken)
    {
        store.Update(s => s with { Ble = BleState.Scanning, Error = null });
        // The filter records every Echelon machine heard and accepts only the chosen one (L2-074).
        var scan = transport.ScanAsync(NearbyFilter.Build(profile.Machine, nearby, store.Current.TreadmillEnabled), _options.ScanTimeout, waitToken);
        store.Update(s => s.Adapter == AdapterState.On ? s : s with { Adapter = AdapterState.On });
        var advertisement = await scan.ConfigureAwait(false);
        if (advertisement is null)
        {
            store.Update(s => s with { Ble = BleState.Scanning, Error = profile.NotFoundMessage });
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
            nearby.Hold(profile.Machine);
            try
            {
                store.Update(s => s with
                {
                    Ble = BleState.Connected,
                    Belt = profile.Machine == Machine.Treadmill ? BeltState.Stopped : null,
                });
                await connection.SubscribeAsync(profile.NotifyCharacteristics, frame => ingestor.OnNotify(frame, connection), linkLost.Token).ConfigureAwait(false);
                for (var i = 0; i < profile.InitSequence.Count; i++)
                {
                    if (i > 0)
                    {
                        await Task.Delay(_options.InitCommandSpacing, time, linkLost.Token).ConfigureAwait(false);
                    }

                    await connection.WriteAsync(profile.InitSequence[i], withResponse: true, linkLost.Token).ConfigureAwait(false);
                }

                registry.Set(connection);
                await KeepAliveAsync(profile, connection, linkLost.Token).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested && linkLost.IsCancellationRequested)
            {
                // The link dropped.
            }
            finally
            {
                connection.Disconnected -= OnDisconnected;
                nearby.Release(profile.Machine);
                registry.Clear();
            }

            if (!stoppingToken.IsCancellationRequested)
            {
                store.Update(s => s with { Ble = BleState.Disconnected, Belt = null, BeltCountdown = null });
            }
        }
    }

    private async Task KeepAliveAsync(MachineProfile profile, IBikeConnection connection, CancellationToken linkLost)
    {
        using var timer = new PeriodicTimer(_options.KeepaliveInterval, time);
        byte counter = 1;
        while (connection.IsConnected && await timer.WaitForNextTickAsync(linkLost).ConfigureAwait(false))
        {
            if (!connection.IsConnected)
            {
                break;
            }

            await connection.WriteAsync(profile.Keepalive(counter), withResponse: true, linkLost).ConfigureAwait(false);
            counter = Wattzup.Protocol.EchelonTreadmillCommands.NextKeepaliveCounter(counter);
            store.Touch();
        }
    }

    private void OnMachineChanged(Machine machine)
    {
        try
        {
            Volatile.Read(ref _attempt)?.Cancel();
        }
        catch (ObjectDisposedException)
        {
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
