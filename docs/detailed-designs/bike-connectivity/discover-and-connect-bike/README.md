# Discover and connect the bike

## Overview

Wattzup reads live riding data from an Echelon indoor bike and controls the bike's resistance. The bike exposes a proprietary Bluetooth Low Energy (BLE) service and has no wired interface. Before any telemetry, resistance command or workout can run, the backend has to find the bike, connect to it and switch on its data stream. This feature covers that start-up path.

**BLE advertisement** — short broadcast packet in which a peripheral announces its name and service identifiers

**GATT characteristic** — addressable value on a BLE peripheral that a client reads, writes or subscribes to

**init sequence** — three fixed commands (device info, resistance range, start data stream) that make the bike begin sending workout data

The feature sits at the bottom of the bike-connectivity subsystem. It runs inside the Wattzup API process as a hosted background service and starts with the process, independent of whether any browser is open. The same service also keeps the HTTP API available when the host has no working Bluetooth adapter, so the dashboard can report the fault instead of failing to load. Connection upkeep after start-up (keepalive and recovery) belongs to the sibling feature `maintain-bike-connection`.

## Description

- **`BikeConnectionService`** — `BackgroundService` in `Wattzup.Api`. It runs the scan → connect → initialise loop for the life of the process and publishes each lifecycle change (`scanning`, `connecting`, `connected`, `error`) to `BikeStateStore`.
- **`EchelonDeviceFilter`** — pure predicate in `Wattzup.Protocol`. It accepts a `BikeAdvertisement` whose name starts with `ECH` (ordinal, case-insensitive) or whose service UUID list contains `EchelonUuids.Service` (case-insensitive) (L2-001).
- **`EchelonUuids`** — constants for the service, write characteristic and notify characteristic UUIDs.
- **`EchelonCommands`** — static command builder in `Wattzup.Protocol`. `InitSequence` returns the device-info, resistance-range and start-stream byte arrays in that order.
- **`IBikeTransport`** — abstraction over the OS Bluetooth stack (`Wattzup.Ble.Abstractions`). `ScanAsync(filter, timeout, ct)` returns the first matching `BikeAdvertisement` or `null`. `ConnectAsync(advertisement, ct)` returns an `IBikeConnection`.
- **`IBikeConnection`** — an open GATT link. It exposes `SubscribeAsync`, `WriteAsync(bytes, withResponse)`, `IsConnected` and a `Disconnected` event.
- **`BikeAdvertisement`** — record holding `Name`, `Address` and `ServiceUuids` as seen during the scan. `DisplayName` returns the name, or the address when the name is empty.
- **`BikeStateStore`** — single-writer owner of `BikeState` in `Wattzup.Core`. `Update(Func<BikeState, BikeState>)` applies a change and raises `StateChanged`, which drives the broadcast.
- **`ConnectivityOptions`** — bound from configuration. It holds `ScanTimeout` (20 s), `InitCommandSpacing` (300 ms) and `ErrorBackoff` (3 s).

The scan lasts at most `ScanTimeout`. If nothing matches, the service sets `error` to `No Echelon bike found yet — pedal to wake it up`, keeps `ble` at `scanning`, and starts the next scan immediately. After a connection opens, the service subscribes to the notify characteristic before it writes any init command. It then writes each init command with response and waits `InitCommandSpacing` between writes (L2-002).

When the adapter is missing or switched off, `IBikeTransport` throws `BluetoothUnavailableException`. The service records `ble = error` with a readable message and retries after `ErrorBackoff`. Kestrel is already listening at that point because the service does not block host start-up (L2-039).

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-001` | `L1-001` | Bike scanning. The backend must scan for BLE devices for up to 20 seconds per attempt and select the first device whose advertised name starts with `ECH` (case-insensitive) or whose advertised service UUIDs include the Echelon service UUID (case-insensitive). |
| `L2-002` | `L1-001` | Connection and initialisation. On selecting a device, the backend must connect, subscribe to the notify characteristic, then send the three init commands in order with write-with-response, 300 ms apart. |
| `L2-039` | `L1-010` | Graceful lifecycle. |

## Diagrams

### System context

The rider wakes the bike by pedalling; Wattzup reaches the bike only through the operating system's Bluetooth stack.

![C4 system context for discovering and connecting the bike](diagrams/c4-context.png)

### Containers

Discovery runs entirely inside the Wattzup API container, which talks to the OS Bluetooth stack through `IBikeTransport`.

![C4 container view for discovering and connecting the bike](diagrams/c4-container.png)

### Components

`BikeConnectionService` drives the loop. It uses `EchelonDeviceFilter` and `EchelonCommands` from the protocol library, calls `IBikeTransport`, and records each lifecycle state in `BikeStateStore`.

![C4 component view for discovering and connecting the bike](diagrams/c4-component.png)

### Class structure

The service depends on the transport abstraction and the pure protocol types. A platform transport is selected at start-up; the service never references a platform type directly.

![Class diagram for discovering and connecting the bike](diagrams/class-structure.png)

### Behaviour — scan, connect and initialise

A scan either times out and repeats, or yields a device. The service then connects, subscribes before writing (L2-002), and sends the 3 init commands 300 ms apart.

![Sequence diagram for scanning, connecting and initialising the bike](diagrams/sequence-scan-connect.png)

### Behaviour — Bluetooth adapter unavailable at start-up

The HTTP host starts regardless. The service records the adapter fault and retries every 3 s until the adapter appears (L2-039).

![Sequence diagram for start-up without a Bluetooth adapter](diagrams/sequence-adapter-unavailable.png)
