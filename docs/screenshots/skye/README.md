# Isle of Skye Fog rendering

The live 3D world behind the ride HUD for [Into the Unknown](http://localhost:4200/classes/into-the-unknown?simulate), which rides the Isle of Skye along the Glen Brittle road. The world follows its description: mist-shrouded Hebridean roads where the Cuillin appear and vanish. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-skye.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the walkers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Glen Brittle](001-glen-brittle.jpg) | The first Isle of Skye Fog scene, on a soft, grey morning with the mist down. The riders follow the wet single-track road over the moor past a white diamond passing-place sign, with heather, rust-brown bracken and grey boulders either side. A blackface sheep grazes on the verge, a Highland cow stands in the grass, and peat smoke rises from a white croft beyond its peat banks. A mist bank rolls across the glen on the left under a low grey overcast, and the Cuillin's jagged ridge shows faintly through it. The bracken reads as cones, and the moor's patches are coarse. | 81% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/into-the-unknown?simulate`, click **Ride in Isle of Skye Fog**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [052 · The Cuillin stand in the fog](bend-052-cuillin-stands.jpg) | The Black Cuillin ridges and the glen's slopes, half lost in the fog, were bent vertex by vertex with the Glen Brittle road's bends, swinging with each turn. They now stand beyond the road unbent, as the panorama does, and the sheep and props behind the rider stand on the road there instead of at the height under the rider. |
