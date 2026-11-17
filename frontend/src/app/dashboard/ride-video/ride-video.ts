import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import type { RideVideo as Video } from '../../core/api-types';
import { VideoSync } from '../../core/video-sync.service';

/**
 * The `Video` tab panel: hosts the ride-along player and hands it to VideoSync. The page hides it,
 * never removes it, behind `Power vs. plan`, so the video keeps following the ride (L2-076 AC2).
 */
@Component({
  selector: 'wz-ride-video',
  templateUrl: './ride-video.html',
  styleUrl: './ride-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideVideo {
  private readonly sync = inject(VideoSync);
  readonly video = input.required<Video>();
  private readonly videoId = computed(() => this.video().video_id);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  constructor() {
    // Keyed by the id alone: a new state brings a new but equal video every second.
    effect(() => {
      const id = this.videoId();
      const host = this.host().nativeElement;
      untracked(() => void this.sync.mount(host, { ...this.video(), video_id: id }));
    });
  }
}
