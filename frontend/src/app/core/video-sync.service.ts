// Keeps the ride-along video on the ride's target position (L2-076 criteria 3, 4 and 10, ADR 0012).
// Provided by RidePage; RideVideo mounts the player into it. The live state is the only clock.
import { DOCUMENT, DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import type { RideVideo } from './api-types';
import { LiveStateService } from './live-state.service';
import { syncAction, targetPosition } from './video-sync';
import { type PlayerHandle, YOUTUBE_PLAYER } from './youtube-player';

@Injectable()
export class VideoSync {
  private readonly live = inject(LiveStateService);
  private readonly players = inject(YOUTUBE_PLAYER);
  private readonly document = inject(DOCUMENT);
  private readonly handle = signal<PlayerHandle | null>(null);
  private readonly visible = signal(this.document.visibilityState !== 'hidden');
  /** Set when the page is shown again: the next action seeks to the target first. */
  private resync = false;
  private mounted = 0;

  constructor() {
    const onVisibility = () => {
      const shown = this.document.visibilityState !== 'hidden';
      if (shown && !this.visible()) this.resync = true;
      this.visible.set(shown);
    };
    this.document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('visibilitychange', onVisibility);
      this.unmount();
    });
    effect(() => this.apply());
  }

  /** Builds the player for `video` in `host`, replacing any earlier one. */
  async mount(host: HTMLElement, video: RideVideo): Promise<void> {
    this.unmount();
    const ticket = ++this.mounted;
    const workout = untracked(() => this.live.state()?.workout);
    const start = workout ? targetPosition(video, workout) : video.start_seconds;
    try {
      const handle = await this.players.create(host, video.video_id, start);
      if (ticket !== this.mounted) return handle.destroy();
      this.handle.set(handle);
    } catch {
      // The player did not load; the ride carries on without it.
    }
  }

  unmount(): void {
    this.mounted++;
    this.handle()?.destroy();
    this.handle.set(null);
  }

  private apply(): void {
    const handle = this.handle();
    const workout = this.live.state()?.workout;
    const video = workout?.plan.video;
    if (!handle || !workout || !video) return;
    const player = handle.state();
    const visible = this.visible();
    untracked(() => {
      const target = targetPosition(video, workout);
      const action = syncAction({
        status: workout.status,
        player,
        position: handle.currentTime(),
        target,
        visible,
        resync: this.resync,
      });
      if (visible) this.resync = false;
      if (action === 'play-at') {
        handle.seek(target);
        handle.play();
      } else if (action === 'pause-at') {
        handle.pause();
        handle.seek(target);
      } else if (action === 'seek') {
        handle.seek(target);
      }
    });
  }
}
