// Tests: the two eggs kept apart from the dozen (eggs/bonus.ts) are found like the others but
// never count toward the dozen, and the dozen's own list never names them.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../src/project/storage', () => ({ loadSaveData: async (id: string) => saves[id] ?? {} }));

import {
  BONUS_EGGS,
  bonusKey,
  bonusStates,
  bonusStatus,
  clampTaps,
  eggTaps,
  isHatched,
  parseTaps,
  setEggTaps,
  tapsText,
  TAPS,
  TAPS_KEY,
} from '../src/eggs/bonus';
import { EGGS } from '../src/eggs/eggs';
import { eggStates, OVERRIDES_KEY } from '../src/eggs/eggState';
import { tapMessage } from '../src/eggs/bonusViewer';

const save = (inv: number[]) => new TextEncoder().encode(JSON.stringify({ version: 1, world: { ci: { inv, meter: [] } } }));
const store = new Map<string, string>();

describe('the two eggs kept apart from the dozen', () => {
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

  it("reads the rotten egg's tap count, clamped", () => {
    expect(parseTaps('7', null)).toBe(7);
    expect(parseTaps('99', null)).toBe(TAPS);
    expect(parseTaps('-3', null)).toBe(0);
    expect(parseTaps('junk', null)).toBe(0);
    expect(clampTaps(4.8)).toBe(4);
  });

  it('migrates the old tapped-open flag to a count', () => {
    expect(parseTaps(null, '1')).toBe(TAPS);
    expect(parseTaps(null, null)).toBe(0);
    // a count, once written, wins over the old flag
    expect(parseTaps('2', '1')).toBe(2);
    store.set('gm-egg-hatched', '1');
    expect(eggTaps()).toBe(TAPS);
    expect(isHatched()).toBe(true);
  });

  it('remembers each crack stage, drops the old flag and tells the desk', () => {
    const events: string[] = [];
    vi.stubGlobal('window', { dispatchEvent: (e: Event) => events.push(e.type) });
    store.set('gm-egg-hatched', '1');
    setEggTaps(5);
    expect(store.get(TAPS_KEY)).toBe('5');
    expect(store.has('gm-egg-hatched')).toBe(false);
    expect(eggTaps()).toBe(5);
    expect(isHatched()).toBe(false);
    setEggTaps(TAPS);
    expect(isHatched()).toBe(true);
    setEggTaps(0);
    expect(store.has(TAPS_KEY)).toBe(false);
    expect(eggTaps()).toBe(0);
    expect(events).toEqual(['gm-eggs-changed', 'gm-eggs-changed', 'gm-eggs-changed']);
  });

  it('says how cracked the rotten egg is', () => {
    expect(tapsText(0)).toBe('whole');
    expect(tapsText(5)).toBe('cracked 5/13');
    expect(tapsText(13)).toBe('IOU note');
  });

  it('says what each tap does', () => {
    expect(tapMessage(1)).toMatch(/^Tap 1 of 13\. .*wobbles/);
    expect(tapMessage(9)).toMatch(/glints/);
    expect(tapMessage(13)).toMatch(/crumbles.*IOU one diamond heart.*Joe/);
    expect(new Set(Array.from({ length: 13 }, (_, i) => tapMessage(i + 1))).size).toBe(13);
  });
});
