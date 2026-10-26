// The score trophies' bookkeeping: a game's best counts only when beaten, the total adds every
// finished play, the tiers come from the sums, only catalog games' real plays are kept, and
// EGG.EXE's overrides show another tier and go back to the earned one.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../project/storage', () => ({
  loadSaveData: async (id: string) => ({ ...(saves[id] ?? {}) }),
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array) => void ((saves[id] ??= {})[name] = bytes),
}));
// the unlocks are the achievements' own business (achievements.test.ts)
const unlocked: string[] = [];
vi.mock('../achievements/store', () => ({ unlockAchievement: (id: string) => void unlocked.push(id) }));

import { addEnd, bestSum, emptyScores, FILE, loadScores, parseScores, recordEnd, SAVE_ID } from './scores';
import { nextTier, readTrophyOverrides, resetTrophyOverrides, setTrophyOverride, shownTier, THRESHOLDS, tierOf, TOP_TIER } from './tiers';
import { scoreHook } from './hook';

const store = new Map<string, string>();
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  for (const k of Object.keys(saves)) delete saves[k];
  store.clear();
  unlocked.length = 0;
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('score record', () => {
  it('counts a game’s best only when it is beaten', () => {
    let r = addEnd(emptyScores(), 'teddy', 5000);
    r = addEnd(r, 'teddy', 3000);
    expect(r.best.teddy).toBe(5000);
    r = addEnd(r, 'teddy', 5000);
    expect(r.best.teddy).toBe(5000);
    r = addEnd(r, 'teddy', 7200);
    r = addEnd(r, 'realm', 100);
    expect(r.best).toEqual({ teddy: 7200, realm: 100 });
    expect(bestSum(r)).toBe(7300);
  });

  it('adds every finished play to the total', () => {
    let r = emptyScores();
    for (const s of [5000, 3000, 0, 7200]) r = addEnd(r, 'teddy', s);
    expect(r.total).toBe(15200);
    expect(r.plays).toBe(4);
    // a negative or fractional score never takes anything away
    expect(addEnd(r, 'teddy', -50.7).total).toBe(15200);
  });

  it('keeps it in the save store, read back the same, and drops what is malformed', async () => {
    await recordEnd('teddy', 4000);
    await recordEnd('teddy', 2500);
    await recordEnd('goat', 900);
    const r = await loadScores();
    expect(r).toEqual({ best: { teddy: 4000, goat: 900 }, total: 7400, plays: 3 });
    expect(saves[SAVE_ID][FILE]).toBeDefined();
    expect(parseScores(new TextEncoder().encode('{"best":{"a":"x","b":-1,"c":12},"total":"lots"}'))).toEqual({ best: { c: 12 }, total: 0, plays: 0 });
    expect(parseScores(new TextEncoder().encode('not json'))).toEqual(emptyScores());
  });

  it('unlocks the first trophy’s achievement with points, and the top one at the top', async () => {
    await recordEnd('teddy', 0);
    expect(unlocked).toEqual([]);
    await recordEnd('teddy', 10);
    await flush();
    expect(unlocked).toEqual(['trophy-first']);
    await recordEnd('teddy', THRESHOLDS.best[TOP_TIER - 1]);
    await flush();
    expect(unlocked).toContain('trophy-top');
  });
});

describe('only real play of a catalog game counts', () => {
  it('hooks catalog games only, never a game of your own or a download', async () => {
    expect(scoreHook(undefined)).toBeUndefined();
    expect(scoreHook('project:abc')).toBeUndefined();
    expect(scoreHook('bundle:teddy')).toBeUndefined();
    scoreHook('game:teddy')!(1234, 'lost');
    await vi.waitFor(async () => expect((await loadScores()).best.teddy).toBe(1234));
  });
});

describe('tiers', () => {
  it('come from the sums', () => {
    for (const kind of ['best', 'total'] as const) {
      const t = THRESHOLDS[kind];
      expect(t).toHaveLength(TOP_TIER);
      expect([...t].sort((a, b) => a - b)).toEqual(t);
      expect(tierOf(kind, 0)).toBe(0);
      expect(tierOf(kind, t[0])).toBe(1);
      expect(tierOf(kind, t[2] - 1)).toBe(2);
      expect(tierOf(kind, t[2])).toBe(3);
      expect(tierOf(kind, t[TOP_TIER - 1] * 10)).toBe(TOP_TIER);
      expect(nextTier(kind, t[1] + 5)).toEqual({ tier: 3, at: t[2], needs: t[2] - t[1] - 5 });
      expect(nextTier(kind, t[TOP_TIER - 1])).toBeUndefined();
    }
  });

  it('can be shown otherwise from EGG.EXE, and put back to the earned one', () => {
    const points = THRESHOLDS.best[1];
    expect(shownTier('best', points)).toBe(2);
    setTrophyOverride('best', 5);
    setTrophyOverride('total', 0);
    expect(readTrophyOverrides()).toEqual({ best: 5, total: 0 });
    expect(shownTier('best', points)).toBe(5);
    expect(shownTier('total', 1e9)).toBe(0);
    setTrophyOverride('best', 99);
    expect(shownTier('best', points)).toBe(TOP_TIER);
    setTrophyOverride('best', undefined);
    setTrophyOverride('total', undefined);
    expect(shownTier('best', points)).toBe(2);
    expect(store.size).toBe(0);
    // X Reset all: both back at once
    setTrophyOverride('best', 4);
    setTrophyOverride('total', 3);
    resetTrophyOverrides();
    expect(readTrophyOverrides()).toEqual({});
    expect(shownTier('total', THRESHOLDS.total[0])).toBe(1);
  });
});
