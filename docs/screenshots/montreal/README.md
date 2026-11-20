# Montreal Jazz Fest rendering

The live 3D world behind the ride HUD for [High Intensity, Short Rest](http://localhost:4200/classes/high-intensity-short-rest?simulate), which rides Montreal Jazz Fest along Rue Sainte-Catherine. The world follows its description: downtown stages and street crowds in summer, with short rests between sets. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-montreal.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for the crowds and the bands, and a loop that recycles the street. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Sainte-Catherine](001-sainte-catherine.jpg) | The first Montreal scene, on a summer evening just after sunset under a violet sky. The riders take Rue Sainte-Catherine, closed for the festival, between granite pavements set with the quarter's red dots, where crowds stand and bounce on the beat. Festoons of warm bulbs sag across the street, and lamp posts carry JAZZ MONTRÉAL banners with a saxophone's curve. Glass and old stone fronts wall it in, their windows lit. The stages, with their trusses, coloured beams and cycling screens, and the food kiosks come later in the lap. The fronts' lit windows read as a busy checkerboard, the crowds stand in thin lines rather than packed, and the street is still dark in the dusk. | 72% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/high-intensity-short-rest?simulate`, click **Ride in Montreal Jazz Fest**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
