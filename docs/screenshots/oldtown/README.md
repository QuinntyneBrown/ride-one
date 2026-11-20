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

The work is on `improve/old-town-criterium`. It began from `11dee85` and is delivered as one pull request. The pre-existing analytics edit in `frontend/angular.json` belongs to separate work and stays out of the commits.

| Capture | Change and observed result | Keep or revise |
| --- | --- | --- |
| [000 · Initial](000-initial.png) | The running WebGL2 ride showed a road, roadside posts, a gray horizon and a rectangular cyclist torso. | Baseline. |
| [001 · Frontages](001-frontages.jpg) | The street now has textured storefronts on both sides, with identifiable doors, windows, balconies and shutters. The distant panorama showed two oversized cyclists floating above the road. | Replaced by 3D houses in 003. |
| [002 · Skyline](002-skyline.jpg) | The floating cyclists are gone and the sky and distant hills read clearly. The cathedral spires are obscured from the initial camera position. Aligning them with the street opening is the first outstanding visual adjustment. | Spires aligned in 004. A 3D cathedral was added in 031. |
| [003 · Town houses](003-town-houses.jpg) | 3D houses (procedural stucco bay textures, shop floor, pitched roofs) replace flat photo frontage; parallax + roof silhouettes; sky grey between roofs. | Keep. The grey sky between the roofs was fixed in 004 and 005. |
| [004 · Tiled roofs](004-tiled-roofs.jpg) | Clay-tile roof texture with UVs and wall-coloured gables; panorama turned 0.16 so the cathedral sits at the end of the street; panorama now awaited before the first frame (a stationary ride never redrew once it loaded, leaving grey sky). | Keep. |
| [005 · Blue sky](005-blue-sky.jpg) | Oldtown sky turbidity 1.6 / rayleigh 2.6 / mie 0.003 and the panorama's top fifth fades out through an alpha map, so no hard edge above the skyline. | Keep. |
| [006 · Pavements](006-pavements.jpg) | 15 cm granite kerbs and flagstone pavements laid over the road profile on both sides (ribbons that follow the grade). | Keep. |
| [007 · Cobbles](007-cobbles.jpg) | 1024px canvas of granite setts (13 cm rows, own shade each, dark joints) with white race edge lines replaces the asphalt tile in oldtown; road colour lifted to pale stone. | Keep. |
| [008 · Cyclist](008-cyclist.jpg) | The box torso becomes a modelled rider and road bike from one kit: tyres and rims, diamond frame, drop bars, saddle, helmet, bent arms, legs on the pedals through two-bone IK driven by the crank. | Keep. |
| [009 · Pacers](009-pacers.jpg) | The six simulated pacers ride in the scene at their board gaps and lanes, in their rider colours (L2-107 AC7); Ana alongside, Jonas, Maya and Sophie up the street. | Keep. |
| [010 · Sun behind](010-sun-behind.jpg) | Looks gain a sun azimuth; Old Town's sun moves behind-left so the rider's back and the right-hand façades are lit (it had backlit the rider). | Revised by 011, 012, 027 and finally 083. |
| [011 · High sun](011-high-sun.jpg) | Sun raised to 55° and the shadow box stretched 90 m down the street, so the right half of the road is sunlit and house shadows reach the vanishing point. | Revised by 027 and 083: lower, from behind the rider. |
| [012 · Warm light](012-warm-light.jpg) | Old Town's sun becomes warm (#ffeccc) and stronger (3.2) with less sky fill (1.1), so sun and shade separate. | Keep. |
| [013 · Cornices](013-cornices.jpg) | A projecting cornice under each roof and a string course over the shop floor, in the house's trim colour, catch the sun and cast a line of shadow. | Keep. |
| [014 · Shopfronts](014-shopfronts.jpg) | Shop floors redrawn as painted wooden shop fronts with a warm lit interior, shelves of goods, reflections and a panelled stall riser instead of black glass. | Keep. |
| [015 · Homes](015-homes.jpg) | Half the houses get a home's ground floor (panelled door under a fanlight, barred window, rusticated base) over a two-bay tile, so the street mixes homes and shops. | Keep. |
| [016 · Lamps bollards](016-lamps-bollards.jpg) | Iron lamp posts with lanterns every 28 m on alternate pavements and black iron bollards at the kerb; the pink verge posts are not built in Old Town. | The bollards went in 087: they stood behind the barriers. |
| [017 · Awnings](017-awnings.jpg) | Two-thirds of shop fronts get a striped canvas awning (five colourways) sloping 1.5 m over the pavement with a valance, casting shade on the flagstones. | Keep. |
| [018 · Window boxes](018-window-boxes.jpg) | Half the palettes put a window box of geraniums (red, pink or white) under every upper window. | More palettes in 082 and real boxes in 093. |
| [019 · Varied neighbours](019-varied-neighbours.jpg) | The layout draws from its own seeded sequence (details no longer reshuffle the street) and next-door houses never share a palette. | Keep. |
| [020 · Rider posture](020-rider-posture.jpg) | Shoulders lower and forward, hands on the hoods, elbows bent out, slimmer seat, larger helmet over a smaller head: the riders read as racing, not sitting upright. | Keep. |
| [021 · Jersey kit](021-jersey-kit.jpg) | Jerseys and helmets carry a kit texture, tinted by each rider colour: dark side panels and a pale hem band. | Keep. |
| [022 · Chimneys](022-chimneys.jpg) | One or two brick chimney stacks with clay pots on each roof, standing on the slope where it meets them. | Pots added in 095. |
| [023 · Street haze](023-street-haze.jpg) | Old Town's fog becomes a warm haze from 30 m that hides everything by 430 m: houses at the far end of the loop fade in instead of popping, while the panorama's cathedral stays clear. | Keep. |
| [024 · Race barriers](024-race-barriers.jpg) | Race-day crowd barriers run along both kerbs, hung with printed banners (Old Town Criterium, Cathedral Circuit, Cobbled sprint, Race day) and a steel top rail, open every 24 m for a crossing; ribbons are now textured in street metres so kerbs, slabs and banners pass the rider instead of riding along. | Keep. |
| [025 · Gutters](025-gutters.jpg) | A dished gutter of long granite slabs along each kerb, darker towards the kerb, with the race lines moved just inside it. | Keep. |
| [026 · Worn setts](026-worn-setts.jpg) | Lighter joints and gentler sett shading calm the road; the setts down the middle are polished lighter by the traffic. | Relief added in 041. |
| [027 · Sun down street](027-sun-down-street.jpg) | The sun swings round almost behind the rider (azimuth −162°, 48° up), so the road is sunlit and the house shadows lie along the left pavement. | Superseded by the raking sun of 083. |
| [028 · Contact shadows](028-contact-shadows.jpg) | A soft contact shadow under each bike (technique 37, from the high tier) grounds the riders; the sun's own shadow of them is too soft at the street's shadow reach. | Keep. |
| [029 · Crowd](029-crowd.jpg) | Spectators in knots behind both barriers, each with trousers, a shirt of their own colour and a head, facing the road (three instanced meshes, one draw each). | Arms 044, children 054, hats 055, density 084, hair 090, colours 102. |
| [030 · Bunting](030-bunting.jpg) | Strings of pennants in the race colours cross the street every 35 m, 8.5 m up at the houses and sagging 1.6 m in the middle (one instanced mesh). | Keep. |
| [031 · Cathedral](031-cathedral.jpg) | A 3D minster stands 620 m down the road like the skyline (west tower and 62 m open spire with pinnacles, two lower towers, rose window, portal, nave and steep roof), hazed by hand; the panorama turns its own cathedral aside. | Brought to 500 m in 086. |
| [032 · Cathedral stone](032-cathedral-stone.jpg) | The cathedral's towers carry lancet windows with tracery and the spire an openwork of quatrefoils, on dressed stone; less haze so it reads as stone in sunlight. | Keep. |
| [033 · Balconies](033-balconies.jpg) | Two houses in five get a first-floor balcony across their front: a stone slab and a wrought-iron railing of balusters and scrolls, cut out with alpha. | Keep. |
| [034 · Shop signs](034-shop-signs.jpg) | Three shops in five hang a painted sign from an iron bracket over the pavement: a gilt cup, key, loaf or wheel on a coloured board, read from either side. | Keep. |
| [035 · Dormers](035-dormers.jpg) | Up to two dormers on the street side of each roof, a window under its own small tiled gable. | Keep. |
| [036 · Weathering](036-weathering.jpg) | Façades weathered: grime splashed up the shop floors from the street, rain streaks under every sill; each house now draws its details from its own seeded sequence, chosen for a shop and home mix at the start line. | Keep. |
| [037 · Closed shutters](037-closed-shutters.jpg) | A third of the shuttered houses close both leaves of every upper window against the sun; per-house choices now each draw from a sequence of their own. | Keep. |
| [038 · Effort arch](038-effort-arch.jpg) | The effort arch follows the mock: dark lettering on a volt banner with a keyline, a deeper beam on steel truss legs with weighted feet, and a white line across the road where the effort starts (captured with the arch drawn 35 m ahead through the debug hook). | Seen only during efforts; check it again in a ride that reaches one. |
| [039 · Race numbers](039-race-numbers.jpg) | Every rider wears a race number on the lower back (black digits on white cloth with safety pins): You 4, each pacer its jersey number. | Keep. |
| [040 · House flags](040-house-flags.jpg) | A third of the houses fly a civic flag in two or three bands from a pole angled out over the street at the first floor. | Keep. |
| [041 · Sett relief](041-sett-relief.jpg) | The cobbles gain relief: a normal map computed from a height field of domed setts and sunk joints (technique 3, from the medium tier), so each sett catches the light on its edge. | Relief strength raised from 2.2 to 9 after the first capture. |
| [042 · Door pots](042-door-pots.jpg) | Homes set clipped bay trees in terracotta pots either side of most of their doors, the first green at street level. | Keep. |
| [043 · Ridges gutters](043-ridges-gutters.jpg) | Ridge tiles cap every roof, a zinc gutter runs along each eave and a downpipe drops at one end of every house, marking where one house ends and the next begins. | Keep. |
| [044 · Cheering crowd](044-cheering-crowd.jpg) | Spectators gain arms: most hang at their sides, a quarter reach up and out cheering the riders on. | Keep. |
| [045 · Spokes chainring](045-spokes-chainring.jpg) | Every bike gains laced spokes (an alpha-masked disc under the speed blur), a chainring on the drive side and a blue bottle in its cage on the down tube. | Keep. |
| [046 · Pedal rock](046-pedal-rock.jpg) | Each bike rocks a little under every pedal stroke, about its tyres' line on the road (still with reduced motion); captured riding at 31.9 km/h. | Keep. |
| [047 · Drain grates](047-drain-grates.jpg) | A cast-iron drain grate sits in each gutter, the two sides out of step, sunk in the relief map. | Subtle. Keep. |
| [048 · Window glass](048-window-glass.jpg) | Upper windows mirror the sky above and the sunlit houses across the street below, with a diagonal glint and a curtain drawn to one side. | Hard to see past the closed shutters. Keep. |
| [049 · Hanging baskets](049-hanging-baskets.jpg) | Every lamp holds out an iron arm with a hanging basket of red and pink geraniums over the barrier. | Keep. |
| [050 · Merged houses](050-merged-houses.jpg) | No visible change: each house, lamp, bollard and the cathedral merge their parts that share a material into one mesh, taking the street from 2190 meshes in view to 1357 so the higher tiers keep their frame budget. | No visible change. Keep it for the frame budget. |
| [051 · Stepped gables](051-stepped-gables.jpg) | A third of the narrow houses raise a stepped Flemish gable over their front, five coped courses with an oculus, giving the distant rooflines a stepped silhouette. | Keep. |
| [052 · Quoins](052-quoins.jpg) | Half the houses dress both front corners with stone quoins, long and short in turn, in their trim colour. | Keep. |
| [053 · Marshals](053-marshals.jpg) | A race marshal in a hi-vis vest stands at the barrier every forty metres or so, facing the road. | Keep. |
| [054 · Children](054-children.jpg) | One spectator in six is a child, a metre or so tall, at the front against the barrier. | Keep. |
| [055 · Sun hats](055-sun-hats.jpg) | A fifth of the crowd wear a sun hat or cap, cream, navy, red, white or volt. | Keep. |
| [056 · Helmet vents](056-helmet-vents.jpg) | Every helmet gets its own shell: the rider's colour with ten dark vents running front to back and a dark rim, glossier than the jersey. | Keep. |
| [057 · Road paint](057-road-paint.jpg) | Fans' slogans painted on the setts (ALLEZ ALLEZ, HUP HUP, VAMOS, GO ANA) in worn white and yellow road paint, stretched along the road as road writing is so it reads from the rider's low eye. | At 1.1 m deep the paint was invisible from the saddle, so it was stretched to 7 m. |
| [058 · Shop trades](058-shop-trades.jpg) | Each shop keeps a trade by its palette: a bookshop's shelves, a bakery's loaves, a florist's buckets banked up the window, or a boutique's rail and two dressed mannequins. | Keep. |
| [059 · Doorsteps](059-doorsteps.jpg) | A worn stone step up to each home's door (mostly behind the barriers from the saddle). | Mostly hidden by the barriers. |
| [060 · Leaf texture](060-leaf-texture.jpg) | The clipped bay trees take a leaf texture, a dense mass of small leaves each lit a shade apart, so they read as foliage instead of green balls. | Keep. |
| [061 · Setbacks](061-setbacks.jpg) | Old frontages never quite line up: each house stands up to 45 cm back from its neighbour, breaking the façade line into steps. | Keep. |
| [062 · Worn pavement](062-worn-pavement.jpg) | The pavement slabs vary more from one to the next, with old gum, a damp stain and a crack. | Keep. |
| [063 · Tv moto](063-tv-moto.jpg) | The television motorbike rides 30 m ahead by the left gutter, a white bike with its pilot and a cameraman sat backwards on the pillion, camera on his shoulder, mast behind. | Moved from 46 m to 30 m so it reads as a motorbike. |
| [064 · Scalloped awnings](064-scalloped-awnings.jpg) | Each awning's valance ends in a scalloped hem, half-discs every 30 cm. | Keep. |
| [065 · Race socks](065-race-socks.jpg) | Every rider wears white race socks to mid-calf, carried on the shin as the legs turn. | Keep. |
| [066 · Hand flags](066-hand-flags.jpg) | Two in three of the cheering fans hold up a hand flag, flown square to the street so the riders see it coming. | Turned square to the street after a first version showed edge-on. |
| [067 · Alleys](067-alleys.jpg) | Now and then an alley runs off between two houses (one in view of the start on each side): setts running back to a far wall, a room bridging it on an arch, the sky over it. | One alley is placed in view of the start. At this angle most alleys hide behind their neighbours. |
| [068 · Cathedral clock](068-cathedral-clock.jpg) | The cathedral gains a pointed gable over its portal, pinnacles along both nave walls, a clock on the belfry face and a gilded cross on the spire (small at 620 m). | Small at 620 m. It reads better after 086. |
| [069 · Shop doors](069-shop-doors.jpg) | Every shop gains a glazed door in painted wood in one of its bays, a brass handle and kick plate, the lit shop showing through. | Keep. |
| [070 · Street banners](070-street-banners.jpg) | Cloth banners strung across the street between the houses every 140 m (OLD TOWN CRITERIUM, WELKOM · BIENVENUE, CATHEDRAL CIRCUIT), folds in the cloth, on a rope. | Keep. |
| [071 · Balcony plants](071-balcony-plants.jpg) | Balconies hold two to four pots of geraniums along the railing, and now and then a bistro table. | Keep. |
| [072 · Dentils](072-dentils.jpg) | A row of dentils runs under every cornice, white teeth catching the light along the eaves. | Keep. |
| [073 · Window sills](073-window-sills.jpg) | A stone sill stands proud under every upper window, lined up with the painted windows bay by bay. | Keep. |
| [074 · Lintels](074-lintels.jpg) | A lintel with a raised keystone crowns every upper window. | Keep. |
| [075 · Corner shade](075-corner-shade.jpg) | The pavement darkens softly over its last metre into the foot of the houses, as ambient light fails into the corner. | The left side showed only after 094. |
| [076 · Fascias](076-fascias.jpg) | Every shop front carries a dark fascia over its window, its trade lettered in gilt: BOEKEN, BAKKERIJ, BLOEMEN or MODE, matching the window below. | Keep. |
| [077 · Barrier panels](077-barrier-panels.jpg) | The barriers carry six panel designs instead of four, adding a volt WATTZUP and an ALLEZ ! panel to break the repeat. | Keep. |
| [078 · Swifts](078-swifts.jpg) | A dozen swifts wheel high over the street ahead, dark crescents on swept wings, a turn for every 60 m ridden. | Keep. |
| [079 · Frame paint](079-frame-paint.jpg) | Each pacer rides a frame of their own paint (white, red, navy, silver or teal), all clearcoated together at the tier that has it; You keep the black frame. | Keep. |
| [080 · Granite kerbs](080-granite-kerbs.jpg) | The kerbs become speckled granite stones a metre long, each a shade apart, butted at fine joints. | Keep. |
| [081 · Lamp pennants](081-lamp-pennants.jpg) | Every lamp post flies a swallow-tailed race pennant, OTC down it in volt on black or white on red, square to the street below the basket. | Keep. |
| [082 · More window boxes](082-more-window-boxes.jpg) | Three more palettes plant window boxes (pink, yellow and white), so most upper floors carry flowers. | Keep. |
| [083 · Raking sun](083-raking-sun.jpg) | The sun drops to 42° and swings round behind the right shoulder (azimuth −150°): the right-hand houses throw their shade across the road in a diagonal line, the left façades and pavement stay in sun, and the riders' backs stay lit (a lower 36°/−138° trial put the whole road in shade and was rejected). | Keep. |
| [084 · Fuller crowd](084-fuller-crowd.jpg) | The crowd closes up, knots of fans every one to five metres instead of up to seven and a half, so the barriers are lined from the start. | Keep. |
| [085 · White helmets](085-white-helmets.jpg) | Half the pacers wear a white helmet rather than one in their colour; captured riding at 31.9 km/h with the motion blur. | Keep. |
| [086 · Nearer cathedral](086-nearer-cathedral.jpg) | The cathedral comes 120 m nearer (500 m ahead), so its spire rises well clear of the bunting and closes the street as a landmark. | Keep. |
| [087 · No hidden bollards](087-no-hidden-bollards.jpg) | No visible change: the bollards stood behind the race barriers where no rider could see them, so they go (and a trial gilt band on them with them), about a hundred meshes fewer. | No visible change. |
| [088 · Bunting cords](088-bunting-cords.jpg) | The pennants hang from a visible cord, and each pennant tilts with the cord's sag instead of hanging square. | Keep. |
| [089 · Trailing baskets](089-trailing-baskets.jpg) | Ivy trails out over each hanging basket's rim and down (a first, pointed cone read as a strawberry and was flattened). | The first cone read as a strawberry, so it was flattened. |
| [090 · Spectator hair](090-spectator-hair.jpg) | Every bare-headed spectator gets hair, from black and browns to fair, grey and auburn. | Keep. |
| [091 · Lit shops](091-lit-shops.jpg) | Shop windows glow from inside: an emissive map lights only the glass, warmest low down where the shop's lamps fall. | Keep. |
| [092 · Gable finials](092-gable-finials.jpg) | Each step of a stepped gable carries stone balls on its outer corners. | Keep. |
| [093 · Window boxes 3d](093-window-boxes-3d.jpg) | Houses that keep flowers set a real terracotta window box on every upper sill, geraniums spilling over its front. | Keep. |
| [094 · Damp gutters](094-damp-gutters.jpg) | A damp line darkens the setts against each kerb, glossier than the dry road, broken where the water has run off; drawing both faces of the ribbon also brings the corner shade of 075 to the left-hand pavement, which had been culled. | Subtle. It also fixed 075. |
| [095 · Chimney pots](095-chimney-pots.jpg) | Each chimney stack carries two clay pots on its cap (seen on the distant roofs; the near ones hide behind their cornices). | The near pots hide behind their cornices. |
| [096 · Iron covers](096-iron-covers.jpg) | Cast-iron covers lie in the setts a few times a lap, a raised ring round a cross-hatched field lettered EAU. | Keep. |
| [097 · Belfry](097-belfry.jpg) | A parish church's brick belfry rises over the roofs to the left 260 m ahead, a louvred bell stage under a slate spire, so the skyline has two spires (first placed to the right, where the near roofs hid it). | Moved left, where the roofs no longer hide it. |
| [098 · Golden light](098-golden-light.jpg) | The sun warms to a golden 0xffe2b6 and strengthens a little against a softer fill, deepening the contrast between the sunlit and shaded sides of the street. | Keep. |
| [099 · Tv board](099-tv-board.jpg) | The TV moto carries a blue TV board on its back, facing the riders, and an amber beacon on its mast. | Keep. |
| [100 · Vinyl banners](100-vinyl-banners.jpg) | The barrier banners take a printed-vinyl sheen that catches the low sun (subtle from the saddle). | Subtle. |
| [101 · Awning colours](101-awning-colours.jpg) | Shop awnings come in seven colours instead of five, adding teal and ochre; the far shops on the right change from red to ochre. | Keep. |
| [102 · Fan colours](102-fan-colours.jpg) | The crowd's shirts add the race's volt and two club colours, sky blue and pink, livening the barriers. | Keep. |

