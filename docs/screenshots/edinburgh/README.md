# Edinburgh Fringe rendering

The live 3D world behind the ride HUD for [20 Minute HIIT](http://localhost:4200/classes/20-minute-hiit?simulate), which rides Edinburgh Fringe up the Royal Mile. The world follows its description: the Royal Mile packed with street performers and posters in August festival season. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-edinburgh.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the crowd, the performers and their rings, and a loop that recycles the street. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Royal Mile](001-royal-mile.jpg) | The first Edinburgh scene, on a bright August afternoon. The riders climb the Royal Mile's granite setts between tall dark tenements with rows of white-framed sash windows above shopfronts with gilded fascias. Bunting sags across the street in red, white, blue and yellow, Saltires fly from the tenements, and poster columns and A-boards plastered with the Fringe's shows stand on the flagstone pavements among the crowds. The Castle's walls close the view at the top of the Mile. St Giles' crown spire and the jugglers' rings come later in the lap. The tenements' fronts repeat their window grid closely, and the crowd stands in lines rather than milling. | 78% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/20-minute-hiit?simulate`, click **Ride in Edinburgh Fringe**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [065 · The Castle stands at the head of the Mile](bend-065-castle-stands.jpg) | Edinburgh Castle on its rock at the head of the Royal Mile was bent vertex by vertex with the Mile's bends, so its walls slewed across the end of the street with each turn. It now stands beyond the road unbent, as the panorama does, and the crowd and props behind the rider stand on the cobbles there instead of at the height under the rider. |
