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
    ['route66', { warmup: 0.5, work: 3, rest: -1, cooldown: 0, steady: 1 }, 3.221436],
    ['venice', { warmup: 0, work: 1, rest: -0.5, cooldown: 0, steady: 0 }, 1.073812],
    ['amsterdam', { warmup: 0, work: 0.5, rest: -0.5, cooldown: 0, steady: 0 }, 0.527679],
    ['giza', { warmup: 0.3, work: 0.8, rest: -0.6, cooldown: -0.2, steady: 0.3 }, 0.836906],
    ['daytona', { warmup: 0, work: 0.2, rest: 0, cooldown: 0, steady: 0 }, 0.218453],
    ['koppenberg', { warmup: 1, work: 9, rest: -3, cooldown: -2, steady: 1 }, 9.147624],
    ['ventoux', { warmup: 4, work: 7, rest: 5, cooldown: 3, steady: 5 }, 7.276794],
    ['chicago', { warmup: 0, work: 0.3, rest: 0, cooldown: 0, steady: 0 }, 0.318453],
    ['goldengate', { warmup: 0.5, work: 1, rest: -1, cooldown: -0.5, steady: 0 }, 1.221436],
    ['havana', { warmup: 0, work: 0.3, rest: 0, cooldown: 0, steady: 0 }, 0.318453],
    ['seapoint', { warmup: 0.2, work: 0.4, rest: -0.2, cooldown: 0, steady: 0.2 }, 0.436906],
    ['montreal', { warmup: 0, work: 0.3, rest: 0, cooldown: 0, steady: 0 }, 0.318453],
    ['stanleypark', { warmup: 0, work: 0.5, rest: -0.5, cooldown: 0, steady: 0 }, 0.610718],
    ['stelvio', { warmup: 4, work: 8, rest: 6, cooldown: 3, steady: 6 }, 8.276794],
    ['edinburgh', { warmup: 1.5, work: 2.5, rest: 1, cooldown: 0.5, steady: 1.5 }, 2.647624],
    ['northshore', { warmup: 0.5, work: 1.5, rest: 0.5, cooldown: 0, steady: 1 }, 1.610718],
    ['campolongo', { warmup: 4, work: 7, rest: 5, cooldown: 3, steady: 6 }, 7.221436],
    ['marinabay', { warmup: 0.5, work: 1, rest: 0, cooldown: 0, steady: 0.5 }, 1.092265],
    ['serpentine', { warmup: 0, work: 0.4, rest: -0.3, cooldown: 0, steady: 0 }, 0.455359],
    ['champs', { warmup: 0.5, work: 1.5, rest: 0.5, cooldown: 0, steady: 1 }, 1.592265],
    ['tulips', { warmup: 0, work: 0.5, rest: 0, cooldown: 0, steady: 0 }, 0.555359],
    ['tourmalet', { warmup: 4, work: 9, rest: 6, cooldown: 3, steady: 7 }, 9.258342],
    ['napa', { warmup: 0, work: 1.2, rest: -0.6, cooldown: 0, steady: 0 }, 1.310718],
    ['glastonbury', { warmup: 0.5, work: 1, rest: 0, cooldown: 0, steady: 0.5 }, 1.110718],
    ['pikeplace', { warmup: 0.5, work: 1.5, rest: 0, cooldown: -0.5, steady: 1 }, 1.647624],
    ['hardknott', { warmup: 5, work: 12, rest: 7, cooldown: 3, steady: 9 }, 12.295247],
    ['alpe', { warmup: 4, work: 9, rest: 7, cooldown: 3, steady: 7 }, 9.221436],
    ['saguaro', { warmup: 1, work: 2, rest: 0, cooldown: -1, steady: 1.5 }, 2.18453],
    ['trollstigen', { warmup: 3, work: 7, rest: 4, cooldown: 2, steady: 6 }, 7.221436],
    ['poggio', { warmup: 2, work: 3.7, rest: -2, cooldown: 0, steady: 2 }, 3.866077],
    ['montmartre', { warmup: 3, work: 8, rest: 4, cooldown: 2, steady: 5 }, 8.295248],
    ['brickyard', { warmup: 0, work: 0, rest: 0, cooldown: 0, steady: 0 }, 0.036906],
    ['chichen', { warmup: 1, work: 4, rest: 0, cooldown: -1, steady: 2 }, 4.147624],
    ['bonneville', { warmup: 0, work: 0, rest: 0, cooldown: 0, steady: 0 }, 0],
    ['como', { warmup: 0.5, work: 1.5, rest: 0, cooldown: -0.5, steady: 1 }, 1.68453],
    ['yosemite', { warmup: 0.5, work: 2, rest: 0, cooldown: -0.5, steady: 1 }, 2.147624],
    ['etna', { warmup: 3, work: 6, rest: 2, cooldown: 0, steady: 4 }, 6.147624],
    ['timessquare', { warmup: 0, work: 1, rest: 0, cooldown: 0, steady: 0 }, 1.055359],
    ['tremola', { warmup: 4, work: 7, rest: 3, cooldown: 1, steady: 5 }, 7.147624],
    ['teide', { warmup: 3, work: 5, rest: 2, cooldown: 0, steady: 4 }, 5.147624],
    ['monaco', { warmup: 0, work: 2, rest: 0, cooldown: 0, steady: 0 }, 2.092265],
    ['tempelhof', { warmup: 0, work: 0.5, rest: 0, cooldown: 0, steady: 0 }, 0.573812],
    ['paine', { warmup: 1, work: 2.5, rest: 0, cooldown: -0.5, steady: 1.5 }, 2.68453],
    ['coast', { warmup: 0.5, work: 4.5, rest: -1.5, cooldown: -0.5, steady: 0.5 }, 4.795247],
  ])('%s asks for its grade per kind at s 0, plus its roll at s 300', (id, grades, workAt300) => {
    const world = worldById(id);
    for (const [kind, grade] of Object.entries(grades)) {
      expect(targetGrade(world, kind as SegmentKind, 0)).toBeCloseTo(grade, 9);
    }
    expect(targetGrade(world, 'work', 300)).toBeCloseTo(workAt300, 5);
  });
});
