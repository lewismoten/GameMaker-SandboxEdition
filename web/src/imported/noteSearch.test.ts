// The Library's notes list: games here with a rating or note, then removed ones, found by any
// words of their name, note, source or fingerprint.
import { describe, expect, it } from 'vitest';
import { noteEntries, searchNotes } from './noteSearch';

const live = [
  { id: 'p1', name: 'Zark' },
  { id: 'p2', name: 'Alpha' },
  { id: 'p3', name: 'No notes' },
];
const notes = {
  p1: { rating: 4 as const, note: 'Great secret room on level 2', source: 'zips/zark.zip' },
  p2: { note: 'Needs the CD music' },
  p3: { source: 'zips/plain.zip' },
};
const removed = [
  { id: 'old', name: 'Space', fingerprint: { gam: [0xabc] }, note: 'Broken test level', rating: 1 as const, removed: 100, source: 'zapak.zip' },
  { id: 'old2', name: 'Shorty', fingerprint: { gam: [0xdef] }, removed: 200 },
];

describe('noteEntries', () => {
  it('lists the games here with a rating or note A to Z, then the removed ones newest first', () => {
    const e = noteEntries(live, notes, removed);
    expect(e.map((x) => [x.name, x.rating, x.removed])).toEqual([
      ['Alpha', 0, undefined],
      ['Zark', 4, undefined],
      ['Shorty', 0, 200],
      ['Space', 1, 100],
    ]);
  });
});

describe('searchNotes', () => {
  const e = noteEntries(live, notes, removed);
  const find = (q: string) => searchNotes(e, q).map((x) => x.name);

  it('finds by any words of the note, name or source, in any order and case', () => {
    expect(find('secret LEVEL')).toEqual(['Zark']);
    expect(find('level')).toEqual(['Zark', 'Space']);
    expect(find('zapak.zip')).toEqual(['Space']);
    expect(find('alpha')).toEqual(['Alpha']);
  });

  it('finds removed games by the word, and by fingerprint', () => {
    expect(find('removed')).toEqual(['Shorty', 'Space']);
    expect(find('00000abc')).toEqual(['Space']);
  });

  it('gives everything for an empty search, and nothing when a word is missing', () => {
    expect(find('  ')).toHaveLength(4);
    expect(find('secret nowhere')).toEqual([]);
  });
});
