import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CLASS_API, type ClassEntry } from '@wattzup/api';
import { WorldRide } from '@wattzup/components';
import { CountdownService } from '../../core/countdown.service';
import { formatDuration } from '../../core/format-duration';
import { LiveStateService } from '../../core/live-state.service';
import { ResistanceCommandService } from '../../core/resistance-command.service';
import { stepLevel } from '../../core/resistance-controls';
import { RideActions } from '../../core/ride-actions';
import { worldRideAccess } from '../../core/world-ride-access';
import { worldRideView } from '../../core/world-ride-view';
import { worldById } from '../../core/worlds';
import { ClassNotFound } from '../class-not-found/class-not-found';

type Phase = 'loading' | 'ready' | 'not-found';

/**
 * Route `/classes/:id/world`: the ride in progress of class `:id` in that class's scene. It reads
 * the class and the live state, and drives the ride through the dashboard's commands (L2-090).
 */
@Component({
  selector: 'wz-world-ride-page',
  imports: [ClassNotFound, WorldRide],
  templateUrl: './world-ride-page.html',
  styleUrl: './world-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CountdownService],
})
export class WorldRidePage {
  /** The route's `:id`. */
  readonly id = input.required<string>();

  private readonly classes = inject(CLASS_API);
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly live = inject(LiveStateService);
  private readonly actions = inject(RideActions);
  private readonly resistance = inject(ResistanceCommandService);
  private readonly timer = inject(CountdownService);

  protected readonly phase = signal<Phase>('loading');
  private readonly entry = signal<ClassEntry | null>(null);
  /** Decided once, when the class and the first state are both in (L2-090 AC3, AC4). */
  private readonly shown = signal(false);

  private readonly world = computed(() => {
    const id = this.entry()?.world;
    return id ? worldById(id) : null;
  });

  protected readonly view = computed(() => {
    const state = this.live.state();
    const entry = this.entry();
    const world = this.world();
    return this.shown() && state && entry && world ? worldRideView(state, entry, world) : null;
  });

  protected readonly clock = computed(() => ({
    elapsed: this.timer.elapsedText(),
    total: formatDuration(this.live.state()?.workout?.total_seconds ?? 0),
  }));

  protected readonly countdown = computed(() => {
    const w = this.live.state()?.workout;
    const duration = w?.segments[w.segment]?.duration ?? 0;
    const left = this.timer.wholeLeft();
    return {
      left: this.timer.remainingText(),
      ridden: Math.max(0, Math.min(duration, duration - left)),
      duration,
      width: `${(this.timer.progress() * 100).toFixed(2)}%`,
    };
  });

  protected readonly reconnecting = this.actions.reconnecting;

  protected readonly classHref = computed(() => `/classes/${encodeURIComponent(this.id())}`);

  constructor() {
    this.live.ensureStarted();
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
    // The state held when the page opens may predate the ride just started from the class page, so
    // it can show the ride but only a state that arrives after opening sends the rider away.
    const openedAt = untracked(this.live.lastStateAt);
    effect(() => {
      const entry = this.entry();
      const state = this.live.state();
      const fresh = this.live.lastStateAt() !== openedAt;
      if (!entry || !state || untracked(this.shown)) return;
      if (worldRideAccess(this.id(), entry, state.workout) === 'show') {
        this.shown.set(true);
      } else if (fresh) {
        void this.router.navigateByUrl(untracked(this.classHref), { replaceUrl: true });
      }
    });
    // A ride too short to save leaves for the dashboard when it ends (L2-097 AC5).
    effect(() => {
      const w = this.live.state()?.workout;
      if (!this.shown() || !w || w.session_id) return;
      if (w.status === 'ended' || w.status === 'ended: bike shut off') {
        untracked(() => void this.router.navigateByUrl('/'));
      }
    });
  }

  private async load(id: string): Promise<void> {
    this.phase.set('loading');
    try {
      const entry = await this.classes.get(id);
      if (entry === 'not-found') {
        this.phase.set('not-found');
        this.title.setTitle('Class not found · Wattzup');
        return;
      }
      this.entry.set(entry);
      if (entry.world) this.title.setTitle(worldById(entry.world).name);
      this.phase.set('ready');
    } catch {
      this.phase.set('not-found');
    }
  }

  protected togglePause(): void {
    void (this.view()?.paused ? this.actions.resume() : this.actions.pause());
  }

  /** − or + sends the level one lower or higher (L2-096 AC2, L2-047). */
  protected step(delta: -1 | 1): void {
    void this.resistance.set(stepLevel(this.live.state(), delta));
  }

  protected end(): void {
    this.actions.end();
  }

  protected navigate(href: string): void {
    void this.router.navigateByUrl(href);
  }

  /** `See your ride` opens the summary as just finished (L2-085 AC2). */
  protected openSession(href: string): void {
    void this.router.navigateByUrl(href, { state: { justFinished: true } });
  }

  protected reconnect(): void {
    void this.actions.reconnect();
  }
}
