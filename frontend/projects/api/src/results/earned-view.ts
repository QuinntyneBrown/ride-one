/** One XP line as Results draws it: "Podium" and "+75". */
export interface XpLineView {
  readonly label: string;
  readonly xp: string;
}

/**
 * The XP panel on Results (L2-074): waiting while the ride is recorded, offline when it waits for a network, not
 * recorded when the backend refused it, or ready with the total ("+442") and each line in the order the backend returned.
 */
export interface XpEarnedView {
  readonly state: 'waiting' | 'offline' | 'notRecorded' | 'ready';
  readonly total: string | null;
  readonly lines: readonly XpLineView[];
}
