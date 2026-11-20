# Angkor Temples rendering

The live 3D world behind the ride HUD for [60 Minute Reverse Pyramid](http://localhost:4200/classes/60-minute-reverse-pyramid?simulate), which rides the temple road. The world follows its description: jungle roads between Khmer temples and moats at dawn. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-angkor.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the monks, and a loop that recycles the jungle road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture                                          | Change and observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Render quality |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| [001 · The temple road](001-the-temple-road.jpg) | The first Angkor Temples scene, at dawn. The riders roll along the red laterite road between tall pale-trunked dipterocarps and sugar palms, with monks in saffron robes walking the verge. On the right a ruined sandstone gateway stands with a strangler fig's roots over it. On the left lotus flowers float on the still moat, and across the water Angkor Wat's terraces and corbelled towers stand dark against the sunrise. The first take was too dark and fogged the temple out; its towers were smooth eggs. The light is brighter now, the fog further off, and the towers are built up in tiers. | 82%            |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/60-minute-reverse-pyramid?simulate`, click **Ride in Angkor Temples**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [067 · Angkor Wat's towers stand across the moat](bend-067-towers-across-the-moat.jpg) | Angkor Wat's five lotus towers across the moat were bent vertex by vertex with the temple road's bends, so the towers leaned and slewed with each turn. They now stand beyond the road unbent, as the panorama does, and the monks and props behind the rider stand on the road there instead of at the height under the rider. |
