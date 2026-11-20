# Amsterdam Canals rendering

The live 3D world behind the ride HUD for [Beginner Training Session](http://localhost:4200/classes/beginner-training-session?simulate), which rides Amsterdam Canals along the Herengracht. The world follows its description: flat canal-side streets, humpback bridges and houseboats among friendly commuters. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-amsterdam.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its commuters, and a loop that recycles the gracht. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Herengracht](001-herengracht.jpg) | The first Amsterdam scene, on a spring morning with the sun behind the rider. The rider takes a herringbone brick street; canal houses in dark brick and painted render rise on the right, their stepped, bell, neck and spout gables cut against the sky, with white-framed windows, hoist beams and coloured doors. Elms and dark green lamps line the quay, bicycles crowd its edge, and across the canal the far houses face back over houseboats. Commuters ride upright bikes both ways and people walk the pavements. The canal's water sits below the quay and barely shows from the saddle, and the humpback bridges and the canal boat come later in the lap. | 74% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/beginner-training-session?simulate`, click **Ride in Amsterdam Canals**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
