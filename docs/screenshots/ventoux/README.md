# Mont Ventoux rendering

The live 3D world behind the ride HUD for [In & Out of the Saddle Hill Climb Reps](http://localhost:4200/classes/in-and-out-of-the-saddle-hill-climb-reps?simulate), which rides Mont Ventoux up from Chalet Reynard. The world follows its description: bare white limestone in the mistral, standing and sitting up the Giant of Provence. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-ventoux.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its climbers and fans, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Chalet Reynard](001-chalet-reynard.jpg) | The first Ventoux scene, at a clear, windswept noon. The road climbs across bare white scree, littered with loose limestone blocks and the odd stunted cedar. On the right the slope rises; on the left a low dry-stone wall edges a drop that falls away into the haze, where the ground sinks far below. The summit's white cone and its red-and-white weather tower stand ahead. Fans line the road, flags snapping in the mistral, and climbers grind up while others sweep down. The painted words are mostly hidden behind the pacers, a close fan on the wall fills the left edge, and the scree is too uniform for the moonscape it should be. | 70% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/in-and-out-of-the-saddle-hill-climb-reps?simulate`, click **Ride in Mont Ventoux**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [025 · The paint lies on the Giant of Provence](bend-025-paint-on-the-giant.jpg) | The words the fans paint on Ventoux's road (ALLEZ, VENTOUX, COURAGE) were laid level, so on its steady 7% each 7 m word sank into the tarmac but for its near end. They now lie along the slope, and the road's props behind the rider stand on the road there instead of at the height under the rider. |
