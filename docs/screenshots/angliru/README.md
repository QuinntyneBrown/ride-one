# Angliru rendering

The live 3D world behind the ride HUD for [5 Gruelling Minutes](http://localhost:4200/classes/5-gruelling-minutes?simulate), which climbs the Angliru. The world follows its description: Asturian ramps so steep the crowd pushes in on the road. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-angliru.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the crowd, and a loop that recycles the climb. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture                                    | Change and observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Render quality |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| [001 · The corridor](001-the-corridor.jpg) | The first Angliru scene, a Vuelta stage day in the Sierra del Aramo with low cloud drifting around the mountain. The riders grind up grooved concrete slabs over "VAMOS" and "ANGLIRU", painted for them on the road. The crowd presses in from both sides to leave only a corridor, jumping and leaning in, and Asturias's gold-cross flags and Spain's flags wave over the riders. Drystone walls run along both sides with chestnut trees above the road. A brown Asturian cow grazes on the bank, and a farm with its hórreo on stone stilts stands on the pasture below. The first take drew the mist as flat grey slabs; they are now soft banks of cloud. | 82%            |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/5-gruelling-minutes?simulate`, click **Ride in Angliru**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [036 · The Asturian hills stand still](bend-036-asturian-hills-stand.jpg) | The green Asturian hills round the Angliru were bent vertex by vertex with the road's 45° bends, swinging with each turn of the concrete ramps. They now stand beyond the road unbent, as the panorama does, and the fans, flags and farm props behind the rider stand on the 12% road there instead of floating at the height under the rider. |
