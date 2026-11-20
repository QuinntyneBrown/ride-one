# Chichén Itzá rendering

The live 3D world behind the ride HUD for [The Full Pyramid](http://localhost:4200/classes/the-full-pyramid?simulate), which rides Chichén Itzá along the sacbé. The world follows its description: a jungle road to the Mayan pyramid of El Castillo. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-chichen.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the visitors, and a loop that recycles the causeway. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The sacbé](001-the-sacbe.jpg) | The first Chichén Itzá scene, on a golden Yucatán afternoon. The riders follow the white limestone causeway through the jungle, between a green wall of canopy with broad-leaved trees, palms and vines hanging at its edge. A great pale ceiba spreads its crown overhead, and a ruined temple platform with broken columns stands in the undergrowth beside a vendor's frame of bright woven textiles. Visitors walk the causeway's edges, and ahead El Castillo's temple rises over the trees at the end of the road. The pyramid's terraces are hidden behind the trees, and the canopy wall reads as a uniform hedge. | 78% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/the-full-pyramid?simulate`, click **Ride in Chichén Itzá**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [056 · El Castillo stands at the end of the sacbé](bend-056-castillo-stands.jpg) | El Castillo and the jungle canopy beyond the sacbé were bent vertex by vertex with the causeway's bends, so the pyramid's steps leaned and slewed with each turn. They now stand beyond the road unbent, as the panorama does, and the walkers and props behind the rider stand on the causeway there instead of at the height under the rider. |
