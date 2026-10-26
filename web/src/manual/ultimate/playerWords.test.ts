// The Ultimate Owner's Guide's table of the player's own words: every row is really in the CD's
// XFERPLAY.EXE, at its offset, its length long, and ended by a 0 (a whole string, not a piece).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLAYER_WORDS } from './playerWords';

const exe = readFileSync(new URL('../../../../cd/gm/xferplay.exe', import.meta.url));

describe('the player’s own words', () => {
  it('lists each word where XFERPLAY.EXE keeps it', () => {
    expect(exe.length).toBe(160_598);
    for (const w of PLAYER_WORDS) {
      expect(w.text.length, w.text).toBe(w.length);
      expect(exe.subarray(w.offset, w.offset + w.length).toString('latin1'), w.text).toBe(w.text);
      expect(exe[w.offset + w.length], w.text).toBe(0);
      expect(exe[w.offset - 1], w.text).toBe(0);
    }
  });

  it('lists them in file order, once each', () => {
    const offsets = PLAYER_WORDS.map((w) => w.offset);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(new Set(offsets).size).toBe(offsets.length);
  });
});
