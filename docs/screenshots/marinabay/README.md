# Marina Bay Night rendering

The live 3D world behind the ride HUD for [Fast Paced Cadence Variations](http://localhost:4200/classes/fast-paced-cadence-variations?simulate), which rides Marina Bay Night along the bayfront. The world follows its description: Singapore's night loop around the Supertrees and the bay's glowing skyline. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-marinabay.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its strollers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · Bayfront](001-bayfront.jpg) | The first Marina Bay scene, on a warm night. The riders take the bayfront boulevard between rows of warm lamps and palms. On the left, strollers walk the granite promenade above black water streaked with the lights' reflections, and across the bay the city's towers stand lit window by window with the ArtScience Museum's lotus petals and the Singapore Flyer's ring before them. On the right the Supertrees rise from the dark gardens, their lattice canopies glowing violet and pink with the lit skyway strung between them. The sky is plain black, and Marina Bay Sands' SkyPark does not yet read apart from the towers around it. | 74% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/fast-paced-cadence-variations?simulate`, click **Ride in Marina Bay Night**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
