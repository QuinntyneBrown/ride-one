# Lake Tahoe rendering

The live 3D world behind the ride HUD for [Sandwich Max Efforts](http://localhost:4200/classes/sandwich-max-efforts?simulate), which rides the shore road. The world follows its description: a clear alpine lake shore ringed by pines and granite. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-tahoe.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the paddleboarders and walkers, and a loop that recycles the shore. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture                              | Change and observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Render quality |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| [001 · The shore](001-the-shore.jpg) | The first Lake Tahoe scene, on a clear, still summer morning. The riders roll along the shore road's double yellow line between tall Jeffrey pines with red-brown bark. On the left the beach shelves into turquoise shallows, rounded granite boulders stand out of the water, and a paddleboarder glides by the pier. Beyond lie the deep blue lake, the far shore's forests and the Sierra's peaks with their snow caps. Granite boulders lie piled on the slope on the right. Earlier takes left the shallows hard to tell from the deep water and drew the snow caps flickering against the rock. | 81%            |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/sandwich-max-efforts?simulate`, click **Ride in Lake Tahoe**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [051 · The Sierra stands across the lake](bend-051-sierra-stands.jpg) | The snowy Sierra peaks across Lake Tahoe were bent vertex by vertex with the shore road's bends, swinging with each turn through the pines. They now stand beyond the road unbent, as the panorama does, and the walkers and props behind the rider stand on the road there instead of at the height under the rider. |
