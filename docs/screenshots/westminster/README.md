# Westminster Rush Hour rendering

The live 3D world behind the ride HUD for [Time Is of the Essence](http://localhost:4200/classes/time-is-of-the-essence?simulate), which rides Westminster Rush Hour on Westminster Bridge. The world follows its description: London at dusk beneath Big Ben; race black cabs and red buses before the clock chimes. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-westminster.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures and a loop that recycles the bridge. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Bridge](001-bridge.jpg) | The first Westminster scene. The rider keeps left over Westminster Bridge, with a red bus lane, BUS LANE painted in it, beside them and the oncoming carriageway on the right. Red double-deckers and black cabs race the rider in the bus lane and stream towards them with their lamps lit, all on the ride's clock. Green triple-lantern standards and cast-iron balustrades line the parapets, commuters in coats walk both pavements, and the Thames lies 7.5 m below. Ahead on the right bank the Palace of Westminster is floodlit gold under Elizabeth Tower, its four dials lit at ten to six, with lit Portland-stone blocks along both banks under a rose and violet dusk. The rider's lane reads near black at this light, the palace's river front is small at this distance, and the bank buildings are plain boxes. | 60% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/time-is-of-the-essence?simulate`, click **Ride in Westminster Rush Hour**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
