import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { BikeState } from '../../core/api-types';
import { formatCount, formatDistance, formatLive, formatSpeed } from '../../core/metric-format';

/** Heart rate, avg power, speed, distance and energy (L2-022). */
@Component({
  selector: 'wz-metrics-strip',
  templateUrl: './metrics-strip.html',
  styleUrl: './metrics-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsStrip {
  readonly state = input<BikeState | null>(null);
  readonly dimmed = input(false);

  protected readonly metrics = computed(() => {
    const s = this.state();
    if (!s) return null;
    return [
      { term: 'Heart rate', value: formatLive(s.heart_rate), unit: 'bpm', heart: true },
      { term: 'Avg power', value: formatCount(s.avg_power), unit: 'W', heart: false },
      {
        term: 'Speed',
        value: formatSpeed(s.speed_kmh),
        unit: `km/h · ${formatSpeed(s.speed_mph)} mph`,
        heart: false,
      },
      { term: 'Distance', value: formatDistance(s.distance_km), unit: 'km', heart: false },
      { term: 'Energy', value: formatCount(s.kcal), unit: 'kcal', heart: false },
    ];
  });

  protected readonly terms = ['Heart rate', 'Avg power', 'Speed', 'Distance', 'Energy'];
}
