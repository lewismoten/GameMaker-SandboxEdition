// Tests: the two eggs kept apart from the dozen (eggs/bonus.ts) are found like the others but
// never count toward the dozen, and the dozen's own list never names them.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../src/project/storage', () => ({ loadSaveData: async (id: string) => saves[id] ?? {} }));

import { BONUS_EGGS, bonusKey, bonusStates, bonusStatus, isHatched, setHatched, TAPS } from '../src/eggs/bonus';
import { EGGS } from '../src/eggs/eggs';
import { eggStates, OVERRIDES_KEY } from '../src/eggs/eggState';

const save = (inv: number[]) => new TextEncoder().encode(JSON.stringify({ version: 1, world: { ci: { inv, meter: [] } } }));
const store = new Map<string, string>();

describe('the two eggs kept apart from the dozen', () => {
  beforeEach(() => {
    store.clear();
    for (const k of Object.keys(saves)) delete saves[k];
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, String(v)), removeItem: (k: string) => void store.delete(k) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('are the rotten egg and the true Easter egg, keyed apart from any game', () => {
    expect(BONUS_EGGS.map(bonusKey)).toEqual(['bakers/rotten', 'bakers/faberge']);
    expect(EGGS.map((e) => e.game)).not.toContain(BONUS_EGGS[0].game);
    expect(TAPS).toBe(13);
  });

  it('are found from a save or by hand, and broken by hand', () => {
    const rotten = { ...BONUS_EGGS[0], detect: { block: 140 } };
    expect(bonusStatus(rotten, { 'game1.sav': save([140]) }, {}).found).toBe(true);
    expect(bonusStatus(rotten, { 'game1.sav': save([141]) }, {}).found).toBe(false);
    expect(bonusStatus(rotten, {}, { 'bakers/rotten': 'added' }).status).toBe('added');
    expect(bonusStatus(rotten, { 'game1.sav': save([140]) }, { 'bakers/rotten': 'broken' }).found).toBe(false);
    // the game's own key is not theirs
    expect(bonusStatus(rotten, {}, { bakers: 'added' }).found).toBe(false);
  });

  it('never count toward the dozen', async () => {
    const dozen = Object.fromEntries(EGGS.slice(0, 11).map((e) => [e.game, 'added']));
    store.set(OVERRIDES_KEY, JSON.stringify({ ...dozen, 'bakers/rotten': 'added', 'bakers/faberge': 'added' }));
    const states = await eggStates();
    expect(states).toHaveLength(12);
    expect(states.filter((s) => s.found)).toHaveLength(11);
    expect((await bonusStates()).every((s) => s.found)).toBe(true);
    // all twelve, with both of these broken: still the whole dozen
    store.set(OVERRIDES_KEY, JSON.stringify({ ...dozen, [EGGS[11].game]: 'added', 'bakers/rotten': 'broken', 'bakers/faberge': 'broken' }));
    expect((await eggStates()).every((s) => s.found)).toBe(true);
    expect((await bonusStates()).some((s) => s.found)).toBe(false);
  });

  it('remembers the rotten egg tapped open', () => {
    expect(isHatched()).toBe(false);
    setHatched(true);
    expect(isHatched()).toBe(true);
    setHatched(false);
    expect(isHatched()).toBe(false);
  });
});
