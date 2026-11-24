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
| 46 | 70° to the left (the issue's own picture) | to the right, a little behind |
| 75 | 157° to the left | ahead and to the right |
| 150 | 98° to the right | to the left |
| 300 | 1°: dead ahead | straight back, towards the camera |
| 350 | 102° to the left | to the right |
| 500 | 40° to the left | back and to the right |
| 875 | 174°: behind | straight ahead, up the road |
| 1000 | 78° to the left | to the right |

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
