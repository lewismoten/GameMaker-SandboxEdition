// The voice check's comparison (compare.ts): which differences between a line's words and what
// Whisper heard a listener would notice. Made-up transcripts; Whisper never runs in tests.
import { describe, expect, it } from 'vitest';
import { compareSpeech, plainWords, wordDiff } from './compare';

const misses = (written: string, heard: string, spoken?: string) =>
  compareSpeech(written, heard, spoken).misses.map((h) => `${h.said.join(' ')} > ${h.heard.join(' ')}`);

describe('plainWords', () => {
  it('lowercases, drops punctuation and says numbers', () => {
    expect(plainWords('It’s December 1994: $89!')).toEqual(['its', 'december', 'nineteen', 'ninety', 'four', 'eighty', 'nine', 'dollars']);
    expect(plainWords('an old two hundred and six')).toEqual(['an', 'old', 'to', 'hundred', 'six']);
  });
  it('joins letters said one at a time', () => {
    expect(plainWords('dial a B.B.S. now')).toEqual(['dial', 'a', 'bbs', 'now']);
    expect(plainWords('dial a B B S')).toEqual(['dial', 'a', 'bbs']);
  });
  it('says "a hundred" as "one hundred"', () => expect(plainWords('a hundred by 100')).toEqual(['one', 'hundred', 'by', 'one', 'hundred']));
  it('spells sound-alikes one way', () => expect(plainWords('Louie put the disc in, too')).toEqual(['lewie', 'put', 'the', 'disk', 'in', 'to']));
});

describe('wordDiff', () => {
  it('finds dropped, added and changed words', () => {
    const h = wordDiff(['theme', 'goes', 'dark'], ['goes', 'dark', 'now']);
    expect(h.map((x) => [x.said, x.heard])).toEqual([
      [['theme'], []],
      [[], ['now']],
    ]);
  });
  it('ignores words only split differently', () => expect(wordDiff(['game', 'maker', 'box'], ['gamemaker', 'box'])).toEqual([]));
});

describe('compareSpeech', () => {
  it('passes a clip that says its words', () => {
    expect(misses('The 1994 desk: dial a BBS.', 'The nineteen ninety-four desk, dial a BBS.')).toEqual([]);
    expect(misses('Hi! I’m Lewie. Game-Maker is here.', 'Hi, I am Louie. GameMaker is here.')).toEqual([]);
  });
  it('flags a cut-off year, a misread number and a mumbled initialism', () => {
    expect(misses('That was back in 1994.', 'That was back in nineteen ninety.')).toEqual(['four > ']);
    expect(misses('like an old 286.', 'like an old 206.')).toEqual(['eighty > hundred']);
    expect(misses('even the BBS.', 'even the BBA.')).toEqual(['bbs > bba']);
    expect(misses('Theme goes dark.', 'goes dark.')).toEqual(['theme > ']);
  });
  it('counts little words and plurals as small', () => {
    const r = compareSpeech('Play it with the keyboard. Links shows the doors.', 'Play it with a keyboard. Link shows the doors.');
    expect(r.misses).toEqual([]);
    expect(r.small).toHaveLength(2);
  });
  it('accepts a take that says its spoken form', () => {
    expect(misses('THE CHEZ needs charging.', 'The chairs need charging.', 'the Shay needs charging.')).toEqual(['chez needs > chairs need']);
    expect(misses('Theme goes dark.', 'The theme button goes dark.', 'The Theme button goes dark.')).toEqual([]);
  });
});
