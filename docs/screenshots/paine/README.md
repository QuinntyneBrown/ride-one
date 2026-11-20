# Torres del Paine rendering

The live 3D world behind the ride HUD for [30 Minute VO2 Max Session](http://localhost:4200/classes/30-minute-vo2-max-session?simulate), which rides Torres del Paine along the Pehoé gravel. The world follows its description: Patagonian gravel roads beneath granite spires and wind-whipped lakes. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-paine.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the trekkers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Pehoé gravel](001-pehoe-gravel.jpg) | The first Torres del Paine scene, on a bright, wild afternoon. The riders follow the gravel road with its ruts along Lago Pehoé, whose turquoise water lies on the left. The golden tussock steppe rolls up on the right, with lenga trees bent by the wind and guanacos grazing. Across the lake the Cuernos' pale granite horns rise under their black caps, the three Torres stand as needles on their ridge to the right, and Paine Grande carries its glacier on the left under a lens-shaped cloud. The tussocks read as cones, and the massif's forms are simple. | 77% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/30-minute-vo2-max-session?simulate`, click **Ride in Torres del Paine**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
