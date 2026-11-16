namespace Wattzup.Core.Workouts;

/// <summary>One second of the power trace (L2-050).</summary>
public readonly record struct PowerSample(int RideSeconds, int Power);

/// <summary>
/// The ride's power trace: a fixed ring of 10,800 samples (3 hours), written by the workout engine and read by
/// <c>GET /api/workout/trace</c> (L2-050, L2-038).
/// </summary>
public sealed class PowerTraceHistory
{
    public const int Capacity = 10_800;

    private readonly PowerSample[] _ring = new PowerSample[Capacity];
    private readonly Lock _gate = new();
    private int _next;
    private int _count;

    public void Reset()
    {
        lock (_gate)
        {
            _next = 0;
            _count = 0;
        }
    }

    public void Append(int rideSeconds, int power)
    {
        lock (_gate)
        {
            _ring[_next] = new PowerSample(rideSeconds, power);
            _next = (_next + 1) % Capacity;
            _count = Math.Min(_count + 1, Capacity);
        }
    }

    /// <summary>The samples, oldest first.</summary>
    public IReadOnlyList<PowerSample> Snapshot()
    {
        lock (_gate)
        {
            var result = new PowerSample[_count];
            var first = (_next - _count + Capacity) % Capacity;
            for (var i = 0; i < _count; i++)
            {
                result[i] = _ring[(first + i) % Capacity];
            }

            return result;
        }
    }
}
