# Notting Hill Carnival rendering

The live 3D world behind the ride HUD for [Quick HIIT Workout](http://localhost:4200/classes/quick-hiit-workout?simulate), which rides Notting Hill Carnival up Ladbroke Grove. The world follows its description: sound systems throbbing on Ladbroke Grove, pushing through costumed mas bands on carnival Monday. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-nottinghill.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the crowd and the dancers, and a loop that recycles the Grove. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Ladbroke Grove](001-ladbroke-grove.jpg) | The first carnival scene, on a bright August afternoon. Four-storey pastel stucco terraces line both sides, with sash windows, first-floor balconies, bays and front doors at the top of their steps. Steel barriers run along both kerbs with the crowd packed behind them, jumping to the music, and bunting in the islands' colours zigzags overhead. Roots Hi-Fi's speaker stack and banner stand at the kerb, its cones pulsing on the beat, beside a striped jerk chicken stall with its smoke rising; three mas bands dance up the road ahead in feathered backpieces. The Westway and Trellick Tower are out of this frame, and the crowd's faces and the dancers' costumes are simple at this distance. | 72% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/quick-hiit-workout?simulate`, click **Ride in Notting Hill Carnival**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [097 · The dancers behind the rider dance on Ladbroke Grove](bend-097-dancers-on-ladbroke-grove.jpg) | The carnival dancers, the crowd and the props between the camera and the rider were set at the height under the rider wherever they were behind it, so where Ladbroke Grove rises 2% they hung above the road there. They now stand on the road where they are. |
