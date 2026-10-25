// Tests: when the listings must change because a secret game was revealed or hidden again (project/catalogWatch.ts).
import { describe, expect, it } from 'vitest';
import { catalogStale } from '../src/project/catalogWatch';

describe('catalogStale', () => {
  it('waits until a list has been given out', () => {
    expect(catalogStale(undefined, 1)).toBe(false);
    expect(catalogStale(undefined, 0)).toBe(false);
  });

  it('changes the listings only when the eggs or the hearts say otherwise', () => {
    expect(catalogStale(0, 1)).toBe(true);
    expect(catalogStale(1, 0)).toBe(true);
    expect(catalogStale(1, 1)).toBe(false);
    expect(catalogStale(0, 0)).toBe(false);
    // the hearts found as well as the eggs: the hearts' game shows now too
    expect(catalogStale(1, 3)).toBe(true);
    expect(catalogStale(2, 2)).toBe(false);
  });
});
