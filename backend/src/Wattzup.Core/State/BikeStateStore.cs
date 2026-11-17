namespace Wattzup.Core.State;

/// <summary>
/// The only writer of <see cref="BikeState"/>. Readers take <see cref="Current"/>, an immutable
/// snapshot; changes are applied under a short lock, derived (<see cref="StateDerivations"/>),
/// published by reference swap, and announced through <see cref="StateChanged"/> in order.
/// </summary>
public sealed class BikeStateStore(BikeState initial, TimeProvider time, DisplayNames? displayNames)
{
    private readonly Lock _gate = new();
    private BikeState _current = initial;

    /// <summary>Raised under the store's lock after every change, in order. Handlers must be quick and never block.</summary>
    public event Action<BikeState>? StateChanged;

    public BikeState Current => Volatile.Read(ref _current);

    public TimeProvider Time => time;

    /// <summary>Now as Unix epoch seconds.</summary>
    public double Now => time.GetUtcNow().ToUnixTimeMilliseconds() / 1000.0;

    /// <summary>Applies <paramref name="change"/> and the derivations, then publishes the result.</summary>
    public BikeState Update(Func<BikeState, BikeState> change)
    {
        ArgumentNullException.ThrowIfNull(change);
        lock (_gate)
        {
            var next = StateDerivations.Apply(change(_current), Now, displayNames);
            Volatile.Write(ref _current, next);
            StateChanged?.Invoke(next);
            return next;
        }
    }

    /// <summary>An update with no field change, so time-derived fields stay current (L2-003).</summary>
    public BikeState Touch() => Update(s => s);
}
