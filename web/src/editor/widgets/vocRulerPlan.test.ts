import { describe, expect, it } from 'vitest';
import { rulerPlan } from './vocRulerPlan';

describe('rulerPlan', () => {
  it('has no zones for a short sound', () => {
    const p = rulerPlan(5000, 11025);
    expect(p.yellowAt).toBe(1);
    expect(p.redAt).toBe(1);
    expect(p.limitAt).toBeUndefined();
    expect(p.ticks.length).toBe(8);
  });
  it('puts yellow, red and 64 KB in order for a long one', () => {
    const p = rulerPlan(70_000, 11025);
    expect(p.yellowAt).toBeLessThan(p.redAt);
    expect(p.redAt).toBeLessThan(p.limitAt!);
    expect(p.limitAt).toBeLessThan(1);
    expect(p.ticks).toEqual([]);
    expect(p.seconds.length).toBe(6);
  });
});
