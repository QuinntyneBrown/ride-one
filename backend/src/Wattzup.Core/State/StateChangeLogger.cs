using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Wattzup.Core.State;

/// <summary>Logs only real changes of <c>ble</c>, <c>adapter</c> and <c>workout.status</c>, with structured fields (L2-033).</summary>
public sealed partial class StateChangeLogger : IHostedService
{
    private readonly BikeStateStore _store;
    private readonly ILogger<StateChangeLogger> _logger;
    private (BleState Ble, AdapterState Adapter) _link;
    private string? _workoutStatus;

    public StateChangeLogger(BikeStateStore store, ILogger<StateChangeLogger> logger)
    {
        ArgumentNullException.ThrowIfNull(store);
        _store = store;
        _logger = logger;
        _link = (store.Current.Ble, store.Current.Adapter);
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _store.StateChanged += OnChanged;
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _store.StateChanged -= OnChanged;
        return Task.CompletedTask;
    }

    private void OnChanged(BikeState state)
    {
        if ((state.Ble, state.Adapter) != _link)
        {
            _link = (state.Ble, state.Adapter);
            var ble = Contract(state.Ble);
            var adapter = Contract(state.Adapter);
            LogBle(_logger, ble, state.Device, adapter, state.Transport, state.Error);
        }

        var status = state.Workout?.Status;
        if (status != _workoutStatus)
        {
            _workoutStatus = status;
            LogWorkout(_logger, status ?? "none", state.Workout?.Segment, state.Workout?.ElapsedSeconds, state.Workout?.EndedReason);
        }
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Bluetooth {Ble} (device {Device}, adapter {Adapter}, transport {Transport}, error {Error}).")]
    private static partial void LogBle(ILogger logger, string ble, string? device, string adapter, string transport, string? error);

    private static string Contract(Enum value) => System.Text.Json.JsonNamingPolicy.SnakeCaseLower.ConvertName(value.ToString());

    [LoggerMessage(Level = LogLevel.Information, Message = "Workout {Status} (segment {Segment}, elapsed {ElapsedSeconds} s, ended reason {EndedReason}).")]
    private static partial void LogWorkout(ILogger logger, string status, int? segment, int? elapsedSeconds, string? endedReason);
}
