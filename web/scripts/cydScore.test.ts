// Scoring policy regressions: simple movement, buttons, timing and ledges.
import { describe, expect, it } from 'vitest';
import { scoreCyd, type CydMetrics } from './cydScore';

const simple: CydMetrics = {
  presses: 20,
  spaceEnterShare: 0,
  extraShare: 0,
  changesPerSecond: 0,
  peakChangesPerSecond: 0,
  jumps: 0,
  narrowJumps: 0,
  narrowLandings: 0,
};
describe('CYD scoring', () => {
  it('gives simple movement the top score', () => expect(scoreCyd(simple)).toEqual({ score: 100, reasons: [] }));
  it('penalizes frequent buttons and extra keys equally', () => {
    expect(scoreCyd({ ...simple, spaceEnterShare: 1 }).score).toBe(65);
    expect(scoreCyd({ ...simple, extraShare: 1 }).score).toBe(65);
    expect(scoreCyd({ ...simple, spaceEnterShare: 0.1 }).score).toBe(97);
  });
  it('penalizes narrow timing and narrow ledges independently', () => {
    expect(scoreCyd({ ...simple, jumps: 2, narrowJumps: 2 }).score).toBe(90);
    expect(scoreCyd({ ...simple, narrowLandings: 2 }).score).toBe(96);
  });
  it('includes bursts even when the mean is low', () => {
    expect(scoreCyd({ ...simple, peakChangesPerSecond: 8 }).score).toBe(95);
    expect(scoreCyd({ ...simple, changesPerSecond: 2 }).score).toBe(90);
  });
  it('caps individual penalties and clamps the result', () => {
    expect(scoreCyd({ ...simple, narrowJumps: 100 }).score).toBe(75);
    expect(
      scoreCyd({ ...simple, spaceEnterShare: 0.5, extraShare: 0.5, changesPerSecond: 30, peakChangesPerSecond: 30, narrowJumps: 100, narrowLandings: 100 })
        .score,
    ).toBe(0);
  });
});
