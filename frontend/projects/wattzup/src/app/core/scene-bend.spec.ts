import { BEND_SAMPLES, bendAhead, bendPoint } from './scene-bend';
import { WORLDS, worldById, type World } from './worlds';

const alpe = worldById('alpe');
const straight: World = { ...alpe, bend: { angle: 0, length: 100 } };
const distance = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z);

describe('bendAhead and bendPoint (L2-101 AC6, L2-110 AC9)', () => {
  it('samples 128 points of centre, heading and curvature', () => {
    expect(bendAhead(alpe, 1234)).toHaveLength(BEND_SAMPLES * 4);
  });

  it('keeps the road under the rider at (0, 0), pointing straight down the view', () => {
    for (const s of [0, 777, 4321]) {
      const samples = bendAhead(alpe, s);
      expect(distance(bendPoint(samples, 0, 0), { x: 0, z: 0 })).toBeLessThan(1e-6);
      expect(distance(bendPoint(samples, 3, 0), { x: 3, z: 0 })).toBeLessThan(1e-6);
      expect(distance(bendPoint(samples, 0, -2), { x: 0, z: -2 })).toBeLessThan(0.05);
    }
  });

  it('leaves the road of a scene with no bend straight', () => {
    const samples = bendAhead(straight, 999);
    for (const x of [-300, -6, 0, 4, 250]) {
      for (const z of [60, 5, 0, -50, -299, -800]) {
        expect(distance(bendPoint(samples, x, z), { x, z })).toBeLessThan(1e-6);
      }
    }
  });

  it('turns the road ahead by the heading of L2-101 AC6, from the heading under the rider', () => {
    const s = 1500;
    const samples = bendAhead(alpe, s);
    const turn = ((alpeHeading(s + 100) - alpeHeading(s)) * Math.PI) / 180;
    const a = bendPoint(samples, 0, -99);
    const b = bendPoint(samples, 0, -101);
    const along = Math.atan2(b.x - a.x, -(b.z - a.z));
    expect(along).toBeCloseTo(turn, 2);
  });

  it('keeps a point on the outside of a bend its distance from the centre line, and one inside no further', () => {
    for (const s of [300, 900, 2500]) {
      const samples = bendAhead(alpe, s);
      for (const m of [40, 120, 220]) {
        const centre = bendPoint(samples, 0, -m);
        for (const x of [-8, -3, 3, 8]) {
          const d = distance(bendPoint(samples, x, -m), centre);
          expect(d).toBeLessThanOrEqual(Math.abs(x) + 1e-6);
          expect(d).toBeGreaterThan(Math.abs(x) * 0.85);
        }
      }
    }
  });

  it('moves little from one frame to the next', () => {
    for (const world of WORLDS) {
      for (const s of [0, 1000, 5000]) {
        const now = bendAhead(world, s);
        const next = bendAhead(world, s + 0.01);
        for (const m of [-40, 0, 100, 300, 460, 2000]) {
          for (const x of [-200, -10, 0, 10, 200]) {
            const d = distance(bendPoint(now, x, -m), bendPoint(next, x, -m));
            expect(d).toBeLessThan(0.2);
          }
        }
      }
    }
  });

  it('eases the heading to 0 past the end of the road, so the far distance is only shifted', () => {
    const samples = bendAhead(alpe, 2222);
    expect(samples[(BEND_SAMPLES - 1) * 4 + 2]).toBeCloseTo(0, 9);
    const a = bendPoint(samples, 0, -1000);
    const b = bendPoint(samples, 50, -1500);
    expect(b.x - a.x).toBeCloseTo(50, 6);
    expect(b.z - a.z).toBeCloseTo(-500, 6);
  });

  it.each(WORLDS.map((w) => [w.id, w] as const))(
    '%s never folds the ground within 400 m of the road back over it',
    (_id, world) => {
      for (const s of [0, 640, 1990, 7300]) {
        const samples = bendAhead(world, s);
        for (let m = -40; m <= 460; m += 6) {
          for (let x = -400; x <= 400; x += 12) {
            const p = bendPoint(samples, x, -m);
            const dx = bendPoint(samples, x + 0.5, -m);
            const dm = bendPoint(samples, x, -m - 0.5);
            // The map's Jacobian keeps the sign it has on the straight road, where across is
            // +x and along is −z: x × (−z) < 0.
            const ax = { x: dx.x - p.x, z: dx.z - p.z };
            const am = { x: dm.x - p.x, z: dm.z - p.z };
            expect(ax.x * am.z - ax.z * am.x).toBeLessThan(0);
          }
        }
      }
    },
  );
});

function alpeHeading(s: number): number {
  const { angle, length } = alpe.bend;
  return angle * Math.sin(s / length) * Math.cos(s / (2.7 * length) + 1);
}