The baseline is followed by 102 captured iterations (001 to 102). Iterations 050 and 087 change performance and leave the frame unchanged. That leaves 100 distinct visual iterations.

Old Town is now built in 3D. The street is [OldTownStreet](../../../frontend/projects/wattzup/src/app/core/world-oldtown.ts). Its houses are procedural, from seeded palettes, canvas textures and per-house detail sequences. Each house's parts are merged into one mesh per material (050). The street furniture, crowd, bunting, cathedral, belfry and TV motorbike recycle along a 420 m loop, following the road's height.

The riders are built by [CyclistKit](../../../frontend/projects/wattzup/src/app/core/world-cyclist.ts), with crank-driven two-bone legs. [ThreeWorldRenderer](../../../frontend/projects/wattzup/src/app/core/world-renderer.ts) adds Old Town's look and lighting, the setts' relief (technique 3), the pacers at their gaps (L2-107 AC7, `pacersOnRoad` in [pacers.ts](../../../frontend/projects/wattzup/src/app/core/pacers.ts)) and contact shadows (technique 37). The photo façade atlas is no longer used and has been removed.

The panorama and every other asset are awaited before the first frame, because a stationary ride does not redraw.

## Reproducing the captures

1. Start the app with `npm start` from `frontend/` if port 4200 is idle. Use Chromium at 1440 × 900 for comparison with the existing captures.
2. Open `http://localhost:4200/classes/30-minute-hiit-cardio?simulate`. Click **Ride in Old Town Criterium** and wait for the URL to end in `/world`. Direct navigation without an active ride redirects to the class page.
3. Keep the initial camera and ride position comparable across passes. Wait for the scene to draw with its assets, inspect the browser console for errors, then save a full-page viewport capture. This machine used Three.js’s WebGL2 fallback. A successful texture request alone previously produced a screenshot with an empty scene.
4. Use consecutive filenames beginning with the iteration number. Keep an entry here stating what changed, what the frame showed, and what to keep or revise. Capture each distinct rendering change. Reloads, camera motion over unchanged geometry and repeated screenshots do not establish additional design iterations.
5. Headless Chromium captures a WebGPU canvas as black. Launch it with `--enable-gpu --ignore-gpu-blocklist` and hide `navigator.gpu` in an init script to capture the WebGL2 path at the high tier, as captures 003 onwards were. To see the ultra tier, copy the WebGPU canvas into a 2D canvas.
6. If still available on this machine, `/tmp/wz-facade-check.cjs` contains the Playwright navigation used for the initial façade check. It has a fixed output path for iteration 001. Copy it and change that path before running another pass. Run the copy with `frontend/` as the working directory.

