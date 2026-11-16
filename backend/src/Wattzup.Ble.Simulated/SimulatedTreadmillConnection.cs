using Wattzup.Ble.Abstractions;

namespace Wattzup.Ble.Simulated;

/// <summary>
/// The simulated treadmill's open link (ADR 0009). Like the real treadmill it notifies only on change: after the
/// last init request it reports speed 0 and incline 0; the start-belt command makes the belt run at 1.0 km/h, a
/// set-speed command while it runs and a set-incline command are reported back, and the stop-belt command or
/// <see cref="SimulationControl.StopBeltFromConsole"/> report speed 0. A cut link stops the belt, as the real
/// treadmill is assumed to (L2-043 criterion 5): the belt lives with the link, so the next connection starts with it
/// stopped and reports speed 0. The frame bytes are those of
/// docs/protocol/echelon-treadmill-frames.md; this transport does not reference Wattzup.Protocol.
/// </summary>
internal sealed class SimulatedTreadmillConnection : IBikeConnection
{
    private const int StartSpeedMetresPerHour = 1000;

    private readonly SimulationControl _control;
    private readonly TimeProvider _time;
    private readonly Lock _gate = new();
    private Action<ReadOnlyMemory<byte>>? _onNotify;
    private int _connected = 1;
    private int _speed;
    private int _incline;

    public SimulatedTreadmillConnection(SimulationControl control, TimeProvider time)
    {
        _control = control;
        _time = time;
        control.LinkDropRequested += Drop;
        control.FrameInjected += Deliver;
        control.BeltStopRequested += StopBelt;
    }

    public bool IsConnected => Volatile.Read(ref _connected) == 1;

    public event Action? Disconnected;

    public Task SubscribeAsync(IReadOnlyList<string> notifyCharacteristicUuids, Action<ReadOnlyMemory<byte>> onNotify, CancellationToken cancellationToken)
    {
        _control.Record("subscribe", notifyCharacteristicUuids);
        _onNotify = onNotify;
        return Task.CompletedTask;
    }

    public Task WriteAsync(ReadOnlyMemory<byte> bytes, bool withResponse, CancellationToken cancellationToken)
    {
        if (!IsConnected)
        {
            throw new InvalidOperationException("The simulated treadmill is not connected.");
        }

        if (_control.ThrowOnNextWrite is { } message)
        {
            _control.ThrowOnNextWrite = null;
            throw new IOException(message);
        }

        var frame = bytes.ToArray();
        _control.Record(new SimulatedWrite(frame, withResponse, _time.GetUtcNow()));
        switch (frame)
        {
            case [0xF0, 0xA3, 0x00, _]:
                ReportSpeed(0);
                ReportIncline(0);
                break;
            case [0xF0, 0xB0, 0x01, 0x01, _] when !_control.IgnoreBeltStart:
                ReportSpeed(StartSpeedMetresPerHour);
                break;
            case [0xF0, 0xB0, 0x01, 0x00, _]:
                StopBelt();
                break;
            case [0xF0, 0xB2, 0x02, var hi, var lo, _]:
                bool running;
                lock (_gate)
                {
                    running = _speed > 0;
                }

                if (running)
                {
                    ReportSpeed((hi << 8) | lo);
                }

                break;
            case [0xF0, 0xB1, 0x01, var incline, _]:
                ReportIncline(incline);
                break;
        }

        return Task.CompletedTask;
    }

    public ValueTask DisposeAsync()
    {
        Close(raise: false);
        return ValueTask.CompletedTask;
    }

    private void StopBelt() => ReportSpeed(0);

    private void ReportSpeed(int metresPerHour)
    {
        lock (_gate)
        {
            _speed = metresPerHour;
        }

        Deliver(WithChecksum([0xF0, 0xD3, 0x02, (byte)(metresPerHour >> 8), (byte)metresPerHour, 0x00]));
    }

    private void ReportIncline(int percent)
    {
        lock (_gate)
        {
            _incline = percent;
        }

        Deliver(WithChecksum([0xF0, 0xD2, 0x01, (byte)_incline, 0x00]));
    }

    private static byte[] WithChecksum(byte[] frame)
    {
        frame[^1] = (byte)(frame.Take(frame.Length - 1).Sum(b => b) & 0xFF);
        return frame;
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
        _control.BeltStopRequested -= StopBelt;
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
}
