// Time field descriptions carry rounded units and distinguish disabled timers from frame minima.
import { describe, expect, it } from 'vitest';
import { durationText, tickDuration } from '../src/editor/core/duration';

describe('readable durations', () => {
  it('expresses hours through milliseconds with expanded words available', () => {
    expect(durationText(18062030)).toBe('5 h 1 min 2 s 30 ms');
    expect(durationText(18062030, true)).toBe('5 hours, 1 minute, 2 seconds, 30 milliseconds');
    expect(durationText(59999.6)).toBe('1 min');
    expect(durationText(0)).toBe('0 s');
  });
  it('converts each clock and respects zero timers and minimum frame lengths', () => {
    expect(tickDuration(182, { rate: 18.2 })).toBe('10 s');
    expect(tickDuration(1, { rate: 18.2 }, true)).toBe('55 milliseconds');
    expect(tickDuration(0, { rate: 18.2, minimum: 1 })).toBe('55 ms');
    expect(tickDuration(0, { rate: 18.2, zero: 'Never' })).toBe('Never');
    expect(tickDuration(146, { rate: 146 })).toBe('1 s');
    expect(tickDuration(2, { rate: 0 })).toBe('Unknown duration');
    expect(durationText(NaN)).toBe('Unknown duration');
  });
});
