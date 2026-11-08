// Scoot's stamps: what earns which stamp, one postcard for this device, one Sample CD, graduation and
// mystery stamp at most, and no secret game's id ever reaching the store (every secret id in
// games/*/about.json is fed in, as a catalog game, a saved stamp and a played game).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { addStamp, loadCourier } from './courierStore';
import { stampFor, type Known } from './stamps';
import { STAMP_WORDS, WORLDS } from './tables';
import { stampText } from './courierText';

const stored = new Map<string, string>();
beforeEach(() => {
  stored.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => stored.get(k) ?? null,
    setItem: (k: string, v: string) => stored.set(k, v),
    removeItem: (k: string) => stored.delete(k),
  });
});
afterEach(() => vi.unstubAllGlobals());

/** Every secret game's id and title, from the games' own about.json. */
function secrets(): { id: string; title: string }[] {
  const games = resolve(__dirname, '../../../games');
  const out: { id: string; title: string }[] = [];
  for (const id of readdirSync(games)) {
    const f = resolve(games, id, 'about.json');
    if (!existsSync(f)) continue;
    const about = JSON.parse(readFileSync(f, 'utf8')) as { secret?: boolean; title?: string };
    if (about.secret) out.push({ id, title: about.title ?? id });
  }
  return out;
}

const CATALOG: Known[] = [
  { id: 'snow', title: 'Snow Day', original: {} },
  { id: 'starter-walk', title: 'Walking', series: 'starter', original: {} },
  { id: 'starter-doors', title: 'Doors', series: 'starter', original: {} },
  { id: 'graduation-basics', title: 'Graduation: First Steps', series: 'starter', original: {} },
  { id: 'graduation-diploma', title: 'The Sandbox Diploma', series: 'starter', original: {} },
];

describe('earning stamps', () => {
  it('a catalog game played to its ending stamps its id; playing alone does not', () => {
    expect(stampFor('game:snow', 'played', CATALOG)).toBeUndefined();
    expect(stampFor('game:snow', 'won', CATALOG)).toEqual({ kind: 'game', game: 'snow' });
    expect(stampFor('snow', 'won', CATALOG)).toEqual({ kind: 'game', game: 'snow' });
  });

  it('every Starter is the one Sample CD stamp, every graduation the one graduation stamp', () => {
    expect(stampFor('game:starter-walk', 'won', CATALOG)).toEqual({ kind: 'sample-cd' });
    expect(stampFor('game:starter-doors', 'won', CATALOG)).toEqual({ kind: 'sample-cd' });
    expect(stampFor('game:graduation-basics', 'won', CATALOG)).toEqual({ kind: 'graduation' });
    expect(stampFor('game:graduation-diploma', 'won', CATALOG)).toEqual({ kind: 'graduation' });
    for (const id of ['starter-walk', 'starter-doors', 'graduation-basics', 'graduation-diploma', 'snow']) addStamp(stampFor(id, 'won', CATALOG)!, () => 0);
    expect(loadCourier().postcards[0].stamps).toEqual([{ kind: 'sample-cd' }, { kind: 'graduation' }, { kind: 'game', game: 'snow' }]);
  });

  it('a secret game, a game of your own and an unknown one give the same mystery stamp, once', () => {
    const all = secrets();
    expect(all.length).toBeGreaterThan(0);
    // even a catalog that lists a revealed secret game
    const withSecret = [...CATALOG, ...all.map((s) => ({ id: s.id, title: s.title, original: {} }))];
    for (const s of all) {
      expect(stampFor(`game:${s.id}`, 'played', withSecret)).toEqual({ kind: 'mystery' });
      expect(stampFor(`game:${s.id}`, 'won', withSecret)).toEqual({ kind: 'mystery' });
    }
    expect(stampFor('project:abc', 'played', CATALOG)).toEqual({ kind: 'mystery' });
    expect(stampFor('game:not-in-the-catalog', 'won', CATALOG)).toEqual({ kind: 'mystery' });
    expect(stampFor(undefined, 'played', CATALOG)).toEqual({ kind: 'mystery' });
    expect(addStamp({ kind: 'mystery' }, () => 0)).toBe(true);
    expect(addStamp({ kind: 'mystery' }, () => 0)).toBe(false);
    expect(loadCourier().postcards[0].stamps).toEqual([{ kind: 'mystery' }]);
    expect(stampText({ kind: 'mystery' })).toBe(STAMP_WORDS.mystery);
  });
});

describe('the store keeps no secret id', () => {
  it('a game stamp for a secret game is kept as the mystery stamp', () => {
    for (const s of secrets()) addStamp({ kind: 'game', game: s.id }, () => 0);
    const raw = stored.get('gm-courier')!;
    for (const s of secrets()) {
      expect(raw.includes(s.id), 'a secret id was stored').toBe(false);
      expect(raw.toLowerCase().includes(s.title.toLowerCase()), 'a secret title was stored').toBe(false);
    }
    expect(loadCourier().postcards[0].stamps).toEqual([{ kind: 'mystery' }]);
  });

  it('a saved secret id is dropped as the store is read, and mystery stamps carry nothing', () => {
    const [s] = secrets();
    stored.set(
      'gm-courier',
      JSON.stringify({
        postcards: [
          { world: 1, here: true, stamps: [{ kind: 'game', game: s.id }, { kind: 'mystery', game: 'x' }, { kind: 'sample-cd' }, { kind: 'sample-cd' }] },
        ],
      }),
    );
    expect(loadCourier().postcards).toEqual([{ world: 1, here: true, stamps: [{ kind: 'mystery' }, { kind: 'sample-cd' }] }]);
  });
});

describe("this device's postcard", () => {
  it('is made by the first stamp, with a curated world rolled once, and stays one', () => {
    expect(loadCourier().postcards).toEqual([]);
    addStamp({ kind: 'sample-cd' }, () => 0.999);
    addStamp({ kind: 'graduation' }, () => 0);
    const cards = loadCourier().postcards;
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ world: WORLDS.length - 1, here: true });
    // a second "here" card in saved data is dropped
    stored.set('gm-courier', JSON.stringify({ postcards: [cards[0], { ...cards[0], world: 2 }, { world: 3, stamps: [] }] }));
    expect(loadCourier().postcards.map((p) => p.world)).toEqual([WORLDS.length - 1, 3]);
  });
});
