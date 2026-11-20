# Ghent Six-Day rendering

The live 3D world behind the ride HUD for [Level Up Your Cadence](http://localhost:4200/classes/level-up-your-cadence?simulate), which rides Ghent Six-Day round the Kuipke. The world follows its description: six-day racing under the Kuipke's wooden banking, where cadence lifts with every lap the crowd counts. It is the first indoor scene. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-ghent.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the crowd, and a straight that repeats once a lap of the 166 m track. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The Kuipke](001-kuipke.jpg) | The first Ghent scene, on a six-day night under a closed roof. The rider races pine boards marked with the measurement, sprinters' and stayers' lines, the côte d'azur on their left and the banking sweeping up on their right to the sponsors' boards. Steep tiers behind both bankings are packed with a standing crowd that bounces on the ride's clock. The infield holds the riders' cabins behind their coloured curtains, a rail, the bar and a lap board that counts the rider's laps. Tie beams, rows of floodlights and the six-day's banners close the roof. The back straight is far across the infield and the crowd figures are simple at this distance; the turns at each end are not drawn, because the track's straight repeats. | 70% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/level-up-your-cadence?simulate`, click **Ride in Ghent Six-Day**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
