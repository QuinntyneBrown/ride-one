# Yosemite Valley rendering

The live 3D world behind the ride HUD for [Full Effort VO2 Max Intervals](http://localhost:4200/classes/full-effort-vo2-max-intervals?simulate), which rides Yosemite Valley along Northside Drive. The world follows its description: beneath El Capitan and Half Dome, waterfalls thundering beside the road. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-yosemite.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the hikers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Northside Drive](001-northside-drive.jpg) | The first Yosemite Valley scene, on a bright late-spring morning. The riders follow the valley road through meadows of grass, lupins and poppies under ponderosa pines and black oaks, beside a split-rail fence. On the left the Merced runs clear and green over granite boulders, and hikers walk the verge. The granite walls rise sheer on both sides, with El Capitan over the left and Yosemite Falls pouring down the north wall on the right. Ahead Half Dome closes the valley over the trees. The walls read as flat slabs, and Half Dome's cut face does not show from the road. | 76% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/full-effort-vo2-max-intervals?simulate`, click **Ride in Yosemite Valley**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [055 · El Capitan and Half Dome stand still](bend-055-granite-walls-stand.jpg) | El Capitan, Half Dome and the granite walls of the valley were bent vertex by vertex with Northside Drive's bends, so the walls leaned and slewed with each turn. They now stand beyond the road unbent, as the panorama does, and the walkers and props behind the rider stand on the road there instead of at the height under the rider. |
