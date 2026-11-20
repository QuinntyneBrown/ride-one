# Central Park Loop rendering

The live 3D world behind the ride HUD for [15 Minute Cardio HIIT](http://localhost:4200/classes/15-minute-cardio-hiit?simulate), which rides Central Park Loop on Park Drive. The world follows its description: early laps of Central Park past the reservoir and Bethesda Fountain, joggers and carriages sharing the drive. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-centralpark.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for its people and a loop that recycles the drive. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Park Drive](001-park-drive.jpg) | The first Central Park scene, on an early summer morning with the sun low behind the rider. Park Drive has the rider's lane between a runners' lane on the left and a horse lane on the right, each stencilled. American elms fork into vases and arch their crowns over the drive. Cast-iron lamps with lit globes and green slatted benches line it, and joggers run both ways in the runners' lane while horse carriages trot ahead in theirs. On the left the Reservoir's cinder track, granite wall and iron fence front the water, Bethesda Fountain's Angel of the Waters stands on its terrace once a lap, and Midtown's towers rise over the trees ahead. The towers between the trees are still plain boxes, the carriages are small at this distance, and the Reservoir sits low behind the lawn. | 65% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/15-minute-cardio-hiit?simulate`, click **Ride in Central Park Loop**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
