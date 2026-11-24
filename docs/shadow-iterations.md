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

### 5. The blur is round on the road

- **Found (sheet 004, from above):** the shadow was smeared along its length and still sharp across it. The figure's
  picture is the road seen down the sun's rays, where a metre along the shadow is a third of a metre; a blur that is
  round in the picture is three times as long as it is wide on the road.
- **Changed:** the blur's reach is worked out in metres on the road. The picture is read at the fineness (mip level)
  of the short way, and seven readings side by side, weighted most in the middle, make up the long way.
- **Result (sheet 005, from above):** edges are equally soft all round. The hoops of both wheels, the frame's
  triangle and the rider's back and head can each be told apart at 150 s and 350 s.

### 6. Softer the further it lies

- **Found (sheet 005):** with the blur round, the shadow was crisp to its far end: a cut-out, not the "blurred out"
  shadow the issue asks for. A low sun through haze is a broad light.
- **Changed:** the blur's reach is 3 cm at the wheels and grows 7.5 cm for each metre the shadow lies from them
  (it was 2 cm and 3.5 cm).
- **Result (sheet 006, the rider's eye):** sharp where the tyres stand, the head's shadow a soft patch about a third
  of a metre across; at 46 s, 150 s and 350 s it reads as a low-sun shadow rather than a decal.

### 7. Fainter towards the far end

- **Found (sheet 006):** the head's shadow, 4.5 m away, was as dark as the tyre's. The sky's light gets under a
  shadow from its sides, more the further it lies from what throws it.
- **Changed:** the dark falls away smoothly from the wheels to just past the head's shadow, to half there.
- **Result (sheet 007):** the eye is led from the bike outwards; the far end melts into the road at 46 s and 350 s.

### 8. Dark under the bike and under each tyre

- **Found (sheet 007; 300 s and 500 s of sheet 004b):** with the sun ahead the shadow falls towards the camera,
  hidden by the bike, and the bike seemed to float. Under a real bike the road is dark whatever the sun does,
  because the rider hides the sky from it, most of all where a tyre touches.
- **Changed:** a soft dark along the bike (0.7 m by 0.22 m) and a small deeper one under each tyre, 0.5 m either
  side of the bike's middle, combined with the sun's shadow so the two never add up to more than black.
- **Result (sheet 008):** at 300 s, dead into the sun, the tyres sit on a dark patch and the bike is on the road.

### 9. The shadow darkens the road's own colour, in the sky's tint

- **Found (sheet 008):** the shadow was near-black paint laid over the road with normal blending, so the yellow
  centre lines turned grey-black under it. A shadow takes light away; it adds no colour of its own.
- **Changed:** the shadow multiplies what is behind it. How much it leaves is worked out from the course's own
  light (`shadowShade`, pure, unit tested): the sky's share of the light on the ground, for each of red, green and
  blue, so under Ibiza's orange sun the shadow keeps more blue than red. The dark under the bike multiplies too.
- **Result (sheet 009):** the lines stay yellow through the shadow and the shade is cool against the warm road.
  But the light's own arithmetic leaves 43% to 82% of the light: far too faint on dark asphalt.

### 10. Deep enough to see on dark asphalt

- **Found (sheet 009):** at 150 s the shadow could barely be made out.
- **Changed:** the shadow is drawn deeper than the light's arithmetic (its share raised to the power 3, from 1.8),
  and the sky fills in 40% by the far end, not 50%.
- **Result (sheet 010):** the shadow is plain at 46 s and 150 s from the rider's eye, still soft and still cool.

### 11. Only part of the sky's tint

- **Found (sheet 010, 46 s):** where the shadow crossed the yellow centre line the paint turned green: the shade
  kept 25% of red and 72% of blue.
- **Changed:** the shade is drawn 45% of the way from its own grey to the light's arithmetic (`TINT`).
- **Result (sheet 011):** the line under the shadow is a darker yellow; the shade is still cooler than the road.
  Sheet 012 is the same two places at the course's second step, which has no bloom pass and blends on the canvas
  itself: the shadow is the same depth and colour there.

### 12. A tighter picture of the figure

- **Found (measured, lowest step, in software):** a frame took 113 ms with the shadow and 93 ms without it. The
  road's square was 2.5 m by 7.3 m and the figure filled little over half of the picture.
- **Changed:** the picture is 2.2 m square (`HALF` 1.1), so the square on the road is 2.2 m by 6.4 m and each texel
  is 12% smaller on the road.
- **Result (sheet 012d, from above):** nothing of the bike or rider is cut off at 46 s, 150 s or 350 s, and the
  three frames timed averaged 99 ms.

### 13. The shadow's cost follows the course's five steps

- **Found:** the shadow cost the same on the slowest tablet as on the fastest: 256 texels, seven readings of the
  picture for every point of the road's square, and the rider drawn twice every frame.
- **Changed:** `STEPS` in `sun-shadow.ts`. The two lowest steps use 128 texels, 3 and 5 readings, and one picture of
  the figure for two frames; the third 192 texels and 7 readings; the two highest 256 and 7. With fewer readings each
  reads a coarser level of the picture, so the blur stays whole. The renderer tells the shadow when the step moves.
- **Result (sheet 013, lowest step):** the shadow is blurrier and still a bike and rider at 46 s and 150 s. Frames
  averaged 98 ms against 93 ms with no shadow at all: the shadow's cost there fell from about 20 ms to about 5 ms.

### 14. Deeper again, after looking at the whole ride

- **Found (sheets 014a, 014c):** on the steepest climb (915 s), the steepest descent (694 s), the tightest bend
  (372 s) and the sharpest crest (564 s) the shadow lay on the road and nothing was cut off, but with the sun
  abeam at 1000 s and behind at 75 s it was hard to find at a glance.
- **Changed:** `DEPTH` 4.5 (it was 3): the deepest shade leaves about 25%, 35% and 47% of red, green and blue.
- **Result (sheet 014):** at 46 s, 75 s, 150 s and 1000 s the shadow is the first dark thing the eye finds on the
  road by the rider, and still soft-edged.

### 15. Less blur: the bike can be read again

- **Found (sheet 015a, from above, 350 s):** after entry 6 the shadow from above was one broad smudge; the wheels'
  hoops could barely be found. "Blurred out" had gone past "a figure on a bike".
- **Changed:** the blur's reach is 2.5 cm at the wheels and grows 5 cm a metre (it was 3 cm and 7.5 cm).
- **Result (sheets 015b, 015c):** from above both hoops, the frame and the rider's back are plain at 150 s and
  350 s; from the rider's eye at 46 s and 150 s the edge is still soft everywhere.

### 16. The rider's body is not the faintest part

- **Found (sheet 015b):** the tyres' thin shadows by the bike were darker than the shadow of the rider's whole
  trunk, 3 m away, which is the most solid thing there is. The fill of entry 7 took 40% off it on top of the blur.
  (The raw figure and a single coarse reading of it were looked at to rule out a fault in the picture: the trunk
  is solid in both.)
- **Changed:** the sky fills in 20% by the far end (`FILLED`), not 40%.
- **Result (sheet 016):** the trunk and head are as dark as the hoops at 150 s and 350 s.

*Not counted:* the figure is now drawn with everything else in the scene hidden, so the map's chunks are not
walked for it. Timed before and after at the second step, in software, the difference was inside the noise
(about ±20 ms on a 170 ms frame), so it is kept as a tidy-up and claimed as no improvement.

### 17. Each part is as soft as the light's journey from it

- **Found (sheets 014c, 017a):** the blur grew with a point's distance from the bike's middle along the road. With
  the sun along the bike (75 s, 300 s, 875 s) one wheel stands a metre down-sun of the middle, so that tyre's
  shadow was blurred where it touches the tyre; and the top of a wheel was as sharp as its foot.
- **Changed:** the figure's picture also keeps, in green, how high above the road each part stands. The road reads
  that coarsely (mip level 3) and blurs by the height thrown along the road (`height / tan(altitude)`), so the blur
  follows what throws the shadow, not where on the road it falls.
- **Result (sheets 019, 019c):** a tyre's shadow is crisp at the tyre wherever the sun stands, each hoop softens
  from its foot to its top, and the head stays the softest thing.

### 18. The shadow lies on the road's own profile

- **Found:** the shadow was one flat square tilted to the slope under the rider and held 4 cm above the road, so it
  would clear a dip. At the course's sharpest dips and crests the gradient turns 1% in 4 m; over the square's 6.4 m
  a flat sheet leaves the road by 3 cm, so it floated at a crest and all but touched in a dip.
- **Changed:** the square is a strip of 8 rows, each row's two points set every frame on the centre line's height
  that far up the road (the road is level from kerb to kerb), and it lies 2 cm above the road, not 4.
- **Result (sheets 018, 019c):** at the sharpest crest (564 s), dip (685 s) and climb (915 s) nothing of the shadow
  is cut by the road and none of it is seen to float.

### 19. A wheel's shadow is a rim, with light between the spokes

- **Found (sheet 016, from above):** each wheel threw an even grey plate with a dark edge. A real wheel in low sun
  throws its tyre and rim; 24 thin spokes, turning, stop about a fifteenth of the light.
- **Changed:** a wheel's side is drawn into the figure solid from where its rim begins (0.253 m from the axle) and
  at its hub, and 8% solid between, measured from the nearer axle in the bike's own axes. `course-cyclist.ts` now
  exports those measures (`WHEELS`) so the shadow and the wheel cannot drift apart.
- **Result (sheet 019):** two clean hoops with the road showing through them at 150 s and 350 s.

*A correction.* Entries 17 to 19 were first "checked" against pictures of the build before them: a type error in
entry 17 had been failing the build, the server went on serving the last good one, and the helper's check for a
failed build did not catch it. The helper now refuses to take pictures after a failed build, and sheets 019 and
019c are the first true pictures of all three.

### 20. The shadow is thrown by the rider's coarse body, inside the frame's budget

- **Found (the budget spec, `L2-177` AC1):** once the figure was counted (entry 2), the heaviest frame of the course,
  at 100 s on the highest step, was 122,727 triangles against a budget of 120,000. The figure was the rider's fine
  body, 5,684 triangles, drawn a second time for a picture 256 texels across.
- **Changed:** a rider made finely keeps the file's coarse body (1,530 triangles) on the same bones, on the
  figure's layer only, and it throws the shadow; the fine body is marked as throwing none. On the two lowest
  steps the body is already the coarse one and throws its own.
- **Result (sheet 020, from above):** the shadow at 150 s and 350 s cannot be told from sheet 019's, a frame draws
  4,154 fewer triangles, and the budget spec passes at all 25 places again.

*Not counted, tried and taken out:* narrowing the dark under the bike (no difference could be seen: the tyres'
contact is at the very foot of the rider's-eye view and hidden under the rider from above), and averaging four
samples a texel in the figure's picture at the two highest steps (sheet 021 could not be told from sheet 020,
because the road's blur is wider than a texel; it would have cost fill for nothing).

### 21. Thrown from as high as the light that shades the rider

- **Found (200 s, full size):** with the sun ahead and to the right the front wheel's shadow was a thin arc 2 m
  long sweeping across the road by the camera, and the rider's body fell out of the foot of the picture: the
  "weird sometimes" of the issue, from the other side. A sun counted as 20° high stretches everything 2.9 times
  along the road. The light that actually shades the rider is not at 20° either: the renderer stands it 70 m out
  and 34 m up, at 25.9°, because Ibiza's 6° sun would light nothing from above.
- **Changed:** `LOWEST_SUN` is that light's height, from one pair of numbers (`SUN_LIGHT`) the renderer's light and
  the shadow now both read. The stretch is 2.1 times and the head's shadow lies 3.4 m from the wheels, not 4.5 m.
- **Result (sheet 021):** at 150 s the whole of the shadow is in the picture and is plainly two wheels, a frame, a
  bent back and a head; at 200 s the arc is a wheel. The shadow and the light on the rider now agree.

### 22. The shadow falls on the road's paint, not under it

- **Found (250 s, from above, full size):** the shadow stopped at the edge of a pink effort chevron and carried on
  the other side, as if the chevron were a hole in it. The chevrons, the start grid and the finish's chequers are
  built 3 cm above the asphalt and the centre lines 2 cm; entry 18 had lowered the shadow to 2 cm, under the first
  three and level with the lines.
- **Changed:** the shadow lies 3.6 cm above the road: over all of its paint, under the kerbs (5 cm). Laid on the
  road's own profile (entry 18) it can sit there without cutting into a dip.
- **Result (sheet 022):** at 250 s the chevrons are shaded where the shadow crosses them, and at 1 s the grid's
  white lines are.
