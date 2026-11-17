using Wattzup.Ble.Abstractions;
using Wattzup.Core.State;
using Wattzup.Protocol;

namespace Wattzup.Core.Machines;

/// <summary>
/// The scan filter: records every Echelon machine heard and accepts only the chosen one (L2-074 criteria 1 and 4).
/// While treadmill support is off, a treadmill is neither recorded nor accepted (L2-075 criterion 4).
/// </summary>
public static class NearbyFilter
{
    public static Func<BikeAdvertisement, bool> Build(Machine chosen, NearbyMachines nearby, bool treadmillEnabled)
    {
        ArgumentNullException.ThrowIfNull(nearby);
        return advertisement =>
        {
            ArgumentNullException.ThrowIfNull(advertisement);
            Machine? heard = EchelonTreadmillFilter.Matches(advertisement.Name, advertisement.ServiceUuids) ? Machine.Treadmill
                : EchelonDeviceFilter.Matches(advertisement.Name, advertisement.ServiceUuids) ? Machine.Bike
                : null;
            if (heard is not { } machine || (machine == Machine.Treadmill && !treadmillEnabled))
            {
                return false;
            }

            nearby.Heard(machine, advertisement);
            return machine == chosen;
        };
    }
}
