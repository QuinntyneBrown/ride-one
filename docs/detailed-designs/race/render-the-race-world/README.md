# Render the race world

## Overview

Every map is a route through a 3D world. During a race the world fills the screen behind the
HUD and moves with the rider: the camera sits at the rider's place on the route and travels
forward at the rider's virtual speed. Other riders appear at their places in their jersey
colours; the ghost appears translucent gold.

> **world** — lit, textured 3D scene of one map's route, drawn behind the race HUD

> **renderer tag** — label in the race top bar naming the GPU API that draws the world, "WebGPU" or "WebGL 2"

> **panorama** — still photograph of a map's world, shown when the browser can draw neither WebGPU nor WebGL 2

> **real-world scenery** — optional photorealistic 3D Tiles of a real place, streamed from Google Maps Platform with the rider's own key

The world is the heaviest part of the app. It loads only when a race opens, in its own lazy
chunk, and releases every GPU resource when the race ends. It draws with WebGPU where the
browser grants an adapter and with WebGL 2 otherwise, through one Three.js `WebGPURenderer`
(ADR 0020, ADR 0021). It stops drawing while the tab is hidden; the race clock and telemetry
carry on regardless (L2-133). Its detail is scaled to the device, cheap forms of each technique
first (AGENTS.md, Low-power rendering).

Some maps follow a real place. On those maps a scenery panel offers to stream the real place as
photorealistic 3D Tiles with a Google Maps Platform key the rider pastes. The key stays in the
browser and goes only to Google's Map Tiles API. If Google refuses the key, the built-in world
stays.

## Description

**`world` library (`frontend/projects/world`, new)** — the boundary for Three.js. It is imported
only by dynamic `import()`, so neither Three.js nor the scene enters the initial bundle. Adding
it adds `ride → world` and `world → api` (types only) to the dependency rule in `AGENTS.md`
and to the ESLint boundaries in the same change.

- **`WorldRenderer`** — the only type that names a Three.js type. It exposes
  `start(canvas, map, quality)`, `resize(width, height)`, `draw(frame)`, `setVisible(visible)`,
  `useScenery(source)` and `dispose()`. `dispose()` releases every geometry, material,
  texture, render target and the renderer, and stops its `requestAnimationFrame` loop.
- **`RendererBackendProbe`** — asks for a WebGPU adapter, then for a WebGL 2 context, and
  returns `webgpu`, `webgl2` or `none` (L2-065 AC1, AC2).
- **`RenderQuality`** — pure tier table (ADR 0021): the tier for the device and backend, and
  which form of each technique the tier uses. `ultra` is WebGPU only.
- **`RaceWorldScene`** — road, terrain, sky and props of the map's world, loaded from
  same-origin assets under `frontend/public/worlds/<worldId>/` (ADR 0021). The road bends in
  the vertex stage (ADR 0023). The camera follows the rider's distance and keeps its framing in
  a portrait viewport by widening the vertical field of view, never stretching (L2-064 AC5).
- **`RiderFigures`** — one instanced mesh for the riders in view, each in its jersey colour;
  the ghost uses a translucent gold material (L2-064 AC3).
- **`PhotorealTilesLayer`** — loads Google's photorealistic 3D Tiles for the map's real place
  through the Map Tiles API with the rider's key, and reports `refused` when Google rejects it.
  The 3D Tiles loader package is `<TO SUPPLY>`; under ADR 0021 a new runtime dependency needs
  an amendment that names and pins it.

**Ride app**

- **`RaceWorldStore`** (`ride`, provided on the race route) — loads the `world` chunk, probes
  the backend, starts `WorldRenderer` on the scene's canvas, feeds it one `WorldFrame` per
  animation frame from the latest `RaceSnapshot` and field, pauses drawing on
  `visibilitychange` to hidden, and calls `dispose()` on destroy. It also releases its
  `ResizeObserver` and listeners. It exposes `backend` for the renderer tag.
- **`RaceScene`** (`components`, block `race-scene`) — the canvas host. The canvas is one image
  (`role="img"`) labelled with the map's world description ("The Old Town Criterium world: a
  cobbled old town under a blue sky, its cathedral spire on the horizon"). With backend `none`
  it shows the map's panorama (`race-scene__photo`) instead (L2-065 AC2).
