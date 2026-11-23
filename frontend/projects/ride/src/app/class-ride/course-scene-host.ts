import {
  type ComponentRef,
  DestroyRef,
  Directive,
  ViewContainerRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DISPLAY_PREFERENCES, type Segment } from '@telo/api';
import type { CourseScene } from '@telo/world';

/**
 * The course in Class Ride's box (L2-174 AC1, L2-175 AC1): it imports the `world` library when the ride opens, so
 * neither the library nor Three.js is in Class Ride's own chunk, and a ride with the class video never loads them.
 * When the library has come it creates its `CourseScene` here, which fetches the course's files, draws them and goes,
 * renderer and all, when the rider leaves (L2-174 AC8). A dynamic import and `setInput`, rather than `@defer`, whose
 * runtime would grow the initial bundle.
 */
@Directive({ selector: '[wzCourseScene]' })
export class CourseSceneHost {
  /** The course's name, which names its canvas: "Ibiza Sunset Strip". */
  readonly name = input.required<string>({ alias: 'wzCourseScene' });
  readonly segments = input.required<readonly Segment[]>();
  readonly elapsed = input.required<number>();
  readonly speedKmh = input.required<number | null>();
  readonly running = input.required<boolean>();
  /** Emitted once the course's first frame has been drawn, where the clock puts the rider (L2-175 AC3). */
  readonly drawn = output<void>();
  /** Emitted once when the course's files cannot be loaded or are malformed, or its graphics context is lost for good (L2-175 AC2). */
  readonly unavailable = output<void>();

  private readonly scene = signal<ComponentRef<CourseScene> | null>(null);
  /** Reduced motion as this device asks for it (L2-142). */
  private readonly display = inject(DISPLAY_PREFERENCES);

  constructor() {
    const host = inject(ViewContainerRef);
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => (destroyed = true));
    void import('@telo/world').then((library) => {
      if (destroyed) return;
      const scene = host.createComponent(library.CourseScene);
      untracked(() => this.bind(scene));
      scene.instance.drawn.subscribe(() => this.drawn.emit());
      scene.instance.unavailable.subscribe(() => this.unavailable.emit());
      this.scene.set(scene);
    });
    effect(() => {
      const scene = this.scene();
      if (scene) this.bind(scene);
    });
  }

  /** Hands the scene the ride's inputs; read in the effect, they follow the ride. */
  private bind(scene: ComponentRef<CourseScene>): void {
    scene.setInput('label', this.name());
    scene.setInput('segments', this.segments());
    scene.setInput('elapsed', this.elapsed());
    scene.setInput('speedKmh', this.speedKmh());
    scene.setInput('running', this.running());
    scene.setInput('reducedMotion', this.display.reducedMotion());
  }
}
