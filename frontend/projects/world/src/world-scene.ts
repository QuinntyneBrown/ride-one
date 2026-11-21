import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  type Backend,
  type SceneRider,
  type Segment,
  WORLD_RENDERER,
  type WorldRenderer,
} from '@telo/api';
import { FrameScheduler } from './frame-scheduler';
import { worldForMap } from './map-world';
import { MotionPreference } from './motion-preference';
import { timedSegments } from './timed-segments';
import { SceneDriver } from './scene-driver';

/**
 * The map's world drawn under the race HUD (L2-064, L2-065), `main`'s dashboard/world-scene. It loads the renderer on
 * first render, draws on the app's frame loop, emits `started` with the GPU API drawing it, and emits `unavailable`
 * once when it cannot draw. The race scene around it is one image for assistive technology, so the canvas is not
 * another (the race mock).
 */
@Component({
  selector: 'wz-world-scene',
  templateUrl: './world-scene.html',
  styleUrl: './world-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldScene implements AfterViewInit {
  /** The map's world (`MapDto.world`). */
  readonly worldId = input.required<string>();
  readonly segments = input.required<readonly Segment[]>();
  readonly elapsed = input.required<number>();
  readonly speedKmh = input.required<number | null>();
  readonly running = input.required<boolean>();
  /** The race's other riders, drawn at their places in their jerseys (L2-064 AC3); none outside a race. */
  readonly riders = input<readonly SceneRider[] | undefined>(undefined);
  /** Emitted once when WebGL is unavailable or the renderer fails to start (L2-110 AC4). */
  readonly unavailable = output<void>();
  /** Emitted once the renderer has started, with the GPU API drawing the world (L2-065 AC1). */
  readonly started = output<Backend>();

  private readonly load = inject(WORLD_RENDERER);
  private readonly frames = inject(FrameScheduler);
  private readonly motion = inject(MotionPreference);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  /**
   * Set once the scene has started. Until then the canvas is busy and unseen: the load draws
   * hidden parts from a camera no frame has placed yet (L2-111 AC12, #896).
   */
  protected readonly driver = signal<SceneDriver | null>(null);
  /** True while the display's frame period is measured again: the scene holds its picture. */
  private readonly measuring = signal(false);

  private readonly world = computed(() => worldForMap(this.worldId()));
  /** The plan's segments with their start seconds, as `main`'s scene reads them. */
  private readonly timed = computed(() => timedSegments(this.segments()));

  private startOnView: () => void = () => undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let renderer: WorldRenderer | null = null;
    let stop: (() => void) | null = null;
    let observer: ResizeObserver | null = null;
    let screen: MediaQueryList | null = null;
    let destroyed = false;

    // The tab's return or another screen may change the display's refresh rate: measure it
    // again, judging and drawing nothing meanwhile (L2-111 AC9).
    const remeasure = () => {
      const r = renderer;
      if (!r || destroyed || untracked(this.measuring)) return;
      r.pauseBudget();
      this.measuring.set(true);
      void this.frames.measurePeriod().then((period) => {
        if (destroyed) return;
        r.setFramePeriod(period);
        this.measuring.set(false);
      });
    };
    const onVisibility = () => {
      if (!document.hidden) remeasure();
    };
    const onScreen = () => {
      watchScreen();
      remeasure();
    };
    const watchScreen = () => {
      screen?.removeEventListener('change', onScreen);
      screen = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      screen.addEventListener('change', onScreen);
    };
    destroyRef.onDestroy(() => {
      destroyed = true;
      stop?.();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      screen?.removeEventListener('change', onScreen);
      renderer?.dispose();
    });

    // Started once the view is in place: `ngAfterViewInit` rather than `main`'s `afterNextRender`, whose render hooks
    // would grow the initial bundle (L72, L77).
    this.startOnView = () => {
      const canvas = this.canvas().nativeElement;
      // The display's frame period is measured before the scene's own work can slow it
      // (L2-111 AC9).
      void Promise.all([this.load(), this.frames.measurePeriod()])
        .then(async ([loaded, period]) => {
          const started = await loaded.start(
            canvas,
            untracked(this.world),
            () => this.frames.nextFrame(),
            untracked(this.timed),
          );
          if (started) loaded.setFramePeriod(period);
          return { loaded, started };
        })
        .then(
          ({ loaded, started }) => {
            if (destroyed) {
              loaded.dispose();
              return;
            }
            if (!started) {
              loaded.dispose();
              this.unavailable.emit();
              return;
            }
            renderer = loaded;
            const resize = () =>
              loaded.resize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio);
            resize();
            observer = new ResizeObserver(resize);
            observer.observe(canvas);
            document.addEventListener('visibilitychange', onVisibility);
            watchScreen();
            this.driver.set(new SceneDriver(loaded));
            this.started.emit(loaded.backend);
          },
          () => {
            if (!destroyed) this.unavailable.emit();
          },
        );
    };

    // The loop runs only while the ride runs: a paused world holds still (L2-109 AC1), and the
    // app's loop requests no frame while the tab is hidden (L2-110 AC5).
    effect(() => {
      const running = this.driver() !== null && this.running();
      if (running && !stop) stop = this.frames.startLoop();
      if (!running && stop) {
        stop();
        stop = null;
      }
    });

    // One frame per tick of the loop, and one whenever the inputs change.
    effect(() => {
      const driver = this.driver();
      if (!driver || this.measuring()) return;
      const now = this.frames.now();
      driver.frame(now, {
        segments: this.timed(),
        elapsed: this.elapsed(),
        speedKmh: this.speedKmh(),
        running: this.running(),
        reducedMotion: this.motion.reduced(),
        riders: this.riders(),
      });
    });
  }

  ngAfterViewInit(): void {
    this.startOnView();
  }
}
