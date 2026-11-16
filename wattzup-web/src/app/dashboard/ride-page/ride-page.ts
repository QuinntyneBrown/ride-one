import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CountdownService } from '../../core/countdown.service';
import { LiveStateService } from '../../core/live-state.service';
import { formatLive } from '../../core/metric-format';
import { powerDelta } from '../../core/power-delta';
import { estimateWatts } from '../../core/plan-expansion';
import { rideViewState } from '../../core/ride-view-state';
import { AppBar } from '../app-bar/app-bar';
import { Interval } from '../interval/interval';
import { MetricsStrip } from '../metrics-strip/metrics-strip';
import { Readout } from '../readout/readout';

/** Route `/`: the ride dashboard. */
@Component({
  selector: 'wz-ride-page',
  imports: [AppBar, Interval, MetricsStrip, Readout],
  providers: [CountdownService],
  templateUrl: './ride-page.html',
  styleUrl: './ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RidePage {
  protected readonly live = inject(LiveStateService);
  protected readonly state = this.live.state;
  protected readonly workout = computed(() => this.state()?.workout ?? null);
  protected readonly view = computed(() =>
    rideViewState(this.state(), this.live.connection(), this.live.loadFailed()),
  );

  protected readonly power = computed(() => {
    const s = this.state();
    const w = s?.workout;
    const segment = w?.segments[w.segment];
    const target = w
      ? (s?.target_power ?? (segment ? estimateWatts(segment.cadence, segment.level) : null))
      : null;
    return {
      value: formatLive(s?.power ?? null),
      target,
      delta: powerDelta(s?.power ?? null, target, w?.status ?? null),
    };
  });

  protected readonly cadence = computed(() => {
    const s = this.state();
    const w = s?.workout;
    const segment = w?.segments[w.segment];
    return {
      value: formatLive(s?.cadence ?? null),
      sub: segment ? `Aim for ${segment.cadence}` : 'No cadence goal',
    };
  });

  constructor() {
    this.live.ensureStarted();
  }
}
