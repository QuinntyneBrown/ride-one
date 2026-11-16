namespace Wattzup.Ble.Simulated;

/// <summary>One write the simulated bike received.</summary>
public sealed record SimulatedWrite(byte[] Bytes, bool WithResponse, DateTimeOffset At);

/// <summary>
/// The knobs of the simulated bike, used by tests to inject faults: power the bike off, switch the adapter off,
/// drop the link, throw on the next write, hold or ignore resistance echoes, or deliver any frame.
/// </summary>
public sealed class SimulationControl
{
    private readonly Lock _gate = new();
    private readonly List<string> _events = [];
    private readonly List<SimulatedWrite> _writes = [];
    private readonly List<byte[]> _heldEchoes = [];
    private bool _poweredOn = true;
    private bool _adapterOn = true;
    private TaskCompletionSource _wrote = new(TaskCreationOptions.RunContinuationsAsynchronously);

    internal event Action? Changed;

    internal event Action? LinkDropRequested;

    internal event Action<byte[]>? FrameInjected;

    /// <summary>The bike is on and advertising. Switching it off drops an open link.</summary>
    public bool PoweredOn
    {
        get => _poweredOn;
        set
        {
            _poweredOn = value;
            if (!value)
            {
                LinkDropRequested?.Invoke();
            }

            Changed?.Invoke();
        }
    }

    /// <summary>The computer's Bluetooth adapter is on. Switching it off drops an open link.</summary>
    public bool AdapterOn
    {
        get => _adapterOn;
        set
        {
            _adapterOn = value;
            if (!value)
            {
                LinkDropRequested?.Invoke();
            }

            Changed?.Invoke();
        }
    }

    /// <summary>The message of an exception the next write throws, or null.</summary>
    public string? ThrowOnNextWrite { get; set; }

    /// <summary>While true, resistance echoes are held until <see cref="ReleaseEchoes"/>.</summary>
    public bool HoldEchoes { get; set; }

    /// <summary>While true, the bike ignores set-resistance writes and echoes nothing.</summary>
    public bool IgnoreResistance { get; set; }

    /// <summary>The cadence the bike reports in its 0xD1 frames.</summary>
    public int Cadence { get; set; } = 85;

    /// <summary>Every write so far, in order.</summary>
    public IReadOnlyList<SimulatedWrite> Writes
    {
        get
        {
            lock (_gate)
            {
                return [.. _writes];
            }
        }
    }

    /// <summary>The link events so far, in order: <c>connect</c>, <c>subscribe</c>, <c>write</c>, <c>disconnect</c>.</summary>
    public IReadOnlyList<string> Events
    {
        get
        {
            lock (_gate)
            {
                return [.. _events];
            }
        }
    }

    /// <summary>Waits until at least <paramref name="count"/> writes have arrived; false after <paramref name="timeout"/>.</summary>
    public async Task<bool> WaitForWritesAsync(int count, TimeSpan timeout)
    {
        using var cts = new CancellationTokenSource(timeout);
        while (true)
        {
            Task wrote;
            lock (_gate)
            {
                if (_writes.Count >= count)
                {
                    return true;
                }

                wrote = _wrote.Task;
            }

            try
            {
                await wrote.WaitAsync(cts.Token).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return false;
            }
        }
    }

    /// <summary>Drops the open link, as if the bike went out of range.</summary>
    public void DropLink() => LinkDropRequested?.Invoke();

    /// <summary>Delivers a frame on the open link, as if the bike sent it.</summary>
    public void Notify(byte[] frame) => FrameInjected?.Invoke(frame);

    /// <summary>Delivers the resistance echoes held while <see cref="HoldEchoes"/> was set.</summary>
    public void ReleaseEchoes()
    {
        byte[][] held;
        lock (_gate)
        {
            held = [.. _heldEchoes];
            _heldEchoes.Clear();
        }

        foreach (var frame in held)
        {
            Notify(frame);
        }
    }

    internal void Record(string linkEvent)
    {
        lock (_gate)
        {
            _events.Add(linkEvent);
        }
    }

    internal void Record(SimulatedWrite write)
    {
        lock (_gate)
        {
            _events.Add("write");
            _writes.Add(write);
            var wrote = _wrote;
            _wrote = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            wrote.TrySetResult();
        }
    }

    internal void Hold(byte[] echo)
    {
        lock (_gate)
        {
            _heldEchoes.Add(echo);
        }
    }
}
