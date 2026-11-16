# Echelon treadmill BLE frame structure

This page describes the bytes Wattzup and the Echelon Stride treadmill exchange over Bluetooth. The
bike's frames are in [echelon-ble-frames.md](./echelon-ble-frames.md); this page uses its
[conventions](./echelon-ble-frames.md#conventions), [common frame layout](./echelon-ble-frames.md#common-frame-layout)
and [checksum](./echelon-ble-frames.md#checksum), which the treadmill shares.

It draws on three sources:

- a read-only GATT service discovery of the rider's treadmill (`STRIDE-8s22-000766`): services and
  characteristics only, nothing written;
- the Echelon Stride support in the open-source project
  [qdomyos-zwift](https://github.com/cagnulein/qdomyos-zwift) (`src/devices/echelonstride/echelonstride.cpp`,
  GPL-3.0). Facts are restated here; no code is copied;
- the bike's frames, where the treadmill uses the same framing.

Each field has a **Status**, as on the bike's page:

- **Decoded:** Wattzup reads or writes the field. A requirement fixes it (L2-063 to L2-066).
- **Observed:** a source shows the field, but Wattzup does not use it and no requirement covers it.
- **Unknown:** a source shows the value but not what it means.

Nothing is built on an Observed or Unknown field. No capture from this treadmill exists yet, so
every Decoded field below is also on the [Needs hardware confirmation](#needs-hardware-confirmation)
list.

## GATT transport

| Role | UUID | Properties | Use |
|---|---|---|---|
| Advertised service | `0bf669f0-45f2-11e7-9598-0800200c9a66` | — | Treadmill device filter (L2-063) |
| Echelon service | `0bf669f1-45f2-11e7-9598-0800200c9a66` | — | Same service as the bike |
| Write characteristic | `0bf669f2-45f2-11e7-9598-0800200c9a66` | write, write-without-response | Commands with response; acknowledgements without |
| Notify characteristic | `0bf669f3-45f2-11e7-9598-0800200c9a66` | notify | Subscribed (L2-063); which frames it carries is Unknown |
| Notify characteristic | `0bf669f4-45f2-11e7-9598-0800200c9a66` | notify | Subscribed (L2-063); which frames it carries is Unknown |
| Device Information | `180A` | read | Not used |
| Nordic Buttonless DFU | `FE59` / `8ec90003-…` | — | **Never written.** Writing it puts the treadmill into firmware-update mode |

The reference subscribes to both notify characteristics and decodes frames from either the same
way, so Wattzup does the same. Each write or notification carries one frame.

## Frame types

| Type | Direction | Name | Total length (bytes) | Handled by Wattzup |
|---|---|---|---|---|
| `A0` | to treadmill | Keepalive with counter | 5 | Once per second (L2-063) |
| `A1` | to treadmill | Device info request | 4 | At init (L2-063) |
| `A3` | to treadmill | Range request | 4 | At init (L2-063) |
| `A4` | to treadmill | Unknown request | 4 | At init (L2-063), first, as the reference does |
| `B0` | to treadmill | Belt start / stop | 5 | On a workout start, pause, stop, replace or end, and after a start timeout (L2-066) |
| `B1` | to treadmill | Set incline | 5 | On request (L2-065) |
| `B2` | to treadmill | Set speed | 6 | On request (L2-065) |
| `D0` | from treadmill | Unknown | 5 | Acknowledged (echoed); no metric (L2-063, L2-064) |
| `D1` | from treadmill | Workout data | ≥ 12 | Ignored on the treadmill (L2-064) |
| `D2` | from treadmill | Incline | 5 | Decoded and acknowledged (L2-064) |
| `D3` | from treadmill | Speed | 6 | Decoded and acknowledged (L2-064) |
| `E0` | from treadmill | Unlock challenge | 8 | Ignored; see [Not used](#not-used) |

`B0 01 01` starts the belt. It is the same five bytes as the bike's "start data stream" init
command, so the treadmill's init sequence must never include it (L2-063).

## Commands (Wattzup to treadmill)

### Init: `A4`, `A1`, `A3`: 32 bits each

Written in this order, each with response, at least 300 ms apart, after both notify subscriptions
are in place (L2-063). The reference writes `A1` four times and once more after `A3`; Wattzup writes
it once.

| Command | Bytes | Status |
|---|---|---|
| `A4` Unknown request | `F0 A4 00 94` | Decoded (sent); meaning Unknown |
| `A1` Device info request | `F0 A1 00 91` | Decoded (sent) |
| `A3` Range request | `F0 A3 00 93` | Decoded (sent) |

No reply to these requests is decoded.

### `A0` Keepalive with counter: 40 bits

| Bits | Byte | Size | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | |
| 8–15 | 1 | 8 | Type | `A0` | |
| 16–23 | 2 | 8 | Length | `01` | |
| 24–31 | 3 | 8 | Counter | 1, 2, … 255, then 1 again (never 0) | Decoded (L2-063) |
| 32–39 | 4 | 8 | Checksum | `(0x91 + counter) mod 256` | |

Examples: counter 1 is `F0 A0 01 01 92`; counter 255 is `F0 A0 01 FF 90`. The reference sends it about
every 2 seconds; Wattzup sends it once per second, like the bike's keepalive.

### `B0` Belt start and stop: 40 bits

| Bits | Byte | Size | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | |
| 8–15 | 1 | 8 | Type | `B0` | |
| 16–23 | 2 | 8 | Length | `01` | |
| 24–31 | 3 | 8 | Belt | `01` start, `00` stop | Decoded (L2-066) |
| 32–39 | 4 | 8 | Checksum | | |

| Command | Bytes |
|---|---|
| Start belt | `F0 B0 01 01 A2` |
| Stop belt | `F0 B0 01 00 A1` |

The reference follows the start with `F0 D0 01 00 C1` and `F0 D0 01 11 D2` written without response;
their meaning is Unknown and Wattzup does not send them. Some Stride 4 models need extra frames; they
are not supported.

### `B1` Set incline: 40 bits

| Bits | Byte | Size | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | |
| 8–15 | 1 | 8 | Type | `B1` | |
| 16–23 | 2 | 8 | Length | `01` | |
| 24–31 | 3 | 8 | Target incline | uint8, whole percent, 0–15 | Decoded (L2-065) |
| 32–39 | 4 | 8 | Checksum | `(0xA2 + incline) mod 256` | |

| Target incline | Bytes |
|---|---|
| 0 % | `F0 B1 01 00 A2` |
| 5 % | `F0 B1 01 05 A7` |
| 15 % | `F0 B1 01 0F B1` |

### `B2` Set speed: 48 bits

| Bits | Byte | Size | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | |
| 8–15 | 1 | 8 | Type | `B2` | |
| 16–23 | 2 | 8 | Length | `02` | |
| 24–39 | 3–4 | 16 | Target speed | uint16 BE, metres per hour (km/h × 1000) | Decoded (L2-065) |
| 40–47 | 5 | 8 | Checksum | | |

| Target speed | Value | Bytes |
|---|---|---|
| 1.0 km/h | 1000 | `F0 B2 02 03 E8 8F` |
| 7.0 km/h | 7000 | `F0 B2 02 1B 58 17` |
| 9.0 km/h | 9000 | `F0 B2 02 23 28 EF` |
| 16.0 km/h | 16000 | `F0 B2 02 3E 80 62` |

The reference accepts 0–22 km/h. Wattzup accepts 1.0–16.0 km/h in steps of 0.1 (ADR 0009).

### Acknowledgements

The reference writes every `D0`, `D2` and `D3` frame it receives straight back to the write
characteristic, without response. Wattzup does the same (L2-063). Whether the treadmill needs the
echo is Unknown.

## Notifications (treadmill to Wattzup)

The reference notes that the treadmill notifies speed and incline only when they change.

### `D3` Speed: 48 bits

| Bits | Bytes | Size | Field | Encoding | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | Decoded |
| 8–15 | 1 | 8 | Type | `D3` | Decoded |
| 16–23 | 2 | 8 | Length | `02` | Observed |
| 24–39 | 3–4 | 16 | Speed | uint16 BE, metres per hour | Decoded (L2-064) |
| 40–47 | 5 | 8 | Checksum | | Observed |

`speed_kmh = round(value ÷ 1000, 1)` and `speed_mph = round(value ÷ 1000 ÷ 1.609344, 1)`, both with
banker's rounding. A speed above 0 means the belt is moving (L2-064).

| Frame | Speed |
|---|---|
| `F0 D3 02 23 28 10` | 9.0 km/h, 5.6 mph |
| `F0 D3 02 1B 58 38` | 7.0 km/h |
| `F0 D3 02 00 00 C5` | 0.0, belt stopped |

The reference has a setting that multiplies this value by 1.60934, for consoles that count in miles.
Wattzup assumes kilometres; this is on the hardware list.

### `D2` Incline: 40 bits

| Bits | Byte | Size | Field | Encoding | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | Decoded |
| 8–15 | 1 | 8 | Type | `D2` | Decoded |
| 16–23 | 2 | 8 | Length | `01` | Observed |
| 24–31 | 3 | 8 | Incline | uint8, whole percent | Decoded (L2-064) |
| 32–39 | 4 | 8 | Checksum | | Observed |

Example: `F0 D2 01 05 C8` means incline 5 %. On the bike the same type is resistance; the decoder is
chosen by the machine, never by the frame.

### `D0` Unknown: 40 bits

`F0 D0 01 <x> <checksum>`. The reference echoes it and reads nothing from it. Status: Unknown.

### `D1` Workout data

The reference reads byte 11 as heart rate on some models and, on Stride 4 models, bytes 7–8 as speed
÷ 100. Status: Observed. Wattzup ignores `D1` on the treadmill.

## Not used

- **`E0` unlock challenge (8 bytes).** The reference answers it with a computed response on some
  newer models. Wattzup does not; if the treadmill needs it, the hardware smoke test will show that
  speed commands are ignored, and a requirement must be added first.
- **Device Information `180A`** and **DFU `FE59`**: never read or written by Wattzup.

## Needs hardware confirmation

A person runs this list on the real treadmill (`STRIDE-8s22-000766`), standing beside the belt with
the safety key clipped on, before the treadmill support is released (L2-043). Nothing here is run by
an agent or by CI.

1. **Discovery:** the treadmill is found by name (`STRIDE…`) with the treadmill chosen, and the bike
   is not found with the treadmill chosen, nor the treadmill with the bike chosen.
2. **Connection and init:** subscribing to `…f3` and `…f4` succeeds; `F0 A4 00 94`, `F0 A1 00 91`,
   `F0 A3 00 93` are accepted and **the belt does not move**.
3. **Keepalive:** with `F0 A0 01 <n> <checksum>` once per second, the link stays up for 10 minutes.
4. **Speed and incline reports:** changing speed and incline on the console produces `D3` and `D2`
   frames, on which characteristic each arrives, and that `D3` is in km/h × 1000 (not miles).
5. **Acknowledgements:** echoing `D0`, `D2` and `D3` causes no console error; note whether the
   treadmill behaves differently without it.
6. **Start belt:** after the countdown, `F0 B0 01 01 A2` starts the belt, and a `D3` above 0 follows.
   Note any console countdown of its own.
7. **Stop belt:** `F0 B0 01 00 A1` stops the belt from every speed used below.
8. **Speed steps:** 1.0, 7.0, 9.0 and 16.0 km/h (`F0 B2 02 …`) each set the console to that speed;
   steps of 0.1 and 0.5 km/h are accepted; 16.0 km/h is within the treadmill's own maximum.
9. **Incline steps:** 0, 1, 5 and 15 % (`F0 B1 01 …`) each set the console to that incline; 15 % is
   within the treadmill's own maximum.
10. **Console stop:** stopping the belt from the console and pulling the safety key both report speed
    0 and pause the ride, and Wattzup does not restart the belt.
11. **Disconnect:** switching Bluetooth off mid-ride: note what the belt does on its own; the UI shows
    the safety-key message; after reconnecting the ride stays paused.
12. **Unlock challenge:** whether the treadmill sends an `E0` frame and ignores commands until it is
    answered.
