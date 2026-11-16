import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CueDirector } from '../../core/cue-director';

/** The big segment-change banner and its polite announcement (L2-027, L2-041). */
@Component({
  selector: 'wz-phase-banner',
  templateUrl: './phase-banner.html',
  styleUrl: './phase-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseBanner {
  protected readonly cues = inject(CueDirector);
}
