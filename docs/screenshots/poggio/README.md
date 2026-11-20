# The Poggio rendering

The live 3D world behind the ride HUD for [Tempo Efforts With Sprint Finishes](http://localhost:4200/classes/tempo-efforts-with-sprint-finishes?simulate), which rides The Poggio along the coast road to San Remo. The world follows its description: Riviera coast road over the Poggio and down to a sprint in San Remo. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-poggio.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the tifosi, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Coast road](001-coast-road.jpg) | The first Poggio scene, on a bright spring afternoon. The riders climb the coast road between tifosi bouncing at both edges under Italian, Belgian and French flags, toward a blue banner arch reading SAN REMO · 2 KM. On the left a low wall and palms stand above the glittering Mediterranean, with San Remo strung along the shore. On the right the hillside steps up in stone-walled terraces with olive trees, dark cypresses and pastel villas. Ahead the Poggio's village and church tower sit on their hill beneath the Ligurian Alps. The flower glasshouses are hidden behind the terrace walls from road level, and the first wall repeats plainly along the verge. | 79% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/tempo-efforts-with-sprint-finishes?simulate`, click **Ride in The Poggio**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [039 · The Riviera hills stand over San Remo](bend-039-riviera-hills-stand.jpg) | The Ligurian hills above San Remo were bent vertex by vertex with the Poggio's 45° bends, swinging with each turn of the coast road. They now stand beyond the road unbent, as the panorama does, and the fans, palms and walls behind the rider stand on the road there instead of at the height under the rider. |
