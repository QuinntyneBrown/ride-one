# Las Vegas Strip rendering

The live 3D world behind the ride HUD for [Quick HIIT Sprint Workout](http://localhost:4200/classes/quick-hiit-sprint-workout?simulate), which rides Las Vegas Strip down Las Vegas Boulevard. The world follows its description: neon casinos and dancing fountains after midnight, sprinting from light to light down the boulevard. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-vegas.ts`, with `build`, `lay`, `place` and `setTime`, seeded detail, canvas textures, the kit's `Figures` for its people, and a loop that recycles the Strip. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The Strip](001-the-strip.jpg) | The first Strip scene, after midnight under a moon and the city's violet glow. Casinos line both sides: Lucky 7, The Ace, Golden Mirage and more, each with a dark front lit by its neon name, bulbs and amber lobby, a marquee pylon by the kerb and a hotel tower lit floor by floor behind. Uplit date palms stand on the median, traffic runs both ways with head- and tail-lights, and a junction ahead hangs its signals over a painted crossing; they cycle green, amber and red on the ride's clock. The Welcome sign stands on the median and the observation tower rises at the far end. The lobbies were first a flat bright beige, so they are now darker amber glass. The sky is a flat black, and the fountains' lake is out of this frame. | 70% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/quick-hiit-sprint-workout?simulate`, click **Ride in Las Vegas Strip**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
