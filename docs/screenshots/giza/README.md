# Giza Plateau rendering

The live 3D world behind the ride HUD for [The Pyramid](http://localhost:4200/classes/the-pyramid?simulate), which rides Giza Plateau on the Plateau Road. The world follows its description: a desert road around the pyramids at sunrise, where efforts build and fall like the stones. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-giza.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the caravan's riders, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Plateau Road](001-plateau-road.jpg) | The first Giza scene, at sunrise with the low sun behind the rider. The road runs between limestone kerbs over golden, wind-rippled sand. Khufu and Khafre stand ahead on the left as the classic line-up, with Khafre's casing cap still on and Menkaure and the queens' pyramids behind them in the haze. A camel caravan with robed riders plods along the left verge, low mastaba tombs and scattered blocks line the road, date palms cluster on the right, and Cairo's blocks and minarets rise faint on the horizon. The Sphinx comes later in the lap. The camels' legs read as stilts, and the road is darker than the sand around it. | 72% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/the-pyramid?simulate`, click **Ride in Giza Plateau**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
