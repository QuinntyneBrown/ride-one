namespace Wattzup.Core.State;

/// <summary>
/// The only writer of <see cref="BikeState"/>. Readers take <see cref="Current"/>, an immutable
/// snapshot; changes are applied under a short lock and published by reference swap.
/// </summary>
public sealed class BikeStateStore(BikeState initial)
{
    private BikeState _current = initial;

    public BikeState Current => Volatile.Read(ref _current);
}
