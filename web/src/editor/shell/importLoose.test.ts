// Loose files with no game among them make a new game only when they look like game pieces.
import { describe, expect, it } from 'vitest';
import { looksLikeGamePieces } from './importLoose';

describe('looksLikeGamePieces', () => {
  it('accepts a game’s maps, blocks and palettes', () => {
    expect(looksLikeGamePieces(['notes.txt', 'level1.MAP'])).toBe(true);
    expect(looksLikeGamePieces(['x/hero.chr'])).toBe(true);
  });
  it('turns away a text file or a picture on its own', () => {
    expect(looksLikeGamePieces(['loose.txt'])).toBe(false);
    expect(looksLikeGamePieces(['cat.gif', 'readme.doc'])).toBe(false);
    expect(looksLikeGamePieces([])).toBe(false);
  });
});
