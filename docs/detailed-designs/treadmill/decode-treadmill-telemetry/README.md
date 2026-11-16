# Decode treadmill telemetry

## Overview

Once connected, the Echelon treadmill notifies short byte frames on its two notify characteristics, `…f3` and `…f4`. Two frame types carry the metrics the rider sees: `D3` carries the belt speed and `D2` the incline. This feature turns those frames into `speed_kmh`, `speed_mph` and `incline`, derives the state of the belt from the speed, and adds up the ride's distance. The treadmill notifies speed and incline only when they change, so the last reported value stands until the next frame.

**speed frame** — frame of type `0xD3`, at least 6 bytes, carrying the belt speed in metres per hour as a big-endian 16-bit value at bytes 3–4

**incline frame** — frame of type `0xD2`, at least 5 bytes, carrying the incline in whole percent at byte 3

**belt state** — whether the belt is moving, `stopped`, `starting` or `running`, carried as `belt` (L2-064, L2-066)

**ride distance** — kilometres covered while a workout is running, `distance_km`, integrated from the reported speed once per running second

The same type byte means different things on the two machines: on the bike `D2` is resistance, on the treadmill it is incline. The decoder is chosen by the chosen machine, never by the frame (ADR 0009). The treadmill's `D1` frame is ignored and its `D0` frame changes no metric. The bike's decoding stays in `telemetry/decode-bike-telemetry`; the echo of `D0`, `D2` and `D3` frames is described in `treadmill/choose-machine`.

## Description

- **`TreadmillPacketDecoder`** (`Wattzup.Protocol`) — static `Decode(ReadOnlySpan<byte> frame)` returning a `TelemetryUpdate?` (L2-064):
  - It returns `null` for a frame shorter than 4 bytes or not starting with `0xF0`, for an unknown type, and for `D0`, `D1` and `E0` frames.
  - A `D3` frame of at least 6 bytes yields `SpeedUpdate(Kmh, Mph)` with `value = (frame[3] << 8) | frame[4]`, `Kmh = round(value ÷ 1000, 1)` and `Mph = round(value ÷ 1000 ÷ 1.609344, 1)` from the unrounded km/h value, both with `MidpointRounding.ToEven`.
  - A `D2` frame of at least 5 bytes yields `InclineUpdate(frame[3])`.
  - Shorter `D3` and `D2` frames return `null` and raise nothing (L2-064 criterion 5). The trailing checksum is not checked, as on the bike.
- **`SpeedUpdate(double Kmh, double Mph)`** and **`InclineUpdate(int Percent)`** — new cases of the `TelemetryUpdate` record, beside the bike's `ResistanceUpdate` and `CadenceUpdate`.
- **`BeltState`** (`Wattzup.Core.State`) — enum `Stopped`, `Starting`, `Running`, serialised as `stopped`, `starting` and `running`.
- **`TelemetryIngestor`** (`Wattzup.Core`) — the notify handler for both machines. For every frame it counts `packets` and hands the bytes to the raw packet sinks, as on the bike (L2-005, L2-030). It then decodes with `TreadmillPacketDecoder` when `store.Current.Machine` is `Treadmill`, else with `PacketDecoder`. In one `BikeStateStore.Update` it applies the result, so one frame produces one broadcast:
  - `SpeedUpdate` sets `speed_kmh` and `speed_mph`. It derives `belt`: above 0 is `running`; 0 is `stopped`, except while `belt` is `starting`, when it stays `starting` (L2-064 criterion 7). It acknowledges pending `speed` commands with `CommandLog.Acknowledge(log, CommandKind.Speed, kmh, nowMs)` (`treadmill/control-speed-and-incline`).
  - `InclineUpdate` sets `incline` and acknowledges pending `incline` commands. It never touches `resistance` (L2-064 criterion 4).
  - A decoded update sets `last_data_at` to now and `first_data_at` if it is `null` (L2-064 criterion 6). On the treadmill `power` is not computed.
  - After the update it writes the acknowledgement echo (`treadmill/choose-machine`).
- **Belt on connect and disconnect** — `BikeConnectionService` sets `belt` to `stopped` in the update that sets `ble = connected` on the treadmill, and to `null` in every update that leaves `connected` (L2-064 criterion 8). On the bike `belt` stays `null` (L2-066 criterion 10).
- **`WorkoutEngine`** — on each running tick of a treadmill workout, adds `speed_kmh ÷ 3600` to `distance_km`, rounded to 2 decimals when written, as L2-049 criterion 4 does on the bike. `power`, `target_power`, `avg_power` and `kcal` stay `null` on the treadmill, because the estimates of ADR 0003 need cadence and resistance (L2-064 criterion 9). The engine also reads `belt` and `speed_kmh` to start the ride clock and to detect a belt stopped from the console (`treadmill/control-the-belt`).

