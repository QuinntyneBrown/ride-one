using System.Runtime.InteropServices;
using System.Runtime.Versioning;

namespace Wattzup.Ble.CoreBluetooth.Interop;

/// <summary>Foundation and CoreBluetooth value helpers: strings, data, arrays, errors and UUIDs.</summary>
[SupportedOSPlatform("macos")]
internal static class Foundation
{
    private const string CoreBluetoothPath = "/System/Library/Frameworks/CoreBluetooth.framework/CoreBluetooth";
    private const string FoundationPath = "/System/Library/Frameworks/Foundation.framework/Foundation";

    private static readonly Lazy<IntPtr> CoreBluetoothLibrary = new(() =>
    {
        NativeLibrary.Load(FoundationPath);
        return NativeLibrary.Load(CoreBluetoothPath);
    });

    /// <summary>Loads the frameworks so their classes are registered with the runtime.</summary>
    public static void EnsureLoaded() => _ = CoreBluetoothLibrary.Value;

    /// <summary>The value of an exported <c>NSString *const</c>, e.g. <c>CBAdvertisementDataLocalNameKey</c>.</summary>
    public static IntPtr CoreBluetoothConstant(string name) => Marshal.ReadIntPtr(NativeLibrary.GetExport(CoreBluetoothLibrary.Value, name));

    public static IntPtr String(string value)
    {
        var utf8 = Marshal.StringToCoTaskMemUTF8(value);
        try
        {
            return ObjC.Send(ObjC.Class("NSString"), ObjC.Sel("stringWithUTF8String:"), utf8);
        }
        finally
        {
            Marshal.FreeCoTaskMem(utf8);
        }
    }

    public static string? ToManaged(IntPtr nsString) =>
        nsString == IntPtr.Zero ? null : Marshal.PtrToStringUTF8(ObjC.Send(nsString, ObjC.Sel("UTF8String")));

    public static unsafe IntPtr Data(ReadOnlySpan<byte> bytes)
    {
        fixed (byte* p = bytes)
        {
            return ObjC.Send(ObjC.Class("NSData"), ObjC.Sel("dataWithBytes:length:"), (IntPtr)p, (nuint)bytes.Length);
        }
    }

    public static byte[] Bytes(IntPtr nsData)
    {
        if (nsData == IntPtr.Zero)
        {
            return [];
        }

        var length = checked((int)ObjC.SendNUInt(nsData, ObjC.Sel("length")));
        var copy = new byte[length];
        if (length > 0)
        {
            Marshal.Copy(ObjC.Send(nsData, ObjC.Sel("bytes")), copy, 0, length);
        }

        return copy;
    }

    public static IReadOnlyList<IntPtr> Items(IntPtr nsArray)
    {
        if (nsArray == IntPtr.Zero)
        {
            return [];
        }

        var count = (int)ObjC.SendNUInt(nsArray, ObjC.Sel("count"));
        var items = new IntPtr[count];
        for (var i = 0; i < count; i++)
        {
            items[i] = ObjC.Send(nsArray, ObjC.Sel("objectAtIndex:"), (nuint)i);
        }

        return items;
    }

    public static IntPtr Array(params IntPtr[] items)
    {
        var array = ObjC.Send(ObjC.Class("NSMutableArray"), ObjC.Sel("array"));
        foreach (var item in items)
        {
            ObjC.SendVoid(array, ObjC.Sel("addObject:"), item);
        }

        return array;
    }

    public static IntPtr ObjectForKey(IntPtr dictionary, IntPtr key) =>
        dictionary == IntPtr.Zero ? IntPtr.Zero : ObjC.Send(dictionary, ObjC.Sel("objectForKey:"), key);

    public static string? ErrorText(IntPtr nsError) =>
        nsError == IntPtr.Zero ? null : ToManaged(ObjC.Send(nsError, ObjC.Sel("localizedDescription")));

    public static IntPtr Uuid(string uuid) => ObjC.Send(ObjC.Class("CBUUID"), ObjC.Sel("UUIDWithString:"), String(uuid));

    /// <summary>A CBUUID's string, lowercase: <c>180d</c> for 16-bit UUIDs, the full form for 128-bit ones.</summary>
    public static string UuidText(IntPtr cbUuid) => (ToManaged(ObjC.Send(cbUuid, ObjC.Sel("UUIDString"))) ?? string.Empty).ToLowerInvariant();

    /// <summary>An NSUUID's string, e.g. a peripheral's identifier.</summary>
    public static string NsUuidText(IntPtr nsUuid) => ToManaged(ObjC.Send(nsUuid, ObjC.Sel("UUIDString"))) ?? string.Empty;
}
