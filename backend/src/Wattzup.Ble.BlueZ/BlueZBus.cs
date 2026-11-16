using System.Threading.Channels;
using Tmds.DBus.Protocol;
using Wattzup.Ble.Abstractions;

namespace Wattzup.Ble.BlueZ;

/// <summary>A signal from BlueZ, already read off the D-Bus receive loop.</summary>
internal abstract record BusEvent;

/// <summary><c>org.freedesktop.DBus.Properties.PropertiesChanged</c> on an object under <c>/org/bluez</c>.</summary>
internal sealed record PropertiesChanged(string Path, string Interface, Dictionary<string, VariantValue> Changed) : BusEvent;

/// <summary><c>org.freedesktop.DBus.ObjectManager.InterfacesAdded</c>.</summary>
internal sealed record InterfacesAdded(string Path, Dictionary<string, Dictionary<string, VariantValue>> Interfaces) : BusEvent;

/// <summary><c>org.freedesktop.DBus.ObjectManager.InterfacesRemoved</c>.</summary>
internal sealed record InterfacesRemoved(string Path, string[] Interfaces) : BusEvent;

/// <summary>The system bus connection closed or failed; every object seen through it is gone.</summary>
internal sealed record BusClosed : BusEvent;

/// <summary>Writes the body of a method call.</summary>
internal delegate void BodyWriter(ref MessageWriter writer);

/// <summary>
/// The system D-Bus connection to <c>org.bluez</c>. Signals are copied off the library's receive loop into a
/// channel and raised from one thread-pool task, in order, so no handler ever runs on the D-Bus reader.
/// </summary>
internal sealed class BlueZBus : IAsyncDisposable
{
    public const string Service = "org.bluez";
    public const string Adapter1 = "org.bluez.Adapter1";
    public const string Device1 = "org.bluez.Device1";
    public const string GattCharacteristic1 = "org.bluez.GattCharacteristic1";

    private const string PropertiesInterface = "org.freedesktop.DBus.Properties";
    private const string ObjectManagerInterface = "org.freedesktop.DBus.ObjectManager";
    private const string BlueZRoot = "/org/bluez";

    private static readonly HashSet<string> UnavailableErrors = new(StringComparer.Ordinal)
    {
        "org.bluez.Error.NotReady",
        "org.freedesktop.DBus.Error.ServiceUnknown",
        "org.freedesktop.DBus.Error.NameHasNoOwner",
        "org.freedesktop.DBus.Error.AccessDenied",
    };

