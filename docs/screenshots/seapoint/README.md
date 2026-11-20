# Sea Point, Cape Town rendering

The live 3D world behind the ride HUD for [20/40 Interval Session](http://localhost:4200/classes/20-40-interval-session?simulate), which rides Sea Point, Cape Town along the Sea Point Promenade. The world follows its description: a promenade beneath Lion's Head and Table Mountain, with Atlantic waves rolling in. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-seapoint.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its joggers and walkers, and a loop that recycles the promenade. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Promenade](001-promenade.jpg) | The first Sea Point scene, on a clear morning. The riders take the promenade's warm paving between lawns. On the left a low wall gives onto dark granite boulders and the Atlantic's surf, with benches facing the sea; the Green Point lighthouse's diagonal red and white stripes stand on the shore ahead. On the right palms line the lawn before Beach Road and its white balconied apartment blocks, and Lion's Head rises over them, its rocky crown on a fynbos-covered cone. Joggers, walkers and their dogs share the promenade. Table Mountain sits too far back in the haze to read, Lion's Head's crown is too rounded, and the blocks repeat one balcony pattern. | 74% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/20-40-interval-session?simulate`, click **Ride in Sea Point, Cape Town**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [066 · Lion's Head stands over the promenade](bend-066-lions-head-stands.jpg) | Lion's Head and Signal Hill above the apartment blocks were bent vertex by vertex with the promenade's bends, swinging with each turn along the Atlantic. They now stand beyond the road unbent, as the panorama does, and the walkers and props behind the rider stand on the promenade there instead of at the height under the rider. |
