import { describe, expect, it } from 'vitest';
import { captionPieces } from './captionPieces';

describe('captionPieces', () => {
  it('keeps a short line whole', () => {
    expect(captionPieces('Nine one one, what is your emergency?')).toEqual(['Nine one one, what is your emergency?']);
  });

  it('cuts a long speech at sentence ends, in order, losing no words', () => {
    const text =
      'Save with F5 before trying a tricky stretch. Use different save slots so one unfortunate landing does not become family history. Teddy saves before jumping. Gwinn saves after saying, watch this.';
    const pieces = captionPieces(text);
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.every((p) => p.length <= 150)).toBe(true);
    expect(pieces.join(' ')).toBe(text);
  });

  it('gives back an empty line as itself', () => {
    expect(captionPieces('')).toEqual(['']);
  });
});
