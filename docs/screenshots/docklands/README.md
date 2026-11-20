# Neon Docklands rendering iterations

The live 3D world behind the ride HUD for [20 Minute Power Intervals](http://localhost:4200/classes/20-minute-power-intervals?simulate), whose class rides Neon Docklands (Harbour Bridges Loop). The composition reference is [the Docklands mock still](../../mocks/assets/world-ride/docklands.webp): a night street between lit towers with neon signs, a harbour skyline to the left, lamps, a raised quay pavement and neon kerb lines. Each iteration is one significant change, captured from the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and merged in its own pull request.

| Capture                          | Change and observed result                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [000 · Initial](000-initial.png) | The panorama behind the road was the mock still itself, with its road, riders and Bridge Ramp arch baked in, floating above a near-black 3D road.                                                                                                                   |
| [001 · Towers](001-towers.jpg)   | The baked panorama is gone. Glass and concrete towers line both sides of the street, recycled along a 640 m loop, with windows lit at random in three façade schemes and neon signs down some faces. The road and rider are still very dark: lighting them is next. |

## Reproducing a capture

Start the app with `npm start` in `frontend/`. Open the class page with `?simulate`, click **Ride in Neon Docklands**, wait for `/world`, let the scene settle for six seconds and capture the viewport at 1440 × 900.
