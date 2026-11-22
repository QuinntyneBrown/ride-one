import type { ProgressDto } from '@telo/api';

const XP = new Intl.NumberFormat('en-GB');

/**
 * Profile's line under the headline (docs/mocks/pages/profile/): "760 XP to level 8 · 4-day streak" (L2-038 AC4, L2-042
 * AC4); the streak reads 0 when there is none. At level 30 there is no next level, so the streak stands alone. Rides and
 * kilometres join it with slice 13.3.
 */
export function profileMeta({
  level,
  totalXp,
  nextLevelXp,
  streakDays,
}: Pick<ProgressDto, 'level' | 'totalXp' | 'nextLevelXp' | 'streakDays'>): string {
  const streak = `${streakDays}-day streak`;
  if (nextLevelXp === null) return streak;
  return `${XP.format(nextLevelXp - totalXp)} XP to level ${level + 1} · ${streak}`;
}
