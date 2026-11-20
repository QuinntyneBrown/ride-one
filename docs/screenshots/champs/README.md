# Champs-Élysées Finale rendering

The live 3D world behind the ride HUD for [Quick & Sharp Sprinting Efforts](http://localhost:4200/classes/quick-and-sharp-sprinting-efforts?simulate), which rides Champs-Élysées Finale up the Champs-Élysées. The world follows its description: final-day cobbles toward the Arc de Triomphe; sharp sprints for the line. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-champs.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the renderer's cobbled road, the kit's `Figures` for the crowd, and a loop that recycles the avenue. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Avenue](001-avenue.jpg) | The first Champs-Élysées scene, on a golden summer evening. The riders sprint up the avenue's cobbles between barriers hung with the race's banners ("DERNIÈRE ÉTAPE", "MAILLOT JAUNE", "PARIS · ARRIVÉE"), the crowd packed several deep behind them in bright shirts. Lamp posts fly tricolours over the kerbs, double rows of clipped plane trees line the pavements, and the cream façades with their balconies show between the trunks. The Arc de Triomphe closes the avenue ahead, a great tricolour hung beneath its vault. The façades are mostly hidden by the trees, and the Arc reads simply, without its sculpture. | 80% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/quick-and-sharp-sprinting-efforts?simulate`, click **Ride in Champs-Élysées Finale**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
