# Stelvio Pass rendering

The live 3D world behind the ride HUD for [Conquer the Climb](http://localhost:4200/classes/conquer-the-climb?simulate), which rides Stelvio Pass up the Passo dello Stelvio. The world follows its description: forty-eight hairpins stacked up an Italian alpine wall to the snowfields. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-stelvio.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its climbers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Hairpins](001-hairpins.jpg) | The first Stelvio scene, on a crisp alpine morning. Ahead the mountain wall rises with the road's hairpins zigzagging up its face, edged white by their parapets, to the pass's roofs and the snowfields, with the Ortler's peaks just showing above. The rider climbs between a grey cliff on the right, where the Tornante 24 sign stands, and a stone parapet topped with red-and-white posts on the left, over larches falling to the valley. Fellow climbers grind up ahead. The wall fills the sky, so little blue shows and the peaks are cut off at the frame's top, and the hairpins are painted on the face rather than modelled. | 76% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/conquer-the-climb?simulate`, click **Ride in Stelvio Pass**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
