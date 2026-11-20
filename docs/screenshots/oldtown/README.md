# Old Town Criterium rendering handoff

## Goal and references

Improve the live 3D world behind the ride HUD for [30 Minute HIIT Cardio](http://localhost:4200/classes/30-minute-hiit-cardio/world). The rider should recognize Cathedral Circuit and feel forward motion at cycling speed. The requested finish includes at least 100 rendering iterations, a screenshot of the initial ride and of each iteration under `docs/screenshots`, a commit, a pull request, and a verified merge.

Use [the local Old Town mock](../../mocks/pages/world-ride/oldtown.html) for composition. Its [scene image](../../mocks/assets/world-ride/oldtown-canvas.webp) shows a cobbled street, a cathedral spire, cyclists and a sprint arch. Use `~/Downloads/Zwift.avif` as the quality reference for the chase camera, road detail, readable cyclist silhouette, and separation of near scenery from distant landmarks. The repository contains the Magic Patterns-derived mocks. Access to the hosted design has yet to be verified.

### Reference inventory

| Reference | How it informed the work |
| --- | --- |
| **Magic Patterns World Ride** · [local mock collection](../../mocks/pages/world-ride/) and [Old Town canvas](../../mocks/assets/world-ride/oldtown-canvas.webp) | The Old Town still was inspected directly. It establishes the chase perspective, street proportions, landmark, pacer and effort arch. The collection also contains the other worlds and ride states. |
| **Magic Patterns source provenance** · [ADR 0020](../../adr/0020-three-js-for-world-ride.md), [draw-class-scene design](../../detailed-designs/world-ride/draw-class-scene/README.md) and [pacer design](../../detailed-designs/world-ride/show-simulated-pacers/README.md) | These documents identify the original Magic Patterns files as `shared/components/WorldScene.tsx` and `shared/worlds.ts`. The latter supplied world looks and pacer definitions. Those filenames are references recorded in the repository. The original hosted project and its source were not opened during this work. |
| **Zwift** · `~/Downloads/Zwift.avif` | The reference was opened locally. The lead rider and group are easy to distinguish at chase distance, and roadside vegetation and paving convey scale. Use those qualities when reviewing Old Town. |
| **Live Wattzup route and original assets** · [baseline](000-initial.png), [class catalogue](../../../frontend/public/classes.json), [renderer](../../../frontend/projects/wattzup/src/app/core/world-renderer.ts) | The catalogue maps this class to `oldtown`. The baseline records what the user actually saw. The original panorama is available at `11dee85:frontend/public/worlds/oldtown/panorama.webp`; viewing it revealed the baked-in riders. |
| **Repository constraints** · [AGENTS.md](../../../AGENTS.md), [L1](../../specs/L1.md), [L2](../../specs/L2.md), [quality-tier design](../../detailed-designs/world-ride/render-scene-quality/README.md), [ADR 0021](../../adr/0021-webgpu-renderer-with-webgl2-fallback.md) | These define the ride behavior, same-origin assets, rendering backend, fallback and verification requirements. The implementing-incrementally skill guided the slices. The imagegen skill was used to create the façade and replacement skyline artwork. |

## Work in the branch

Continue in the existing worktree on `improve/old-town-criterium`, based on `11dee85`. At handoff the renderer and assets are local changes, including an untracked façade texture. There is no feature commit or PR yet. The pre-existing analytics edit in `frontend/angular.json` belongs to separate work. Stage the intended paths explicitly so that edit stays with its owner.

| Capture | Change and observed result |
| --- | --- |
| [000 · Initial](000-initial.png) | The running WebGL2 ride showed a road, roadside posts, a gray horizon and a rectangular cyclist torso. |
| [001 · Frontages](001-frontages.jpg) | The street now has textured storefronts on both sides, with identifiable doors, windows, balconies and shutters. The distant panorama showed two oversized cyclists floating above the road. |
| [002 · Skyline](002-skyline.jpg) | The floating cyclists are gone and the sky and distant hills read clearly. The cathedral spires are obscured from the initial camera position. Aligning them with the street opening is the first outstanding visual adjustment. |

Two rendering iterations have been captured. Continue at 003, with at least 98 further iterations required.

The main edit is in [ThreeWorldRenderer](../../../frontend/projects/wattzup/src/app/core/world-renderer.ts). Old Town loads [one façade atlas](../../../frontend/public/worlds/oldtown/facades.webp) and shares a material and plane geometry across 12 pairs of 24 m street sections. Each section follows the road height and recycles with distance. Awaiting texture load before the first draw matters because the ride can be stationary. An earlier assignment of an unloaded texture produced a black scene and a Three.js WebGL2 texture error. A later asynchronous assignment alone left the first frame showing blank walls. The current code also supplies a warm stone fallback when the atlas fails to load.

## Reproducing the captures

1. Start the app with `npm start` from `frontend/` if port 4200 is idle. Use Chromium at 1440 × 900 for comparison with the existing captures.
2. Open `http://localhost:4200/classes/30-minute-hiit-cardio?simulate`. Click **Ride in Old Town Criterium** and wait for the URL to end in `/world`. Direct navigation without an active ride redirects to the class page.
3. Keep the initial camera and ride position comparable across passes. Wait for the scene to draw with its assets, inspect the browser console for errors, then save a full-page viewport capture. This machine used Three.js’s WebGL2 fallback. A successful texture request alone previously produced a screenshot with an empty scene.
4. Use consecutive filenames beginning with the iteration number. Keep an entry here stating what changed, what the frame showed, and what to keep or revise. Capture each distinct rendering change. Reloads, camera motion over unchanged geometry and repeated screenshots do not establish additional design iterations.
5. If still available on this machine, `/tmp/wz-facade-check.cjs` contains the Playwright navigation used for the initial façade check. It has a fixed output path for iteration 001. Copy it and change that path before running another pass. Run the copy with `frontend/` as the working directory.

## Strategy for the next passes

Work from the horizon toward the rider, checking each layer in the real ride. Start with the replacement [cathedral panorama](../../../frontend/public/worlds/oldtown/panorama.webp). It contains distant buildings and sky. Inspect the spires from the chase camera, particularly where the façades meet at the vanishing point. Tune the panorama orientation, elevation and extent there. The skyline should still read when the bike is stopped.

Give the street measurable depth next. Break up the continuous flat cornice with roof profiles, stepped heights, setbacks and occasional gaps. Add raised pavements and curbs, then tune the scale of cobbles and gutters against the wheel. Place lamps, trees or awnings where their silhouettes and shadows mark progress along the street. Check the grade and recycled block boundaries while riding, as a still image can hide seams and jumps.

Refine the rider and bicycle at chase-camera distance. Model the helmet, shoulders, bent arms, hips, legs and shoes around the existing wheelbase and cadence-driven crank. Inspect the near silhouette over light and dark paving. Balance sunlight, ambient fill and fog after the materials and shapes are visible. Compare with both references throughout. Keep the HUD legible and the scene tied to the real ride state.

Follow the repo's incremental ATDD workflow, requirements L1-017 and L2-110/111, the [scene design](../../detailed-designs/world-ride/draw-class-scene/README.md), the [quality-tier design](../../detailed-designs/world-ride/render-scene-quality/README.md), and ADRs 0020/0021. Preserve reduced motion, pause, hidden-tab handling, quality tiers, missing-asset fallbacks, the lazy Three.js chunk and same-origin asset loading. Verify the simulator can advance through the improved scene as well as enter it. Full regression and performance checks for these edits are pending.

## Delivery

Review the baseline, each numbered capture and the final live route. Confirm at least 100 distinct iterations plus the baseline. Run `node tools/verify/verify.mjs` from the repository root before pushing. Stage the renderer, intended assets, screenshots and accompanying changes, then commit, push, open the PR, check CI, merge and verify GitHub reports it merged. Include the baseline and final screenshot links in the PR so the visual change is easy to review.
