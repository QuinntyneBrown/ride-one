# North Shore, Oahu rendering

The live 3D world behind the ride HUD for [20 Minute Fat Burning Workout](http://localhost:4200/classes/20-minute-fat-burning-workout?simulate), which rides North Shore, Oahu along the Kamehameha Highway. The world follows its description: big-wave beaches and shrimp trucks along Kamehameha Highway. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-northshore.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for beachgoers and diners, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Kam Highway](001-kam-highway.jpg) | The first North Shore scene, on a bright winter morning. The riders take the two-lane highway with its double yellow line. On the left, ironwoods and naupaka line the golden beach, beachgoers stand watching the surf, and the big waves stand up in white-capped walls offshore; a lifeguard tower comes later in the lap. On the right, shrimp trucks lettered "SHRIMP PLATES · $16" park in the red-dirt lots by picnic tables and umbrellas, surf shacks with tin roofs and racked boards stand among leaning coconut palms, and the Ko'olau's green ridges rise behind. The waves read small and pale from the road, and the beach shrubs are flat-sided. | 72% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/20-minute-fat-burning-workout?simulate`, click **Ride in North Shore, Oahu**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [063 · The Ko'olau ridge stands over the highway](bend-063-koolau-stands.jpg) | The green Ko'olau ridge and the ocean beyond the beach were bent vertex by vertex with Kamehameha Highway's bends, swinging with each turn along the shore. They now stand beyond the road unbent, as the panorama does, and the surfers and props behind the rider stand on the road there instead of at the height under the rider. |
