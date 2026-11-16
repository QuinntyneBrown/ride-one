using System.Runtime.InteropServices;
using System.Runtime.Versioning;

namespace Wattzup.Ble.CoreBluetooth.Interop;

/// <summary>
/// The Objective-C runtime calls the transport needs. <c>objc_msgSend</c> is declared once per signature, as Apple
/// requires on arm64 (ADR 0008).
/// </summary>
[SupportedOSPlatform("macos")]
internal static partial class ObjC
{
    private const string Lib = "/usr/lib/libobjc.A.dylib";

    [LibraryImport(Lib, StringMarshalling = StringMarshalling.Utf8)]
    public static partial IntPtr objc_getClass(string name);

    [LibraryImport(Lib, StringMarshalling = StringMarshalling.Utf8)]
    public static partial IntPtr objc_getProtocol(string name);

    [LibraryImport(Lib, StringMarshalling = StringMarshalling.Utf8)]
    public static partial IntPtr sel_registerName(string name);

    [LibraryImport(Lib, StringMarshalling = StringMarshalling.Utf8)]
    public static partial IntPtr objc_allocateClassPair(IntPtr superclass, string name, nuint extraBytes);

    [LibraryImport(Lib)]
    public static partial void objc_registerClassPair(IntPtr cls);

    [LibraryImport(Lib, StringMarshalling = StringMarshalling.Utf8)]
    [return: MarshalAs(UnmanagedType.I1)]
    public static partial bool class_addMethod(IntPtr cls, IntPtr selector, IntPtr implementation, string types);

    [LibraryImport(Lib)]
    [return: MarshalAs(UnmanagedType.I1)]
    public static partial bool class_addProtocol(IntPtr cls, IntPtr protocol);

    [LibraryImport(Lib)]
    public static partial IntPtr objc_retain(IntPtr obj);

    [LibraryImport(Lib)]
    public static partial void objc_release(IntPtr obj);

    [LibraryImport(Lib)]
    public static partial IntPtr objc_autoreleasePoolPush();

    [LibraryImport(Lib)]
    public static partial void objc_autoreleasePoolPop(IntPtr pool);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial IntPtr Send(IntPtr receiver, IntPtr selector);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial IntPtr Send(IntPtr receiver, IntPtr selector, IntPtr a);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial IntPtr Send(IntPtr receiver, IntPtr selector, IntPtr a, IntPtr b);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial IntPtr Send(IntPtr receiver, IntPtr selector, IntPtr a, IntPtr b, IntPtr c);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial IntPtr Send(IntPtr receiver, IntPtr selector, IntPtr a, nuint b);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial IntPtr Send(IntPtr receiver, IntPtr selector, nuint a);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial void SendVoid(IntPtr receiver, IntPtr selector, IntPtr a, IntPtr b);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial void SendVoid(IntPtr receiver, IntPtr selector, IntPtr a);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial void SendVoid(IntPtr receiver, IntPtr selector);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial void SendVoid(IntPtr receiver, IntPtr selector, byte a, IntPtr b);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial void SendVoid(IntPtr receiver, IntPtr selector, IntPtr a, IntPtr b, nint c);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial nint SendNInt(IntPtr receiver, IntPtr selector);

    [LibraryImport(Lib, EntryPoint = "objc_msgSend")]
    public static partial nuint SendNUInt(IntPtr receiver, IntPtr selector);

    public static IntPtr Sel(string name) => sel_registerName(name);

    public static IntPtr Class(string name) => objc_getClass(name);

    /// <summary><c>[[cls alloc] init]</c>.</summary>
    public static IntPtr New(IntPtr cls) => Send(Send(cls, Sel("alloc")), Sel("init"));
}

/// <summary>An autorelease pool around Objective-C calls made from a managed thread.</summary>
[SupportedOSPlatform("macos")]
internal readonly struct AutoreleasePool : IDisposable
{
    private readonly IntPtr _pool;

    private AutoreleasePool(IntPtr pool) => _pool = pool;

    public static AutoreleasePool Push() => new(ObjC.objc_autoreleasePoolPush());

    public void Dispose() => ObjC.objc_autoreleasePoolPop(_pool);
}

/// <summary>libdispatch, for the private serial queue CoreBluetooth calls back on.</summary>
[SupportedOSPlatform("macos")]
internal static partial class Dispatch
{
    [LibraryImport("/usr/lib/libSystem.B.dylib", StringMarshalling = StringMarshalling.Utf8)]
    public static partial IntPtr dispatch_queue_create(string label, IntPtr attributes);
}
