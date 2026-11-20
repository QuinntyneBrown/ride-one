# Review a session

## Overview

After a ride, the rider wants to know how it went and whether it beat the last time. This feature is the Session Summary page at `/sessions/:id`, where the rider lands when a ride ends (L2-084, L2-085). It shows the average power, the change since the previous attempt at the same class, the personal bests, the streak, the power and cadence traces against the plan, the cadence dips and the totals of one session (`history/record-session`).

**Session Summary** — page at `/sessions/:id` that shows one session

**just finished** — the summary opened from the end of a ride; it reads `Ride saved · …` and `Done`; opened any other way it reads `All sessions`

**previous attempt** — the latest finished attempt at the same class that ended before this session (L2-087); rides from `/setup` have none

**personal best** — `Best 1-minute power`, `Best average on this class` or `No cadence dips`, as L2-087 sets them

**delta** — the change of average power from the previous attempt, written with its sign (`+12 W`, `−4 W`, `0 W`), so colour only adds to it

The figures that compare sessions (previous attempt, bests, streak, weekly count) are computed in `@wattzup/browser` and answered through `SESSION_API`; the page computes none of them. It only formats them and draws the traces.

The feature extends these existing designs:
- `dashboard/dialogs-and-notifications`: `End ride` on the bike goes to `/sessions/<session_id>`.
- `dashboard/show-connection-status`: the bike-shut-off overlay offers `See your ride`, and a new `Ride complete` overlay appears when the plan ends.
- `platform/host-and-structure`: gains the lazy route and the components.

## Description

### Figures and contract (`@wattzup/browser`)

- **`previousAttempt(sessions, session)`** (`lib/engine/progress-calculator.ts`, shared with `history/track-progress`) — the latest `completed` session with the same non-null `class_id` and an earlier `ended_at`, or `null` (L2-087).
- **`bestsSetBy(sessions, session)`** — the bests of the L2-087 table, in its order. The comparison uses only sessions that ended earlier, so a first ride sets no `Best 1-minute power`.
- **`BrowserSessionApi`** (`lib/contracts/`, implements `SESSION_API`; see `history/keep-sessions`):
  - `list()` resolves `{sessions: [SessionSummary]}`, newest first (L2-083 criterion 1).
  - `get(id)` resolves the record's fields plus `previous: SessionSummary | null` and `bests: string[]` (criterion 2). An id that does not match `^[a-f0-9]{12}$` or names no session answers `'not-found'` (criterion 3).
  - `progress()` (`history/track-progress`) supplies the streak panel.

### App and components

**Contract (`@wattzup/api`).**
- **`SessionApi`** (`src/lib/session-api.ts`, new) has three methods:
  - `list(): Promise<SessionSummary[]>`;
  - `get(id): Promise<SessionDetail | 'not-found'>`;
  - `progress(): Promise<Progress>`.

  The token is `SESSION_API`, implemented by `BrowserSessionApi`, and `app.config.ts` binds it. The types are in `src/contract/schema.d.ts`.

**Presentation components (`projects/components/src/lib/`, new).** Each keeps the mock's BEM block and injects nothing.
- **`SessionTraces`** (`session-traces/`, `wz-session-traces`) — two SVGs on one time axis:
  - `Cadence` draws the cadence polyline, the dashed aim of each counted segment, and one `session-traces__dip` band per dip. The band of `focusDip` is marked `--focus`, and the others are dimmed while one is focused.
  - `Power` draws the power polyline over shaded work segments.
  - The section's `aria-label` is the text alternative of L2-085 criterion 8.
  - Inputs: `view: TracesView` (precomputed points, bands, aims and ticks) and `focusDip: number | null`.
- **`DipList`** (`dip-list/`, `wz-dip-list`) — `Cadence dips` with `<n>% on target`, the lead line, and a button per dip that emits `focusDip` on enter, focus, leave and blur. With no dips it shows the no-dips line. Inputs: `view: DipListView`.
- **`WeekStrip`** (`week-strip/`, `wz-week-strip`) — seven days, Monday first. Each `li` is named `<Weekday> <d> <Mon>, ridden|not ridden`; a ridden day carries `--ridden` and today carries `--today`. Inputs: `days: CalendarDay[]`.
- **`StatStrip`** (`stat-strip/`, `wz-stat-strip`) — a `dl` of label, value and unit. Inputs: `stats: Stat[]`.

