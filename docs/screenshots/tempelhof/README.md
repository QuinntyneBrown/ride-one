# Tempelhof Field rendering

The live 3D world behind the ride HUD for [Intense High Tempo Bike Workout](http://localhost:4200/classes/intense-high-tempo-bike-workout?simulate), which rides Tempelhof Field down the runway. The world follows its description: Berlin's old airport runways turned park, kites flying overhead. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-tempelhof.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the skaters, joggers and picnickers, and a loop that recycles the runway. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The runway](001-the-runway.jpg) | The first Tempelhof Field scene, on a breezy summer evening. The riders race down the runway's concrete slabs on its white centre line, past tyre marks, edge lights and yellow taxiway signs. Skaters, joggers and walkers share the runway, and the long grass of the meadows runs flat either side behind low fences, with the community gardens' beds and the beer garden's parasols at the edge. Kites in every colour swing overhead, and across the field the long limestone terminal stands under the radar tower with the Fernsehturm rising beyond. The grass shows few tufts at a distance. | 81% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/intense-high-tempo-bike-workout?simulate`, click **Ride in Tempelhof Field**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
