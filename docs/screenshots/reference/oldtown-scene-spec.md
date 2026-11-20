# Old Town Criterium: the scene, layer by layer

This is the technical specification of Old Town Criterium's World Ride scene, the reference every
other world is built to (`docs/screenshots/reference/oldtown-final.png` is how it looks; it scores 80
on the render-quality rubric). It records what Old Town draws, where, how big, in what material,
and why, down to the pot plants by the front doors, so a new world can be built to the same
standard with the same structure.

Source of truth: `frontend/projects/wattzup/src/app/core/world-oldtown.ts` (the street),
`world-renderer.ts` (sky, light, road, camera, riders), `pacers.ts`, `world-cyclist.ts`,
`worlds.ts` and `world-kit.ts` (the shared pieces new worlds build on). Where this document and
the code disagree, the code wins; fix the document.

Read with: `docs/detailed-designs/world-ride/draw-class-scene/README.md` (the design every scene
is listed in), `docs/class-worlds.md` (the rubric and each world's score) and AGENTS.md.

---

## 1. What is fixed and what each world changes

Fixed in every world (never change them per world):

| Fixed                                                                                                                                                                                                                                           | Where it comes from                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| The screen layout: top bar (world · circuit · class, timer, Pause/End), power panel top left, Riders nearby top right with the You row highlighted, interval card bottom left, elevation profile bottom centre, resistance control bottom right | the World Ride page (`dashboard/`), the mocks `docs/mocks/pages/world-ride/*` |
| The rider (You) and the six pacers, their 3D models, kits, race numbers and helmets                                                                                                                                                             | `world-cyclist.ts`, `pacers.ts`, `ThreeWorldRenderer.addRider`                |
| The camera                                                                                                                                                                                                                                      | `ThreeWorldRenderer.draw`                                                     |
| The road strip, its width and the effort arch over it                                                                                                                                                                                           | `ThreeWorldRenderer` (`ROAD_HALF = 3.5`, `addArch`)                           |
| The sky model, shadows, tone mapping and the quality tiers                                                                                                                                                                                      | `ThreeWorldRenderer`, `render-quality.ts` (L2-111)                            |

What a world supplies, and nothing else:

| Per world                                                                        | Where                                                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Name, circuit (route), effort name, description, grade per segment kind and roll | an entry in `WORLDS` in `worlds.ts` (and its grade test row in `worlds.spec.ts`)            |
| Sky, fog, light, ground and road colour                                          | an entry in `LOOKS` in `world-renderer.ts`                                                  |
| The scene itself                                                                 | its own `SceneStreet` module, `world-<id>.ts`, registered in `STREETS` (`world-streets.ts`) |
| Banner, barrier, flag and road-paint text                                        | constants at the top of its module                                                          |

Old Town predates the kit: it builds its own crowd and ribbons, and the renderer creates it
directly (`addStreet`). Every newer world implements `SceneStreet` and is built from the kit;
section 9 maps each Old Town layer to the kit piece a new world uses.

---

## 2. Coordinates, the loop and placement

- **Axes.** The rider rides at the origin, facing −z. x is across the road (+x right), y is up.
  `metres` ahead of the rider is z = −metres.
- **The road.** 3.5 m each side of the centre line (`ROAD_HALF`), laid as a strip of points every
  2 m: 150 ahead (300 m) and 10 behind. `heightAt(metres)` gives the road's height there; every
  part stands on it.
- **The loop.** The street is built once along a loop of `LOOP` metres (Old Town 420 m; kit
  worlds use 500 m) and recycled as the rider rides. A part at loop offset `offset` stands

  ```
  metres = ((offset − s) mod every) − BEHIND
  ```

  ahead of the rider, `s` metres into the ride (`loopMetres` in the kit). BEHIND (Old Town 24,
  kit worlds 30) keeps parts in view a little behind the camera.
  **Pitfall:** offsets are positions on the loop, not distances ahead. The baseline capture is
  taken about 7 s in, at s ≈ 60–70 m, so a part meant to be about 45 m ahead in the opening
  shot needs an offset of about s + BEHIND + 45 ≈ 140 m. A part at offset 40 is behind the rider
  in that shot.

- **Far landmarks don't loop.** The cathedral, the belfry and the TV moto stand a fixed distance
  ahead every frame (`position.set(x, heightAt(ahead), −ahead)`), like a skyline.
- **Ribbons.** Anything continuous along the road (kerbs, pavements, barriers, rails, shade
  strips) is a ribbon: a cross-section profile `[x, height above the road][]` swept along the
  road's points every frame by `lay(points, s)`. UVs are in metres: u across the profile, v along
  the road plus `s`, so textures stay fixed to the street as the rider passes. Ribbon meshes are
  `frustumCulled = false` and `receiveShadow = true`.
- **Randomness.** All variety is seeded (`seeded(n)`), never `Math.random()`. Each concern draws
  from its own sequence: the layout (`seeded(3)`), the alleys (`seeded(71)`), each house
  (`seeded(7919·index + 7921)`), and each house feature (`chance(feature)`). Adding a new detail
  then never reshuffles the rest of the street. Keep this discipline in every world.

---

## 3. Light, sky, fog and camera

`LOOKS.oldtown`: a clear early-summer afternoon, the sun high behind the rider's left shoulder.

| Setting                  | Value                                | Effect                                                                                    |
| ------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `sky`                    | `0xa9c7e8`                           | hemisphere fill's sky colour                                                              |
| `fog`                    | `0xdcd8cf`, range 30–430 m           | warm stone-coloured haze down the street                                                  |
| `ground`                 | `0x6b6256`                           | hemisphere fill's ground bounce, ground strip                                             |
| `road`                   | `0xd9d2c8`                           | tint over the cobble texture                                                              |
| `sun`                    | elevation 42°, azimuth −150°         | high, behind and to the left: the house fronts on the right are sunlit, the left in shade |
| `light`                  | sun 3.5, fill 1.0, colour `0xffe2b6` | a strong warm key and a low fill: deep, readable shadows                                  |
| `turbidity` / `rayleigh` | 1.6 / 2.6                            | a clean, deep blue sky                                                                    |

Renderer-wide (the same for every world):

- **Camera:** `PerspectiveCamera(60°, aspect, 0.1, 6000)` at (sway, 2.1, 5.5), looking at the
  road 24 m ahead, 1.2 m up. The sway is `sin(s/3)·0.04` (0 under reduced motion). Captures are
  1440 × 900.
- **Sky:** a physical `SkyMesh` (scale 4500, mie 0.003). The sky also lights the scene through a
  PMREM environment at intensity 0.06.
- **Fog doesn't touch the sky.** Anything that must read as distant against the sky is hazed by
  hand instead (section 7), and mist is drawn as curtains (kit `Mist`).
- **Sun shadows:** a 2048² map in a tight box around the rider; Old Town's box reaches 45 m
  (other worlds 25 m) because a street of houses needs longer shadows. Bias −0.0005.
- **Per tier** (`render-quality.ts`): AgX tone mapping, exposure, anisotropic filtering (up to
  16×), PCF shadows, bloom (0.12) and the rest of the L2-111 techniques. A world doesn't change
  these.

---

## 4. The road surface

Old Town rides on cobbles (`COBBLED` set in the renderer; a world joins it only if its road
really is setts). `cobbleTextures()` makes one 1024² tile covering 10 m along by 7 m across, plus
a matching normal map:

- **Setts:** 13 cm rows across the road, each sett 11–17 cm wide, staggered half a sett row on
  row. Each is its own shade of granite (tone 165–215, a little warmth), lit from above (a light
  top edge, a dark bottom edge), with dark joints. Setts in the wheel tracks (the middle 36%) are
  polished: lighter and more even.
- **Relief:** each sett domed (radial gradient) and the joints sunk, turned into a tangent-space
  normal map with strength 9. The road catches the low light sett by sett.
- **Gutters:** a 32 cm channel of long granite slabs along each kerb, dished and darker, with a
  cast-iron drain grate in each, the two sides out of step.
- **Race lines:** a white edge line 10 cm wide, 42 cm in from each side.
- The texture scrolls with `s` (`offset.y = (s/10) mod 1`) for both map and relief.

On top of the road:

- **The fans' writing:** `ALLEZ ALLEZ`, `HUP HUP`, `VAMOS`, `GO ANA` in off-white and yellow
  (`paintTexture`), each 3.2 × 7 m, stretched along the road so it reads from a rider's low eye.
  They lie 1 cm above the road (transparent, `depthWrite: false`, `polygonOffset −2`), at offsets
  38, 135, 232 and 329 m, between 0.9 m left and 0.8 m right of centre.
- **Manhole covers:** three cast-iron covers per lap (r 0.4 m) with a raised ring, a
  cross-hatched field and the water board's letters `EAU`, at offsets 33, 150 and 290 m.
- **The damp gutter line:** a 40 cm strip against each kerb, darker and glossier (roughness 0.2)
  than the dry setts, broken by dry patches where the water ran off (alpha map, transparent).

---

## 5. The street, layer by layer from the kerb out

Each side of the road, from the road edge outwards (x = distance from the centre line):

| Layer             | x (m)                 | Height                     | Material                                                                                                                            | Notes                                                                                                                                                                                        |
| ----------------- | --------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kerb face and top | 3.50 → 3.75           | 0 → 0.15                   | `kerbTexture`: granite kerbstones a metre long, speckled, each a shade apart, fine joints                                           | profile: down the face, across the 25 cm top                                                                                                                                                 |
| Crowd barriers    | 3.90                  | 0.23 → 1.15                | printed vinyl (`barrierBannerTexture`), roughness 0.5, metalness 0.05, alphaTest 0.5                                                | panels: OLD TOWN CRITERIUM, CATHEDRAL CIRCUIT, COBBLED SPRINT, RACE DAY, WATTZUP, ALLEZ !; the left side's texture is mirrored (`repeat.set(−1, −side/24)`) so its print reads the right way |
| Barrier top rail  | 3.86 → 3.94           | 1.15 → 1.21                | brushed steel `#b9bdc2`, metalness 0.7, roughness 0.35                                                                              | a small diamond profile                                                                                                                                                                      |
| Pavement          | 3.75 → 7.00           | 0.15                       | `slabTexture`: 50 cm flagstones in two staggered rows per metre, each slab a shade apart, old chewing gum, a damp stain and a crack | runs under the house fronts                                                                                                                                                                  |
| Corner shade      | 5.60 → 7.00           | 0.154                      | black, alpha from clear to darkest at the wall (`cornerTexture`)                                                                    | ambient occlusion where pavement meets wall                                                                                                                                                  |
| House fronts      | 6.50 + 0–0.45 setback | from 4 m below the road up | section 6                                                                                                                           | each house stands up to 45 cm back: old frontages never line up                                                                                                                              |

The renderer hides its generic roadside posts and lamps for Old Town: the street brings its own.

### 5.1 Street furniture on the pavement

**Lamp posts:** every 28 m (offset i·28 + 6), alternating sides, at x = ±4.2 (just behind the
barrier). Each one has:

- a cast-iron foot (r 0.16–0.2, 0.5 m) and a 4 m tapering pole (r 0.06–0.09), iron `#1f2124`
  (metalness 0.6);
- a hexagonal lantern of warm glass (`0xfff1d0`, emissive `0xffd9a0` at 0.35) under a conical
  iron cap at 4.85 m;
- **a hanging basket** on a 0.9 m iron arm reaching out over the barrier at 3.6 m: a wicker
  half-bowl (r 0.3, `0x5a3e26`) at 3.2 m, a mound of geraniums in it (r 0.36, bloom texture, red
  and pink heads on green), and ivy and lobelia trailing out underneath (an open cone of the leaf
  material, point down);
- **a race pennant** on the post at 2.4 m, square to the street: a 0.5 × 1.1 m swallow-tailed
  cloth lettered O-T-C down it, black with volt letters or red with white, alternating.

### 5.2 Across the street

- **Cloth banners:** three, at offsets 70, 210 and 350 m: `OLD TOWN CRITERIUM` (black on volt),
  `WELKOM · BIENVENUE` (white on red) and `CATHEDRAL CIRCUIT` (navy on cream). Each is a
  7 × 1.3 m cloth at 7.2 m (`clothBannerTexture`, DoubleSide, casts shadow), hung from an iron
  rope at 7.85 m spanning house to house (13 m).
- **Bunting:** a line every 35 m (12 lines a lap, first at offset 14), each with 30 triangular
  pennants (0.4 m wide, 0.42 m drop, point down) in red, cream, navy, gold and green. The cord
  hangs 8.5 m up at the house fronts and sags 1.6 m at the centre (a parabola). Each pennant and
  its length of cord follow the cord's slope. Both are drawn instanced: one mesh for all
  pennants, one for all cord lengths.

---

## 6. The houses

Built along each side of the loop, back to back with no gaps except alleys. The right side
starts 5 m into the loop and the left at 0, so the two sides' joints never line up.

### 6.1 Massing

| Dimension     | Value                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| Width         | 2–5 window bays × 3 m (6–15 m), from the layout sequence                                                      |
| Shop floor    | 4.2 m high                                                                                                    |
| Upper storeys | 2–4, each 3.2 m                                                                                               |
| Depth         | 10 m                                                                                                          |
| Footing       | 4 m below the road, so a slope never shows a house's base                                                     |
| Roof          | a pitched prism, ridge along the street, rise 2.2–3.8 m, overhanging 0.3 m at the eaves and 0.1 m at the ends |
| Façade colour | one of 8 palettes; next-door houses are never the same palette                                                |
| Roof colour   | one of 4 clay and slate tiles: `#9a4b33`, `#7c3d2c`, `#a85a3a`, `#5a5c63`                                     |

The façades are textured boxes (`tiledBox`): the road-facing side shows one texture tile per
window bay and storey, so the windows line up with the geometry. The roof (`prism`) has two
material groups, tiled slopes and plain gables in the wall colour.

**Palettes** (wall / trim / shutter / window-box flowers):

| Wall                 | Trim      | Shutters  | Flowers |
| -------------------- | --------- | --------- | ------- |
| `#c96f55` terracotta | `#efe2c9` | `#5a6e4c` | white   |
| `#e2b86f` ochre      | `#f6ecd6` | `#4d6a73` | pink    |
| `#efe4cc` cream      | `#ffffff` | `#5f7a52` | red     |
| `#de9474` salmon     | `#f4e6cf` | none      | none    |
| `#ead27f` yellow     | `#fbf3dc` | `#6b4d36` | magenta |
| `#b9c2a0` sage       | `#f1efe4` | `#4f5f45` | yellow  |
| `#d99d91` rose       | `#f7ebe3` | `#53627a` | white   |
| `#aebdc8` blue-grey  | `#f2f2ee` | none      | red     |

### 6.2 Ground floor: a shop or a home (50/50 per house)

**Shop** (one texture tile per 3 m bay, `bayTexture(palette, true)`):

- A painted wooden shop front with a stone plinth.
- A lit window: a warm interior (dark at the ceiling, amber low down), with a reflection of sky
  and street across the glass and a glazing bar. An emissive map lets only the glass glow
  (`0xffc58a` at 0.32).
- The window shows the shop's trade, which is fixed per palette:
  - **Books:** shelves of spines in five colours.
  - **Bread:** shelves of round cobs and long batons, gold to brown.
  - **Flowers:** three tiers of grey buckets of cut flowers.
  - **Clothes:** a rail of hanging garments and two dressed mannequins.
- **Fascia** over the shop front at 4.05 m: a 5.2 × 0.42 m dark green board with a gilt border
  and the trade in spaced gilt serif capitals (BOEKEN, BAKKERIJ, BLOEMEN, MODE), scaled to the
  house's width.
- **Shop door** (1.1 × 2.5 m) in one of the bays: painted wood in one of four colours (green,
  oxblood, navy, charcoal), with a glazed upper panel showing the lit shop, a lower panel, a
  brass handle and a brass kick plate.
- **Awning** (65% of shops): striped canvas (the colour and cream, seven colours) sloping 1.5 m
  out and 0.7 m down from just under the fascia. Below it a 16 cm valance with a scalloped hem,
  one half-disc scallop every 30 cm.
- **Hanging sign** (60% of shops): a painted board (0.7 × 0.55 m) on a 1.1 m iron bracket at
  5.1 m, standing out over the pavement. It has a gilt border and a gilt emblem: a cup on green,
  a key on oxblood, a loaf on navy or a wheel on black.

**Home** (one texture tile per two bays, `homeTexture`):

- Rusticated stone up to the window sills.
- A panelled double door under an arched stone surround and a glazed fanlight, with a brass knob.
- A barred window beside the door: iron bars over the glass, with two cross-bars.
- **A worn stone step** at each door (0.45 × 0.16 × 1.3 m, `0xbdb5a6`).
- **Pot plants: a clipped bay tree in a terracotta pot either side of each door.**
  - The pot is a tapered cylinder (r 0.24 at the top, 0.18 at the foot, 0.5 m tall), terracotta
    `0xb4603f`.
  - The bay is a sphere of r 0.42, stretched to 1.25 times its height, centred 0.95 m up, in the
    leaf texture (1,400 small leaves in shades of green).
  - Each pot stands 0.85 m from the door's centre and 0.35 m out from the wall. Each has its own
    35% chance of being missing, so the pairs aren't all complete.

### 6.3 Upper storeys

One texture tile per bay and storey (`bayTexture(palette, false)`, 30% of houses use the
shut-shutter version):

- A tall window (62 × 118 px of a 192 × 205 tile) in a trim surround, with:
  - **Louvred shutters** open either side, in the palette's colour.
  - **Glass** that mirrors the sky above and the sunlit houses across the street below
    (a four-stop gradient), with a diagonal glint.
  - **A curtain** drawn to one side inside.
  - **Glazing bars:** one upright and one transom.
- **Shut shutters:** both leaves closed against the afternoon sun.
- **Weathering:** grime splashed up from the street (stronger on the shop floor) and rain streaks
  running down from under each sill.
- **Stucco texture:** about 900 light and dark specks per tile.

In 3D, on every upper window:

- A stone **sill** (0.2 × 0.09 × 1.2 m) at 0.62 m.
- A **lintel** (0.1 × 0.16 × 1.22 m) at 2.62 m, with a raised **keystone** (0.14 × 0.26 × 0.2).
- **A window box of geraniums**, where the palette has flowers. It is a terracotta trough
  (0.24 × 0.2 × 1.05 m) on the sill, with a mound of geranium blooms spilling over its front
  (a sphere scaled 0.4 × 0.3 × 1.25 in the bloom texture). The texture also paints a box in, so
  it reads from far off as well as close up.

### 6.4 Façade ornament (3D, in the trim colour)

- **Cornice** under the eaves: 0.45 m proud, 0.42 m high.
- **Dentils** under the cornice: small blocks every 0.3 m (0.18 × 0.14 × 0.14).
- **String course** over the shop floor: 0.2 m proud, 0.24 m high.
- **Quoins** up both front corners (50% of houses): long and short stones in turn (0.75 and
  0.45 m), every 0.5 m.
- **Stepped gable** (35% of houses 9 m wide or less): five courses narrowing to the top. Each is
  coped in stone with a stone ball finial on its outer corners, and the second course has a
  round window (an iron oculus). This is the Flemish town house.

### 6.5 Balconies (40% of houses)

- A first-floor stone slab (0.85 m deep, 16 cm thick) the width of the house less 0.8 m.
- A wrought-iron railing on three sides, 0.95 m high: top and bottom rails, balusters every
  16 cm and a pair of scroll rings per metre. It is a cutout texture (alphaTest 0.5) on planes.
- **Geraniums in pots along the railing**: 2–4 terracotta pots (the door pot at 0.7 scale), each
  with a geranium mound.
- **A bistro table** on 40% of balconies: an iron drum.

### 6.6 Roofscape

- **Dormers:** 0–2 on the street-side slope, each a small windowed box (1.6 m) in the upper
  façade's texture under its own tiled gable roof.
- **Chimney stacks:** 1–2 per house, brick (`0x8e4a37`), 0.7 × 1.4 × 0.9 m, each with a brick
  cap and **two clay chimney pots** (terracotta cylinders r 0.1–0.13, 0.4 m) side by side.
- **Ridge tiles** capping the ridge.
- **A zinc gutter** along the eaves (16 × 14 cm), with **a downpipe** at one end running the
  full height to the pavement.
- **Roof tiles** (`tileTexture`): courses of rounded clay tiles, one metre per repeat, each tile
  a shade apart, shaded across its curve, with a dark line under each course.

### 6.7 Flags on the houses (32% of houses)

A 2.4 m iron pole angled 0.5 rad out from the first floor over the pavement, flying a
2.0 × 1.35 m civic flag in two or three horizontal bands: red/cream, gold/navy,
green/cream/red or black/gold. The cloth is creased by soft vertical shading and readable from
either side.

### 6.8 Alleys

- About 14% of the gaps between houses, plus one guaranteed between 40 and 75 m into the loop so
  it is in the opening view.
- Each is 3.2 m wide and 16 m deep, floored in grey setts (`0x8a837a`).
- It runs back into shade to a wall in the neighbour's colour, 11 m high.
- **An arch spans it 6 m in**, carrying a room over the alley with its own small window.

### 6.9 Performance

Each house is merged with `flatten()`: all parts that share a material become one mesh, one
draw per material per house. Shared geometries (the unit box, pot, bush, finial, chimney pot,
oculus, scallop, sign board, door leaf, fascia board) are created once on the street object and
reused. Everything is pushed to `disposables`, and every canvas texture goes through `track`.

---

## 7. The skyline and the landmark

**The hero landmark: a Gothic cathedral at the vanishing point.** It stands 500 m ahead, 6 m
right of the street's line, sunk 2 m. It is built from boxes, cones and a prism, in limestone
(`0xd6c197`), with:

- **The nave:** 30 × 34 × 110 m, under a steep slate roof (prism, 18 m rise), with pinnacles
  every 12 m along both walls.
- **The west tower:** three stages narrowing (24 × 60 × 22 m, 20 × 22 × 19, 16 × 14 × 15). Each
  stage is faced with lancet windows with tracery (`gothicTexture(false)`), with corner
  pinnacles at two levels.
- **The spire:** an openwork spire (r 11, 62 m) of quatrefoils diminishing to the tip
  (`gothicTexture(true)`), topped with a gilded cross at 157–161 m.
- **The flanking towers:** two lower towers (14 × 46 × 16 m), each with a 22 m pinnacle.
- **The west front:** a dark portal (7 × 14 m) under a pointed gable, a 10 m rose window at
  34 m, and lancets on the side towers.
- **A clock** on the tower's face at 71 m: an 8 m cream dial with gilt hands.

It is **hazed by hand**: every material has `fog: false` and its colour lerped toward the haze
colour `0xdcd8cf` (stone 25%, shade 30%, roof and glass 45%, gilt 10%). The scene fog would
otherwise wash it out completely at 500 m. The cathedral is merged with `flatten()`. The kit's
`hazedMaterial(disposables, haze, colour, amount, options)` is this technique, shared.

**The mid-distance landmark: a parish belfry** 260 m ahead, 13 m left, over the roofs. It is a
square brick tower (9 m wide, 34 m high) with a stone string course, a louvred bell stage (8 m)
with dark louvres on each face, a second string course and an octagonal slate spire (22 m),
hazed at 32%. It breaks the roofline between the street and the cathedral, so the distance
reads in steps.

**Swifts:** a dozen dark crescents (two swept wing boxes each, unlit, unfogged) wheeling 24–34 m
over the roofs 70–120 m ahead, one turn per 60 m ridden.

---

## 8. Life: the crowd, the marshals and the race

### 8.1 Spectators

- **Knots** of 2–7 people, the gaps between knots 1–5 m, each knot on a random side. People
  stand 0.5–0.9 m apart along the knot, 4.4–5.8 m from the centre line (behind the barrier, on
  the pavement).
- **Each person** is built from instanced unit parts, scaled per person:
  - legs (a capsule, 0.9 m), a torso (a capsule, 0.75 m), a head (r 0.105) and two arms
    (capsules, 0.6 m);
  - height 1.55–1.9 m;
  - turned toward the road, ±0.6 rad of square.
- **Colours** vary per person:
  - shirts from eleven colours, including the race's volt and two club-jersey colours;
  - five skin tones;
  - five trouser colours;
  - hair in seven natural shades on every bare head.
- **Cheering:** a quarter of the crowd cheer, both arms raised up and out. **Two in three of
  those wave a hand flag** (0.4 × 0.28 m) in the pennant colours, held square to the street.
- **Children:** one in six is a child, 1.05–1.35 m tall, at the front against the barrier.
- **Hats:** a fifth wear sun hats or caps (cream, navy, red, white or volt).
- **Marshals:** a race marshal in a hi-vis vest (`#e8f021`) every 38–44 m, alternating sides,
  at the barrier facing the road, 1.8 m tall.
- **Drawing:** seven instanced meshes in all (legs, torsos, heads, arms, hats, hand flags, hair),
  coloured per instance, casting shadows and moved with the street every frame. Hats and hair are
  shown or hidden by scaling to 0.

### 8.2 The race

- **The TV moto** rides 30 m ahead, 2.3 m left of centre:
  - a white motorbike with a blue stripe and a black seat, and a pilot in black leaning to the
    bars in a white helmet;
  - a cameraman in blue sitting backwards on the pillion, the camera on his shoulder turned on
    the riders;
  - a transmitter mast with an amber beacon (emissive) and a blue `TV` board on the back.
- **The riders:** You (jersey 4) on the centre line, and the six pacers (`PACERS`), each at its
  gap from the Riders nearby board and in its own lane. Pacers ride from 4 m behind to 300 m
  ahead.

  | Pacer           | Jersey | Lane (m) |
  | --------------- | ------ | -------- |
  | Sophie Dubois   | 1      | −1.7     |
  | Maya Okafor     | 2      | 1.5      |
  | Jonas Lindqvist | 3      | −0.9     |
  | Ana Ferreira    | 5      | 1.1      |
  | Ravi Patel      | 6      | −1.3     |
  | Kenji Watanabe  | 7      | 2.0      |

  Each rides a frame in its own paint, and even-numbered pacers wear a white helmet. All riders
  have race numbers, pedal with the cadence and cast shadows.

- **The effort arch:** a black gantry on two steel truss legs (four chords each, on weighted
  feet) with the next effort's label. It appears over the road where each effort starts.

### 8.3 Grade

`worlds.ts` gives Old Town `warmup 0.5, work 6, rest −1.5, cooldown 0, steady 0, roll 0.5`. Each
sprint is a 6% kick up toward the cathedral, and the recoveries run back down. The grade the
rider sees is `grade[kind] + roll·sin(s/310)·cos(s/870 + 1)`.

---

## 9. Building a new world to this standard

### 9.1 Layer map: Old Town → a new world

| Old Town layer                                                          | Its role in the rubric          | A new world uses                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cobbles with relief, gutters, race edge lines                           | Road surface                    | the renderer's road (join `COBBLED` only for real setts); markings as ribbons (kit `dashTexture` for centre lines, edge-line ribbons); stencils and decals as planes with `polygonOffset` |
| Fans' writing on the road, every ~100 m                                 | Road surface                    | kit `paintTexture`, every 25 m (flat paint only reads in the first ~25 m)                                                                                                                 |
| Manhole covers, damp gutter line                                        | Road surface                    | world-specific decals                                                                                                                                                                     |
| Kerb, pavement, corner shade                                            | Geometry                        | kit `Ribbons` with the world's own textures                                                                                                                                               |
| Barriers with printed panels and rail                                   | Event dressing                  | kit `barrierBannerTexture` on a ribbon at x = ±3.9, the same rail profile                                                                                                                 |
| Banners across the street                                               | Event dressing                  | kit `clothBannerTexture`                                                                                                                                                                  |
| Bunting, lamp pennants, house flags                                     | Event dressing                  | kit `FeatherFlags`; bunting and lamp pennants are Old Town's own (move them into the kit before a second world uses them)                                                                 |
| Houses with storeys, roofs, ornament                                    | Geometry                        | the world's own modelled buildings or terrain, with varied heights and colours; never flat photo walls or a repeated corridor                                                             |
| Pot plants, window boxes, hanging baskets, chimney pots, signs, awnings | Geometry + Description fidelity | the world's own equivalents at the same density (section 9.3)                                                                                                                             |
| Cathedral (hand-hazed, fixed ahead)                                     | Hero landmark                   | the world's landmark, fixed ahead at the vanishing point, kit `hazedMaterial`                                                                                                             |
| Belfry, swifts                                                          | Light and atmosphere (depth)    | a mid-distance feature that steps the distance; kit `Mist` for fog worlds                                                                                                                 |
| Crowd, children, marshals, hand flags                                   | Crowd and life                  | kit `Crowd` (knots, wardrobe, flags, `skip` to clear features)                                                                                                                            |
| TV moto, swifts                                                         | Crowd and life                  | the world's signature life: kit `Figures` for walkers and joggers, plus its own animals, boats or aircraft                                                                                |
| `LOOKS.oldtown`                                                         | Light and atmosphere            | a `LOOKS` entry for the description's time of day and weather                                                                                                                             |

### 9.2 What the kit shares, and what is still Old Town's own

- **Shared in `world-kit.ts`:**
  - `SceneStreet` and `StreetFactory`, `loopMetres`, `Ribbons`, `seeded`, `canvasTexture` and
    `speckle`
  - `hazedMaterial`, `Crowd`, `Figures`, `Mist`, `FeatherFlags`
  - `barrierBannerTexture`, `clothBannerTexture`, `paintTexture`, `dashTexture` and
    `scaleFaceUv`
- **Still Old Town's own:**
  - `flatten` (merging by material), `tiledBox` (windows per bay and storey) and `prism` (a
    roof with tiled slopes and plain gables)
  - the house builder, bunting, the lamp with basket and pennant, and the TV moto
- **The rule:** when a second world needs one of these, move it into the kit first and have Old
  Town import it. Never copy it.

### 9.3 The detail inventory

Old Town's density of small things is what lifts it from 35 to 80. A new world should name its
own equivalent of each line, at a similar count per 100 m of street:

- [ ] **Pot plants by the front doors:** bay trees in terracotta pots, pairs by each home's
      door, some missing.
- [ ] **Window boxes:** geraniums under every upper window of the houses whose palette has them.
- [ ] **Balcony pots:** geraniums along balcony railings, 2–4 per balcony, and the odd bistro
      table.
- [ ] **Hanging baskets:** geraniums with trailing ivy on every lamp, out over the barrier.
- [ ] **Chimneys:** stacks with caps and two clay pots each, 1–2 per house.
- [ ] **Roofs:** dormers, ridge tiles, gutters and downpipes.
- [ ] **Shop fronts:** lit windows showing the trade, gilt fascia lettering, glazed doors with
      brass, awnings with scalloped hems and hanging iron signs with gilt emblems.
- [ ] **Homes:** panelled doors with fanlights, barred windows and worn stone steps.
- [ ] **Windows:** shutters, some closed; curtains; reflections; sills, lintels and keystones.
- [ ] **Façades:** cornices with dentils, string courses, quoins and stepped gables with finials
      and an oculus.
- [ ] **Weathering:** grime splash, rain streaks, pavement stains, gum and a crack, a damp
      gutter line and corner shade.
- [ ] **Street:** manhole covers, drain grates, alleys with arches and lamp posts with lanterns.
- [ ] **Race:** barriers with printed panels, banners across the street, bunting, lamp pennants,
      house flags, fans' road writing, hand flags, marshals in hi-vis, the TV moto and the effort
      arch.
- [ ] **Distance:** a hand-hazed hero landmark at the vanishing point, a mid-distance feature,
      and birds or other life in the sky.

### 9.4 Lessons learned building the newer worlds

- **Place for the shot.** Remember the loop arithmetic (section 2): the 7 s capture sees offsets
  of about s + 30 to s + 330.
- **Clear the crowd** in front of anything the description names, with `Crowd`'s
  `skip(side, offset, x)`.
- **Hand-haze far landmarks** and keep their haze low enough to read (0.06–0.2). Fog washes out
  anything past about 60% of `fogRange[1]`.
- **Turn landmarks toward the rider.** A structure seen edge-on reads as a line: rotate a bridge
  or a façade so its depth shows.
- **Cutouts and decals:** use `alphaTest` for cutouts (railings, feather flags, foliage cards)
  and `polygonOffset` for anything lying on the road.
- **Mirror the left side's print:** barrier and banner textures on the left side need
  `repeat.x = −1`.
- **One significant change per iteration.** Capture before and after the same way
  (`docs/screenshots/<slug>/NN-before.png`, `NN-after.png`), and keep only net gains.