The protocol reference's example frames decode as follows. `F0 D3 02 23 28 10` → `SpeedUpdate(9.0, 5.6)`. `F0 D3 02 1B 58 38` → `SpeedUpdate(7.0, 4.3)`. `F0 D3 02 00 00 C5` → `SpeedUpdate(0.0, 0.0)`. `F0 D2 01 05 C8` → `InclineUpdate(5)`. `F0 D0 01 00 C1` → `null`.

### Acceptance tests

`Wattzup.Protocol.Tests` hold `TreadmillPacketDecoderTests`, one case per row: 9.0 km/h and 5.6 mph; 0.0; 7.0; incline 5; a 5-byte `D3`; a 3-byte `D2`; `D0`; a `D1` frame; a frame with the wrong marker; and a midpoint value that rounds to even.

`Wattzup.Core.Tests` cover `TelemetryIngestor` against a test double of `IBikeConnection` and `FakeTimeProvider`: the decoder follows the machine (one `F0 D2 01 05 C8` frame sets `resistance` on the bike and `incline` on the treadmill); the `belt` derivation table of L2-064 criterion 7 (`stopped` to `running`, `running` to `stopped`, `starting` held at speed 0, `starting` to `running`); and one broadcast per frame.

`Wattzup.Api.AcceptanceTests` run the host with `SimulatedBikeTransport`, `--machine treadmill` and `FakeTimeProvider`:

- `A_speed_frame_sets_kmh_and_mph_and_stamps_the_data_time` (L2-064 AC1, AC6)
- `An_incline_frame_sets_incline_and_leaves_resistance_null` (L2-064 AC4)
- `A_connected_treadmill_reports_belt_stopped_until_it_moves` (L2-064 AC8)
- `A_disconnected_treadmill_reports_belt_null` (L2-064 AC8)
- `A_running_treadmill_workout_adds_speed_to_the_distance_each_second` (L2-064 AC9)

The simulator injects frames through `SimulationControl.Notify(frame)`.

### Open questions

- **Miles consoles.** The reference has a setting that multiplies the `D3` value by 1.60934 for consoles that count in miles. Wattzup assumes kilometres (protocol reference, hardware item 4). `<TO SUPPLY>`: the hardware result.
- **Characteristic per frame.** Which of `…f3` and `…f4` carries `D2` and `D3` is Unknown; both are subscribed and decoded the same way (hardware item 4).
- **Reported speed while starting.** A speed of 0 reported while `belt` is `starting` keeps `starting`; the 10-second start timeout of `treadmill/control-the-belt` ends that state.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-064` | `L1-013` | Treadmill telemetry decoding. With the treadmill chosen, a `0xD3` frame of at least 6 bytes sets `speed_kmh` and `speed_mph` from metres per hour at bytes 3–4, a `0xD2` frame sets `incline` to byte 3, `0xD0` changes no metric and `0xD1` is not decoded; the speed sets `belt`, and each running tick adds the speed to `distance_km`. |

## Diagrams

### System context

The treadmill is the only source of its speed and incline; the frames reach Wattzup through the operating system's Bluetooth stack.

![C4 system context for decoding treadmill telemetry](diagrams/c4-context.png)

### Containers

Decoding runs inside the Wattzup API container. Wattzup Web receives the decoded speed, incline, belt state and distance over SSE.

![C4 container view for decoding treadmill telemetry](diagrams/c4-container.png)

### Components

`TelemetryIngestor` picks `TreadmillPacketDecoder` by the store's machine, applies the result and the belt derivation in one store update, and acknowledges pending commands through `CommandLog`. `WorkoutEngine` adds the distance on each running tick.

![C4 component view for decoding treadmill telemetry](diagrams/c4-component.png)

### Class structure

The two treadmill updates extend the existing `TelemetryUpdate` record. The decoder is pure and needs no Bluetooth to test.

![Class diagram for decoding treadmill telemetry](diagrams/class-structure.png)

### Behaviour — decode a speed or incline frame

A frame is counted and logged, decoded by the treadmill's decoder, applied with the belt derivation in one update, broadcast, and echoed back to the treadmill (L2-063, L2-064).

![Sequence diagram for decoding a treadmill frame](diagrams/sequence-decode-frame.png)
