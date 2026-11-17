// The metric list under the trace: heart rate, avg power, speed, distance and energy on the bike;
// heart rate, avg pace, distance, climbed and energy on the treadmill (L2-022, L2-071 AC7).
import type { BikeState } from '@wattzup/api';
import type { MetricItem } from '@wattzup/components';
import { formatCount, formatDistance, formatLive, formatSpeed } from './metric-format';
import { formatAvgPace } from './pace';

/** The items to show, or null while there is no state yet. */
export function metricItems(s: BikeState | null): MetricItem[] | null {
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
}
