// The tin heart hunt's bookkeeping: a touch at the heart's place is kept once in the game's save
// data, EGG.EXE's overrides add and take away finds, and only the counted catalog games count.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../project/storage', () => ({
  SAVES_CHANGED: 'gm-saves-changed',
  loadSaveData: async (id: string) => saves[id] ?? {},
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array) => void ((saves[id] ??= {})[name] = bytes),
}));

import { countedOf, FOUND_FILE, heartHook, heartStates, MANIFEST, parseFound, pendingOf, readOverrides, setAllOverrides, setOverride, statusOf } from './tinHearts';
import { countWord, joeNote } from './trophy';
import type { Session } from '../engine/scene';

const store = new Map<string, string>();
const games = [{ id: 'realm', title: 'Quest for the Round Tuit' }, { id: 'sleuth', title: 'Final Curtain' }];
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('tin hearts', () => {
  beforeEach(() => {
    store.clear();
    for (const k of Object.keys(saves)) delete saves[k];
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, String(v)), removeItem: (k: string) => void store.delete(k) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('keeps a touch at the heart (and only there) in the game’s save data, once', async () => {
    const hook = heartHook('game:realm')!;
    const scenes = Array.from({ length: 25 }, (_, i) => ({ files: i === 19 ? ['', 'PORT.MAP'] : ['', 'town.map'] }));
    hook.onSession({ game: { scenes } } as unknown as Session);
    hook.onTouched(19, 11, 33, 5);
    hook.onTouched(3, 10, 33, 5);
    await flush();
    expect(saves['game:realm']).toBeUndefined();
    hook.onTouched(19, 10, 33, 142);
    await flush();
    const note = parseFound(saves['game:realm'][FOUND_FILE]);
    expect(note).toMatchObject({ scene: 19, at: [10, 33] });
    // a second visit keeps the first find's date
    const first = saves['game:realm'][FOUND_FILE];
    await heartHook('game:realm')!.onTouched(19, 10, 33, 142);
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
    saves['game:realm'] = { [FOUND_FILE]: new TextEncoder().encode('{"found":"2026-10-23T00:00:00Z","scene":19,"at":[10,33]}') };
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

  it('has Joe write the count out', () => {
    expect(countWord(4)).toBe('Four');
    expect(countWord(24)).toBe('Twenty-four');
    expect(countWord(30)).toBe('Thirty');
    expect(joeNote(24)).toMatch(/^Twenty-four tin hearts, counted twice/);
    expect(joeNote(24)).not.toMatch(/health/i);
  });
});
