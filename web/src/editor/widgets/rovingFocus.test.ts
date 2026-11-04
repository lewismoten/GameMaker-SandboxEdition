import { describe, expect, it } from 'vitest';
import { typeAheadIndex } from './rovingFocus';

describe('typeAheadIndex', () => {
  const l = ['ALPHA.GIF', 'BETA.GIF', 'BLOCK.BBL', 'CAT.FLI'];
  it('finds the next label that starts with the typed text', () => {
    expect(typeAheadIndex(l, 0, 'b')).toBe(1);
    expect(typeAheadIndex(l, 1, 'bl')).toBe(2);
  });
  it('wraps and repeats a letter to step on', () => {
    expect(typeAheadIndex(l, 3, 'a')).toBe(0);
    expect(typeAheadIndex(l, 1, 'bb')).toBe(2);
  });
  it('returns -1 when nothing matches or nothing typed', () => {
    expect(typeAheadIndex(l, 0, 'z')).toBe(-1);
    expect(typeAheadIndex(l, 0, '')).toBe(-1);
  });
});
