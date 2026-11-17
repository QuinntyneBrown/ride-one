// The phase banner's lines and the polite announcement (L2-027, L2-041); in km/h on the treadmill
// (L2-071 criterion 19).
import { formatDuration } from '@wattzup/components';
import type { SegmentChange } from './segment-change-detector';
import { kindLabel } from './segment-labels';

const kmh = (speed: number): string => `${speed.toFixed(1)} km/h`;

/** The segment's target: its level on the bike, its speed on the treadmill. */
function target(t: { level: number | null; speed: number | null }): string {
  return t.speed !== null ? kmh(t.speed) : String(t.level);
}

/** The banner's target: on the treadmill the speed and the incline (L2-071 criterion 19). */
function headlineTarget(t: {
  level: number | null;
  speed: number | null;
  incline?: number | null;
}) {
  const value = target(t).toUpperCase();
  return t.speed !== null ? `${value} · ${t.incline ?? 0}%` : value;
}

export function bannerText(c: SegmentChange): { headline: string; detail: string } {
  const time = formatDuration(c.duration);
  const value = headlineTarget(c);
  if (c.kind === 'work') {
    return {
      headline: `WORK · ${value} · GO!`,
      detail: `Round ${c.round} of ${c.rounds} · ${time}`,
    };
  }
  const headline = `${kindLabel(c.kind).toUpperCase()} · ${value}`;
  if (!c.next) return { headline, detail: `${time} · last stretch` };
  return { headline, detail: `${time} · next: ${kindLabel(c.next.kind)} at ${target(c.next)}` };
}

function spoken(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (m > 0) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  if (s > 0 || m === 0) parts.push(`${s} ${s === 1 ? 'second' : 'seconds'}`);
  return parts.join(' ');
}

export function announcement(c: SegmentChange): string {
  if (c.speed !== null) {
    return `${kindLabel(c.kind)}, ${kmh(c.speed)}, incline ${c.incline ?? 0}%, ${spoken(c.duration)}`;
  }
  return `${kindLabel(c.kind)}, resistance ${c.level}, ${spoken(c.duration)}`;
}
