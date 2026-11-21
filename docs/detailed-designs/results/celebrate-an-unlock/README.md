# Celebrate an unlock

## Overview

Opening a new map is the biggest reward in Telo Ride's progression. It is also the one moment the
app celebrates with motion (L1-013). When a ride meets a locked map's goal, Results shows a gold
card that names the map and offers to race it.

- **unlock** — opening of a locked map when the rider meets its goal
  (`progression/earn-stars-and-unlock-maps`)
- **unlock card** — gold card on Results that announces the opened map
- **reduced motion** — rider's operating-system preference, exposed as the
  `prefers-reduced-motion: reduce` media feature, for less movement on screen

The backend decides whether a ride opened a map and names it in its answer (L2-040 AC5). Results
shows the card only then. The same unlock also drives the banner on Home
(`home/choose-the-next-ride`, L2-036).

## Description

- **`ResultsStore`** — the Results route's store (see `show-results`). When the outbox's sync
  state becomes `recorded` with an `openedMapId`, it looks the map up through `CATALOGUE_API` and
  sets `unlock` to an `UnlockCardView`; otherwise `unlock` stays `null`.
- **`UnlockCardView`** — the map id, the title "{map} is open", the place line ("A harbour city
  after dark.", from `MapDto.worldDescription`), the photo and the action label "Ride {map}".
- **`UnlockCard`** — presentation component (`wz-unlock-card`, block `unlock-card`). It renders
  the card and emits `ride(mapId)`. Its stylesheet defines the entrance:
  - the card fades in and scales from 0.96 to 1 over 250 ms, starting after 200 ms;
  - the photo fades from grey at half brightness to full colour over 250 ms, starting after
    350 ms;
  - under `prefers-reduced-motion: reduce`, only opacity changes.

  Durations and easing come from the design-system motion tokens. The animation is CSS only, so
  it holds no timer to release.
- **`ResultsPage`** — renders the card when `unlock` is set and routes `ride(mapId)` to Race
  Setup for that map.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-076` | `L1-013` | When a ride opened Neon Docklands, Results shall show a gold card reading "Neon Docklands is open" and "A harbour city after dark.", with "Ride Neon Docklands" (to Race Setup for it). |
| `L2-076` (AC2) | `L1-013` | The card shall fade in and scale from 0.96 to 1 over 250 ms after 200 ms, then its photo shall fade from grey at half brightness to full colour over 250 ms after 350 ms; with reduced motion, only opacity shall change. |
| `L2-076` (AC3) | `L1-013` | When no map opened, Results shall show no unlock card. |

## Diagrams

### System context

The rider sees in Telo Ride the map a ride opened. No external system takes part.

![C4 system context for celebrating an unlock](diagrams/c4-context.png)

### Containers

The Telo Ride API names the opened map in its answer to the ride's submission; the Ride app shows
the card.

![C4 container view for celebrating an unlock](diagrams/c4-container.png)

### Components

`ResultsStore` reads the opened map from the outbox's recorded answer and its details from
`CatalogueApi`; `ResultsPage` renders `UnlockCard`.

![C4 component view for celebrating an unlock](diagrams/c4-component.png)

### Class structure

The store computes an `UnlockCardView` from `RideRecordedDto.openedMapId` and the `MapDto`. The
note records the motion the stylesheet applies.

![Class diagram for celebrating an unlock](diagrams/class-structure.png)

### Behaviour — show the unlock card

With an opened map, the card enters with the timed fade, scale and colour change, or opacity only
under reduced motion (L2-076 AC2). With none, no card shows (AC3).

![Sequence diagram for showing the unlock card](diagrams/sequence-show-unlock-card.png)
