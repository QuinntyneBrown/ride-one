# Haleakalā rendering

The live 3D world behind the ride HUD for [Maximum Intensity Hill Climb Efforts](http://localhost:4200/classes/maximum-intensity-hill-climb-efforts?simulate), which climbs Haleakalā's summit road. The world follows its description: Maui's sea-level-to-summit climb, ending above the clouds. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-haleakala.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the visitors at the pull-outs, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture                                            | Change and observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Render quality |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| [001 · Above the clouds](001-above-the-clouds.jpg) | The first Haleakalā scene, in the clear early morning high above the clouds. The riders climb the summit road along its double yellow centre line, between white reflector posts. The bare rust-red cinder on either side is scattered with lava rubble and silverswords' spiky silver globes, two sending up their purple flowering spikes. A nēnē crossing sign stands on the right, visitors and their cars wait at a pull-out ahead, and on the left the sea of clouds spreads to the horizon below the slope. Ahead the summit's cinder cones rise behind the observatories' white domes. The Big Island's peaks are out of frame from this bearing. | 82%            |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/maximum-intensity-hill-climb-efforts?simulate`, click **Ride in Haleakalā**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [035 · The observatories stand on the summit](bend-035-observatories-stand.jpg) | Science City's white domes on the summit and the crater rim were bent vertex by vertex with the road's 50° bends, so the domes slewed and squeezed with each switchback up the cinder slopes. They now stand beyond the road unbent, as the panorama does, and the props behind the rider stand on the road there. |
