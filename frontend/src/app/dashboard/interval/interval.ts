import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { WorkoutSnapshot } from '../../core/api-types';
import { CountdownService } from '../../core/countdown.service';
import { CueDirector } from '../../core/cue-director';
import { kindLabel, nextLabel, roundLabel, toneOf } from '../../core/segment-labels';

/** The interval card: segment kind and round, time left, progress and next (L2-024, L2-025). */
@Component({
  selector: 'wz-interval',
  imports: [RouterLink],
  templateUrl: './interval.html',
  styleUrl: './interval.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Interval {
  readonly workout = input<WorkoutSnapshot | null>(null);
  readonly loading = input(false);
  protected readonly countdown = inject(CountdownService);
  protected readonly cues = inject(CueDirector);

  protected readonly segment = computed(() => {
    const w = this.workout();
    const s = w?.segments[w.segment];
    if (!w || !s) return null;
    return {
      label: kindLabel(s.kind),
      tone: toneOf(s.kind),
      round: roundLabel(s, w.segments),
      next: nextLabel(w.segments, w.segment),
    };
  });

  protected readonly percent = computed(() => Math.round(this.countdown.progress() * 100));
  protected readonly barWidth = computed(() => `${(this.countdown.progress() * 100).toFixed(2)}%`);
}
