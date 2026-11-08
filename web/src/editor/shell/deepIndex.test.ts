// The home page's deeper search: reads games in the background, widens results, keeps a cache,
// survives a broken store, and never offers a secret game.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createDeepIndex, hintOf, type DeepSource, type DeepStore } from './deepIndex';
import { extractDeep, type DeepPart } from './deepExtract';
import { homeDeepSearch } from './homeDeepSearch';
import type { HomeGame } from './homeCards';

const enc = (s: string) => new TextEncoder().encode(s);
const memoryStore = () => {
  const m = new Map<string, DeepPart[]>();
  return { m, store: { get: async (k) => m.get(k), put: async (k, v) => void m.set(k, v) } satisfies DeepStore };
};
const source = (key: string, text: string, reads = { n: 0 }): DeepSource => ({
  key,
  version: '1',
  names: ['readme.doc', 'a.gam'],
  readFiles: async () => (reads.n++, [['readme.doc', enc(text)]]),
  readExtras: async () => ({ extras: [{ label: 'Description', text: `blurb of ${key}` }] }),
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('deep index', () => {
  it('finds words in files and widens as games arrive', async () => {
    const { store } = memoryStore();
    const more = vi.fn();
    const idx = createDeepIndex({ store, extract: extractDeep, idle: async () => undefined, onMore: more });
    idx.start([source('cd:a', 'The purple dragon sleeps'), source('cd:b', 'Nothing here')]);
    await vi.waitFor(() => expect(idx.progress.done).toBe(2));
    const hits = idx.find(['dragon']);
    expect([...hits.keys()]).toEqual(['cd:a']);
    expect(hintOf(hits.get('cd:a')!)).toBe('found in README.DOC');
    expect(idx.find(['blurb']).size).toBe(2);
    expect(hintOf(idx.find(['blurb']).get('cd:a')!)).toBe('found in description');
    expect(more).toHaveBeenCalled();
  });

  it('uses the cache the next time, without reading the game', async () => {
    const { store } = memoryStore();
    const reads = { n: 0 };
    const first = createDeepIndex({ store, extract: extractDeep, idle: async () => undefined, onMore: () => undefined });
    first.start([source('cd:a', 'dragon', reads)]);
    await vi.waitFor(() => expect(first.progress.done).toBe(1));
    const idle = vi.fn(async () => undefined);
    const second = createDeepIndex({ store, extract: extractDeep, idle, onMore: () => undefined });
    second.start([source('cd:a', 'dragon', reads)]);
    await vi.waitFor(() => expect(second.progress.done).toBe(1));
    expect(reads.n).toBe(1);
    expect(idle).not.toHaveBeenCalled();
    expect(second.find(['dragon']).size).toBe(1);
  });

  it('still works when the store is broken', async () => {
    const broken: DeepStore = { get: () => Promise.reject(new Error('no')), put: () => Promise.reject(new Error('full')) };
    const idx = createDeepIndex({ store: broken, extract: extractDeep, idle: async () => undefined, onMore: () => undefined });
    idx.start([source('cd:a', 'dragon')]);
    await vi.waitFor(() => expect(idx.progress.done).toBe(1));
    expect(idx.find(['dragon']).size).toBe(1);
  });

  it('keeps going when one game cannot be read', async () => {
    const { store } = memoryStore();
    const bad: DeepSource = { ...source('cd:x', ''), readFiles: () => Promise.reject(new Error('offline')) };
    const idx = createDeepIndex({ store, extract: extractDeep, idle: async () => undefined, onMore: () => undefined });
    idx.start([bad, source('cd:a', 'dragon')]);
    await vi.waitFor(() => expect(idx.progress.done).toBe(2));
    expect([...idx.find(['dragon']).keys()]).toEqual(['cd:a']);
  });

  it('reads nothing until focus', async () => {
    const reads = vi.fn();
    const mk = (id: string) => ({ key: `cd:${id}`, entry: { id, files: [], title: id }, project: undefined }) as unknown as HomeGame;
    const deep = homeDeepSearch({
      games: () => [mk('plain')],
      onMore: () => undefined,
      extract: async (j) => (reads(j), []),
      store: memoryStore().store,
      idle: async () => undefined,
    });
    expect(reads).not.toHaveBeenCalled();
    expect(deep.find('x').size).toBe(0);
    deep.stop();
  });

  it('a locked secret game never matches, an unlocked one does, even with it cached', async () => {
    const { store } = memoryStore();
    const mk = (id: string) => ({ key: `cd:${id}`, entry: { id, files: [], title: id, pack: 'p' }, project: undefined }) as unknown as HomeGame;
    // the secret game's text is already in the shared cache, from a time it was unlocked
    await store.put('cd:hidden|p', [{ file: '', label: 'Description', text: 'a felt egg' }]);
    let listed = [mk('plain')]; // locked: the home page does not list it
    const deep = homeDeepSearch({
      games: () => listed,
      onMore: () => undefined,
      extract: async () => [{ file: '', label: 'Description', text: 'a felt egg' }],
      store,
      idle: async () => undefined,
    });
    await deep.focus();
    await vi.waitFor(() => expect(deep.find('felt').size).toBe(1));
    expect([...deep.find('felt').keys()]).toEqual(['cd:plain']);
    listed = [mk('plain'), mk('hidden')]; // unlocked: listed now
    await deep.focus();
    await vi.waitFor(() => expect(deep.find('felt').has('cd:hidden')).toBe(true));
    listed = [mk('plain')]; // locked again
    expect(deep.find('felt').has('cd:hidden')).toBe(false);
    deep.stop();
  });
});
