import { describe, expect, it } from 'vitest';
import { byWalkPercent, keptBadge, walkLabel, walkPercent } from './walkBadge';
import { emptyCompanion, setSection } from '../project/companion';

describe('walk badge', () => {
  it('reads a kept walkthrough, complete or partial, and none without frames', () => {
    const c = emptyCompanion();
    expect(keptBadge(c, 'A.GAM')).toBeUndefined();
    setSection(c, 'A.GAM', 'walkthrough', { won: false, walk: { timeline: { frames: 'x' } }, scenes: [{ strategy: 1 }, { strategy: 1 }, {}, {}] });
    expect(keptBadge(c, 'A.GAM')).toEqual({ complete: false, won: 2, total: 4 });
    setSection(c, 'A.GAM', 'walkthrough', { won: true, walk: { timeline: { frames: 'x' } }, scenes: [{ strategy: 1 }, { strategy: 1 }] });
    expect(keptBadge(c, 'A.GAM')).toEqual({ complete: true, won: 2, total: 2 });
  });
  it('sorts complete first, then by share won, then none', () => {
    const list = [undefined, { complete: false, won: 1, total: 4 }, { complete: true, won: 3, total: 3 }, { complete: false, won: 3, total: 4 }];
    expect([...list].sort(byWalkPercent).map(walkPercent)).toEqual([100, 75, 25, -1]);
    expect(walkLabel(list[1]!)).toBe('Walkthrough: 1 of 4 scenes');
  });
});
