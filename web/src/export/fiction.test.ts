import { describe, expect, it } from 'vitest';
import { fictionNote } from './fiction';

describe('the note on our own games', () => {
  it('says when one was made and the year it pretends to be from', () => {
    expect(fictionNote({ original: {}, year: 1996 })).toBe('Made in 2026 for Game-Maker: Sandbox Edition; presented as a fictional 1996 release.');
    expect(fictionNote({ original: {} })).toBe('Made in 2026 for Game-Maker: Sandbox Edition; presented as a fictional 1990s release.');
  });

  it('leaves the 1990s games by other authors and RSD’s samples alone', () => {
    expect(fictionNote({ year: 1993 })).toBeUndefined();
  });
});
