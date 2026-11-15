// midairRule: a held direct rise runs out only while its push a tick is not above gravity's cap (pixels a tick).
import { describe, expect, it } from 'vitest';
import { riseNeverRunsOut, ticksUntilStuck } from '../../games/kit/midairRule';

describe('midairRule', () => {
  it('judges a push against the 44-pixel gravity cap, not the 11-pixel move clamp', () => {
    for (const p of [4, 11, 12, 32, 43, 44]) expect(riseNeverRunsOut(p)).toBe(false);
    for (const p of [45, 48]) expect(riseNeverRunsOut(p)).toBe(true);
  });
  it('counts air ticks by gravity ticks', () => {
    expect(ticksUntilStuck(12, { gravityCap: 44, gravityTicks: 1 })).toBe(12);
    expect(ticksUntilStuck(12, { gravityCap: 44, gravityTicks: 3 })).toBe(36);
    expect(ticksUntilStuck(45)).toBe(Infinity);
  });
});
