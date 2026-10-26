// The game the Library starts on (libraryStart.ts): the latest game page, look inside or copied
// project, used once, and only when that game has paper on the shelves.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { libraryStartGame, noteLibraryContext } from './libraryStart';

const store = new Map<string, string>();
const listed = (id: string) => ['teddy', 'goat', 'bard1'].includes(id);
const origins: Record<string, string> = { mine: 'goat', shareCopy: 'commander' };
const origin = (p: string) => origins[p];

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('the Library’s starting game', () => {
  it('is none without a game seen', () => {
    expect(libraryStartGame(listed, origin)).toBeUndefined();
    noteLibraryContext('help', 'intro', 1);
    noteLibraryContext(undefined, undefined, 2);
    expect(libraryStartGame(listed, origin)).toBeUndefined();
  });

  it('is the game whose page was viewed on the Games list', () => {
    noteLibraryContext('game', 'cd:teddy', 1);
    expect(libraryStartGame(listed, origin)).toBe('teddy');
  });

  it('is the game looked inside, if it has paper here', () => {
    noteLibraryContext('p', 'look:bard1', 1);
    expect(libraryStartGame(listed, origin)).toBe('bard1');
    noteLibraryContext('p', 'look:commander', 2); // shareware: nothing on the shelves
    expect(libraryStartGame(listed, origin)).toBeUndefined();
  });

  it('is the game a project of your own was copied from, if it has paper here', () => {
    noteLibraryContext('p', 'mine', 1);
    expect(libraryStartGame(listed, origin)).toBe('goat');
    noteLibraryContext('p', 'shareCopy', 2);
    expect(libraryStartGame(listed, origin)).toBeUndefined();
    noteLibraryContext('p', 'madeNew', 3); // no origin
    expect(libraryStartGame(listed, origin)).toBeUndefined();
  });

  it('follows the latest view, and is used once', () => {
    noteLibraryContext('game', 'cd:teddy', 1);
    noteLibraryContext('p', 'mine', 2);
    expect(libraryStartGame(listed, origin)).toBe('goat');
    // back to the Library with nothing new seen: it opens as it was left
    expect(libraryStartGame(listed, origin)).toBeUndefined();
    // the same game's page again is a new view
    noteLibraryContext('game', 'cd:teddy', 3);
    expect(libraryStartGame(listed, origin)).toBe('teddy');
  });

  it('is none when the browser keeps nothing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    noteLibraryContext('game', 'cd:teddy', 1);
    expect(libraryStartGame(listed, origin)).toBeUndefined();
  });
});
