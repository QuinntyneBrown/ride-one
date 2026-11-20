# Dutch Tulip Fields rendering

The live 3D world behind the ride HUD for [Easy Cadence Workout](http://localhost:4200/classes/easy-cadence-workout?simulate), which rides Dutch Tulip Fields through the bulb country. The world follows its description: flat roads through striped bulb fields and windmills near Lisse. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-tulips.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for its cyclists, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Bulb fields](001-bulb-fields.jpg) | The first Tulip Fields scene, on a bright April morning. The riders take a brick-red cycle road across the polder between grass verges, and on both sides the bulb fields run flat to the horizon in long stripes of red, yellow, pink, white and purple. A windmill with a thatched body, green cap and white lattice sails stands by the road ahead, more mills turn across the fields, and farmhouses with bulb barns sit behind rows of poplars. Cyclists on upright Dutch bikes share the road. The reeds read as thin poles, and the ditches' water barely shows from the saddle. | 78% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/easy-cadence-workout?simulate`, click **Ride in Dutch Tulip Fields**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
