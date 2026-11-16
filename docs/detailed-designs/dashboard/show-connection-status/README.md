# Show connection status

## Overview

The data on the dashboard passes through 2 links: the bike to the backend over Bluetooth, and the backend to the browser over HTTP. Either link can fail. This feature tells the rider at a glance which link is healthy. A pill in the header shows the Bluetooth state and the bike's name. A footer shows the current error, the packet count, how long live data has been on screen, and when data last arrived.

**status pill** — header element with a coloured dot (green when connected, red on error or when the server is offline, amber otherwise) and the text `<ble>` or `<ble> · <device>`

**diagnostics footer** — bottom line showing the error text and `packets <n> · live <s>s · updated <time>`

When the browser loses the event stream, the pill switches to `server offline · retrying`. The browser then reconnects every 2 s until the stream is back, at which point the first message restores the real state.

## Description

- **`ConnectionPill`** — standalone component reading `LiveStateService.state` and `LiveStateService.connection`.
  - When `connection` is `offline`, it shows `server offline · retrying` with a red dot.
  - Otherwise the text is `ble`, followed by ` · device` when `device` is set.
  - The dot is `ok` (green) for `connected`, `err` (red) for `error`, and amber for every other value (L2-018).
  - The device name is bound as text, never as HTML.
- **`LiveStateService`** — on `EventSource.onerror` it closes the source, sets `connection = 'offline'`, and schedules `connect()` after 2 s. The schedule repeats until a message arrives, and the first message sets `connection = 'open'` (L2-018).
- **`DiagnosticsFooter`** — standalone component.
  - `errorText` is `state().error`, or the latest local API error from `set-resistance` or `start-and-stop-workout`. It is empty when both are null (L2-018).
  - `packets` is `state().packets`.
  - `live` is `Math.round(state().displayed_seconds)`.
  - `updated` is `last_data_at × 1000` formatted with `toLocaleTimeString()`, or `never` when `last_data_at` is null (L2-023).
- **`UiErrorStore`** — small signal store holding the latest client-side error. It is cleared on the next successful API call.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-018` | `L1-006` | Connection status display. The header must show a status pill with a coloured dot and text `<ble>` or `<ble> · <device>`. |
| `L2-023` | `L1-006` | Footer diagnostics. |

## Diagrams

### System context

The rider sees the health of the bike link and the server link that Wattzup maintains.

![C4 system context for showing connection status](diagrams/c4-context.png)

### Containers

Wattzup Web shows the Bluetooth state streamed by the Wattzup API, and its own view of the stream connection.

![C4 container view for showing connection status](diagrams/c4-container.png)

### Components

`ConnectionPill` and `DiagnosticsFooter` read `LiveStateService`. The footer also reads `UiErrorStore`.

![C4 component view for showing connection status](diagrams/c4-component.png)

### Class structure

Both components derive their text with `computed` signals from the service state.

![Class diagram for showing connection status](diagrams/class-structure.png)

### Behaviour — server offline and recovery

The stream fails, the pill shows `server offline · retrying`, and the service retries every 2 s. The first message after reconnecting restores the real state (L2-018).

![Sequence diagram for server offline and recovery](diagrams/sequence-offline-recovery.png)