**App.**
- **`session-view.ts`** (`core/`, new, pure, with its spec) builds the page's text and drawing data:
  - `dateLine(endedAt, justFinished)` reads `Ride saved · Tuesday 17 Nov at 18:10`, in the browser's local time.
  - `deltaOf(session)` reads `{text: '+12 W', direction: 'up' | 'down' | 'same', since: 'vs last time, 12 Nov'}`, or `null`.
  - `endedEarly(session)` gives the `Ended early · …` line.
  - `dipListView(session)` gives the lead line, the rows and the no-dips line.
  - `tracesView(session)` gives the points, bands, aims and ticks as `trace-geometry` does for the live trace.
  - `totals(session)` gives the six stats.
  - `weekLine(week)` gives `<n> of 4 rides this week. <m> more to hit your goal.`, or `Weekly goal hit — …`.
  - `calendarOf(progress, weeks)` gives the week strip (one week) from `ride_days` and `today`; `progress-view.ts` uses it for the six-week calendar.
- **`SessionPage`** (`dashboard/session-page/`, new; route `sessions/:id`, lazy `loadComponent`; title `Your ride · Wattzup`):
  - **Data.** It reads `SESSION_API.get(id)` and `SESSION_API.progress()` together. `phase` is `loading`, `ready`, `not-found` or `error`.
  - **Just finished.** `justFinished` comes from `history.state.justFinished`, which `EndRideDialog` and the ride overlays set through `Router.navigate(…, {state})`. The browser keeps `history.state` across a reload, so the page clears the flag on its history entry once it has rendered (`Location.replaceState`); a reload reads `All sessions` (L2-085 criterion 2).
  - **Header.** The back link (`Done` or `All sessions`) goes to `/progress`. `Ride this again` links to `/classes/<class_id>` when there is one.
  - **Dip focus.** The page holds `focusDip` in a signal, which joins `DipList` to `SessionTraces` (criterion 10).
- **`EndRideDialog`** (changed) — after `stop()` it navigates to `/sessions/<id>` with `{state: {justFinished: true}}` when an id came back, else to `/classes` (L2-084 criterion 1).
- **`RideOverlay`** and `ride-view-state.ts` (changed):
  - The `bike-shut-off` overlay shows `See your ride` and `Ride another class` when `workout.session_id` is set.
  - A new `ride-complete` overlay (`Ride complete`) shows for `ended` with a `session_id`, with `See your ride` focused (L2-084 criteria 2 and 3).

### Screen states

| Mock | State |
|---|---|
| `pages/session/default` | Just finished: `Ride saved · …`, `Done`, `Ride this again`, `+12 W vs last time`, two bests, 3 dips, 3 of 4 rides this week |
| `pages/session/from-list` | The same session opened from the list: `All sessions`, no `Ride saved` |
| `pages/session/ended-early` | `Ended early · 18:40 of 30:00` |
| `pages/session/first-ride` | A ride from `/setup`: no delta, no bests, no `Ride this again`, streak 1 |
| `pages/session/no-dips` | `Cadence held at target for the whole ride. Nothing to fix.` and `No cadence dips` |
| `pages/session/goal-hit` | `Weekly goal hit — 4 rides this week.` |
| `pages/session/loading` | Skeletons |
| `pages/session/not-found` | `We can't find that ride` with `All sessions` |
| `pages/session/error` | `Couldn't load this ride` with `Try again` |
| `pages/ride/complete` | `Ride complete` with `See your ride` |
| `pages/ride/ended` | Bike shut off, with `See your ride` and `Ride another class` |

### Acceptance tests

