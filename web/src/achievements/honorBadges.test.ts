// One badge per honors and one for the diploma: in the catalog, with real art, unlocked from the finished set.
import { describe, expect, it, vi } from 'vitest';

const unlocked: string[] = [];
vi.mock('./store', () => ({
  unlockAchievement: (id: string) => unlocked.push(id),
  progress: () => {},
  remember: () => Promise.resolve([]),
  countOccurrence: () => Promise.resolve(),
  currentAchievements: () => ({ unlocked: {}, progress: {}, sets: { finished: ['graduation-basics', 'graduation-diploma', 'teddy'] } }),
  loadAchievements: () => Promise.resolve(undefined),
}));

import { ACHIEVEMENTS, achievementById } from './catalog';
import { badgeSource } from './badgeArt';
import { CEREMONIES, DIPLOMA } from '../project/ceremonies';
import { refreshGoals } from './goals';

describe('honors badges', () => {
  it('has seven, each with its own art', () => {
    const list = ACHIEVEMENTS.filter((a) => a.id.startsWith('honor-'));
    expect(list.map((a) => a.id)).toEqual([...CEREMONIES, DIPLOMA].map((c) => `honor-${c.id}`));
    const art = list.map((a) => badgeSource(a, true));
    expect(new Set(art).size).toBe(7);
    expect(art.every((s) => s.startsWith('data:image/png'))).toBe(true);
    expect(achievementById('honor-graduation-basics')?.title).toBe('Honors in First Steps');
  });
  it('unlocks the badge for a graduation in the finished set', async () => {
    unlocked.length = 0;
    await refreshGoals([]);
    expect(unlocked).toEqual(['honor-graduation-basics', 'honor-graduation-diploma']);
  });
});
