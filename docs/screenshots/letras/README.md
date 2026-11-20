# Alto de Letras rendering

The live 3D world behind the ride HUD for [Hank's Hardest Training Session](http://localhost:4200/classes/hanks-hardest-training-session?simulate), which climbs the Letras road. The world follows its description: Colombia's 80-kilometre climb through coffee country to the páramo. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-letras.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the fans, and a loop that recycles the climb. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture                                        | Change and observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Render quality |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| [001 · Coffee country](001-coffee-country.jpg) | The first Alto de Letras scene, on a warm, bright morning. The riders climb over "VAMOS NAIRO" and "RIGO", painted on the road for them. On the right, rows of glossy coffee bushes with red cherries cover the steep slope, shaded by banana plants, and tall wax palms rise above. Fans in yellow, blue and red stand by the yellow kilometre posts. On the left, past the guard rail, the mountain falls to a valley lying under a sea of cloud, with ridge after blue ridge beyond and fair-weather cumulus over them. The first take put the ridges so close they hid the valley and drew the clouds as flat discs. | 82%            |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/hanks-hardest-training-session?simulate`, click **Ride in Alto de Letras**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [040 · The valley under the cloud stands still](bend-040-valley-stands.jpg) | The Magdalena valley's 9 km floor under its sea of cloud, the blue ridges beyond and the páramo ahead were bent vertex by vertex with the road's bends, so the valley floor and the ridges slewed and squeezed with each turn. They now stand beyond the road unbent, as the panorama does, and the props and fans behind the rider stand on the road there instead of at the height under the rider. |
