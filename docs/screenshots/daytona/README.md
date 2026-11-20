# Daytona Beach Sand rendering

The live 3D world behind the ride HUD for [Drag Race](http://localhost:4200/classes/drag-race?simulate), which rides Daytona Beach Sand along the tide line. The world follows its description: hard-packed sand where stock cars once raced, and a drag race along the tide line. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-daytona.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its beachgoers, and a loop that recycles the beach. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Tide Line](001-tide-line.jpg) | The first Daytona scene, on a bright morning with the sun behind the rider. The riders take packed sand pressed with tyre tracks. On the left the wet sand shines at the tide line and the surf rolls in over the Atlantic; on the right soft sand rises to sea-oat dunes, a lifeguard tower and pastel hotels with balconies. Ahead the start line crosses the beach under the DAYTONA BEACH timing board, vintage stock cars stand by the start tree, and the Main Street Pier strides across the beach on its pilings. Beachgoers stroll along the water. The umbrellas sit too far back to read, and the surf is a flat band rather than breaking waves. | 74% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/drag-race?simulate`, click **Ride in Daytona Beach Sand**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
