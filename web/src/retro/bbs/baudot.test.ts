// The TTY's Baudot: codes with their LTRS and FIGS shifts, the bits and their timing.
import { describe, expect, it } from 'vitest';
import { BIT, baudotSeconds, baudotTones, CHAR_SECONDS, decodeBaudot, encodeBaudot, FIGS, LEAD_SECONDS, LTRS, MARK, SPACE, ttyText } from './baudot';

describe('Baudot', () => {
  it('starts in letters and codes A, F and a space as ITA2 does', () => {
    expect(encodeBaudot('A F')).toEqual([LTRS, 3, 4, 13]);
  });

  it('shifts to figures and back', () => {
    // 1 is 23 and 9 is 24 in figures; B is 25 in letters
    expect(encodeBaudot('19B')).toEqual([LTRS, FIGS, 23, 24, LTRS, 25]);
  });

  it('sends FIGS again after a space, for TTYs that unshift on space', () => {
    expect(encodeBaudot('1 2')).toEqual([LTRS, FIGS, 23, 4, FIGS, 19]);
  });

  it('ends a line with CR and LF', () => {
    expect(encodeBaudot('A\nB')).toEqual([LTRS, 3, 8, 2, 25]);
  });

  it('repeats the shift every 72 characters', () => {
    const codes = encodeBaudot('E'.repeat(80));
    expect(codes[0]).toBe(LTRS);
    expect(codes[73]).toBe(LTRS);
    expect(codes.length).toBe(82);
  });

  it('is capitals only, and drops what a TTY cannot send', () => {
    expect(ttyText('Hi there? <ok> #1')).toBe('HI THERE? OK 1');
    expect(decodeBaudot(encodeBaudot('How are you? GA'))).toBe('HOW ARE YOU? GA');
    expect(decodeBaudot(encodeBaudot('IT\'S $5.00 (OK): YES; 1/2 "HI" -!'))).toBe('IT\'S $5.00 (OK): YES; 1/2 "HI" -!');
  });

  it('runs at 45.45 baud: 22 ms bits, 7.5 bits a character, about 6 a second', () => {
    expect(BIT).toBeCloseTo(1 / 45.45, 4);
    expect(CHAR_SECONDS).toBeCloseTo(0.165, 6);
    expect(1 / CHAR_SECONDS).toBeCloseTo(6.06, 2);
    expect(baudotSeconds([LTRS, 3])).toBeCloseTo(LEAD_SECONDS + 0.33, 6);
  });

  it('keys a start bit, five bits low first, and a stop bit and a half', () => {
    // A is 00011: start (space), 1, 1, 0, 0, 0, then the stop (mark)
    const tones = baudotTones([3]);
    expect(tones.map((t) => t.freq)).toEqual([MARK, SPACE, MARK, SPACE, MARK]);
    const lens = tones.map((t) => Number(t.dur.toFixed(4)));
    expect(lens).toEqual([LEAD_SECONDS, BIT, 2 * BIT, 3 * BIT, 1.5 * BIT].map((n) => Number(n.toFixed(4))));
    const last = tones[tones.length - 1];
    expect(last.at + last.dur).toBeCloseTo(baudotSeconds([3]), 9);
  });
});
