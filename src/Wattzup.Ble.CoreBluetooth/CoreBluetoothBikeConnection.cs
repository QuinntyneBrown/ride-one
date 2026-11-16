using System.Runtime.Versioning;
using Wattzup.Ble.Abstractions;
using Wattzup.Ble.CoreBluetooth.Interop;

namespace Wattzup.Ble.CoreBluetooth;

/// <summary>A CBPeripheral link to the Echelon service. Native callbacks complete tasks; handlers run on the thread pool.</summary>
[SupportedOSPlatform("macos")]
internal sealed class CoreBluetoothBikeConnection(CoreBluetoothBikeTransport transport, IntPtr peripheral) : IBikeConnection
{
    private static readonly TimeSpan StepTimeout = TimeSpan.FromSeconds(15);

    private readonly SemaphoreSlim _writeGate = new(1, 1);
    private TaskCompletionSource? _step;
    private IntPtr _service;
    private IntPtr _write;
    private IntPtr _notify;
    private Action<ReadOnlyMemory<byte>>? _onNotify;
    private int _connected;
    private int _closed;

    public bool IsConnected => Volatile.Read(ref _connected) == 1 && Volatile.Read(ref _closed) == 0;

    public event Action? Disconnected;

    /// <summary>Connects, then discovers the Echelon service and its write and notify characteristics.</summary>
    public async Task OpenAsync(CancellationToken cancellationToken)
    {
        await StepAsync(() => ObjC.SendVoid(transport.Central, ObjC.Sel("connectPeripheral:options:"), peripheral, IntPtr.Zero), cancellationToken).ConfigureAwait(false);
        Volatile.Write(ref _connected, 1);
        using (AutoreleasePool.Push())
        {
            ObjC.SendVoid(peripheral, ObjC.Sel("setDelegate:"), ObjC.Send(transport.Central, ObjC.Sel("delegate")));
        }

        await StepAsync(() => ObjC.SendVoid(peripheral, ObjC.Sel("discoverServices:"), Foundation.Array(Foundation.Uuid(CoreBluetoothBikeTransport.ServiceUuid))), cancellationToken).ConfigureAwait(false);
        using (AutoreleasePool.Push())
        {
            _service = Find(ObjC.Send(peripheral, ObjC.Sel("services")), CoreBluetoothBikeTransport.ServiceUuid)
                ?? throw new IOException("The bike has no Echelon service.");
        }

        await StepAsync(
            () => ObjC.SendVoid(
                peripheral,
                ObjC.Sel("discoverCharacteristics:forService:"),
                Foundation.Array(Foundation.Uuid(CoreBluetoothBikeTransport.WriteUuid), Foundation.Uuid(CoreBluetoothBikeTransport.NotifyUuid)),
                _service),
            cancellationToken).ConfigureAwait(false);
        using (AutoreleasePool.Push())
        {
            var characteristics = ObjC.Send(_service, ObjC.Sel("characteristics"));
            _write = Find(characteristics, CoreBluetoothBikeTransport.WriteUuid) ?? throw new IOException("The bike has no write characteristic.");
            _notify = Find(characteristics, CoreBluetoothBikeTransport.NotifyUuid) ?? throw new IOException("The bike has no notify characteristic.");
        }
    }

    public async Task SubscribeAsync(Action<ReadOnlyMemory<byte>> onNotify, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(onNotify);
        _onNotify = onNotify;
        await StepAsync(() => ObjC.SendVoid(peripheral, ObjC.Sel("setNotifyValue:forCharacteristic:"), (byte)1, _notify), cancellationToken).ConfigureAwait(false);
    }

    public async Task WriteAsync(ReadOnlyMemory<byte> bytes, bool withResponse, CancellationToken cancellationToken)
    {
        if (!IsConnected)
        {
            throw new IOException("The bike is not connected.");
        }

        await _writeGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            void Write()
            {
                ObjC.SendVoid(peripheral, ObjC.Sel("writeValue:forCharacteristic:type:"), Foundation.Data(bytes.Span), _write, withResponse ? 0 : 1);
            }

            if (withResponse)
            {
                await StepAsync(Write, cancellationToken).ConfigureAwait(false);
            }
            else
            {
                using (AutoreleasePool.Push())
                {
                    Write();
                }
            }
        }
        finally
        {
            _writeGate.Release();
        }
    }

    public ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _closed, 1) == 0)
        {
            _onNotify = null;
            using (AutoreleasePool.Push())
            {
                ObjC.SendVoid(transport.Central, ObjC.Sel("cancelPeripheralConnection:"), peripheral);
            }

            _step?.TrySetException(new IOException("The connection was closed."));
            transport.Forget(peripheral);
        }

        _writeGate.Dispose();
        return ValueTask.CompletedTask;
    }

    internal void OnConnected() => _step?.TrySetResult();

    internal void OnFailedToConnect(string? error) => _step?.TrySetException(new IOException(error ?? "The bike refused the connection."));

    internal void OnServicesDiscovered(string? error) => Complete(error);

    internal void OnCharacteristicsDiscovered(IntPtr service, string? error) => Complete(error);

    internal void OnNotifying(string? error) => Complete(error);

    internal void OnWritten(string? error) => Complete(error);

    internal void OnValue(IntPtr characteristic, byte[] bytes)
    {
        if (characteristic == _notify && _onNotify is { } handler)
        {
            ThreadPool.QueueUserWorkItem(_ => handler(bytes));
        }
    }

    internal void OnDisconnected(string? error)
    {
        Volatile.Write(ref _connected, 0);
        _step?.TrySetException(new IOException(error ?? "The bike disconnected."));
        transport.Forget(peripheral);
        if (Interlocked.Exchange(ref _closed, 1) == 0)
        {
            ThreadPool.QueueUserWorkItem(_ => Disconnected?.Invoke());
        }
    }

    private static IntPtr? Find(IntPtr items, string uuid)
    {
        foreach (var item in Foundation.Items(items))
        {
            if (string.Equals(Foundation.UuidText(ObjC.Send(item, ObjC.Sel("UUID"))), uuid, StringComparison.OrdinalIgnoreCase))
            {
                return item;
            }
        }

        return null;
    }

    private void Complete(string? error)
    {
        if (error is null)
        {
            _step?.TrySetResult();
        }
        else
        {
            _step?.TrySetException(new IOException(error));
        }
    }

    /// <summary>Starts one native operation and waits for its delegate callback; only one runs at a time.</summary>
    private async Task StepAsync(Action start, CancellationToken cancellationToken)
    {
        var step = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        _step = step;
        using (AutoreleasePool.Push())
        {
            start();
        }

        try
        {
            await step.Task.WaitAsync(StepTimeout, cancellationToken).ConfigureAwait(false);
        }
        catch (TimeoutException e)
        {
            throw new IOException("The bike did not answer in time.", e);
        }
    }
}
