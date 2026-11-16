using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;

namespace Wattzup.Ble.CoreBluetooth.Interop;

/// <summary>The callbacks a <see cref="BleDelegate"/> instance forwards, all on the transport's serial dispatch queue.</summary>
[SupportedOSPlatform("macos")]
internal interface IBleCallbacks
{
    void StateUpdated(IntPtr central);

    void Discovered(IntPtr peripheral, IntPtr advertisementData);

    void Connected(IntPtr peripheral);

    void FailedToConnect(IntPtr peripheral, IntPtr error);

    void DisconnectedPeripheral(IntPtr peripheral, IntPtr error);

    void ServicesDiscovered(IntPtr peripheral, IntPtr error);

    void CharacteristicsDiscovered(IntPtr peripheral, IntPtr service, IntPtr error);

    void ValueUpdated(IntPtr peripheral, IntPtr characteristic, IntPtr error);

    void ValueWritten(IntPtr peripheral, IntPtr characteristic, IntPtr error);

    void NotificationStateUpdated(IntPtr peripheral, IntPtr characteristic, IntPtr error);
}

/// <summary>
/// An Objective-C class, <c>WattzupBleDelegate</c>, registered at run time as both CBCentralManagerDelegate and
/// CBPeripheralDelegate. Each instance forwards to one <see cref="IBleCallbacks"/>. No exception crosses back into
/// native code.
/// </summary>
[SupportedOSPlatform("macos")]
internal static unsafe class BleDelegate
{
    private static readonly ConcurrentDictionary<IntPtr, IBleCallbacks> Targets = new();
    private static readonly Lazy<IntPtr> ClassHandle = new(Register);

    public static IntPtr Create(IBleCallbacks target)
    {
        var instance = ObjC.New(ClassHandle.Value);
        Targets[instance] = target;
        return instance;
    }

    private static IntPtr Register()
    {
        Foundation.EnsureLoaded();
        var existing = ObjC.Class("WattzupBleDelegate");
        if (existing != IntPtr.Zero)
        {
            return existing;
        }

        var cls = ObjC.objc_allocateClassPair(ObjC.Class("NSObject"), "WattzupBleDelegate", 0);
        Add(cls, "centralManagerDidUpdateState:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&DidUpdateState, "v@:@");
        Add(cls, "centralManager:didDiscoverPeripheral:advertisementData:RSSI:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidDiscover, "v@:@@@@");
        Add(cls, "centralManager:didConnectPeripheral:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidConnect, "v@:@@");
        Add(cls, "centralManager:didFailToConnectPeripheral:error:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidFailToConnect, "v@:@@@");
        Add(cls, "centralManager:didDisconnectPeripheral:error:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidDisconnect, "v@:@@@");
        Add(cls, "peripheral:didDiscoverServices:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidDiscoverServices, "v@:@@");
        Add(cls, "peripheral:didDiscoverCharacteristicsForService:error:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidDiscoverCharacteristics, "v@:@@@");
        Add(cls, "peripheral:didUpdateValueForCharacteristic:error:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidUpdateValue, "v@:@@@");
        Add(cls, "peripheral:didWriteValueForCharacteristic:error:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidWriteValue, "v@:@@@");
        Add(cls, "peripheral:didUpdateNotificationStateForCharacteristic:error:", (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, IntPtr, IntPtr, void>)&DidUpdateNotificationState, "v@:@@@");
        foreach (var protocol in new[] { "CBCentralManagerDelegate", "CBPeripheralDelegate" })
        {
            var p = ObjC.objc_getProtocol(protocol);
            if (p != IntPtr.Zero)
            {
                ObjC.class_addProtocol(cls, p);
            }
        }

        ObjC.objc_registerClassPair(cls);
        return cls;
    }

    private static void Add(IntPtr cls, string selector, IntPtr implementation, string types)
    {
        if (!ObjC.class_addMethod(cls, ObjC.Sel(selector), implementation, types))
        {
            throw new InvalidOperationException($"Could not add {selector} to WattzupBleDelegate.");
        }
    }

    private static void Forward(IntPtr self, Action<IBleCallbacks> call)
    {
        try
        {
            if (Targets.TryGetValue(self, out var target))
            {
                call(target);
            }
        }
#pragma warning disable CA1031 // An exception must never unwind into CoreBluetooth's dispatch queue.
        catch (Exception e)
#pragma warning restore CA1031
        {
            System.Diagnostics.Trace.TraceError($"CoreBluetooth callback failed: {e}");
        }
    }

    [UnmanagedCallersOnly]
    private static void DidUpdateState(IntPtr self, IntPtr cmd, IntPtr central) => Forward(self, t => t.StateUpdated(central));

    [UnmanagedCallersOnly]
    private static void DidDiscover(IntPtr self, IntPtr cmd, IntPtr central, IntPtr peripheral, IntPtr data, IntPtr rssi) =>
        Forward(self, t => t.Discovered(peripheral, data));

    [UnmanagedCallersOnly]
    private static void DidConnect(IntPtr self, IntPtr cmd, IntPtr central, IntPtr peripheral) => Forward(self, t => t.Connected(peripheral));

    [UnmanagedCallersOnly]
    private static void DidFailToConnect(IntPtr self, IntPtr cmd, IntPtr central, IntPtr peripheral, IntPtr error) =>
        Forward(self, t => t.FailedToConnect(peripheral, error));

    [UnmanagedCallersOnly]
    private static void DidDisconnect(IntPtr self, IntPtr cmd, IntPtr central, IntPtr peripheral, IntPtr error) =>
        Forward(self, t => t.DisconnectedPeripheral(peripheral, error));

    [UnmanagedCallersOnly]
    private static void DidDiscoverServices(IntPtr self, IntPtr cmd, IntPtr peripheral, IntPtr error) =>
        Forward(self, t => t.ServicesDiscovered(peripheral, error));

    [UnmanagedCallersOnly]
    private static void DidDiscoverCharacteristics(IntPtr self, IntPtr cmd, IntPtr peripheral, IntPtr service, IntPtr error) =>
        Forward(self, t => t.CharacteristicsDiscovered(peripheral, service, error));

    [UnmanagedCallersOnly]
    private static void DidUpdateValue(IntPtr self, IntPtr cmd, IntPtr peripheral, IntPtr characteristic, IntPtr error) =>
        Forward(self, t => t.ValueUpdated(peripheral, characteristic, error));

    [UnmanagedCallersOnly]
    private static void DidWriteValue(IntPtr self, IntPtr cmd, IntPtr peripheral, IntPtr characteristic, IntPtr error) =>
        Forward(self, t => t.ValueWritten(peripheral, characteristic, error));

    [UnmanagedCallersOnly]
    private static void DidUpdateNotificationState(IntPtr self, IntPtr cmd, IntPtr peripheral, IntPtr characteristic, IntPtr error) =>
        Forward(self, t => t.NotificationStateUpdated(peripheral, characteristic, error));
}
