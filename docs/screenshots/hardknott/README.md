# Hardknott Pass rendering

The live 3D world behind the ride HUD for [25 Minute Hill Training](http://localhost:4200/classes/25-minute-hill-training?simulate), which rides Hardknott Pass up the lane over the fells. The world follows its description: England's steepest road twisting through the Cumbrian fells. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-hardknott.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the walkers, and a loop that recycles the lane. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The ramp](001-the-ramp.jpg) | The first Hardknott scene, on a blustery Lake District day. The riders climb the narrow lane between dry-stone walls, past the red-bordered 30% warning sign at the foot of the ramp. Bracken and rough grass climb the fell on the right with lichened boulders and Herdwick sheep among them. On the left the ground falls to the gill below green ridges, and a walker in a bright waterproof plods up the verge. Ahead the lane hairpins up the head of the pass beneath the Scafells' grey peaks. The pass face reads as a flat plane, and the scree beyond the gill is a bland grey sweep. | 75% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/25-minute-hill-training?simulate`, click **Ride in Hardknott Pass**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
