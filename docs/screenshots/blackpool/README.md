# Blackpool Illuminations rendering

The live 3D world behind the ride HUD for [In and Out, Shake It All About](http://localhost:4200/classes/in-and-out-shake-it-all-about?simulate), which rides Blackpool Illuminations along the Promenade. The world follows its description: seaside lights, piers and the tower, weaving in and out of tram stops along the illuminated promenade. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-blackpool.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its people, and a loop that recycles the promenade. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The Promenade](001-promenade.jpg) | The first Blackpool scene, at dusk with the lights on. Festoons of coloured bulbs swing across the road between green promenade lamps, lit arches span it, and neon tableaux stand along the sea wall; the bulbs chase colour by colour. On the left, balloon trams run and halt on the tramway past glass tram stops, in front of lit guest houses, hotels, chip shops and arcades with neon signs. On the right the railings look over the beach and the sea, the North Pier runs out once a lap, and the Tower rises ahead under the first arch. A first try at 2° of sun left the road near black, so the sun now sits at 8° and the road is dry. The Tower is small at its distance, the trams read only as boxes, and the bulbs light nothing around them. | 68% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/in-and-out-shake-it-all-about?simulate`, click **Ride in Blackpool Illuminations**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
