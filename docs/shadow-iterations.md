# The rider's shadow: iterations (issue #59)

Issue [#59](https://github.com/QuinntyneBrown/ride-one/issues/59), "Shadow is Wrong": riding in Ibiza, the rider's
shadow "looks weird sometimes"; what is wanted is a "blurred out realistic shadow of figure on a bike". This is the
record of the work, one entry an iteration: what was found wrong in the pictures, what was changed, and what the
pictures showed afterwards. The requirement it ends in is `L2-174` AC12.

## How each iteration was looked at

`frontend/e2e/shadow/shadow.shots.ts` (run with `npx playwright test -c playwright.shadow.config.ts`, only when a
person asks) rides the class on a paused clock and takes the course's box at eight seconds of the ride, chosen so the
sun stands every way round the bike. The sun is fixed over the island and the road turns under it, so these eight
cover the whole ride:

| Second | Sun, from dead ahead of the bike | The shadow falls |
|---|---|---|
| 46 | 138° to the left: behind, left (the issue's own picture) | ahead and to the right |
| 75 | 157° to the left: behind | ahead, a little right |
| 150 | 98° to the right: abeam | to the left |
| 300 | 1°: dead ahead | straight back, towards the camera |
| 350 | 102° to the left: abeam | to the right |
| 500 | 40° to the left: ahead | back and to the right |
| 875 | 174°: dead behind | straight ahead, up the road |
| 1000 | 78° to the left: abeam | to the right |

Two views are used. *The rider's eye* is the ride's own chase camera. *From above* looks straight down on the rider
from 5.5 m (the test-only hook's `above`), where the shadow's shape is not foreshortened; up the picture is up the
road. `SHADOW_WEBGPU=1` takes the pictures with WebGPU instead of WebGL 2.

Unless an entry says otherwise the pictures are of the course's fourth step of five (1.5 device pixels a CSS pixel,
with bloom), drawn in software by headless Chromium with WebGL 2. "Sheet NNN" is the sheet of that iteration.

## Where it started (sheet 000)

The shadow was one of two pictures drawn beforehand on a canvas (`shadow-silhouette.ts`): a bike from its side or a
rider end on, chosen by whether the sun stood more than 45° off the bike's line (`rider-shadow-shape.ts`), and laid
on a square 3.4 m long whatever the sun's height.

- **46 s, 350 s:** the side-on picture is laid across the sun's rays, not along the bike, so its two wheels lie on
  the road a metre from the bike's own wheels: a second bicycle lying beside the rider. This is the issue's picture.
- **150 s:** the same picture on the other side, its wheels standing clear of the bike.
- **300 s, 500 s:** with the sun ahead the end-on picture is all but hidden under the bike.
- **875 s, 1000 s:** a faint smudge with no figure in it.
- Everywhere: the picture never pedals, never leans, pops from one drawing to the other as the road turns through
  45°, and is no longer or shorter for the sun's height.

## Iterations

### 1. The shadow is the rider's own figure, not a drawing

- **Found (sheet 000):** every fault above comes from laying a picture drawn beforehand. No pair of drawings is
  right for every bearing of the sun.
- **Changed:** `sun-shadow.ts`. Each frame the rider is drawn once more, plain white on black, 256 texels square,
  by a camera that looks down the sun's rays (`FIGURE_LAYER`, an override material; no depth is compared, so it is
  not a shadow map). A square on the road reads that picture by each point's place along the sun's rays. The two
  drawings and the rule that chose between them are deleted. `sun-shadow-frame.ts` (pure, unit tested) gives the
  sun's direction for the shadow; a sun lower than 20° is counted as 20°, so the head's shadow lies 4.5 m away
  rather than the 15 m Ibiza's 6° sun would throw across the island.
- **Result (sheet 001):** at every one of the eight places the shadow starts under the tyres and is the shape of
  the bike and rider from where the sun is: wheels, frame, bent back and head at 46 s and 350 s; a narrow figure
  running up the road at 875 s. 47 draw calls and 67,801 triangles at the fourth step (the budget is 140 and
  120,000). The acceptance spec `class-ride-ibiza-shadow.spec.ts` failed before the change and passes after.

### 2. The shadow's own cost is counted in the frame

- **Found (sheet 001):** the report said 47 draw calls, one fewer than before the change, though the rider is now
  drawn twice. The renderer cleared its counts after the figure was drawn, so the figure was never counted and the
  budget of `L2-177` AC1 was being checked against a number that left it out.
- **Changed:** the figure is drawn inside `render()`, after the counts are cleared.
- **Result (sheet 003):** the figure costs 6 draw calls and 10,722 triangles a frame, now in the report: 46 calls
  and 53,393 triangles where the same frame read 40 and 42,671. The budget spec still passes at the heaviest step.

### 3. The wheels are spoked, not missing and not solid

- **Found (sheet 002b, from above):** the wheels' sides (rim, decals and spokes, one disc with holes cut by
  `alphaTest`) were either left out, which left two thin tyres, or drawn solid, which made two black plates.
- **Changed:** each part is drawn into the figure as dark as it is solid (`userData`, read by the figure's one
  material): 1 for the rider and the bike, 0.4 for a part drawn with holes. Parts are blended by the greater of the
  two, so a tyre over a disc stays solid.
- **Result (sheet 004b):** at 150 s and 350 s each wheel throws a dark hoop with a lighter middle, as a spoked wheel
  does in low sun.

### 4. The figure was upside down

- **Found (sheet 003, from above, and a picture of the raw figure laid on the road):** the head and hands lay next to
  the bike and the wheels 4 m away. A picture the renderer draws is kept top row first, and the road was reading it
  bottom row first. Entry 1's "starts under the tyres" was wrong: what started there was the rider's head. The
  chase camera's foreshortening hid it; the look from above was added to the harness because of this.
- **Changed:** the road reads the picture the other way up. Checked on both backends (`SHADOW_WEBGPU=1`): the raw
  figure is the same way up on WebGPU and on WebGL 2, so one rule serves both.
- **Result (sheet 004, 004b):** each wheel's shadow starts at that wheel's own tyre, the frame and legs follow, and
  the head is the far end, at all six places looked at.
