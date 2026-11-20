# Suburban Sunrise rendering

The live 3D world behind the ride HUD for [15 Minute Cardio Workout at Home](http://localhost:4200/classes/15-minute-cardio-workout-at-home?simulate), which rides Suburban Sunrise on Maple Avenue. The world follows its description: quiet tree-lined streets at dawn, with sprinklers ticking, papers landing and neighbours waving from porches. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-suburbia.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` and leg pair for its people, and a loop of fifteen 24 m lots each side that recycles the avenue. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Maple Avenue](001-maple-avenue.jpg) | The first suburban scene, at dawn with the sun just up behind the rider. Sugar maples on the tree lawns arch over the avenue. Behind the sidewalks, one- and two-storey clapboard houses in pastel sidings sit back on mown lawns, each with a gable roof, a chimney, sash windows (a few lit for early risers), a porch with posts and steps, a garage and driveway, a front walk and a mailbox by the kerb; white picket fences front some lots. Sprinklers tick round, the morning papers arc onto the driveways and neighbours wave from their porches, while joggers and walkers pass on the sidewalks. The water tower ahead is hidden behind the maples from this frame, and the sprinklers and papers are small at riding distance. | 70% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/15-minute-cardio-workout-at-home?simulate`, click **Ride in Suburban Sunrise**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
