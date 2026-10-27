// The tin heart hunt's bookkeeping: a touch at the heart's place is kept once in the game's save
// data, EGG.EXE's overrides add and take away finds, and only the counted catalog games count.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../project/storage', () => ({
  SAVES_CHANGED: 'gm-saves-changed',
  loadSaveData: async (id: string) => saves[id] ?? {},
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array) => void ((saves[id] ??= {})[name] = bytes),
}));

import {
  countedOf,
  FOUND_FILE,
  heartHook,
  heartCount,
  heartStates,
  huntComplete,
  huntStates,
  MANIFEST,
  parseFound,
  pendingOf,
  readOverrides,
  resetAllOverrides,
  setAllOverrides,
  setOverride,
  statusOf,
} from './tinHearts';
import { countWord, joeNote } from './trophy';
import type { Session } from '../engine/scene';
import { CLOCK_HEART, takeClockHeart } from './deskHearts';

const store = new Map<string, string>();
const games = [
  { id: 'realm', title: 'Quest for the Round Tuit' },
  { id: 'sleuth', title: 'Final Curtain' },
];
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('tin hearts', () => {
  beforeEach(() => {
    store.clear();
    for (const k of Object.keys(saves)) delete saves[k];
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('keeps a touch at the heart (and only there) in the game’s save data, once', async () => {
    const hook = heartHook('game:realm')!;
    const scenes = Array.from({ length: 25 }, (_, i) => ({ files: i === 19 ? ['', 'PORT.MAP'] : ['', 'town.map'] }));
    hook.onSession({ game: { scenes } } as unknown as Session);
    hook.onTouched(19, 10, 25, 5);
    hook.onTouched(3, 9, 25, 5);
    await flush();
    expect(saves['game:realm']).toBeUndefined();
    hook.onTouched(19, 9, 25, 142);
    await flush();
    const note = parseFound(saves['game:realm'][FOUND_FILE]);
    expect(note).toMatchObject({ scene: 19, at: [9, 25] });
    // a second visit keeps the first find's date
    const first = saves['game:realm'][FOUND_FILE];
    heartHook('game:realm')!.onTouched(19, 9, 25, 142);
    await flush();
    expect(saves['game:realm'][FOUND_FILE]).toBe(first);
  });

  it('has no hook for a game without a heart, or a project', () => {
    expect(heartHook('game:no-heart-yet')).toBeUndefined();
    expect(heartHook('project:abc')).toBeUndefined();
    expect(heartHook(undefined)).toBeUndefined();
  });

  it('counts a find in a save or added by hand, unless taken away', async () => {
    expect(statusOf(true, 'broken')).toEqual({ status: 'broken', found: false });
    expect(statusOf(false, 'added')).toEqual({ status: 'added', found: true });
    saves['game:realm'] = { [FOUND_FILE]: new TextEncoder().encode('{"found":"2026-10-23T00:00:00Z","scene":19,"at":[9,25]}') };
    let s = await heartStates(games);
    expect(s.map((h) => h.found)).toEqual([true, false]);
    setOverride('sleuth', 'added');
    s = await heartStates(games);
    expect(s.map((h) => h.status)).toEqual(['saved', 'added']);
    setAllOverrides(s, false);
    expect(readOverrides()).toEqual({ realm: 'broken' });
    expect((await heartStates(games)).every((h) => !h.found)).toBe(true);
    setAllOverrides(s, true);
    expect(readOverrides()).toEqual({ sleuth: 'added' });
    expect((await heartStates(games)).every((h) => h.found)).toBe(true);
    // X Reset all: back to what the saves say
    resetAllOverrides();
    expect(readOverrides()).toEqual({});
    expect((await heartStates(games)).map((h) => h.status)).toEqual(['saved', 'none']);
  });

  it('counts only catalog games that declare a heart; the rest are pending (dev only)', () => {
    const catalog = [
      { id: 'realm', title: 'Quest', original: {} },
      { id: 'no-heart-yet', title: 'No Heart Yet', original: {}, series: 'bizarre' },
      { id: 'nebula', title: 'Shareware' },
    ];
    expect(countedOf(catalog).map((g) => g.id)).toEqual(['realm']);
    expect(pendingOf(catalog).map((g) => g.id)).toEqual(MANIFEST.pending.includes('no-heart-yet') ? ['no-heart-yet'] : []);
  });

  it('counts the clock heart after the games’ hearts, with EGG.EXE’s overrides', async () => {
    let s = await huntStates(games);
    expect(s.map((h) => h.id)).toEqual(['realm', 'sleuth', CLOCK_HEART]);
    expect(s.every((h) => !h.found)).toBe(true);
    takeClockHeart();
    s = await huntStates(games);
    expect(s[2]).toMatchObject({ id: CLOCK_HEART, inSave: true, status: 'saved', found: true });
    setOverride(CLOCK_HEART, 'broken');
    expect((await huntStates(games))[2].found).toBe(false);
    resetAllOverrides();
    setAllOverrides(await huntStates(games), true);
    expect((await huntStates(games)).every((h) => h.found)).toBe(true);
  });

  it('is won with every heart, the clock’s too', async () => {
    // a new visitor: nothing found when the clock heart joined
    expect(huntComplete(await huntStates(games))).toBe(false);
    setOverride('realm', 'added');
    setOverride('sleuth', 'added');
    expect(huntComplete(await huntStates(games))).toBe(false);
    takeClockHeart();
    expect(huntComplete(await huntStates(games))).toBe(true);
  });

  it('keeps it won for whoever had every game’s heart before the clock’s joined', async () => {
    setOverride('realm', 'added');
    setOverride('sleuth', 'added');
    const s = await huntStates(games);
    expect(huntComplete(s)).toBe(true);
    // the clock heart shows as one more to find
    expect(s.filter((h) => h.found).length).toBe(2);
    expect(s.length).toBe(3);
    // losing a game's heart loses it; finding it again wins it back without the clock's
    setOverride('sleuth', undefined);
    expect(huntComplete(await huntStates(games))).toBe(false);
    setOverride('sleuth', 'added');
    expect(huntComplete(await huntStates(games))).toBe(true);
  });

  it('decides nothing before the games are known', async () => {
    expect(huntComplete([{ id: CLOCK_HEART, found: false }])).toBe(false);
    expect(store.has('gm-hearts-before-clock')).toBe(false);
  });

  it('counts the clock heart in the hunt’s total', async () => {
    vi.doMock('../project/files', () => ({ loadGameList: async () => games.map((g) => ({ ...g, original: {} })) }));
    const c = await heartCount();
    expect(c.total).toBe(3);
    expect(c.found).toBe(0);
    vi.doUnmock('../project/files');
  });

  it('has Joe write the count out', () => {
    expect(countWord(4)).toBe('Four');
    expect(countWord(24)).toBe('Twenty-four');
    expect(countWord(30)).toBe('Thirty');
    expect(joeNote(24)).toMatch(/^Twenty-four tin hearts, counted twice/);
    expect(joeNote(24)).not.toMatch(/health/i);
  });
});