- **Renderer tag** (element of `RaceBar`) — "WebGPU" or "WebGL 2", title "The GPU API drawing
  this world".
- **`RaceScenery`** (`components`, block `race-scenery`) — rendered only on a map with a real
  place. It reads "Ride the real Bruges · Steenstraat to the Markt" and "Paste a Google Maps
  Platform key to stream it as photorealistic 3D Tiles. It stays on this device.", with a key
  field (placeholder "AIza…") and "Stream it", disabled while the field is empty. It emits
  `stream(key)` and shows a refused message when told. From 640 px to 1023 px no HUD panel
  covers it (L2-066 AC6).
- **`SettingsStore`** (`domain/storage`) — keeps the Maps key in this browser only. The key is
  never sent to Telo Ride's backend (L2-066 AC3).
- **`MapDto.realPlace`** and **`MapDto.worldDescription`** (`api`) — catalogue fields read
  here: the real place's title, subtitle and tile region, and the world's text description.

The Content Security Policy that admits the Map Tiles API origin is designed by
security/restrict-third-parties.

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a
level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-064` | `L1-012` | During a race the map's 3D world shall be drawn from the rider's place on the route, with the camera moving forward at the rider's virtual speed, computed by a documented power-to-speed model whose constants are an open question. Other riders within view shall be drawn in their jersey colours at their places on the route, the ghost translucent gold. Assistive technology shall read the world as one image with a description ("The Old Town Criterium world: a cobbled old town under a blue sky, its cathedral spire on the horizon"). In a portrait viewport the world shall be reframed to fill the screen without stretching. |
| `L2-065` | `L1-012` | With WebGPU the world shall be drawn with WebGPU and the tag shall read "WebGPU"; otherwise with WebGL 2 and the tag "WebGL 2". The tag's title shall be "The GPU API drawing this world". With neither, the world shall be replaced by the map's panorama and the race shall still run. While the tab is hidden the world shall stop drawing and the race clock and telemetry shall carry on (L2-133). |
| `L2-066` | `L1-012` | On Old Town Criterium the scenery panel shall read "Ride the real Bruges · Steenstraat to the Markt" and "Paste a Google Maps Platform key to stream it as photorealistic 3D Tiles. It stays on this device.", with a key field (placeholder "AIza…") and "Stream it", disabled while the field is empty. An entered key shall be stored only in this browser and sent only to Google's Map Tiles API, never to Telo Ride's backend. When Google refuses the key, the built-in world shall stay and the panel shall say the key was refused. A map with no real place shall have no scenery panel. From 640 to 1023 px no HUD panel shall cover the panel. |

## Diagrams

### System context

Telo Ride draws the world itself. Google Maps Platform takes part only when the rider streams
real-world scenery with their own key.

![C4 system context for rendering the race world](diagrams/c4-context.png)

### Containers

The Ride app loads world assets from its own origin, keeps the Maps key in browser storage, and
calls Google's Map Tiles API directly. The Telo Ride API takes no part in drawing.

![C4 container view for rendering the race world](diagrams/c4-container.png)

### Components

`RaceWorldStore` loads the lazy `world` library and drives `WorldRenderer`, which composes the
probe, quality table, scene, rider figures and the optional tiles layer.

![C4 component view for rendering the race world](diagrams/c4-component.png)

### Class structure

`WorldRenderer` owns the scene, the figures and the tiles layer and disposes them together.
`RaceWorldStore` holds the renderer and the backend the probe chose.

![Class diagram for rendering the race world](diagrams/class-structure.png)

### Behaviour — start, draw and dispose the world

The store loads the chunk, probes the backend, and either starts the renderer or shows the
panorama. Drawing pauses while the tab is hidden, and leaving the race disposes every resource.

![Sequence diagram for starting, drawing and disposing the world](diagrams/sequence-start-draw-and-dispose.png)

### Behaviour — stream real-world scenery

The key goes to browser storage and to Google's Map Tiles API only. A refused key leaves the
built-in world in place and the panel says so.

![Sequence diagram for streaming real-world scenery](diagrams/sequence-stream-real-scenery.png)
