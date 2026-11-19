import type { Segment } from '@wattzup/api';
import { nextArch, roadAhead } from './scene-road';
import { targetGrade, worldById } from './worlds';

const seg = (kind: Segment['kind'], start: number, duration: number): Segment => ({
  kind,
  start,
  duration,
  level: 10,
  cadence: 80,
  round: kind === 'work' || kind === 'rest' ? 1 : null,
});

const plan: Segment[] = [
  seg('warmup', 0, 300),
  seg('work', 300, 30),
  seg('rest', 330, 60),
  seg('cooldown', 390, 120),
];
const oldTown = worldById('oldtown');

describe('nextArch (L2-098 AC2)', () => {
  it("stands where the next work segment starts, with the world's effort name", () => {
    // 10 s to go at 5 m/s.
    expect(nextArch(oldTown, plan, 290, 5)).toEqual({ label: 'Cobbled sprint', metres: 50 });
  });

  it('is absent when the next segment is not work', () => {
    expect(nextArch(oldTown, plan, 310, 5)).toBeNull();
  });

  it('reads Finish at the end of the last segment', () => {
    expect(nextArch(oldTown, plan, 500, 4)).toEqual({ label: 'Finish', metres: 40 });
  });

  it('floors the speed at 3 m/s, so a stopped rider still sees it ahead', () => {
    expect(nextArch(oldTown, plan, 290, 0)).toEqual({ label: 'Cobbled sprint', metres: 30 });
  });
});

describe('roadAhead (L2-098 AC1)', () => {
  it('eases towards the target grade of the segment the rider will be in', () => {
    // 2 m steps at 5 m/s: step 30 (60 m) is reached at 302 s, inside the work segment.
    const road = roadAhead(oldTown, plan, { t: 290, s: 1000, speed: 5, grade: 0.5 }, 40);
    expect(road).toHaveLength(41);
    expect(road[0]).toEqual({ metres: 0, height: 0, grade: 0.5 });
    const before = road[20]!.grade;
    const after = road[40]!.grade;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThan(targetGrade(oldTown, 'work', 1080));
  });

  it('raises the road by grade ÷ 100 × 2 m each step', () => {
    const road = roadAhead(oldTown, plan, { t: 0, s: 0, speed: 5, grade: 0.5 }, 3);
    for (let i = 1; i < road.length; i++) {
      expect(road[i]!.height - road[i - 1]!.height).toBeCloseTo((road[i]!.grade / 100) * 2, 9);
    }
  });
});
