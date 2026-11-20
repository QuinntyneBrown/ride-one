# Tremola, Gotthard Pass rendering

The live 3D world behind the ride HUD for [Low Cadence Workout](http://localhost:4200/classes/low-cadence-workout?simulate), which rides the Tremola up the Gotthard Pass. The world follows its description: Swiss cobbled hairpins stacked up the old pass road. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-tremola.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the walkers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The Tremola](001-the-tremola.jpg) | The first Tremola scene, on a bright, cool summer morning. The riders climb granite setts between a granite kerb and squat guard stones along the drop to the valley. Alpine pasture climbs on the right with flowers, boulders, larches and brown cows grazing, and the yellow post coach climbs ahead behind its horses. Ahead the hairpins stack up the mountainside one above another on their stone walls, under grey peaks streaked with snow and hung with cloud. The setts read as rows rather than fans, and a thin pale seam shows where the valley floor meets the slope. | 79% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/low-cadence-workout?simulate`, click **Ride in Tremola, Gotthard Pass**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
