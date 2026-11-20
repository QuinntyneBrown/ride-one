# Pike Place at Dawn rendering

The live 3D world behind the ride HUD for [Wake Up and Smell the Lactic](http://localhost:4200/classes/wake-up-and-smell-the-lactic?simulate), which rides Pike Place at Dawn along the market street. The world follows its description: coffee steam and fish-market crowds at sunrise over Seattle's Elliott Bay. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-pikeplace.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the market's crowd, and a loop that recycles the street. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Market street](001-market-street.jpg) | The first Pike Place scene, at sunrise. The riders roll down the damp brick street past the market's brick and timber fronts on the left, with an arcade roof on green posts over stalls of fish on ice, flowers and fruit. The red PUBLIC MARKET CENTER sign glows over the street beside the clock, and the early crowd strolls and stops at the stalls. On the right a railing with lamps runs along the bluff over Elliott Bay, coffee carts send up steam, and the Olympic Mountains catch the pink light across the water, with the Space Needle ahead. The arcade lies deep in shadow, and the buildings' windows are large and plain. | 77% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/wake-up-and-smell-the-lactic?simulate`, click **Ride in Pike Place at Dawn**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [074 · The Needle and the Olympics stand over the Sound](bend-074-needle-and-olympics-stand.jpg) | The Space Needle and the Olympic Mountains across Elliott Bay were bent vertex by vertex with the market street's bends, so the Needle leaned and the peaks slewed with each turn. They now stand beyond the road unbent, as the panorama does, and the shoppers and props behind the rider stand on the street there instead of at the height under the rider. |
