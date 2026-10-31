// Reset achievements sticks: tin hearts, felt eggs and score trophies are read from saves that
// Reset leaves alone, so only finds and scores made after the reset count again.
import { describe, expect, it, vi, beforeEach } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../project/storage', () => ({
  loadSaveData: async (id: string) => ({ ...(saves[id] ?? {}) }),
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array) => {
    (saves[id] ??= {})[name] = bytes;
  },
}));
let hearts: { id: string; inSave: boolean; when?: string }[] = [];
let eggs: { inSave: boolean; egg: { game: string } }[] = [];
vi.mock('../tinHearts/tinHearts', () => ({ huntStates: async () => hearts }));
vi.mock('../eggs/eggState', () => ({ eggStates: async () => eggs }));

import { SAVE_ID as SCORE_ID, FILE as SCORE_FILE, recordEnd } from '../scoreTrophies/scores';
import { eggsAfter, heartsAfter, laterMark, scoresAfter, type ResetMark } from './resetMark';
import { FILE, SAVE_ID, achievementsWritten, forgetForTests, loadAchievements, mergeRecords, parseRecord, resetAchievements } from './store';

const stored = () => parseRecord(saves[SAVE_ID]?.[FILE]);
const mark = (o: Partial<ResetMark> = {}): ResetMark => ({ at: 1000, hearts: [], eggs: [], best: 0, total: 0, ...o });

beforeEach(() => {
  for (const k of Object.keys(saves)) delete saves[k];
  forgetForTests();
  hearts = [];
  eggs = [];
});

describe('reset marks', () => {
  it('ignores hearts and eggs the saves held at the reset, but not new ones or a heart found again later', () => {
    const hs = [
      { id: 'a', inSave: true, when: new Date(500).toISOString() },
      { id: 'b', inSave: true, when: new Date(500).toISOString() },
      { id: 'c', inSave: true, when: new Date(2000).toISOString() },
      { id: 'd', inSave: false },
    ];
    expect(heartsAfter(hs, mark({ hearts: ['a', 'b'] })).map((s) => s.id)).toEqual(['c']);
    expect(heartsAfter(hs).map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(heartsAfter([{ id: 'a', inSave: true, when: new Date(3000).toISOString() }], mark({ hearts: ['a'] }))).toHaveLength(1);
    const es = [
      { inSave: true, egg: { game: 'teddy' } },
      { inSave: true, egg: { game: 'teddy2' } },
    ];
    expect(eggsAfter(es, mark({ eggs: ['teddy'] })).map((s) => s.egg.game)).toEqual(['teddy2']);
  });

  it('counts only score growth beyond the totals at the reset', () => {
    expect(scoresAfter({ best: 900, total: 5000 }, mark({ best: 800, total: 5000 }))).toEqual({ best: 100, total: 0 });
    expect(scoresAfter({ best: 10, total: 10 }, mark({ best: 800, total: 5000 }))).toEqual({ best: 0, total: 0 });
  });

  it('keeps the later reset when records merge, so an older backup does not lift it', () => {
    const base = { unlocked: {}, progress: {}, sets: {} };
    const old = mark({ at: 10, hearts: ['x'] });
    const now = mark({ at: 20, hearts: ['x', 'y'] });
    expect(mergeRecords({ ...base, reset: now }, { ...base, reset: old }).reset).toEqual(now);
    expect(mergeRecords({ ...base, reset: old }, { ...base, reset: now }).reset).toEqual(now);
    expect(mergeRecords({ ...base }, { ...base, reset: old }).reset).toEqual(old);
    expect(mergeRecords(base, base).reset).toBeUndefined();
    expect(laterMark(undefined, undefined)).toBeUndefined();
    // a restored backup from before the reset brings back its unlocks (it was asked to) but the cutoff stays
    const merged = mergeRecords({ ...base, reset: now }, { ...base, unlocked: { 'heart-first': 5 }, reset: undefined });
    expect(merged.unlocked['heart-first']).toBe(5);
    expect(merged.reset).toEqual(now);
  });

  it('writes the mark with the reset and reads it back', async () => {
    hearts = [
      { id: 'a', inSave: true, when: new Date(1).toISOString() },
      { id: 'b', inSave: false },
    ];
    eggs = [{ inSave: true, egg: { game: 'teddy' } }];
    saves[SCORE_ID] = { [SCORE_FILE]: new TextEncoder().encode(JSON.stringify({ best: { g: 700 }, total: 900, plays: 2 })) };
    await loadAchievements();
    await resetAchievements();
    await achievementsWritten();
    const r = stored();
    expect(r.unlocked).toEqual({});
    expect(r.reset).toMatchObject({ hearts: ['a'], eggs: ['teddy'], best: 700, total: 900 });
    expect(r.reset!.at).toBeGreaterThan(0);
    forgetForTests();
    expect((await loadAchievements()).reset).toEqual(r.reset);
  });

  it('a score trophy does not come back after a reset until new points are scored', async () => {
    saves[SCORE_ID] = { [SCORE_FILE]: new TextEncoder().encode(JSON.stringify({ best: { g: 700 }, total: 900, plays: 2 })) };
    await loadAchievements();
    await resetAchievements();
    await recordEnd('g', 700, 0); // finished again with nothing new scored
    await achievementsWritten();
    await new Promise((r) => setTimeout(r, 50)); // the unlock is asked for after the score is stored
    await achievementsWritten();
    expect(stored().unlocked['trophy-first']).toBeUndefined();
    await recordEnd('h', 50);
    await vi.waitFor(async () => {
      await achievementsWritten();
      expect(stored().unlocked['trophy-first']).toBeTypeOf('number');
    });
  });
});
