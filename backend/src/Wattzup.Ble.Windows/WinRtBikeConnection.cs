using System.Threading.Channels;
using Wattzup.Ble.Abstractions;
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Storage.Streams;

namespace Wattzup.Ble.Windows;

/// <summary>An open link to the bike through a <see cref="BluetoothLEDevice"/> and its Echelon characteristics.</summary>
internal sealed class WinRtBikeConnection : IBikeConnection
{
    private readonly BluetoothLEDevice _device;
    private readonly GattSession _session;
    private readonly GattDeviceService _service;
    private readonly GattCharacteristic _write;
    private readonly GattCharacteristic _notify;
    private readonly Channel<byte[]> _frames = Channel.CreateUnbounded<byte[]>(new UnboundedChannelOptions { SingleReader = true });
    private Task? _pump;
    private int _connected = 1;
    private int _disposed;

    public WinRtBikeConnection(BluetoothLEDevice device, GattSession session, GattDeviceService service, GattCharacteristic write, GattCharacteristic notify)
    {
        _device = device;
        _session = session;
        _service = service;
        _write = write;
        _notify = notify;
        device.ConnectionStatusChanged += OnConnectionStatusChanged;
    }

    public bool IsConnected => Volatile.Read(ref _connected) == 1;

    public event Action? Disconnected;

    public async Task SubscribeAsync(Action<ReadOnlyMemory<byte>> onNotify, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(onNotify);
        _pump ??= Task.Run(() => PumpAsync(onNotify), CancellationToken.None);
        _notify.ValueChanged += OnValueChanged;
        var status = await _notify.WriteClientCharacteristicConfigurationDescriptorAsync(
            GattClientCharacteristicConfigurationDescriptorValue.Notify).AsTask(cancellationToken).ConfigureAwait(false);
        WinRtBikeTransport.ThrowIfFailed(status, "subscribe to the notify characteristic");
    }

    public async Task WriteAsync(ReadOnlyMemory<byte> bytes, bool withResponse, CancellationToken cancellationToken)
    {
        if (!IsConnected)
        {
            throw new InvalidOperationException("The bike is not connected.");
        }

        var buffer = ToBuffer(bytes.Span);
        var option = withResponse ? GattWriteOption.WriteWithResponse : GattWriteOption.WriteWithoutResponse;
        var status = await _write.WriteValueAsync(buffer, option).AsTask(cancellationToken).ConfigureAwait(false);
        WinRtBikeTransport.ThrowIfFailed(status, "write to the bike");
    }

    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _disposed, 1) == 1)
        {
            return;
        }

        Volatile.Write(ref _connected, 0);
        _device.ConnectionStatusChanged -= OnConnectionStatusChanged;
        _notify.ValueChanged -= OnValueChanged;
        _frames.Writer.TryComplete();
        if (_pump is { } pump)
        {
            await pump.ConfigureAwait(false);
        }

        // Releasing every GATT object and the session lets Windows close the link.
        _service.Dispose();
        _session.Dispose();
        _device.Dispose();
    }

    private static IBuffer ToBuffer(ReadOnlySpan<byte> bytes)
    {
        using var writer = new DataWriter();
        writer.WriteBytes(bytes.ToArray());
        return writer.DetachBuffer();
    }

    private static byte[] ToArray(IBuffer buffer)
    {
        var bytes = new byte[buffer.Length];
        using var reader = DataReader.FromBuffer(buffer);
        reader.ReadBytes(bytes);
        return bytes;
    }

    // Native callback: copy the frame and leave; the handler runs on the pump, in arrival order.
    private void OnValueChanged(GattCharacteristic sender, GattValueChangedEventArgs args)
    {
        _frames.Writer.TryWrite(ToArray(args.CharacteristicValue));
    }

    // Native callback: never raise Disconnected on it.
    private void OnConnectionStatusChanged(BluetoothLEDevice sender, object args)
    {
        if (sender.ConnectionStatus == BluetoothConnectionStatus.Disconnected)
        {
            _ = Task.Run(Drop, CancellationToken.None);
        }
    }

    private async Task PumpAsync(Action<ReadOnlyMemory<byte>> onNotify)
    {
        await foreach (var frame in _frames.Reader.ReadAllAsync().ConfigureAwait(false))
        {
            if (!IsConnected)
            {
                continue;
            }

            try
            {
                onNotify(frame);
            }
#pragma warning disable CA1031 // A faulty handler must not stop later frames being delivered.
            catch (Exception)
#pragma warning restore CA1031
            {
            }
        }
    }

    private void Drop()
    {
        if (Interlocked.Exchange(ref _connected, 0) == 1)
        {
            Disconnected?.Invoke();
        }
    }
}
