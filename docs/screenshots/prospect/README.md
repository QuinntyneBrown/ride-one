# Prospect Park rendering

The live 3D world behind the ride HUD for [30 Minute Intervals: Fitness Training](http://localhost:4200/classes/30-minute-intervals-fitness-training?simulate), which rides Prospect Park's loop on the park drive. The world follows its description: Brooklyn's park loop past the lake, meadows and weekend markets. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-prospect.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the runners, strollers and picnickers, and a loop that recycles the drive. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Park drive](001-park-drive.jpg) | The first Prospect Park scene, on a golden early-autumn weekend morning. The riders follow the drive's lanes under great oaks and planes turning gold and russet, past cast-iron lamps and green benches, with runners and strollers on the paved footpaths. On the right the Long Meadow rolls away, with the weekend market's white tents and striped awnings along its edge. On the left the Lake lies blue beyond the trees, with swans on it, the white Boathouse on its far bank and a rustic shelter on its point. Ahead, Grand Army Plaza's arch and the borough's towers show over the canopy. The picnic blankets and dogs are small at this distance. | 82% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/30-minute-intervals-fitness-training?simulate`, click **Ride in Prospect Park**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [068 · The boathouse and the towers stand round the park](bend-068-boathouse-stands.jpg) | The boathouse across the lake and the Brooklyn towers above the trees were bent vertex by vertex with the park drive's bends, swinging with each turn of the loop. They now stand beyond the road unbent, as the panorama does, and the walkers and props behind the rider stand on the drive there instead of at the height under the rider. |
