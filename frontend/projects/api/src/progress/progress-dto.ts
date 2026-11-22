/**
 * The rider's standing from `GET /api/progress` (docs/detailed-designs/home/show-the-app-header): their level, total XP
 * and the next level's threshold, `null` at level 30 (L2-038), and their streak in days (L2-042).
 */
export interface ProgressDto {
  readonly level: number;
  readonly totalXp: number;
  readonly nextLevelXp: number | null;
  readonly streakDays: number;
}

/** The header's level link (L2-032 AC2): the badge's level, the XP label, the accessible name and the bar's fill. */
export interface LevelView {
  readonly level: number;
  /** "1,840 / 2,600 XP". */
  readonly label: string;
  /** "Level 7, 1840 of 2600 XP". */
  readonly ariaLabel: string;
  /** From 0 to 100. */
  readonly fillPercent: number;
}
