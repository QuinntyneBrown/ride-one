using Wattzup.Ble.Abstractions;

namespace Wattzup.Ble.Simulated;

/// <summary>The simulated bike's open link.</summary>
internal sealed class SimulatedBikeConnection : IBikeConnection
{
    private readonly SimulationControl _control;
    private readonly TimeProvider _time;
    private readonly DateTimeOffset _openedAt;
    private Action<ReadOnlyMemory<byte>>? _onNotify;
    private ITimer? _stream;
    private int _connected = 1;
    private int _tick;

    public SimulatedBikeConnection(SimulationControl control, TimeProvider time)
    {
        _control = control;
        _time = time;
        _openedAt = time.GetUtcNow();
        control.LinkDropRequested += Drop;
        control.FrameInjected += Deliver;
    }

    public bool IsConnected => Volatile.Read(ref _connected) == 1;

    public event Action? Disconnected;

    public Task SubscribeAsync(Action<ReadOnlyMemory<byte>> onNotify, CancellationToken cancellationToken)
    {
        _control.Record("subscribe");
        _onNotify = onNotify;
        _stream = _time.CreateTimer(_ => SendWorkoutFrame(), null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
        return Task.CompletedTask;
    }

    public Task WriteAsync(ReadOnlyMemory<byte> bytes, bool withResponse, CancellationToken cancellationToken)
    {
        if (!IsConnected)
        {
            throw new InvalidOperationException("The simulated bike is not connected.");
        }

        if (_control.ThrowOnNextWrite is { } message)
        {
            _control.ThrowOnNextWrite = null;
            throw new IOException(message);
        }

        var frame = bytes.ToArray();
        _control.Record(new SimulatedWrite(frame, withResponse, _time.GetUtcNow()));
        if (frame is [0xF0, 0xB1, 0x01, var level, _] && !_control.IgnoreResistance)
        {
            byte[] echo = [0xF0, 0xD2, 0x01, level, (byte)((0xF0 + 0xD2 + 0x01 + level) & 0xFF)];
            if (_control.HoldEchoes)
            {
                _control.Hold(echo);
            }
            else
            {
                Deliver(echo);
            }
        }

        return Task.CompletedTask;
    }

    public async ValueTask DisposeAsync()
    {
        Close(raise: false);
        if (_stream is not null)
        {
            await _stream.DisposeAsync().ConfigureAwait(false);
        }
    }

    private void Drop() => Close(raise: true);

    private void Close(bool raise)
    {
        if (Interlocked.Exchange(ref _connected, 0) == 0)
        {
            return;
        }

        _control.LinkDropRequested -= Drop;
        _control.FrameInjected -= Deliver;
        _stream?.Change(Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
        _control.Record("disconnect");
        if (raise)
        {
            Disconnected?.Invoke();
        }
    }

    private void Deliver(byte[] frame)
    {
        if (IsConnected)
        {
            _onNotify?.Invoke(frame);
        }
    }

    private void SendWorkoutFrame()
    {
        var tick = Interlocked.Increment(ref _tick);
        var elapsed = (int)(_time.GetUtcNow() - _openedAt).TotalSeconds;
        var cadence = _control.Cadence;
        byte[] frame =
        [
            0xF0, 0xD1, 0x09, (byte)(elapsed >> 8), (byte)elapsed, 0x00, 0x00, (byte)(tick >> 8), (byte)tick,
            (byte)(cadence >> 8), (byte)cadence, 0x00, 0x00,
        ];
        frame[^1] = (byte)(frame.Take(12).Sum(b => b) & 0xFF);
        Deliver(frame);
    }
}
