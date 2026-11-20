# Toronto Waterfront Trail rendering

The live 3D world behind the ride HUD for [30 Minute Sprint and Threshold HIIT](http://localhost:4200/classes/30-minute-sprint-and-threshold-hiit?simulate), which rides the Toronto Waterfront Trail along Queens Quay. The world follows its description: harbourfront paths, island ferries and the CN Tower overhead. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-toronto.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the runners and strollers, and a loop that recycles the trail. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Queens Quay](001-queens-quay.jpg) | The first Toronto Waterfront Trail scene, on a bright summer morning. The riders race along the trail beside the wooden boardwalk, where people watch the boats on Lake Ontario and Sugar Beach's pink umbrellas stand on the sand. The Toronto Islands' wooded shore lies low across the water. On the right the granite promenade runs under rows of maples beside the streetcar's grassy track, below glass condo towers. Ahead the CN Tower rises over the Rogers Centre's dome and the downtown towers. The ferry and sailboats are small at this distance. | 82% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/30-minute-sprint-and-threshold-hiit?simulate`, click **Ride in Toronto Waterfront Trail**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [072 · The CN Tower stands straight over the trail](bend-072-cn-tower-stands.jpg) | The CN Tower, the islands and the skyline beyond Queens Quay were bent vertex by vertex with the trail's bends, so the 550 m tower leaned and slewed with each turn along the lake. They now stand beyond the road unbent, as the panorama does, and the walkers and props behind the rider stand on the trail there instead of at the height under the rider. |
