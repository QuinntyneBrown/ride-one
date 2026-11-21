import type { PackStrengthId, RaceMode } from '@telo/api';

/** How a race starts from Race Setup: the start button's label, and the route and query parameters it opens. */
export interface RaceStart {
  readonly label: string;
  readonly route: readonly string[];
  readonly queryParams: Readonly<Record<string, string>>;
}

/**
 * Turns Race Setup's choice into its start (L2-050): Your best time reads "Start ride" and opens the race solo, at once;
 * Bots reads "Go to the start line" and carries the pack; Riders online reads "Find a race" and opens the lobby once
 * seated. The mode and pack travel as query parameters, so the race can be reloaded and Leave can return to the same
 * choice. Until the lobby (slice 15.1), Bots opens the race at once too.
 */
export const RaceStartPlanner = {
  plan(mapId: string, mode: RaceMode, pack: PackStrengthId): RaceStart {
    switch (mode) {
      case 'solo':
        return { label: 'Start ride', route: ['/race', mapId, 'ride'], queryParams: { mode } };
      case 'bots':
        return {
          label: 'Go to the start line',
          route: ['/race', mapId, 'ride'],
          queryParams: { mode, pack },
        };
      case 'online':
        return { label: 'Find a race', route: ['/race', mapId, 'lobby'], queryParams: { mode } };
    }
  },
};
