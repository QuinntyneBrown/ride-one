# Mount Etna rendering

The live 3D world behind the ride HUD for [Go Until You Blow](http://localhost:4200/classes/go-until-you-blow?simulate), which rides Mount Etna along the Sapienza road. The world follows its description: black volcanic slopes climbing toward a smoking summit. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-etna.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the walkers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Sapienza road](001-sapienza-road.jpg) | The first Mount Etna scene, on a clear, windy afternoon. The riders climb the road through black lava fields heaped with jagged flows, past yellow broom, a stunted birch and a house half-swallowed by an old flow. The rust-red Silvestri craters rise either side, a white 4x4 bus grinds up the road and walkers in bright jackets climb the verges. Ahead the summit cone stands dark and streaked with snow, with its plume of steam and ash drifting away on the wind. The plume reads as a chain of puffs rather than one cloud. | 80% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/go-until-you-blow?simulate`, click **Ride in Mount Etna**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [041 · The smoking crater stands still](bend-041-crater-stands.jpg) | Etna's summit cone with its plume and the lava fields round it were bent vertex by vertex with the road's bends, so the cone slewed and squeezed with each turn of the Sapienza road. They now stand beyond the road unbent, as the panorama does, and the props behind the rider stand on the road there instead of at the height under the rider. |
