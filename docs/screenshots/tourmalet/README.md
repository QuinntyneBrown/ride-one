# Col du Tourmalet rendering

The live 3D world behind the ride HUD for [Four Minute Devils](http://localhost:4200/classes/four-minute-devils?simulate), which rides Col du Tourmalet up the road to the col. The world follows its description: Pyrenean slopes where a costumed devil chases riders up every ramp. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-tourmalet.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its fans and climbers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The devil](001-the-devil.jpg) | The first Tourmalet scene, on a bright summer afternoon. The riders climb past "VAMOS" painted across the tarmac. The costumed devil runs a few metres ahead on the right, his horns up and his trident raised, and fans in bright shirts line both verges by camper vans flying Basque and French flags. A stone wall runs along the left above pasture where sheep graze, with green ridges across the valley. Ahead the mountainside carries the switchbacks up past La Mongie to the col, and the Pic du Midi's observatory stands on its peak beyond. From behind, the devil reads as a red block more than a figure, and the camper van is a plain box. | 76% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/four-minute-devils?simulate`, click **Ride in Col du Tourmalet**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [034 · The Pic du Midi stands over the col](bend-034-pic-du-midi-stands.jpg) | The Pic du Midi with its mast, the peaks round it and the hairpins up to the col were bent vertex by vertex with the road's 50° bends, swinging across the sky with each turn. They now stand beyond the road unbent, as the panorama does, and the fans and props behind the rider stand on the road there instead of at the height under the rider. |
