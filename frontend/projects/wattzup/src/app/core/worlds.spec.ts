import type { SegmentKind, WorldId } from '@wattzup/api';
import { targetGrade, worldById } from './worlds';

// L2-101 AC2: grade[k] + roll × sin(s ÷ 310) × cos(s ÷ 870 + 1), one row per scene.
describe('targetGrade (L2-101)', () => {
  it.each<[WorldId, Record<SegmentKind, number>, number]>([
    ['docklands', { warmup: 0.5, work: 5.5, rest: -2, cooldown: 0, steady: 0 }, 5.610718],
    ['granite', { warmup: 3, work: 8, rest: 3.5, cooldown: -5, steady: 5 }, 8.147624],
    ['oldtown', { warmup: 0.5, work: 6, rest: -1.5, cooldown: 0, steady: 0 }, 6.092265],
    ['prairie', { warmup: 0, work: 1.5, rest: -0.5, cooldown: 0, steady: 0.5 }, 1.68453],
    ['dolomites', { warmup: 1, work: 2, rest: 0, cooldown: -1, steady: 0.8 }, 2.442871],
    ['caribana', { warmup: 0.5, work: 3, rest: -0.5, cooldown: 0, steady: 0.5 }, 3.073812],
    ['southbeach', { warmup: 0.5, work: 4, rest: -1, cooldown: 0, steady: 0.5 }, 4.092265],
    ['westminster', { warmup: 0.5, work: 3.5, rest: -1, cooldown: 0, steady: 0.5 }, 3.592265],
    ['centralpark', { warmup: 0.5, work: 4, rest: -1.5, cooldown: 0, steady: 0.5 }, 4.147624],
    ['ghent', { warmup: 0, work: 1.5, rest: -1, cooldown: 0, steady: 0 }, 1.555359],
    ['blackpool', { warmup: 0, work: 2, rest: -0.5, cooldown: 0, steady: 0.5 }, 2.055359],
    ['suburbia', { warmup: 0, work: 1, rest: -1, cooldown: 0, steady: 0.5 }, 1.110718],
    ['nottinghill', { warmup: 0.5, work: 2.5, rest: -0.5, cooldown: 0, steady: 0.5 }, 2.592265],
    ['knicks', { warmup: 0.5, work: 2.5, rest: -1, cooldown: 0, steady: 0.5 }, 2.610718],
    ['vegas', { warmup: 0, work: 1.5, rest: -0.5, cooldown: 0, steady: 0.5 }, 1.536906],
    ['coast', { warmup: 0.5, work: 4.5, rest: -1.5, cooldown: -0.5, steady: 0.5 }, 4.795247],
  ])('%s asks for its grade per kind at s 0, plus its roll at s 300', (id, grades, workAt300) => {
    const world = worldById(id);
    for (const [kind, grade] of Object.entries(grades)) {
      expect(targetGrade(world, kind as SegmentKind, 0)).toBeCloseTo(grade, 9);
    }
    expect(targetGrade(world, 'work', 300)).toBeCloseTo(workAt300, 5);
  });
});
