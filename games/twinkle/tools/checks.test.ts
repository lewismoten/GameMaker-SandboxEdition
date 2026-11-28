// The sky and replay checks must reject failures even when their other observations look right.
import { describe, expect, it } from 'vitest';
import { hasChanged, replayFailure } from './checks';

describe('twinkle checks', () => {
  it('requires a star to change across ticks, not just different stars in one tick', () => {
    expect(
      hasChanged([
        [0, 1, 2],
        [0, 1, 2],
      ]),
    ).toBe(false);
    expect(
      hasChanged([
        [0, 1, 2],
        [1, 1, 2],
      ]),
    ).toBe(true);
  });

  it('rejects replay errors even when scenes and remaining keys match', () => {
    expect(replayFailure({ scenes: [2, 3], keysLeft: 0, error: 'playback failed' })).toBeTruthy();
    expect(replayFailure({ scenes: [2, 3], keysLeft: 0 })).toBeFalsy();
  });
});
