import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One step-change banner; a new id replays its animation. */
export interface PhaseBannerView {
  id: number;
  headline: string;
  detail: string;
  rest: boolean;
}

/** The big segment-change banner and its polite announcement (L2-027, L2-041). */
@Component({
  selector: 'wz-phase-banner',
  templateUrl: './phase-banner.html',
  styleUrl: './phase-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseBanner {
  readonly banner = input<PhaseBannerView | null>(null);
  readonly announcement = input('');
}
