# Mount Teide rendering

The live 3D world behind the ride HUD for [Build Your FTP & Increase Muscle Mass](http://localhost:4200/classes/build-your-ftp-and-increase-muscle-mass?simulate), which rides Mount Teide along the caldera road. The world follows its description: Tenerife's volcanic climb above the clouds to the lunar caldera. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-teide.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the visitors, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Caldera road](001-caldera-road.jpg) | The first Mount Teide scene, on a cloudless high-altitude morning. The riders climb between pale pumice verges and black lava, past round retama bushes, red tajinaste spires and blocks of lava. On the left the slope falls to the sea of clouds lying flat to the horizon. On the right the banded Roques de García stand on their narrow necks under the caldera's dark wall. Ahead Teide's brown cone rises to its pale summit beside Pico Viejo's shoulder. The Roques read as stacked drums, and the pumice verges are wide and bare. | 79% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/build-your-ftp-and-increase-muscle-mass?simulate`, click **Ride in Mount Teide**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
