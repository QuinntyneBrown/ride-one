using Wattzup.Ble.Abstractions;
using Wattzup.Core.State;

namespace Wattzup.Core.Machines;

/// <summary>
/// The only code that changes <c>nearby</c> (L2-074). Advertisements change a pending list; a timer writes it into the
/// store at most once a second, and only when it changed, and removes entries not heard for 30 s unless held.
/// </summary>
public sealed class NearbyMachines : IDisposable
{
    public static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(1);

    public const double ExpirySeconds = 30;

    private readonly Lock _gate = new();
    private readonly BikeStateStore _store;
    private readonly DisplayNames _names;
    private readonly ITimer _timer;
    private readonly SortedDictionary<Machine, NearbyMachine> _entries = [];
    private readonly HashSet<Machine> _held = [];
    private bool _dirty;

    public NearbyMachines(BikeStateStore store, DisplayNames names, TimeProvider time)
    {
        ArgumentNullException.ThrowIfNull(store);
        ArgumentNullException.ThrowIfNull(time);
        _store = store;
        _names = names;
        _timer = time.CreateTimer(_ => Flush(), null, FlushInterval, FlushInterval);
    }

    /// <summary>Replaces <paramref name="machine"/>'s entry with one built from <paramref name="advertisement"/>.</summary>
    public void Heard(Machine machine, BikeAdvertisement advertisement)
    {
        ArgumentNullException.ThrowIfNull(advertisement);
        var name = _names.For(machine);
        var label = string.IsNullOrWhiteSpace(name) ? advertisement.DisplayName : name;
        var entry = new NearbyMachine(machine, advertisement.Name, label, advertisement.Rssi, SignalBars.FromRssi(advertisement.Rssi), _store.Now);
        lock (_gate)
        {
            _entries[machine] = entry;
            _dirty = true;
        }
    }

    /// <summary>The chosen machine's link opened: its entry keeps its last RSSI and does not expire (L2-074 criterion 4).</summary>
    public void Hold(Machine machine)
    {
        lock (_gate)
        {
            _held.Add(machine);
        }
    }

    /// <summary>The link closed: the entry expires 30 s from now unless heard again.</summary>
    public void Release(Machine machine)
    {
        lock (_gate)
        {
            if (_held.Remove(machine) && _entries.TryGetValue(machine, out var entry))
            {
                _entries[machine] = entry with { SeenAt = _store.Now };
                _dirty = true;
            }
        }
    }

    public void Dispose() => _timer.Dispose();

    private void Flush()
    {
        NearbyMachine[] snapshot;
        lock (_gate)
        {
            var now = _store.Now;
            foreach (var (machine, entry) in _entries.ToList())
            {
                if (!_held.Contains(machine) && now - entry.SeenAt >= ExpirySeconds)
                {
                    _entries.Remove(machine);
                    _dirty = true;
                }
            }

            if (!_dirty)
            {
                return;
            }

            _dirty = false;
            snapshot = [.. _entries.Values];
        }

        _store.Update(s => s with { Nearby = snapshot });
    }
}
