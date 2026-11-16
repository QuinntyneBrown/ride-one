# Echelon BLE messages

Byte-level detail: [echelon-ble-frames.md](./echelon-ble-frames.md).

## To the bike

| Name | Description |
|---|---|
| `A0` Keepalive | Sent once per second to keep the connection alive. |
| `A1` Device info request | Asks the bike for device info; sent at init. |
| `A3` Resistance range request | Asks the bike for its resistance range; sent at init. |
| `B0` Start data stream | Starts the bike's notifications; last init command. |
| `B1` Set resistance | Sets the bike's resistance to the target resistance level. |

## From the bike

| Name | Description |
|---|---|
| `D0` Unknown | Meaning unknown; always payload `01`; ignored. |
| `D1` Workout data | About once per second: elapsed time, revolution count, cadence. |
| `D2` Resistance | The bike's current resistance level. |

## To the treadmill

Byte-level detail: [echelon-treadmill-frames.md](./echelon-treadmill-frames.md).

| Name | Description |
|---|---|
| `A0` Keepalive | Sent once per second with a counter 1–255. |
| `A4`, `A1`, `A3` Init requests | Sent once each at init. Never `B0` at init: it starts the belt. |
| `B0` Belt start / stop | `01` starts the belt, `00` stops it. |
| `B1` Set incline | Sets the target incline, 0–10 % (ADR 0010). |
| `B2` Set speed | Sets the target speed, km/h × 1000. |

## From the treadmill

| Name | Description |
|---|---|
| `D0` Unknown | Echoed back as an acknowledgement; no metric. |
| `D2` Incline | The treadmill's current incline, %; echoed back. |
| `D3` Speed | The belt's current speed, km/h × 1000; echoed back. |

