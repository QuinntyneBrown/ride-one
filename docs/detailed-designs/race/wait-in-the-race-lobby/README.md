# Wait in the race lobby

## Overview

A race against bots or riders online starts from a lobby (`/race/:mapId/lobby`). The lobby
gathers the field, shows who is on the start grid, runs a ready check, and starts every rider
together with a shared countdown. A solo race against the rider's ghost has no lobby.

> **lobby** — pre-race screen that seats the field and counts down to a shared start

> **start grid** — ten ordered seats for one race; seat 1 is always the rider ("You")

> **open seat** — seat not yet taken by a rider or a bot

> **start clock** — countdown to the race start, shown as a timer with a status line and a hint

> **ready check** — toggle by which a seated rider tells the field they are ready

> **shared start** — race start sent by the multiplayer service as a server time, at which every client's race clock begins

A bots lobby runs entirely in the browser. It seats nine bots at once; when the rider presses
"I'm ready", every bot is ready and the clock runs from 0:05. A riders-online lobby mirrors a
session run by the multiplayer service: riders join and leave, bots take every open seat at
0:10, and the race starts at 0:03 whether or not every rider is ready. In both, the countdown
covers the screen for 3, 2, 1 and Go, and the race opens at Go with its clock at 0:00.

The lobby sits between Race Setup (set-up-a-race) and the race (ride-a-race). The session rules
themselves (seating, bot fill, start time) are designed by the multiplayer subsystem
(run-a-race-session); this feature is the rider-facing side of them.

## Description

**Ride app**

