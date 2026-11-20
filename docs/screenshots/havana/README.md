# Havana Malecón rendering

The live 3D world behind the ride HUD for [30 Sec On, 2 Min Off](http://localhost:4200/classes/30-sec-on-2-min-off?simulate), which rides Havana Malecón along the seawall. The world follows its description: waves crash over the seawall, with classic cars and pastel façades between the surges. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-havana.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its strollers and fishermen, and a loop that recycles the boulevard. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Seawall](001-seawall.jpg) | The first Havana scene, in the late afternoon. Pastel façades line the right: green, salmon and blue, with colonnades at the foot, green shutters, balconies and peeling plaster, and royal palms along the pavement. On the left, across the oncoming lanes and their double centre line, a classic two-tone car cruises by, and strollers and fishermen line the promenade along the seawall, with the Gulf beyond. Spray breaks white over the wall in the distance, and El Morro's castle and lighthouse guard the harbour mouth ahead. The spray plumes read as soft white domes rather than bursting water, and the people closest to the camera fill the frame's edges. | 75% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/30-sec-on-2-min-off?simulate`, click **Ride in Havana Malecón**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
