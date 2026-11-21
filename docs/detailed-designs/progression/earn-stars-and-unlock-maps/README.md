# Earn stars and unlock maps

## Overview

Telo Ride's Race door offers seven maps in a fixed unlock order. Two are open on a new account;
each of the other five opens when the rider meets one goal. Stars give each map three targets to
chase after it opens. Together they form the map half of the progression (L1-008).

- **star** — award earned once on a map and never lost; each map has three
- **unlock order** — fixed sequence of the seven maps: Prairie Paceline, Old Town Criterium,
  Cliffside Coast, Neon Docklands, Dolomites, Vice City, Col du Granit
- **unlock goal** — single condition that opens a locked map: a top-3 finish in a bots race on a
  named map, a number of stars on a named map, or a rider level
- **prerequisite map** — map named by a top-3 or star goal
- **next unlock** — first locked map in unlock order whose goal the rider can work on now
- **best time** — rider's fastest finish on a map, in any mode

The three stars on every map are "Finish the race", "Top 3 against the medium pack" and "Beat
your best time". Classes and custom workouts earn no stars. The backend evaluates both stars and
unlocks when it records a race (L2-044), and computes the next unlock for every screen that shows
it, so Home, Map Select and Race Setup always agree (L2-041 AC4).

## Description

The slice is backend domain logic invoked from two handlers.

- **`MapDefinition`** — catalogue entity in `Telo.Ride.Domain` with the map's id, name,
  `UnlockOrder`, `OpenAtStart` and `Goal`. The catalogue is data served by `GET /api/maps`
  (`race/browse-maps`), so a catalogue change needs no app code (L2-045 AC3). The goals are:

  | Map | Goal |
  |-----|------|
  | Prairie Paceline | open at start |
  | Old Town Criterium | open at start |
  | Cliffside Coast | `TopThreeVsBots` on Prairie Paceline |
  | Neon Docklands | `TopThreeVsBots` on Old Town Criterium |
  | Dolomites | `StarsOn` Cliffside Coast, 2 |
  | Vice City | `ReachLevel` 10 |
  | Col du Granit | `StarsOn` Dolomites, 3 |

- **`UnlockGoal`** — abstract value object with the subtypes `TopThreeVsBots`, `StarsOn` and
  `ReachLevel`. `Describe()` produces the one goal text a locked map shows anywhere: "Finish top
  3 vs Bots on {map}", "Earn {n}★ on {map}" or "Reach rider level {n}".
- **`MapProgress`** — entity per rider and map holding the stars held, `BestTime`, `OpenedAt`
  and `UnlockSeenAt`. `Award(star)` adds a star and ignores one already held.
  `RecordFinish(time)` returns a `FinishRecord` with the previous best and whether the finish is
  a new best; a first finish sets the best.
- **`RaceFinish`** — value object with the map, the race mode (ghost, bots, riders online), the
  pack strength for a bots race, the place and the finish time.
- **`StarRules`** — domain service. `Evaluate(finish, progress)` returns the stars the finish
  earns: `Finish` for any finished race; `TopThreeMediumPack` for places 1 to 3 in a bots race at
  medium or hard; `BeatBest` for a finish faster than the previous best, never on a first finish.
- **`UnlockRules`** — domain service. `Evaluate(...)` returns the maps a recorded race opens.
  `NextUnlock(...)` walks locked maps in unlock order and returns the first whose prerequisite
  map is open or whose goal is a level. `MapToOffer(...)` serves the Next ride card
  (`home/choose-the-next-ride`).
- **`SubmitRideCommandHandler`** — calls `RecordFinish`, `StarRules`, `Award` and `UnlockRules`,
  opens any map, saves in one unit of work and returns the stars held, the new stars, the best,
  the previous best and the opened map in `RideRecordedDto` (see `keep-progress-on-the-backend`).
- **`GetProgressQueryHandler`** — returns the open maps, per-map stars and bests, each locked
  map's goal text and the next unlock in `ProgressDto`.

The total of stars is out of 21: 3 stars on each of 7 maps. The top-3 unlock goal accepts any
pack strength, while the second star needs medium or hard, as the requirements state.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-039` | `L1-008` | Each map shall have three stars, and an earned star shall never be lost; a finished race on a map in any mode shall earn the first star ("Finish the race"). |
| `L2-039` (AC2–AC3) | `L1-008` | A top-3 finish in a bots race at medium or hard shall earn the second star ("Top 3 against the medium pack"); a finish faster than the previous best on that map shall earn the third star ("Beat your best time"), and a first finish shall set the best without earning it. |
| `L2-039` (AC4–AC5) | `L1-008` | A class or a custom workout shall earn no stars; with 7 maps the star total shall be out of 21. |
| `L2-040` | `L1-008` | A new account shall have Prairie Paceline and Old Town Criterium open and the rest locked. |
| `L2-040` (AC2–AC4) | `L1-008` | A top-3 finish in a bots race on Prairie Paceline shall open Cliffside Coast, and on Old Town Criterium shall open Neon Docklands; 2★ on Cliffside Coast shall open Dolomites; 3★ on Dolomites shall open Col du Granit; reaching level 10 shall open Vice City. |
| `L2-040` (AC5–AC6) | `L1-008` | A ride's result shall name any map it opened for Home (L2-036) and Results (L2-076); a locked map shall show its one goal: "Finish top 3 vs Bots on {map}", "Earn {n}★ on {map}" or "Reach rider level {n}". |
| `L2-041` | `L1-008` | The next unlock shall be the first locked map in unlock order whose goal the rider can work on now: its prerequisite map is open, or its goal is a level. |
| `L2-041` (AC2–AC4) | `L1-008` | The mid rider's next unlock shall be Neon Docklands by "Finish top 3 vs Bots on Old Town Criterium"; the veteran's shall be Col du Granit by "Earn 3★ on Dolomites"; Home, Map Select and Race Setup shall show the same map and goal. |

## Diagrams

### System context

The rider races maps in Telo Ride, earns stars there and opens further maps. No external system
takes part.

![C4 system context for stars and map unlocks](diagrams/c4-context.png)

### Containers

The Ride app submits races to the Telo Ride API and reads the resulting stars, open maps and next
unlock; the API keeps map progress in the Telo Ride database.

![C4 container view for stars and map unlocks](diagrams/c4-container.png)

### Components

Two handlers share the domain rules: `SubmitRideCommandHandler` applies `StarRules` and
`UnlockRules` to a recorded race; `GetProgressQueryHandler` asks `UnlockRules` for the next
unlock.

![C4 component view for stars and map unlocks](diagrams/c4-component.png)

### Class structure

Each `MapDefinition` holds one `UnlockGoal` of three kinds. `MapProgress` holds the stars and the
best time per rider and map, and `UnlockRules` creates the `NextUnlock`.

![Class diagram for stars and map unlocks](diagrams/class-structure.png)

### Behaviour — evaluate stars and unlocks after a race

The handler records the finish, awards each new star of L2-039 and opens the map whose goal the
race met (L2-040), all in one unit of work.

![Sequence diagram for evaluating stars and unlocks](diagrams/sequence-evaluate-stars-and-unlocks.png)

### Behaviour — compute the next unlock

Every screen that shows the next unlock reads it from the same progress query, so the map and
goal match across Home, Map Select and Race Setup (L2-041 AC4).

![Sequence diagram for computing the next unlock](diagrams/sequence-next-unlock.png)
