import { profileMeta } from './profile-meta';

// Traces to: L2-038 AC4; L2-042 AC4
// Profile's line under the headline: the XP to the next level ("760 XP to level 8") and the streak ("4-day streak"),
// which reads 0 when there is none. At level 30 there is no next level, so the streak stands alone.
describe('profileMeta', () => {
  it('reads the mid rider as 760 XP to level 8 on a 4-day streak', () => {
    expect(profileMeta({ level: 7, totalXp: 1840, nextLevelXp: 2600, streakDays: 4 })).toBe(
      '760 XP to level 8 · 4-day streak',
    );
  });

  it('reads a new rider as 400 XP to level 2 on a 0-day streak', () => {
    expect(profileMeta({ level: 1, totalXp: 0, nextLevelXp: 400, streakDays: 0 })).toBe(
      '400 XP to level 2 · 0-day streak',
    );
  });

  it('groups thousands, as the veteran’s 1,280 XP to level 19', () => {
    expect(profileMeta({ level: 18, totalXp: 9120, nextLevelXp: 10400, streakDays: 21 })).toBe(
      '1,280 XP to level 19 · 21-day streak',
    );
  });

  it('names only the streak at level 30', () => {
    expect(profileMeta({ level: 30, totalXp: 25000, nextLevelXp: null, streakDays: 2 })).toBe(
      '2-day streak',
    );
  });
});