`@wattzup/browser` unit tests: `progress-calculator.spec.ts` has one case per row for the previous attempt and the bests (L2-087); the `BrowserSessionApi` tests, over an in-memory session database, cover an empty list, summaries newest first, a session with its previous attempt and bests, a first ride with `previous` `null` and no invented best, and not-found for an unknown or malformed id (L2-083 criteria 1 to 3).

Playwright (`e2e/session.spec.ts`, page object `e2e/pages/session-summary.page.ts`, sessions seeded into IndexedDB by `e2e/fixtures/sessions.ts` before the page loads), one test per behaviour of L2-085: the date line, title and delta (AC1, AC4); `All sessions` and `Ride this again` (AC2, AC3); the fall and `0 W` (AC4); the first ride (AC3, AC4, AC6); `Ended early` (AC5); the bests in order (AC6); the streak, week strip and weekly line (AC7); the traces' text alternative and dip bands (AC8); the dip rows and their highlight on hover and focus (AC9, AC10); no dips (AC9); the totals without heart rate (AC11); loading, not-found and error with `Try again` (AC12).

L2-084 is proven where the ride ends: `e2e/dialogs.spec.ts` (`End ride with a saved ride opens its summary as just finished`, including the reload that reads `All sessions`) and `e2e/banners-and-states.spec.ts` (the `bike-shut-off` overlay with `See your ride`, `Ride complete` with it focused, no overlay without a session).

### Open questions

- **Where `Done` goes.** The prototype sends both `Done` and `All sessions` to Progress, and this design follows it. <TO SUPPLY> if `Done` should return to the class library instead.
- **Heart rate.** The design's `Avg heart rate` stat is left out (ADR 0003, ADR 0015).

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-083` | `L1-005` | Session contract. `SESSION_API.list()` (summaries, newest first), `get(id)` (the session with `previous` and `bests`, or not found) and `progress()`. |
| `L2-084` | `L1-015` | Ending a ride opens its summary. `End ride`, the bike-shut-off overlay and a new `Ride complete` overlay lead to `/sessions/<session_id>`. |
| `L2-085` | `L1-015` | Session Summary page. The headline, delta, ended-early line, bests, streak panel, traces, dips with highlight and totals of one session, with `Done` / `All sessions`, `Ride this again`, and loading, not-found and error states. |
| `L2-087` | `L1-015` | Streaks, weekly goal, previous attempt, bests and achievements, computed in `@wattzup/browser` in the browser's time zone. |
| `L2-051` | `L1-007` | End-ride dialog. Criterion 2: the bike goes to the saved session's summary. |
| `L2-058` | `L1-006` | Ride dashboard states. Criterion 6: the bike-shut-off overlay offers `See your ride`. |

## Diagrams

### System context

The rider reviews a ride in Wattzup straight after it ends, or later from Progress.

![C4 system context for reviewing a session](diagrams/c4-context.png)

### Containers

Wattzup Web asks the Wattzup API for one session and for the progress figures. The API reads both from the sessions it loaded from the sessions file.

![C4 container view for reviewing a session](diagrams/c4-container.png)

### Components

`SessionPage` calls `SESSION_API` and formats the result with `session-view.ts`. It renders `SessionTraces`, `DipList`, `WeekStrip` and `StatStrip`. `BrowserSessionApi` reads `SessionStore` and asks `progress-calculator` for the previous attempt, the bests and the figures.

![C4 component view for reviewing a session](diagrams/c4-component.png)

### Class structure

The contract's `SessionDetail` carries the record, `previous` and `bests`. The pure `session-view.ts` turns it into the views that the presentation components take.

![Class diagram for reviewing a session](diagrams/class-structure.png)

### Behaviour — end a ride and open its summary

`End ride` stops the workout. The answer carries the session's id, and the dialog navigates to the summary as just finished. The page loads the session and the figures, then lays them out (L2-084, L2-085).

![Sequence diagram for opening a session summary](diagrams/sequence-open-summary.png)

### Behaviour — focus a cadence dip

Hovering or focusing a dip row sets the page's `focusDip`. The traces highlight that band and dim the others until the row is left (L2-085 criterion 10).

![Sequence diagram for focusing a dip](diagrams/sequence-focus-dip.png)
