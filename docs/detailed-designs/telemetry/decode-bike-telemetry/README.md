# Decode bike telemetry

## Overview

Once connected, the Echelon bike pushes BLE notifications on its notify characteristic. Each notification is a short byte frame. This feature turns those frames into the metrics the rider sees: cadence, speed and resistance. It also stamps when live data first and last arrived.

**frame** — one notification payload; byte 0 is the marker `0xF0` and byte 1 is the frame type

**workout frame** — frame of type `0xD1`, at least 13 bytes, carrying cadence as a big-endian 16-bit value at bytes 9–10

**resistance frame** — frame of type `0xD2`, carrying the bike's current resistance level at byte 3

**cadence** — pedal revolutions per minute (rpm)

The Echelon bike has no wheel-speed sensor. Speed is derived from cadence with the fixed factor 0.37497622 km/h per rpm, which matches the prototype. The decoding rules live in pure functions of `@wattzup/browser`'s `lib/protocol/`, with no Bluetooth or Angular dependency, so every rule is unit-testable from byte arrays alone.

## Description

- **`decode(frame: Uint8Array)`** (`lib/protocol/packet-decoder.ts`) — returns a `TelemetryUpdate` or `null`. It returns `null` for frames shorter than 4 bytes, frames not starting with `0xF0`, unknown frame types, and `0xD1` frames shorter than 13 bytes (L2-005).
- **`TelemetryUpdate`** — a union of 2 cases. **`ResistanceUpdate`** `{kind: 'resistance', level}` carries byte 3 of a `0xD2` frame (L2-006). **`CadenceUpdate`** `{kind: 'cadence', rpm, speedKmh, speedMph}` carries `(frame[9] << 8) | frame[10]` and the derived speeds (L2-007).
- **`speed-calculator.ts`** (`lib/protocol/`) — `KMH_PER_RPM = 0.37497622` and `KM_PER_MILE = 1.609344`. `toKmh(rpm)` rounds `rpm × KMH_PER_RPM` to 1 decimal, halves to even. `toMph(rpm)` divides the **unrounded** km/h value by `KM_PER_MILE` and then rounds to 1 decimal the same way. Halves to even match Python's `round` in the prototype.
- **`TelemetryIngestor`** (`lib/engine/`) — notify handler that `BikeLink` calls for every frame (see `bike-connectivity/connect-the-bike`; `BikeLink` also keeps the frame in the packet log while **Log every packet** is on, see `platform/diagnostics`). It calls `decode` and applies the outcome in 1 `BikeStateStore.update` call: `packets` increases by 1 (L2-005), and on a non-null update the metric fields are set, `last_data_at` is set to now and `first_data_at` is set if it is `null` (L2-006, L2-007). In the same call it recomputes `power` from the new cadence and resistance (see `estimate-power-and-totals`) and, on a resistance update, acknowledges pending commands (see `resistance-control/log-resistance-commands`). 1 frame therefore produces 1 state change.
- **`Clock`** (`CLOCK`) — `epochMs() / 1000` gives the Unix epoch seconds stored in `last_data_at` and `first_data_at`; tests control it with `FakeClock`.

Example frames from the specification decode as follows. `F0 D2 01 0C CF` → `{kind: 'resistance', level: 12}`. `F0 D1 09 00 05 00 00 00 00 00 50 00 1F` → `{kind: 'cadence', rpm: 80, speedKmh: 30.0, speedMph: 18.6}`. `F0 D0 01 01 C2` → `null`. The decoder does not validate the trailing checksum, which matches the prototype's behaviour.

Verification:

- `protocol.spec.ts` (`lib/protocol/`) — 1 case per criterion of L2-005, L2-006 and L2-007: short frame, wrong marker, unknown type, 12-byte `0xD1`, resistance 12, cadence 80, cadence 256 and cadence 0.
- `telemetry-ingestor.spec.ts` — with `FakeClock`: every frame counts, and timestamps follow the rules of L2-006.
- Playwright specs push `0xD1` and `0xD2` frames through the fake `navigator.bluetooth` and see the cadence, speed and resistance readouts change.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-005` | `L1-002` | Packet framing and counting. Every notification must be counted and logged; only well-formed packets are decoded. |
| `L2-006` | `L1-002` | Resistance packet decoding. A packet with type byte `0xD2` must set `resistance` to byte index 3. |
| `L2-007` | `L1-002` | Workout data decoding. A packet with type byte `0xD1` and at least 13 bytes must set cadence to the big-endian 16-bit value at bytes 9–10, and derive speed from it. `speed_kmh` = round(cadence × 0.37497622, 1). `speed_mph` = round(cadence × 0.37497622 ÷ 1.609344, 1), computed from the unrounded km/h value. |

## Diagrams

### System context

The bike is the only source of telemetry; it reaches Wattzup through the browser's Web Bluetooth.

![C4 system context for decoding bike telemetry](diagrams/c4-context.png)

### Containers

Decoding happens inside the Wattzup app in the rider's browser as notifications arrive.

![C4 container view for decoding bike telemetry](diagrams/c4-container.png)

### Components

`TelemetryIngestor` receives each notification from `BikeLink`, asks `decode` for a `TelemetryUpdate`, and applies the count, the metrics, the estimated power and any acknowledgement to `BikeStateStore` in 1 update.

![C4 component view for decoding bike telemetry](diagrams/c4-component.png)

### Class structure

`packet-decoder` and `speed-calculator` are modules of pure functions. `TelemetryUpdate` is a union with one case per decoded frame type.

![Class diagram for decoding bike telemetry](diagrams/class-structure.png)

### Behaviour — ingest one notification

Every frame is counted (L2-005). Only well-formed `0xD2` and `0xD1` frames change metrics (L2-006, L2-007), and each change recomputes the estimated power (L2-049).

![Sequence diagram for ingesting one notification](diagrams/sequence-ingest-notification.png)