## Possible next passes

- Ride to the first effort and review the arch from 038 in motion.
- Ride a full lap of the 420 m loop to check the recycled house boundaries and the far fade.
- Barrier feet, spectators' hands and faces, and tree-lined squares would add detail at chase distance.
- The street draws about 1,500 meshes. Instancing the lamps and riders' static parts would leave more frame budget for the ultra tier.
- Visual sweeps and baselines were not run or updated (AGENTS.md: a person asks for them).

## Delivery

Review the baseline, each numbered capture and the final live route. Confirm at least 100 distinct iterations plus the baseline. Run `node tools/verify/verify.mjs` from the repository root before pushing. Stage the renderer, intended assets, screenshots and accompanying changes, then commit, push, open the PR, check CI, merge and verify GitHub reports it merged. Include the baseline and final screenshot links in the PR so the visual change is easy to review.

The work merged in [#46](https://github.com/QuinntyneBrown/wattzup/pull/46). [The final capture](final-merged.jpg) was taken from `main` after the merge, at the same camera position and ride state as the numbered captures. It matches [102 · Fan colours](102-fan-colours.jpg).

## Bends and elevation

A second pass of 100 iterations, each one fix to how the road bends and climbs (L2-101 AC6, L2-110 AC9), each merged on its own. Every capture is the same ride: Old Town Criterium, `?simulate`, the clock moved on to the first cobbled sprint, 1440 × 900.

| Capture | Fix |
| --- | --- |
| [001 · Heights between road points](bend-001-smooth-heights.jpg) | Anything laid along the road (houses, lamps, pacers, the arch) took the height of the nearest 2 m road point, so on a 6% ramp it rose in 12 cm steps as it came towards the rider. It now takes the height between the two points either side. |
| [002 · Heights behind the rider](bend-002-heights-behind.jpg) | Everything behind the rider took the height under the rider, so on a climb the crowd, lamps and barriers beside the camera floated above the road behind. Behind the rider the height now runs back down the grade, as the road there is laid. |
| [003 · Normals turn with the bend](bend-003-bent-normals.jpg) | The bend moved every vertex onto the curving road but left its normal as it was on the straight road, so a façade 20° round a bend was lit as if it still ran straight. The vertex stage now turns each normal by the road's heading there, about the up axis. |
| [004 · Bikes pitched on the gradient](bend-004-pitched-bikes.jpg) | The rider and the pacers rode level whatever the gradient, their wheels cutting into a ramp. Each bike now pitches with the road under it: nose up on a climb and down on a descent. |
| [005 · Grade eased by time, not frames](bend-005-eased-grade.jpg) | The grade under the rider eased 2% of the way each frame: three times faster than the road ahead was laid at 60 fps, and twice as fast again at 120 fps, so the bike ran onto the ramp before the road showed it. It now eases 0.12 of the way a second ridden, as the road ahead does. |
| [006 · Riders lean into bends](bend-006-lean-into-bends.jpg) | The rider and pacers rode bolt upright round every bend. Each now leans into the bend it is riding through, until gravity balances the turn: atan(v² κ / g), right on a right-hander. |
| [007 · Camera over the road behind](bend-007-camera-height.jpg) | The chase camera rode at a fixed 2.1 m whatever the road did, so on a climb it hung a third of a metre too high over the road behind the rider. It now rides 2.1 m over the road under it. |
| [008 · The sun holds still as the road turns](bend-008-sun-holds-still.jpg) | The sun was fixed to the rider's view, so it turned with them through every bend and the houses' shadows never moved across the street. The key light and the sky's sun now stay where they are in the world: round a right-hander the sun swings left across the view and the shadows swing with it. |
| [009 · Pacers take the racing line](bend-009-racing-line.jpg) | The pacers held their lanes round every bend as if on rails. Each now cuts towards the inside of the bend it rides through, by the bend's curvature, up to a metre and never into the gutter; a pacer beside the rider holds their lane. |
| [010 · Far houses climb on](bend-010-far-houses-climb.jpg) | Past the end of the laid road (300 m) every height stopped at the road's last point, so on a climb the houses from 300 to 396 m stood level and the street's far end flattened. The street now climbs on there at the road's last grade. |
| [011 · Lean and pedal rock together](bend-011-lean-and-rock.jpg) | The bend lean of 006 and the bike's rock under each pedal stroke both set the same roll, so the pacers' lean was overwritten every frame and the rider's lean stopped their bike rocking. The pose now takes the lean and rocks about it. |
| [012 · Out of the saddle on the ramps](bend-012-out-of-the-saddle.jpg) | Every rider stayed seated on the steepest cobbled kick. From 4% they now rise out of the saddle, standing fully by 7%: the body pivots forward about the hands on the hoods, the hips lift and the bike swings wider under each pedal stroke. |
