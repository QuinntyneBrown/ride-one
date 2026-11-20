# Passo Campolongo rendering

The live 3D world behind the ride HUD for [Intense Climb: Passo Campolongo](http://localhost:4200/classes/intense-climb-passo-campolongo?simulate), which rides Passo Campolongo up the road from Corvara. The world follows its description: forested hairpins from Corvara past ski lifts to a grassy saddle. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-campolongo.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for its climbers, and a loop that recycles the road. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · From Corvara](001-from-corvara.jpg) | The first Campolongo scene, on a clear summer morning. The riders climb between a meadow-and-forest hillside on the right, where the brown sign reads 5 km to the pass at 1875 m, and a split-rail Ladin fence on the left, with spruce forest falling away to the valley and wooded ridges across it. A chairlift's cable crosses the road overhead with its red chairs riding it, and ahead the forest opens onto the grassy saddle, with the Sella's pale layered walls on the left and the Sassongher's spires on the right. The Sella reads as stacked blocks rather than rock, and a thin band of haze still shows where the valley meets the far ridges. | 74% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/intense-climb-passo-campolongo?simulate`, click **Ride in Passo Campolongo**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
