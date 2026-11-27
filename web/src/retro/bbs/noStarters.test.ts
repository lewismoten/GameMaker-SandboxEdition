// The BBSes list no Starters: they live only on the desk's Sample CD.
import { describe, expect, it, vi } from 'vitest';
import type { CatalogEntry } from '../../project/files';
import * as starter from '../../project/starter';
import { sandboxLibrary } from './sandbox';
import { sofaLibrary } from './sofaFiles';

const game = (id: string, over: Partial<CatalogEntry> = {}) =>
  ({ id, title: id.toUpperCase(), kind: 'shareware', path: id, gam: `${id}.gam`, original: {}, ...over }) as unknown as CatalogEntry;

describe('BBS file areas leave out the Starters', () => {
  const cat = [game('orb'), game('first-steps', { series: 'starter' }), game('keys-and-doors', { series: 'starter' }), game('bard', { series: 'bizarre' })];
  it('the Sandbox BBS lists no Starter, and the count matches', () => {
    const ids = sandboxLibrary(cat).map((g) => g.id);
    expect(ids).toEqual(['orb', 'bard']);
  });
  it('The Sofa checks Starter eligibility once for an eligible upload', () => {
    const check = vi.spyOn(starter, 'isStarterGame');
    try {
      const upload = game('bard', { company: 'The Bard of Bizarre' });
      expect(sofaLibrary([upload])).toEqual([upload]);
      expect(check).toHaveBeenCalledTimes(1);
    } finally {
      check.mockRestore();
    }
  });
  it('The Sofa lists no Starter', () => {
    expect(sofaLibrary(cat).some((g) => g.series === 'starter')).toBe(false);
  });
});
