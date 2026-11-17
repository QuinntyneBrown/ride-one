import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { linkError, type VideoDraft } from '../../core/video-link';

/**
 * The ride-along video on the setup screen: the `Ride along to a video` switch and, when on, the
 * YouTube link field with its error (L2-029 criteria 17 and 19, ADR 0012).
 */
@Component({
  selector: 'wz-video-link',
  templateUrl: './video-link.html',
  styleUrl: './video-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoLink {
  readonly draft = model.required<VideoDraft>();
  readonly disabled = input(false);

  protected readonly error = computed(() => linkError(this.draft()));

  protected setOn(on: boolean): void {
    this.draft.update((d) => ({ ...d, on }));
  }

  protected setUrl(url: string): void {
    this.draft.update((d) => ({ ...d, url }));
  }
}
