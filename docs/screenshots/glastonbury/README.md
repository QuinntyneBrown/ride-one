# Glastonbury Fields rendering

The live 3D world behind the ride HUD for [Sprint to the Music](http://localhost:4200/classes/sprint-to-the-music?simulate), which rides Glastonbury Fields along the trackway. The world follows its description: tents, flags and the Pyramid Stage; sprint between music stages. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-glastonbury.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the festival-goers, and a loop that recycles the trackway. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Trackway](001-trackway.jpg) | The first Glastonbury scene, on a warm June evening. The riders take the metal trackway across trampled grass between campsites packed with dome and tunnel tents in every colour, tall poles flying festival flags in stripes, chevrons and suns over them. Festival-goers wander the trackway's edges and stand about in groups, food stalls line the way, and the Pyramid Stage's silver frame rises ahead with Glastonbury Tor and St Michael's tower beyond. The stage's light beams are faint in the evening light, and the far hills grey out in the haze. | 78% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/sprint-to-the-music?simulate`, click **Ride in Glastonbury Fields**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [064 · The vale and the Tor stand round the fields](bend-064-vale-stands.jpg) | The low hills of the Vale of Avalon and the Tor on the skyline were bent vertex by vertex with the trackway's bends, swinging with each turn through the tents. They now stand beyond the road unbent, as the panorama does, and the festival-goers and props behind the rider stand on the trackway there instead of at the height under the rider. |
