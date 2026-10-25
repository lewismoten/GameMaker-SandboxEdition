// Tests for seededRandom.ts: each generator and the hash give the same numbers they always have,
// so walkthroughs, printables and pictures made with them never change.
import { describe, expect, it } from 'vitest';
import { fnv1a, mulberry32, xorshift32 } from './seededRandom';

describe('seeded random numbers', () => {
  it('runs Mulberry32 from its seed', () => {
    const r = mulberry32(1);
    expect([r(), r(), r()]).toEqual([0.6270739405881613, 0.002735721180215478, 0.5274470399599522]);
  });
  it('runs xorshift32 from its seed, taking 0 as 1', () => {
    const r = xorshift32(1994);
    expect([r(), r()]).toEqual([0.1242934144102037, 0.08624009252525866]);
    expect(xorshift32(0)()).toBe(xorshift32(1)());
  });
  it('hashes text with FNV-1a, unsigned', () => {
    expect(fnv1a('')).toBe(2166136261);
    expect(fnv1a('THE CHEZ')).toBe(3920996404);
  });
});
