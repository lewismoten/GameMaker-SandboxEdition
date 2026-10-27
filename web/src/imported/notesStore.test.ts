// Imported games' ratings and notes in storage, the record kept when one is removed, and
// knowing the same game again by its fingerprint when it is imported later.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fingerprintOf, fingerprintOfFiles, fingerprintText, sameGame } from './fingerprint';
import { allNotes, noteOf, ratingOf, setNote } from './gameNotes';
import { forgetRemoved, removedGames, removedMatch } from './removedGames';
import { noteImport, noteRemoval, undoRemoval } from './noteMoves';
import { crc32 } from '../project/zip';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
});

const zapak = fingerprintOf({ gamCrcs: [0x2222, 0x1111], playerCrcs: [0xabcd] });

describe('fingerprints', () => {
  it('are the .gam and player CRCs, in any order, and say so', () => {
    expect(zapak).toEqual({ gam: [0x1111, 0x2222], exe: [0xabcd] });
    expect(fingerprintText(zapak)).toBe('GAM 00001111, 00002222 · EXE 0000ABCD');
    expect(sameGame(zapak, fingerprintOf({ gamCrcs: [0x1111, 0x2222], playerCrcs: [0xabcd] }))).toBe(true);
  });

  it('tell games apart by a different .gam or player, but not by a player that was never known', () => {
    expect(sameGame(zapak, fingerprintOf({ gamCrcs: [0x1111, 0x2222], playerCrcs: [0xeeee] }))).toBe(false);
    expect(sameGame(zapak, fingerprintOf({ gamCrcs: [0x1111] }))).toBe(false);
    const stored = fingerprintOfFiles({ 'a.gam': new Uint8Array([1]), 'a.pal': new Uint8Array([2]) });
    expect(stored).toEqual({ gam: [crc32(new Uint8Array([1]))] });
    expect(sameGame(stored, fingerprintOf({ gamCrcs: [crc32(new Uint8Array([1]))], playerCrcs: [5] }))).toBe(true);
    // no .gam: nothing to know it by
    expect(sameGame({ gam: [] }, { gam: [] })).toBe(false);
  });
});

describe('ratings and notes', () => {
  it('are kept by project id, Unrated and empty notes dropped', () => {
    setNote('p1', { rating: 4, note: 'Good jumps' });
    expect(noteOf('p1')).toEqual({ rating: 4, note: 'Good jumps' });
    expect(ratingOf('p1')).toBe(4);
    setNote('p1', { rating: 0 });
    expect(noteOf('p1')).toEqual({ note: 'Good jumps' });
    setNote('p1', { note: '  ' });
    expect(allNotes()).toEqual({});
    expect(ratingOf('nobody')).toBe(0);
  });

  it('survive damaged storage as none', () => {
    store.set('gm-imported-notes', '{oops');
    expect(noteOf('p1')).toEqual({});
  });
});

describe('removed games', () => {
  it('keep the fingerprint, name, source, rating, note and date, and are known again on a later import', () => {
    noteImport('p1', 'zips/zapak.zip', zapak);
    setNote('p1', { rating: 2, note: 'Too hard' });
    noteRemoval({ id: 'p1', name: 'ZAPAK 1' });
    expect(noteOf('p1')).toEqual({});
    const [r] = removedGames();
    expect(r).toMatchObject({ id: 'p1', name: 'ZAPAK 1', source: 'zips/zapak.zip', fingerprint: zapak, rating: 2, note: 'Too hard' });
    expect(typeof r.removed).toBe('number');
    expect(removedMatch(fingerprintOf({ gamCrcs: [0x1111, 0x2222], playerCrcs: [0xabcd] }))?.id).toBe('p1');
    expect(removedMatch(fingerprintOf({ gamCrcs: [0x9999] }))).toBeUndefined();
    // imported again: the rating and note come back, and the record goes
    expect(noteImport('p2', 'more/zapak.zip', zapak)?.id).toBe('p1');
    expect(noteOf('p2')).toEqual({ source: 'more/zapak.zip', fingerprint: zapak, rating: 2, note: 'Too hard' });
    expect(removedGames()).toEqual([]);
  });

  it('fingerprint a game imported before fingerprints were kept from its files', () => {
    noteRemoval({ id: 'old', name: 'Old' }, { 'old.gam': new Uint8Array([7]) });
    expect(removedGames()[0].fingerprint).toEqual({ gam: [crc32(new Uint8Array([7]))] });
  });

  it('keep one record a game, newest first, and forget one when asked', () => {
    noteRemoval({ id: 'a', name: 'A' }, { 'a.gam': new Uint8Array([1]) });
    noteRemoval({ id: 'b', name: 'B' }, { 'b.gam': new Uint8Array([2]) });
    // the same game as a, removed again under another id
    noteRemoval({ id: 'a2', name: 'A again' }, { 'a.gam': new Uint8Array([1]) });
    expect(removedGames().map((r) => r.id)).toEqual(['a2', 'b']);
    forgetRemoved('b');
    expect(removedGames().map((r) => r.id)).toEqual(['a2']);
  });

  it('give the rating and note back on Undo', () => {
    setNote('p1', { rating: 5, note: 'Best one' });
    noteRemoval({ id: 'p1', name: 'P' }, { 'p.gam': new Uint8Array([3]) });
    undoRemoval('p1');
    expect(noteOf('p1')).toMatchObject({ rating: 5, note: 'Best one' });
    expect(removedGames()).toEqual([]);
  });
});
