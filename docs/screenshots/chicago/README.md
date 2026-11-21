# Chicago Loop Crit rendering

The live 3D world behind the ride HUD for [20 Minute Crit Sprints](http://localhost:4200/classes/20-minute-crit-sprints?simulate), which rides Chicago Loop Crit along Wabash Avenue. The world follows its description: downtown streets beneath the L tracks, sprinting every corner of a city criterium. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-chicago.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for its fans, and a loop that recycles the street. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Wabash Avenue](001-wabash-avenue.jpg) | The first Chicago scene, on a bright afternoon. The riders race down Wabash Avenue beneath the L: its riveted green girders run overhead on knee-braced columns at both kerbs, and the street reads as a long steel tunnel opening to daylight ahead. Crowd barriers line both kerbs, hung with LOOP CRIT and WABASH boards and Chicago's red stars, all reading the right way from the saddle, and fans lean on them. Terracotta, limestone and glass towers with storefronts wall the street. The trains overhead and the prime banner come later in the lap. Under the deck the street is dim, so the towers' upper floors are lost, and the fans facing the road show as plain shapes. | 76% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/20-minute-crit-sprints?simulate`, click **Ride in Chicago Loop Crit**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [094 · The L and the crowd behind the rider stand on Wabash](bend-094-under-the-l-behind.jpg) | The L trains overhead, the crowd and the props between the camera and the rider were set at the height under the rider wherever they were behind it, so where Wabash Avenue rises or falls they hung above or sank into the road there. They now stand on the road where they are. |
