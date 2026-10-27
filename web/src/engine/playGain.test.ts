// The points a play scored itself (playGain.ts): F6's loaded points never count again, however
// many loads, from wherever the save came, and whether it held more points or fewer.
import { describe, expect, it } from 'vitest';
import { gainAtEnd, gainAtLoad, newPlayGain } from './playGain';

describe('a play’s own points', () => {
  it('are the whole score when nothing was loaded', () => {
    expect(gainAtEnd(newPlayGain(), 4200)).toBe(4200);
  });

  it('leave out the points a save brought (one made in an earlier play)', () => {
    const g = newPlayGain();
    gainAtLoad(g, 0, 3000); // F6 right away: the save's 3,000 were counted when that play ended
    expect(gainAtEnd(g, 6000)).toBe(3000);
  });

  it('keep what was scored before the load, then count on from the loaded score', () => {
    const g = newPlayGain();
    gainAtLoad(g, 5000, 3000); // scored 5,000, then loaded a 3,000 save made earlier in this play
    expect(gainAtEnd(g, 6000)).toBe(8000); // as if the load had begun a play of its own
  });

  it('add up over several loads', () => {
    const g = newPlayGain();
    gainAtLoad(g, 1000, 500);
    gainAtLoad(g, 900, 2000);
    gainAtLoad(g, 2600, 0);
    // 1,000 + 400 + 600 + 700
    expect(gainAtEnd(g, 700)).toBe(2700);
  });

  it('never count a save with more points than the play had, nor take points away', () => {
    const g = newPlayGain();
    gainAtLoad(g, 200, 90_000); // a save made at a higher score (or from another game)
    expect(gainAtEnd(g, 90_000)).toBe(200);
    expect(gainAtEnd(g, 80_000)).toBe(200); // ending below the loaded score
    expect(gainAtEnd(g, 90_150)).toBe(350);
  });
});
