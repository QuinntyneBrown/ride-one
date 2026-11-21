# Route 66 Desert rendering

The live 3D world behind the ride HUD for [High Power Tempo With Short Sprints](http://localhost:4200/classes/high-power-tempo-with-short-sprints?simulate), which rides Route 66 Desert on Route 66. The world follows its description: Arizona's open highway, red mesas and chrome diners, holding tempo and then sprinting for each roadside sign. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-route66.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures and a loop that recycles the highway. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The Mother Road](001-mother-road.jpg) | The first Route 66 scene, on a golden afternoon with the sun behind the rider. The two-lane blacktop runs out with its double yellow line and tar-sealed cracks, between gravel shoulders and red sand scattered with sagebrush, rocks and saguaros. A telegraph line marches along the right; a Route 66 shield and a painted *Historic Route 66 · Kingman* billboard stand by the road, with five little red rhyming signs further on to sprint for. Banded red mesas stand on both sides, the motel with its neon sits ahead on the left, the chrome diner and gas pumps come later in the lap, and a teal classic car comes the other way. The classic cars are simple boxes with fins, and the nearer mesas look close for their size. | 72% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/high-power-tempo-with-short-sprints?simulate`, click **Ride in Route 66 Desert**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [100 · The trucks behind the rider run on Route 66](bend-100-trucks-on-route-66.jpg) | The trucks, the diner's cars and the props between the camera and the rider were set at the height under the rider wherever they were behind it, so on the 2.5% rises across the desert they hung above the road there. They now stand on the road where they are. |
