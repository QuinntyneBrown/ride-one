# Indianapolis Brickyard rendering

The live 3D world behind the ride HUD for [90-Second Extended Accelerations](http://localhost:4200/classes/90-second-extended-accelerations?simulate), which rides Indianapolis Brickyard down the front straight. The world follows its description: the oval's long straights and the yard of bricks at the finish. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-brickyard.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the pit crews, and a loop that recycles the straight. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Front straight](001-front-straight.jpg) | The first Brickyard scene, on race day under a clear blue sky. The riders run the front straight toward the yard of bricks and the start-finish line, under the starter's stand where the chequered flag waves. On the right the white SAFER barrier and catch fence stand before grandstands climbing in tier on tier of crowd in every colour. On the left, past the pit wall, crews work in the pit lane in front of garages with doors in team colours. The glass pagoda rises over the infield, with the city's towers beyond the far turn. The yard of bricks reads as a thin red line from the riders' height. | 82% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/90-second-extended-accelerations?simulate`, click **Ride in Indianapolis Brickyard**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [079 · The Pagoda and the stands stay square to the straight](bend-079-pagoda-stands.jpg) | The Pagoda, the grandstands and the Indianapolis skyline beyond the front straight were bent vertex by vertex with the straight's bends, so the Pagoda leaned and slewed with each turn. They now stand beyond the road unbent, as the panorama does, and the crew and props behind the rider stand on the track there instead of at the height under the rider. |