- **`RaceLobbyPage`** (`ride`, selector `wz-race-lobby-page`, block `race-lobby`) — routed page
  at `/race/:mapId/lobby`, loaded with `loadComponent`. It renders the header ("Old Town
  Criterium · 14.2 km · Riders online" or "· Bots, medium"), "Leave", Full screen, the hidden
  heading "Race lobby, Old Town Criterium", the start clock and the grid. At lg or wider the
  clock sits beside the grid; at sm or wider the grid is two columns.
- **`LobbyStore`** (`ride`, provided on the lobby route) — signal store exposing `seats`,
  `takenCount`, `status` ("Waiting for riders" or "On the start line"), `hint`,
  `secondsToStart`, `ready`, `notice` and `countdownStep`. It drives a bots lobby through
  `LocalLobby` and a riders-online lobby through `RaceSessionStore`. It releases its ticker and
  hub handlers on destroy.
- **`LocalLobby`** (`domain/engine`) — pure rules of a bots lobby: seat 1 is You, seats 2 to 10
  take the bots in list order (Pacer Nova, Rook, Juno, Atlas, Kite, Vale, Moss, Flint, Echo),
  "I'm ready" readies every bot and sets the clock to 5 seconds (L2-053 AC3).
- **`LobbyClock`** (`domain/engine`) — turns a start time and the measured clock offset into
  whole seconds to start, once a second, from at most 0:30 (L2-051 AC5). It names the
  thresholds: bot fill at 10 s and countdown at 3 s.
- **`RaceSessionStore`** (`ride`, provided on the `/race/:mapId` parent route) — holds the
  riders-online session: seat list from `SeatsChanged`, `RiderLeft` notices, the start from
  `SessionStarted`, and the clock offset measured by `RideHubClient`. It sends `SetReady` and
  `LeaveSession`.
- **`StartGrid`** (`components`, block `start-grid`) — "Start grid" with "{n} / 10" and ten
  seats. A rider online shows name, jersey colour, country and level ("DE · Lv 4"); a bot shows
  its name, a bot icon and "Bot"; an empty seat reads "Open seat"; a ready seat carries a check
  with `aria-label="Ready"`.
- **`StartClock`** (`components`, elements of `race-lobby`) — status line, the timer
  (`role="timer"`, `aria-label` "Starts in {n} seconds"), the hint and the "I'm ready" toggle.
  The toggle is a button with `aria-pressed`; pressed it reads "You're ready" with a check.
- **`RaceCountdown`** (`components`, block `race-countdown`) — full-screen overlay
  (`role="timer"`, `aria-live="assertive"`, "Race starts in 3") showing 3, 2, 1 and Go, one a
  second. Each step fades and scales in over 200 ms; under `prefers-reduced-motion` it only
  fades. While it shows, the page behind carries `inert`.
- **`ResistanceController`** (`domain/engine`, designed by bike/control-resistance) — sends
  the first segment's level as the target resistance once the rider is "On the start line"
  (L2-051 AC4).

**Telo Ride API** (designed by multiplayer/run-a-race-session)

- **`RideHub`** — `SetReady`, `LeaveSession`; pushes `SeatsChanged`, `RiderLeft`,
  `CountdownStarted` and `SessionStarted`.
- **`RaceSession`** (`Telo.Ride.Domain`) — seats at most 10, fills open seats with bots at 10 s,
  releases a seat whose connection is gone for 10 s in the lobby (L2-057 AC2).

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a
level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-051` | `L1-011` | The lobby (`/race/:mapId/lobby`) header shall read "Old Town Criterium · 14.2 km · Riders online" (or "· Bots, medium") with "Leave" and Full screen, under the hidden heading "Race lobby, Old Town Criterium". The start clock shall have a status line, a clock (`role="timer"`, `aria-label` "Starts in {n} seconds"), a hint and the "I'm ready" toggle. With open seats online, the status shall read "Waiting for riders" and the hint "{n} of 10 seats taken. At 0:10 bots fill the rest so the race starts full." With every seat taken, the status shall read "On the start line", the hint "Keep pedalling easy. Resistance is set for the first stretch.", and the first segment's level shall be sent to the bike. Online, the clock shall show the session's time to start, counting down once a second from at most 0:30. At lg or wider the clock shall sit beside the grid; at sm or wider the grid shall be two columns. |
| `L2-052` | `L1-011` | The start grid shall read "Start grid" with "{n} / 10" and list 10 seats in order, seat 1 always "You" with the rider's level. A rider online shall show name, jersey colour, country and level ("DE · Lv 4"); a bot its name, a bot icon and "Bot"; an empty seat "Open seat". A ready rider's seat shall carry a check (`aria-label="Ready"`). |
| `L2-053` | `L1-011` | Pressing "I'm ready" shall make it "You're ready" with a check and `aria-pressed="true"`, and the seat shall show ready for every rider in the session; pressing again shall return it to "I'm ready". In a bots lobby, "I'm ready" shall start the clock from 0:05 and make every bot ready. Online, the race shall start at 0:03 whether or not every rider is ready. |
| `L2-054` | `L1-011` | Online with open seats, at 0:10 bots shall take every open seat, the status shall become "On the start line" and the count "10 / 10". Seated bots shall be ready, with names from the bot list in order. A race shall always start with 10 riders. |
| `L2-055` | `L1-011` | When MarcoVelo leaves a riders-online lobby before 0:10, a notice (`role="status"`) shall read "MarcoVelo left. Their seat is open again.", MarcoVelo's seat shall read "Open seat" and the count shall drop by one. A rider who leaves after 0:10 shall be replaced by a bot at once. A joining rider shall take the first open seat within one second for every rider in the session. |
| `L2-056` | `L1-011` | At 0:03 the countdown shall cover the screen (`role="timer"`, `aria-live="assertive"`, "Race starts in 3") with the page behind inert. It shall show 3, 2, 1 and Go, one a second, each step fading and scaling in over 200 ms, and only fading with reduced motion. At Go the race shall open with its clock at 0:00. Every rider's race clock in one session shall start within 250 ms of the others' (L2-121). |
| `L2-057` | `L1-011` | Pressing "Leave" shall open Race Setup with the same mode, without a confirmation, and release the rider's seat. When the rider closes the tab in a riders-online lobby, the seat shall be released as in L2-055 once the service has lost the connection for 10 seconds. |

## Diagrams

### System context

The rider waits with other riders in a Telo Ride lobby. Other riders online are themselves
riders of the same system.

![C4 system context for the race lobby](diagrams/c4-context.png)

### Containers

A bots lobby stays inside the Ride app. A riders-online lobby keeps one SignalR connection to
the Telo Ride API, whose ride hub owns the session. The app sends the first segment's level to
the smart bike once the field is full.

![C4 container view for the race lobby](diagrams/c4-container.png)

### Components

`RaceLobbyPage` reads `LobbyStore`. The store uses `LocalLobby` and `LobbyClock` for the rules
and `RaceSessionStore` for the online session, and renders through `StartGrid`, `StartClock`
and `RaceCountdown`.

![C4 component view for the race lobby](diagrams/c4-component.png)

### Class structure

`LobbyStore` holds ten `LobbySeat` values. `LocalLobby` produces them for a bots lobby and
`RaceSessionStore` maps them from `SeatDto` for an online one. `LobbyClock` supplies the
seconds and the thresholds.

![Class diagram for the race lobby](diagrams/class-structure.png)

### Behaviour — bots lobby

Nine bots are seated at once. "I'm ready" readies them and starts the clock from 0:05; the
countdown runs from 0:03, and Go opens the race.

![Sequence diagram for a bots lobby](diagrams/sequence-bots-lobby.png)

### Behaviour — riders-online lobby

Seats follow the hub. At 0:10 the service fills open seats with bots; at 0:03 the countdown
covers the screen; Go is placed at the server's start time corrected by the measured offset.

![Sequence diagram for a riders-online lobby](diagrams/sequence-riders-online-lobby.png)

### Behaviour — leave the lobby

"Leave" releases the seat without a confirmation and returns to Race Setup with the same mode.
A closed tab releases the seat after the service has lost the connection for 10 seconds.

![Sequence diagram for leaving the lobby](diagrams/sequence-leave-the-lobby.png)