    private readonly DBusConnection _connection;
    private readonly Channel<BusEvent> _events = Channel.CreateUnbounded<BusEvent>(
        new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });

    private readonly List<IDisposable> _watches = [];
    private readonly Task _pump;
    private int _closed;

    private BlueZBus(DBusConnection connection)
    {
        _connection = connection;
        _pump = Task.Run(PumpAsync);
    }

    /// <summary>Raised on a thread-pool thread for every signal, in arrival order.</summary>
    public event Action<BusEvent>? EventReceived;

    public bool IsClosed => Volatile.Read(ref _closed) == 1;

    /// <exception cref="BluetoothUnavailableException">The system bus cannot be reached.</exception>
    public static async Task<BlueZBus> OpenAsync(CancellationToken cancellationToken)
    {
        var address = DBusAddress.System
            ?? throw new BluetoothUnavailableException("No D-Bus system bus address is configured.");
        var connection = new DBusConnection(address);
        BlueZBus? bus = null;
        try
        {
            await connection.ConnectAsync().AsTask().WaitAsync(cancellationToken).ConfigureAwait(false);
            bus = new BlueZBus(connection);
            await bus.WatchAsync().ConfigureAwait(false);
            return bus;
        }
        catch (Exception ex) when (ex is not OperationCanceledException and not BluetoothUnavailableException)
        {
            if (bus is not null)
            {
                await bus.DisposeAsync().ConfigureAwait(false);
            }
            else
            {
                connection.Dispose();
            }

            throw new BluetoothUnavailableException("The D-Bus system bus cannot be reached.", ex);
        }
        catch
        {
            if (bus is not null)
            {
                await bus.DisposeAsync().ConfigureAwait(false);
            }
            else
            {
                connection.Dispose();
            }

            throw;
        }
    }

    /// <summary>Calls a method on <c>org.bluez</c> that returns nothing the caller needs.</summary>
    public Task CallAsync(string path, string @interface, string member, CancellationToken cancellationToken, string? signature = null, BodyWriter? body = null)
        => CallAsync(path, @interface, member, static (_, _) => true, cancellationToken, signature, body);

    /// <summary>Calls a method on <c>org.bluez</c> and reads its reply.</summary>
    /// <exception cref="BluetoothUnavailableException">BlueZ is not running, the adapter is off or access is denied.</exception>
    public async Task<T> CallAsync<T>(string path, string @interface, string member, MessageValueReader<T> reader, CancellationToken cancellationToken, string? signature = null, BodyWriter? body = null)
    {
        MessageBuffer message;
        var writer = _connection.GetMessageWriter();
        try
        {
            writer.WriteMethodCallHeader(Service, path, @interface, member, signature, MessageFlags.None);
            body?.Invoke(ref writer);
            message = writer.CreateMessage();
        }
        finally
        {
            writer.Dispose();
        }

        try
        {
            return await _connection.CallMethodAsync(message, reader, null).WaitAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DBusErrorReplyException ex) when (UnavailableErrors.Contains(ex.ErrorName))
        {
            throw new BluetoothUnavailableException($"{ex.ErrorName}: {ex.ErrorMessage}", ex);
        }
        catch (DBusConnectionClosedException ex)
        {
            throw new BluetoothUnavailableException("The D-Bus system bus connection closed.", ex);
        }
    }

    /// <summary>Every BlueZ object with its interfaces and their properties.</summary>
    public Task<Dictionary<string, Dictionary<string, Dictionary<string, VariantValue>>>> GetManagedObjectsAsync(CancellationToken cancellationToken)
        => CallAsync("/", ObjectManagerInterface, "GetManagedObjects", static (message, _) =>
        {
            var reader = message.GetBodyReader();
            var objects = new Dictionary<string, Dictionary<string, Dictionary<string, VariantValue>>>(StringComparer.Ordinal);
            var end = reader.ReadDictionaryStart();
            while (reader.HasNext(end))
            {
                var path = reader.ReadObjectPathAsString();
                objects[path] = ReadInterfaces(ref reader);
            }

            return objects;
        }, cancellationToken);

    /// <summary>Reads one property through <c>org.freedesktop.DBus.Properties.Get</c>.</summary>
    public Task<VariantValue> GetPropertyAsync(string path, string @interface, string name, CancellationToken cancellationToken)
        => CallAsync(path, PropertiesInterface, "Get", static (message, _) => message.GetBodyReader().ReadVariantValue(), cancellationToken, "ss", (ref MessageWriter w) =>
        {
            w.WriteString(@interface);
            w.WriteString(name);
        });

    public async ValueTask DisposeAsync()
    {
        MarkClosed();
        foreach (var watch in _watches)
        {
            watch.Dispose();
        }

        _connection.Dispose();
        await _pump.ConfigureAwait(false);
    }

    private static Dictionary<string, Dictionary<string, VariantValue>> ReadInterfaces(ref Reader reader)
    {
        var interfaces = new Dictionary<string, Dictionary<string, VariantValue>>(StringComparer.Ordinal);
        var end = reader.ReadDictionaryStart();
        while (reader.HasNext(end))
        {
            var name = reader.ReadString();
            interfaces[name] = reader.ReadDictionaryOfStringToVariantValue();
        }

        return interfaces;
    }

    private async Task WatchAsync()
    {
        const ObserverFlags closeFlags = ObserverFlags.EmitOnConnectionClosed | ObserverFlags.EmitOnConnectionFailed;

        _watches.Add(await _connection.AddMatchAsync(
            new MatchRule
            {
                Type = MessageType.Signal,
                Interface = PropertiesInterface,
                Member = "PropertiesChanged",
                PathNamespace = BlueZRoot,
            },
            static (message, _) =>
            {
                if (message.SignatureAsString != "sa{sv}as")
                {
                    return null;
                }

                var reader = message.GetBodyReader();
                var @interface = reader.ReadString();
                var changed = reader.ReadDictionaryOfStringToVariantValue();
                return (BusEvent)new PropertiesChanged(message.PathAsString ?? string.Empty, @interface, changed);
            },
            OnSignal,
            emitOnCapturedContext: false,
            closeFlags).ConfigureAwait(false));

        _watches.Add(await _connection.AddMatchAsync(
            new MatchRule { Type = MessageType.Signal, Path = "/", Interface = ObjectManagerInterface, Member = "InterfacesAdded" },
            static (message, _) =>
            {
                if (message.SignatureAsString != "oa{sa{sv}}")
                {
                    return null;
                }

                var reader = message.GetBodyReader();
                var path = reader.ReadObjectPathAsString();
                return (BusEvent)new InterfacesAdded(path, ReadInterfaces(ref reader));
            },
            OnSignal,
            emitOnCapturedContext: false,
            ObserverFlags.None).ConfigureAwait(false));

        _watches.Add(await _connection.AddMatchAsync(
            new MatchRule { Type = MessageType.Signal, Path = "/", Interface = ObjectManagerInterface, Member = "InterfacesRemoved" },
            static (message, _) =>
            {
                if (message.SignatureAsString != "oas")
                {
                    return null;
                }

                var reader = message.GetBodyReader();
                var path = reader.ReadObjectPathAsString();
                return (BusEvent)new InterfacesRemoved(path, reader.ReadArrayOfString());
            },
            OnSignal,
            emitOnCapturedContext: false,
            ObserverFlags.None).ConfigureAwait(false));
    }

    // Runs on the library's receive loop: only hand the event over, never block or call back out.
    private void OnSignal(Notification<BusEvent?> notification)
    {
        if (notification.IsCompletion)
        {
            MarkClosed();
            return;
        }

        if (notification.HasValue && notification.Value is { } busEvent && IsBlueZObject(busEvent))
        {
            _events.Writer.TryWrite(busEvent);
        }
    }

    private static bool IsBlueZObject(BusEvent busEvent) => busEvent switch
    {
        InterfacesAdded added => added.Path.StartsWith(BlueZRoot + "/", StringComparison.Ordinal),
        InterfacesRemoved removed => removed.Path.StartsWith(BlueZRoot + "/", StringComparison.Ordinal),
        _ => true,
    };

    private void MarkClosed()
    {
        if (Interlocked.Exchange(ref _closed, 1) == 0)
        {
            _events.Writer.TryWrite(new BusClosed());
            _events.Writer.TryComplete();
        }
    }

    private async Task PumpAsync()
    {
        await foreach (var busEvent in _events.Reader.ReadAllAsync().ConfigureAwait(false))
        {
            var handlers = EventReceived;
            if (handlers is null)
            {
                continue;
            }

            foreach (var handler in handlers.GetInvocationList().Cast<Action<BusEvent>>())
            {
                try
                {
                    handler(busEvent);
                }
#pragma warning disable CA1031 // One faulty subscriber must not stop signals reaching the others.
                catch (Exception)
#pragma warning restore CA1031
                {
                }
            }
        }
    }
}
