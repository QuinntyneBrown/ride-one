using Wattzup.Core.State;

namespace Wattzup.Core.Machines;

/// <summary>
/// Holds which machine Wattzup drives (L2-062). The choice lives in the state store's <c>machine</c>; changing it
/// resets the machine-specific fields (L2-070) and raises <see cref="Changed"/> so the connection loop drops the
/// link and scans for the other machine.
/// </summary>
public sealed class MachineSelector(BikeStateStore store)
{
    /// <summary>Raised after the machine changed. Handlers must be quick and never block.</summary>
    public event Action<Machine>? Changed;

    public Machine Current => store.Current.Machine;

    /// <summary>Chooses <paramref name="machine"/>; false when it was already chosen, which changes nothing.</summary>
    public bool Select(Machine machine)
    {
        if (store.Current.Machine == machine)
        {
            return false;
        }

        store.Update(s => Reset(s) with { Machine = machine, Ble = BleState.Scanning, Error = null });
        Changed?.Invoke(machine);
        return true;
    }

    /// <summary>Clears every field that belongs to one machine or one link (L2-070 criterion 3).</summary>
    public static BikeState Reset(BikeState state)
    {
        ArgumentNullException.ThrowIfNull(state);
        return state with
        {
            Device = null,
            Workout = null,
            Resistance = null,
            TargetResistance = null,
            Cadence = null,
            SpeedKmh = null,
            SpeedMph = null,
            Power = null,
            TargetPower = null,
            AvgPower = null,
            DistanceKm = null,
            Kcal = null,
            Commands = [],
            TargetSpeed = null,
            Incline = null,
            TargetIncline = null,
            Belt = null,
            BeltCountdown = null,
            ClimbM = null,
        };
    }
}
