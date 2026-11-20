# La Redoute rendering

The live 3D world behind the ride HUD for [Ramp It Up: Punchy Intervals](http://localhost:4200/classes/ramp-it-up-punchy-intervals?simulate), which climbs La Redoute. The world follows its description: Liège-Bastogne-Liège's punchy Ardennes wall, painted with fan names. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-redoute.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the fans, and a loop that recycles the wall. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture                            | Change and observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Render quality |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| [001 · The wall](001-the-wall.jpg) | The first La Redoute scene, race day in April under a bright, broken spring sky. The riders punch up the steep tarmac over "VAS-Y" and "ALLEZ TIM", painted by the fans so the riders read them as they climb. Crowd barriers hung with "ARDENNES" and "LIÈGE" banners line both kerbs, and the fans behind them bounce and lean in. Belgian tricolours and Wallonia's rooster flags wave over the crowd, and camper vans are wedged onto the verges. Beech and oak woods just coming into leaf close over the leaf-littered banks. Ahead, past the stone farmhouse, the E25's concrete viaduct crosses the valley between the wooded hills. | 84%            |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/ramp-it-up-punchy-intervals?simulate`, click **Ride in La Redoute**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [037 · The Ardennes stand round the Redoute](bend-037-ardennes-stand.jpg) | The wooded Ardennes ridges round the Redoute were bent vertex by vertex with the road's bends, swinging with each turn. They now stand beyond the road unbent, as the panorama does, and the fans, barriers and camper vans behind the rider stand on the 10% road there instead of floating at the height under the rider. |
