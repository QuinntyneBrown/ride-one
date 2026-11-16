using Wattzup.Core.State;
using Wattzup.Protocol;

namespace Wattzup.Core.Machines;

/// <summary>
/// What the connection loop needs to know about one machine (L2-001 to L2-003, L2-063): which advertisement to
/// take, which notify characteristics to subscribe, the init writes, the keepalive and the not-found message.
/// </summary>
public sealed record MachineProfile(
    Machine Machine,
    Func<string?, IReadOnlyList<string>, bool> Matches,
    IReadOnlyList<string> NotifyCharacteristics,
    IReadOnlyList<ReadOnlyMemory<byte>> InitSequence,
    Func<byte, ReadOnlyMemory<byte>> Keepalive,
    string NotFoundMessage)
{
    public const string NoBikeFound = "No Echelon bike found yet — pedal to wake it up";
    public const string NoTreadmillFound = "No Echelon treadmill found yet — switch it on to wake it up";

    public static MachineProfile Bike { get; } = new(
        Machine.Bike,
        EchelonDeviceFilter.Matches,
        EchelonUuids.BikeNotifyCharacteristics,
        EchelonCommands.InitSequence,
        _ => EchelonCommands.Keepalive,
        NoBikeFound);

    public static MachineProfile Treadmill { get; } = new(
        Machine.Treadmill,
        EchelonTreadmillFilter.Matches,
        EchelonUuids.TreadmillNotifyCharacteristics,
        EchelonTreadmillCommands.InitSequence,
        counter => EchelonTreadmillCommands.Keepalive(counter),
        NoTreadmillFound);

    public static MachineProfile For(Machine machine) => machine == Machine.Treadmill ? Treadmill : Bike;
}
