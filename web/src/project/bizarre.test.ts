// The Bard of Bizarre collection: which games are the Bard's, and when they get a tab of their own.
import { describe, expect, it } from 'vitest';
import { BARD, BIZARRE_MIN, hasBizarreTab, isBizarreGame } from './bizarre';

const bard = (n: number) => Array.from({ length: n }, () => ({ original: {}, series: 'bizarre', company: BARD }));
const others = [{ original: {}, company: 'Sandbox Software' }, { company: BARD }, { series: 'bizarre' }];

describe('The Bard of Bizarre collection', () => {
  it('knows the Bard’s games by their series or, in an older catalog, their publisher', () => {
    expect(isBizarreGame({ original: {}, series: 'bizarre' })).toBe(true);
    expect(isBizarreGame({ original: {}, company: BARD })).toBe(true);
    expect(isBizarreGame({ original: {}, company: 'Sandbox Software' })).toBe(false);
    // only games built in ../games
    expect(isBizarreGame({ company: BARD })).toBe(false);
  });

  it('gets a tab of its own only with four or more games', () => {
    expect(BIZARRE_MIN).toBe(4);
    expect(hasBizarreTab([...bard(1), ...others])).toBe(false);
    expect(hasBizarreTab([...bard(3), ...others])).toBe(false);
    expect(hasBizarreTab([...bard(4), ...others])).toBe(true);
    expect(hasBizarreTab(bard(6))).toBe(true);
  });
});
