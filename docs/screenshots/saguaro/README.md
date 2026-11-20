# Saguaro Desert rendering

The live 3D world behind the ride HUD for [Burn Fat Fast](http://localhost:4200/classes/burn-fat-fast?simulate), which rides Saguaro Desert round the cactus forest loop. The world follows its description: a road through a saguaro cactus forest at Arizona sunrise. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-saguaro.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, merged cactus geometry, the kit's `Figures` for the hikers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Cactus forest](001-cactus-forest.jpg) | The first Saguaro scene, at sunrise. The riders follow the park road between yellow edge lines through a forest of many-armed saguaros scattered thick across the bajada. Among them stand ocotillo with red-flowered tips, prickly pear, cholla, flat-topped palo verde and red boulders, and the carved Saguaro National Park sign stands by the road. A hiker walks the shoulder and a roadrunner dashes across the road ahead. The Rincon and Tucson Mountains glow pink and violet on the horizon, with hot-air balloons drifting above them. The desert floor is a little dark in the low light. | 81% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/burn-fat-fast?simulate`, click **Ride in Saguaro Desert**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [057 · The Rincons and the balloons stand still](bend-057-rincons-stand.jpg) | The Rincon Mountains glowing at dusk and the balloons drifting over the desert were bent vertex by vertex with the loop road's bends, swinging with each turn through the cactus forest. They now stand beyond the road unbent, as the panorama does, and the walkers and props behind the rider stand on the road there instead of at the height under the rider. |
