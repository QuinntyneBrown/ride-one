import { describe, expect, it } from 'vitest';
import { PowerTraceHistory, TRACE_CAPACITY } from './power-trace-history';

describe('PowerTraceHistory', () => {
  it('restores samples oldest first', () => {
    const h = new PowerTraceHistory();
    h.restore([
      [0, 100],
      [1, 120],
    ]);
    expect(h.length).toBe(2);
    expect(h.last).toBe(1);
    expect(h.watts[1]).toBe(120);
  });

  it('appends the next second with 0 for null power', () => {
    const h = new PowerTraceHistory();
    expect(h.append(0, null)).toBe('appended');
    expect(h.append(1, 317.4)).toBe('appended');
    expect([h.watts[0], h.watts[1]]).toEqual([0, 317]);
  });

  it('ignores a second already held', () => {
    const h = new PowerTraceHistory();
    h.append(5, 100);
    expect(h.append(5, 200)).toBe('unchanged');
    expect(h.length).toBe(1);
  });

  it('asks for a reload on a gap and a reset on a step back', () => {
    const h = new PowerTraceHistory();
    h.append(5, 100);
    expect(h.append(8, 100)).toBe('gap');
    expect(h.append(2, 100)).toBe('restart');
    expect(h.length).toBe(1);
  });

  it('keeps at most 10,800 samples', () => {
    const h = new PowerTraceHistory();
    h.restore(Array.from({ length: TRACE_CAPACITY + 5 }, (_, i) => [i, i % 300]));
    expect(h.length).toBe(TRACE_CAPACITY);
    expect(h.seconds[0]).toBe(5);
    h.append(TRACE_CAPACITY + 5, 10);
    expect(h.length).toBe(TRACE_CAPACITY);
    expect(h.seconds[0]).toBe(6);
    expect(h.last).toBe(TRACE_CAPACITY + 5);
  });
});
