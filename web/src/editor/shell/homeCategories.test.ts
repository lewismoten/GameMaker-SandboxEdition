// The home page's collections: their order, the one a first visit opens on, and the featured game a chosen collection shows.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATEGORIES, CATEGORY_KEY, FIRST_CATEGORY, pickFeatured, savedCategory } from './homeCategories';

/** A localStorage holding `saved` (nothing when undefined). */
const storage = (saved?: string) => {
  const m = new Map<string, string>(saved ? [[CATEGORY_KEY, saved]] : []);
  vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v) });
};

/** A random number that gives each answer in turn. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const games = (...keys: string[]) => keys.map((key) => ({ key, demo: !key.startsWith('plain') }));
const demo = (g: { demo: boolean }) => g.demo;

afterEach(() => vi.unstubAllGlobals());

describe('the collections', () => {
  it('put your own games first, then Sandbox and Bizarre before Gameware and Shareware', () => {
    expect(CATEGORIES.map((c) => c.id)).toEqual(['mine', 'imported', 'sandbox', 'bizarre', 'gameware', 'shareware']);
  });

  it('open on Sandbox when nothing was picked, and on the one picked otherwise', () => {
    expect(FIRST_CATEGORY).toBe('sandbox');
    storage();
    expect(savedCategory()).toBeUndefined();
    storage('gameware');
    expect(savedCategory()).toBe('gameware');
    storage('nonsense');
    expect(savedCategory()).toBeUndefined();
  });
});

describe('pickFeatured', () => {
  it('picks with the random number given', () => {
    const pool = games('a', 'b', 'c');
    expect(pickFeatured(pool, undefined, demo, () => 0)?.key).toBe('a');
    expect(pickFeatured(pool, undefined, demo, () => 0.99)?.key).toBe('c');
  });

  it('never repeats the game shown while there is another', () => {
    const pool = games('a', 'b');
    const random = seq(0, 0.5, 0.99, 0.25);
    for (let n = 0; n < 8; n++) expect(pickFeatured(pool, 'a', demo, random)?.key).toBe('b');
  });

  it('keeps the only game a collection has', () => {
    expect(pickFeatured(games('a'), 'a', demo)?.key).toBe('a');
  });

  it('prefers games with a demo, and takes any while none other has one', () => {
    const pool = games('plain1', 'd', 'plain2');
    expect(pickFeatured(pool, undefined, demo, () => 0.99)?.key).toBe('d');
    expect(pickFeatured(pool, 'd', demo, () => 0.99)?.key).toBe('plain2');
  });

  it('has nothing to feature from an empty collection', () => {
    expect(pickFeatured([], undefined, demo)).toBeUndefined();
  });
});
