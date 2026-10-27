// The narration's spoken forms (spoken.ts): numbers, initialisms, names and typography, as the
// text-to-speech is handed them.
import { describe, expect, it } from 'vitest';
import { numberWords, sayNumber, spokenText } from './spoken';

describe('numberWords', () => {
  it('says whole numbers', () => {
    expect([0, 7, 13, 20, 66, 100, 286, 1000, 2005].map(numberWords)).toEqual([
      'zero',
      'seven',
      'thirteen',
      'twenty',
      'sixty-six',
      'one hundred',
      'two hundred eighty-six',
      'one thousand',
      'two thousand five',
    ]);
  });
  it('leaves what it cannot say as digits', () => expect(numberWords(1_000_000)).toBe('1000000'));
});

describe('sayNumber', () => {
  it('says years in halves', () => {
    expect(sayNumber('1994')).toBe('nineteen ninety-four');
    expect(sayNumber('1905')).toBe('nineteen oh five');
    expect(sayNumber('1900')).toBe('nineteen hundred');
    expect(sayNumber('2000')).toBe('two thousand');
    expect(sayNumber('2014')).toBe('twenty fourteen');
  });
  it('says the PC chips', () => {
    expect(sayNumber('286')).toBe('two eighty-six');
    expect(sayNumber('486')).toBe('four eighty-six');
    expect(sayNumber('100')).toBe('one hundred');
  });
});

describe('spokenText', () => {
  it('spells out what the voices got wrong', () => {
    expect(spokenText('It’s December 1994, and this PC dials the BBS.')).toBe("It's December nineteen ninety-four, and this PC dials the bee bee ess.");
    expect(spokenText('It boots DOS; type GM to play PLAYGAME.')).toBe('It boots doss; type G M to play Play Game.');
    expect(spokenText('THE CHEZ needs charging. Game-Maker was $89 on an old 286.')).toBe(
      'the Shay needs charging. Game Maker was eighty-nine dollars on an old two eighty-six.',
    );
    expect(spokenText('That’s drive A:. Its CD is in drive D:, 3½ inches…')).toBe("That's drive A. Its CD is in drive D, three and a half inches...");
    expect(spokenText('TURBO BUTTON and the GRAVITAS pad, with an OPL2 chip.')).toBe('Turbo Button and the Gravitas pad, with an O P L two chip.');
  });
  it('leaves typography to Kokoro, which reads it', () => expect(spokenText('I’m Gwinn… in 1994.', 'kokoro')).toBe('I’m Gwinn… in nineteen ninety-four.'));
  it('leaves plain words alone', () => expect(spokenText('Pick any tile and its game moves up top.')).toBe('Pick any tile and its game moves up top.'));
});
