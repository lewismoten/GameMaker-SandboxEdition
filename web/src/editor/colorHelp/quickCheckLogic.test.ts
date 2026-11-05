import { describe, expect, it } from 'vitest';
import { deltaEBytes, simulateBytes, type Vision } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import { SCREENS, suggest } from './quickCheckLogic';

const VIS: Record<'rg' | 'by', Vision[]> = { rg: ['protan', 'deutan'], by: ['tritan'] };

describe('quick color check', () => {
  it('has 4 to 6 screens, each with a tile that normal vision can tell apart', () => {
    expect(SCREENS.length).toBeGreaterThanOrEqual(4);
    expect(SCREENS.length).toBeLessThanOrEqual(6);
    for (const s of SCREENS) expect(deltaEBytes(s.base, s.odd)).toBeGreaterThan(20);
  });
  it('each odd tile looks like the rest in the simulation its screen is about', () => {
    for (const s of SCREENS) {
      const closest = Math.min(...VIS[s.kind].map((v) => deltaEBytes(simulateBytes(s.base, v), simulateBytes(s.odd, v))));
      expect(closest).toBeLessThan(7);
    }
  });
  it('suggests nothing when every odd tile was found', () => {
    expect(suggest(SCREENS.map((s) => s.at))).toBeUndefined();
  });
  it('one miss is not enough to suggest anything', () => {
    const a = SCREENS.map((s) => s.at);
    a[0] = -1;
    expect(suggest(a)).toBeUndefined();
  });
  it('suggests red-green after two red-green misses, blue-yellow after two blue-yellow ones', () => {
    const miss = (kind: string) => SCREENS.map((s) => (s.kind === kind ? -1 : s.at));
    expect(suggest(miss('rg'))).toMatchObject({ warn: 'rg', preview: 'rg', names: true });
    expect(suggest(miss('by'))).toMatchObject({ warn: 'by', preview: 'by' });
    expect(suggest(SCREENS.map(() => -1))).toMatchObject({ warn: 'both', preview: 'all' });
  });
  it('a wrong tile counts as a miss', () => {
    const a = SCREENS.map((s) => (s.kind === 'rg' ? (s.at + 1) % 9 : s.at));
    expect(suggest(a)?.warn).toBe('rg');
  });
});
