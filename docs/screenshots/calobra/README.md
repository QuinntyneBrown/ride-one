# Sa Calobra, Mallorca rendering

The live 3D world behind the ride HUD for [Aerobic Cadence Workout With Team Sky](http://localhost:4200/classes/aerobic-cadence-workout-with-team-sky?simulate), which rides the Sa Calobra climb. The world follows its description: the knotted hairpins of a pro training-camp favourite above the sea. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-calobra.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the fans and riders at the parapet, and a loop that recycles the climb. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Hairpins](001-hairpins.jpg) | The first Sa Calobra scene, on a hot, clear spring morning of training-camp season. The riders climb the narrow road between its white edge lines. On the left a drystone parapet runs along the drop to the deep blue Mediterranean, with a limestone headland across the water. On the right, fluted grey and ochre crags rise behind holm oaks and Aleppo pines, a wild goat browses on the verge, and a team car waits with spare bikes on its roof. Ahead, the hairpins stack up the mountainside under its crags. The Nus de sa Corbata's loop reads only as a grey bar at this distance. | 81% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/aerobic-cadence-workout-with-team-sky?simulate`, click **Ride in Sa Calobra, Mallorca**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [030 · The karst ridges stand still as the road winds](bend-030-karst-stands.jpg) | Sa Calobra's limestone ridges and pinnacles were bent vertex by vertex with the road's 60° bends, so the far ridges slewed and squeezed with each turn of the road. They now stand beyond the road unbent, as the panorama does, while the road winds below them; the props behind the rider stand on the road there. |
