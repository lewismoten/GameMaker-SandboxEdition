// Leveled achievements: each level is an achievement of its own (so it counts in every total), the old tier ids
// are kept as levels, levels rise in goal, standing and next goal come from the record, count levels read the
// distinct listed games in it, and an older record (before levels existed) merges and reads cleanly.
import { describe, expect, it, vi } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../project/storage', () => ({
  loadSaveData: async (id: string) => ({ ...(saves[id] ?? {}) }),
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array) => {
    (saves[id] ??= {})[name] = bytes;
  },
}));

import { ACHIEVEMENTS, achievementById } from './catalog';
import { COUNT_LEVELS, levelStanding, levelsOf } from './levels';
import { goalTargets, refreshGoals } from './goals';
import { achievementsWritten, loadAchievements, mergeRecords, parseRecord, remember } from './store';

const families = [...new Set(ACHIEVEMENTS.flatMap((a) => (a.level ? [a.level.family] : [])))];

describe('level families', () => {
  it('has the three repeat tiers and the three count counters, each level its own achievement', () => {
    expect(families.sort()).toEqual(['every-life', 'every-loss', 'every-win', 'games-finished', 'games-played', 'walks-watched']);
    for (const f of families) {
      const fam = ACHIEVEMENTS.filter((a) => a.level?.family === f);
      expect(fam.map((a) => a.level!.n)).toEqual([1, 2, 3]);
      expect(fam.every((a) => a.level!.of === 3)).toBe(true);
      const goals = fam.map((a) => a.times ?? a.count!);
      expect(goals).toEqual([...goals].sort((x, y) => x - y));
      expect(new Set(goals).size).toBe(goals.length);
      expect(fam[2].hard).toBe(true); // the last level is gold
    }
  });

  it('keeps the stored ids of the old every-life, every-loss and every-win badges as levels 1 to 3', () => {
    for (const [k, f] of [
      ['life', 'every-life'],
      ['loss', 'every-loss'],
      ['win', 'every-win'],
    ]) {
      expect([1, 3, 10].map((t) => achievementById(`${f}-${t}`)?.level?.family)).toEqual([f, f, f]);
      expect(achievementById(`every-${k}-3`)?.level?.n).toBe(2);
    }
  });

  it('reports the current level and the next goal', () => {
    const a = achievementById('games-played-10')!;
    expect(levelsOf(a, ACHIEVEMENTS).map((x) => x.id)).toEqual(['games-played-3', 'games-played-10', 'games-played-20']);
    expect(levelStanding(a, ACHIEVEMENTS, {}).current).toBe(0);
    expect(levelStanding(a, ACHIEVEMENTS, { 'games-played-3': 1, 'games-played-10': 2 })).toMatchObject({ current: 2, next: { id: 'games-played-20' } });
    expect(levelStanding(a, ACHIEVEMENTS, { 'games-played-3': 1, 'games-played-10': 2, 'games-played-20': 3 }).next).toBeUndefined();
  });

  it('counts every level in the totals', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(ACHIEVEMENTS.filter((a) => a.level).length).toBe(families.length * 3);
  });
});

describe('count levels', () => {
  const listed = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `g${i}`, gam: `g${i}.gam` })) as never[];

  it('unlock in order as distinct listed games are played, ignoring unlisted ones', async () => {
    await loadAchievements();
    for (const id of ['g0', 'g1', 'g2', 'g2', 'unlisted']) await remember('played', id);
    await refreshGoals(listed(12));
    await achievementsWritten();
    const r = await loadAchievements();
    expect(r.unlocked['games-played-3']).toBeTypeOf('number');
    expect(r.unlocked['games-played-10']).toBeUndefined();
    expect(r.progress['games-played-10']).toEqual({ n: 3, of: 10 });
    for (let i = 3; i < 10; i++) await remember('played', `g${i}`);
    await refreshGoals(listed(12));
    expect((await loadAchievements()).unlocked['games-played-10']).toBeTypeOf('number');
    expect(goalTargets(listed(12), 'sandbox')).toEqual([]);
  });

  it('goals are reachable with the games the site lists', () => {
    for (const { goals } of Object.values(COUNT_LEVELS)) expect(Math.max(...goals)).toBeLessThanOrEqual(25);
  });
});

describe('older records', () => {
  it('read and merge unchanged, and a level unlocked before levels existed stays unlocked', () => {
    const old = new TextEncoder().encode(
      JSON.stringify({ unlocked: { 'every-win-3': 5, 'play-first': 9 }, progress: { 'every-win-3': { n: 2, of: 2 } }, sets: {} }),
    );
    const r = parseRecord(old);
    const merged = mergeRecords(r, parseRecord(undefined));
    expect(merged.unlocked['every-win-3']).toBe(5);
    expect(levelStanding(achievementById('every-win-1')!, ACHIEVEMENTS, merged.unlocked).current).toBe(2);
  });
});
