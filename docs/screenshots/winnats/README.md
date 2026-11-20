# Winnats Pass rendering

The live 3D world behind the ride HUD for [35 Minute Hill Training](http://localhost:4200/classes/35-minute-hill-training?simulate), which climbs the Winnats road. The world follows its description: a Peak District limestone gorge, steep and grassy-walled. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-winnats.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the walkers, and a loop that recycles the gorge. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture                              | Change and observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Render quality |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| [001 · The gorge](001-the-gorge.jpg) | The first Winnats Pass scene, on a bright, breezy summer morning. The riders grind up the narrow road between white edge lines. Steep grassy walls rise on either side, broken by grey limestone crags, pinnacles and scree. A drystone wall runs along the foot of the left-hand slope, loose rocks lie on the verges, and a red 20% warning sign stands on the right. Sheep graze ahead and walkers climb the verge. The gorge narrows to the moorland skyline at its head, with clouds sailing over the rim. The crags read pale in the high sun and the turf is uniform. | 80%            |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/35-minute-hill-training?simulate`, click **Ride in Winnats Pass**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [038 · The head of the gorge stands still](bend-038-gorge-head-stands.jpg) | The limestone crags and the moor at the head of the Winnats gorge were bent vertex by vertex with the road's bends, swinging with each turn. They now stand beyond the road unbent, as the panorama does, and the walls, rocks and the 20% sign behind the rider stand on the road there instead of floating at the height under the rider. |
