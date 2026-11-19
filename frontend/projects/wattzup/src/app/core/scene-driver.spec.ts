import type { Segment } from '@wattzup/api';
import { SceneDriver, type SceneInput } from './scene-driver';
import type { SceneFrame, WorldRenderer } from './world-renderer-port';

class FakeRenderer implements WorldRenderer {
  readonly frames: SceneFrame[] = [];
  start(): boolean {
    return true;
  }
  resize(): void {
    /* not needed */
  }
  draw(frame: SceneFrame): void {
    this.frames.push(frame);
  }
  dispose(): void {
    /* not needed */
  }
}

const segments: Segment[] = [
  { kind: 'steady', start: 0, duration: 600, level: 10, cadence: 80, round: null },
];
const input = (change: Partial<SceneInput> = {}): SceneInput => ({
  segments,
  elapsed: 100,
  speedKmh: 36,
  running: true,
  reducedMotion: false,
  ...change,
});

describe('SceneDriver (L2-098)', () => {
  it('moves the rider at speed_kmh while running', () => {
    const renderer = new FakeRenderer();
    const driver = new SceneDriver(renderer);
    driver.frame(1000, input());
    driver.frame(1100, input());
    // 36 km/h is 10 m/s; 0.1 s later the rider is 1 m on.
    expect(renderer.frames.map((f) => f.s)).toEqual([0, 1]);
  });

  it('holds the rider still while not running', () => {
    const renderer = new FakeRenderer();
    const driver = new SceneDriver(renderer);
    driver.frame(1000, input({ running: false }));
    driver.frame(2000, input({ running: false }));
    expect(renderer.frames.map((f) => f.s)).toEqual([0, 0]);
  });

  it('steps no more than a quarter second after a hidden tab', () => {
    const renderer = new FakeRenderer();
    const driver = new SceneDriver(renderer);
    driver.frame(0, input());
    driver.frame(60_000, input());
    expect(renderer.frames[1]!.s).toBeCloseTo(2.5, 9);
  });

  it('passes the plan, the moment and reduced motion to the renderer', () => {
    const renderer = new FakeRenderer();
    new SceneDriver(renderer).frame(0, input({ reducedMotion: true, speedKmh: null }));
    expect(renderer.frames[0]).toEqual(
      expect.objectContaining({ segments, elapsed: 100, speedKmh: 0, reducedMotion: true }),
    );
  });
});
