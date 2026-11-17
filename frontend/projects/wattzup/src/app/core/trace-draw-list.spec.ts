import { describe, expect, it } from 'vitest';
import { PowerTraceHistory } from './power-trace-history';
import { traceDrawList } from './trace-draw-list';
import type { TraceScene } from './trace-geometry';

const scene: TraceScene = {
  title: 'Power vs. plan',
  gridStep: 100,
  maxLabel: '300 W',
  total: 100,
  elapsed: 50,
  yMax: 300,
  blocks: [
    { start: 0, end: 50, value: 150, phase: 'easy', past: true },
    { start: 50, end: 100, value: 300, phase: 'work', past: false },
  ],
  ticks: [],
  planAverage: 225,
  legend: [],
};

describe('traceDrawList', () => {
  it('draws one block per segment at its target height, dimming past ones', () => {
    const list = traceDrawList(scene, new PowerTraceHistory(), 100, 300, 1);
    expect(list.rects).toHaveLength(2);
    expect(list.rects[0]).toMatchObject({ y: 150, h: 150, role: 'easy', alpha: 0.07 });
    expect(list.rects[1]).toMatchObject({ y: 0, h: 300, role: 'work', alpha: 0.13 });
  });

  it('draws grid lines every 100 W below the maximum and a playhead at elapsed', () => {
    const list = traceDrawList(scene, new PowerTraceHistory(), 100, 300, 1);
    expect(list.lines.filter((l) => l.role === 'grid')).toHaveLength(2);
    expect(list.lines.at(-1)).toMatchObject({ role: 'playhead', points: [50, 0, 50, 300] });
  });

  it('draws the actual line and area from the history', () => {
    const h = new PowerTraceHistory();
    h.append(0, 150);
    h.append(1, 300);
    const list = traceDrawList(scene, h, 100, 300, 1);
    expect(list.areas[0].points).toEqual([0.5, 150, 1.5, 0]);
    expect(list.lines.find((l) => l.role === 'actual')?.points).toEqual([0.5, 150, 1.5, 0]);
  });

  it('scales line widths with the pixel ratio and draws nothing at zero size', () => {
    expect(traceDrawList(scene, new PowerTraceHistory(), 100, 300, 2).lines.at(-1)?.width).toBe(4);
    expect(traceDrawList(scene, new PowerTraceHistory(), 0, 0, 1).rects).toEqual([]);
  });
});
