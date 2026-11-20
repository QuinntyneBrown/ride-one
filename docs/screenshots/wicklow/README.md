# Wicklow Gap rendering

The live 3D world behind the ride HUD for [Conor's Racing Bonanza](http://localhost:4200/classes/conors-racing-bonanza?simulate), which races over the Wicklow Gap road. The world follows its description: Irish race roads over bog and heather through the Wicklow Mountains. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-wicklow.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the marshals, fans and walkers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The gap road](001-the-gap-road.jpg) | The first Wicklow Gap scene, race day on a bright, blustery spring afternoon. The riders climb the mountain road over "GO ON CONOR" and "ROCHE", chalked across the tarmac by the fans. Purple heather, yellow gorse and grey granite boulders dot the bog on either side. A tricolour flies at the roadside, a yellow bend sign stands on the verge, and fans lean on their car beside the peat banks. A marshal's motorbike waits with its blue light on. On the left the valley falls away past conifers to the lough's glint; ahead and to the right the rounded mountains roll up under fast white clouds. The mountains are smooth domes and the heather tufts read flat. | 80% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/conors-racing-bonanza?simulate`, click **Ride in Wicklow Gap**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [049 · The Wicklow hills stand round the gap](bend-049-wicklow-hills-stand.jpg) | The brown Wicklow hills, the lough below and the cloud over the gap were bent vertex by vertex with the road's 30° bends, swinging with each turn. They now stand beyond the road unbent, as the panorama does, and the fans and props behind the rider stand on the road there instead of at the height under the rider. |
