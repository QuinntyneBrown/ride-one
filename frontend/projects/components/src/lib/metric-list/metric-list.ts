import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { BikeState } from '@wattzup/api';
import { formatCount, formatDistance, formatLive, formatSpeed } from '../format/metric-format';
import { formatAvgPace } from '../format/pace';

/** Heart rate, avg power, speed, distance and energy; on the treadmill heart rate, avg pace,
 * distance, climbed and energy (L2-022, L2-071 criterion 7). */
@Component({
  selector: 'wz-metric-list',
  templateUrl: './metric-list.html',
  styleUrl: './metric-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricList {
  readonly state = input<BikeState | null>(null);
  readonly dimmed = input(false);
  readonly treadmill = computed(() => this.state()?.machine === 'treadmill');

  protected readonly metrics = computed(() => {
    const s = this.state();
    if (!s) return null;
    if (s.machine === 'treadmill') {
      return [
        { term: 'Heart rate', value: formatLive(s.heart_rate), unit: 'bpm', heart: true },
        {
          term: 'Avg pace',
          value: formatAvgPace(s.workout?.elapsed_seconds ?? 0, s.distance_km),
          unit: '/km',
          heart: false,
        },
        { term: 'Distance', value: formatDistance(s.distance_km), unit: 'km', heart: false },
        { term: 'Climbed', value: formatCount(s.climb_m), unit: 'm', heart: false },
        { term: 'Energy', value: formatCount(s.kcal), unit: 'kcal', heart: false },
      ];
    }
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
