import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WORLD_RENDERER, type WorldRenderer } from '../../core/world-renderer-port';
import { WORLDS } from '../../core/worlds';
import { WorldScene } from './world-scene';

/** A fake requestAnimationFrame clock: `refresh(ms)` runs one display refresh `ms` later. */
function fakeFrames() {
  let now = 0;
  let next = 0;
  let queue = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.set(++next, cb);
    return next;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => queue.delete(id));
  return {
    refresh(ms: number) {
      now += ms;
      const due = queue;
      queue = new Map();
      for (const cb of due.values()) cb(now);
    },
  };
}

/** Records what the scene asks of its renderer, in order. */
class FakeRenderer implements WorldRenderer {
  readonly calls: string[] = [];
  start(): Promise<boolean> {
    this.calls.push('start');
    return Promise.resolve(true);
  }
  resize(): void {
    /* not needed */
  }
  draw(): void {
    /* not needed */
  }
  setFramePeriod(ms: number): void {
    this.calls.push(`period ${ms.toFixed(1)}`);
  }
  dispose(): void {
    /* not needed */
  }
}

describe('WorldScene frame period (L2-111 AC9)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('measures the display before the scene starts, then hands the renderer the period', async () => {
    const frames = fakeFrames();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          /* not needed */
        }
        disconnect() {
          /* not needed */
        }
      },
    );
    const renderer = new FakeRenderer();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WORLD_RENDERER, useValue: () => Promise.resolve(renderer) },
      ],
    });
    const fixture = TestBed.createComponent(WorldScene);
    fixture.componentRef.setInput('world', WORLDS[0]);
    fixture.componentRef.setInput('segments', []);
    fixture.componentRef.setInput('elapsed', 0);
    fixture.componentRef.setInput('speedKmh', null);
    fixture.componentRef.setInput('running', false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(renderer.calls).toEqual([]);
    for (let i = 0; i < 31; i++) frames.refresh(1000 / 30);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));

    expect(renderer.calls).toEqual(['start', 'period 33.3']);
  });
});
