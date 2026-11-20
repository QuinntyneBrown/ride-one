# Lake Como rendering

The live 3D world behind the ride HUD for [Seated Surges](http://localhost:4200/classes/seated-surges?simulate), which rides Lake Como along the shore road. The world follows its description: a lakeshore road past villas, ferries and terraced gardens. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-como.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the strollers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Shore road](001-shore-road.jpg) | The first Lake Como scene, on a clear early-summer morning. The riders follow the shore road beside a white stone balustrade with iron lamps, where strollers walk the promenade and lean to look at the lake. The water lies below wooded mountains that fall straight into it, with villages along the far shore. On the right a low stone wall holds up terraced gardens of pink and white azaleas, dark cypresses and magnolias, with a rose villa and its loggia behind. The lake shows as a narrow strip from the road, and the ferries cross out of frame. | 79% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/seated-surges?simulate`, click **Ride in Lake Como**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
