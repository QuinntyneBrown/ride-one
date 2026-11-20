# Trollstigen rendering

The live 3D world behind the ride HUD for [Gradual Threshold Effort Builds](http://localhost:4200/classes/gradual-threshold-effort-builds?simulate), which rides Trollstigen up the Troll’s Ladder. The world follows its description: Norway's troll ladder of hairpins climbing beside waterfalls. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-trollstigen.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the visitors, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The ladder](001-the-ladder.jpg) | The first Trollstigen scene, on a bright Romsdal summer morning. The riders climb between granite guard stones on the left and a sheer, wet cliff on the right, with boulders fallen at its foot and the red-bordered troll sign by the road. A white fall streams down the cliff face. Ahead, the ladder's hairpins zigzag up the headwall beside Stigfossen, with mist drifting along the ledges below snowy peaks. The valley's far walls close the view on the left, and visitors stand at the guard stones. The near waterfall is small in the frame, and the valley walls are plain flat-shaded cones. | 77% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/gradual-threshold-effort-builds?simulate`, click **Ride in Trollstigen**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
