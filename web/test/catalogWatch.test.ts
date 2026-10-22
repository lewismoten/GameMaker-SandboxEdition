// Tests: when the listings must change because a secret game was revealed or hidden again (project/catalogWatch.ts).
import { describe, expect, it } from 'vitest';
import { catalogStale } from '../src/project/catalogWatch';

describe('catalogStale', () => {
  it('waits until a list has been given out', () => {
    expect(catalogStale(undefined, true)).toBe(false);
    expect(catalogStale(undefined, false)).toBe(false);
  });

  it('changes the listings only when the eggs say otherwise', () => {
    expect(catalogStale(false, true)).toBe(true);
    expect(catalogStale(true, false)).toBe(true);
    expect(catalogStale(true, true)).toBe(false);
    expect(catalogStale(false, false)).toBe(false);
  });
});
