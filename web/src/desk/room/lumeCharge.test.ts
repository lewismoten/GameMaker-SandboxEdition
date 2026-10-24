// The wall clock's lume: charges quickly in the light, fades slowly in the dark.
import { describe, expect, it } from 'vitest';
import { LUME_VISIBLE, nextCharge } from './lumeCharge';

const run = (charge: number, lit: boolean, seconds: number) => {
  for (let i = 0; i < seconds; i++) charge = nextCharge(charge, lit, 1);
  return charge;
};

describe('the wall clock’s lume paint', () => {
  it('charges nearly full in ten seconds of light', () => {
    expect(run(0, true, 10)).toBeGreaterThan(0.9);
  });

  it('still glows a minute after the light goes off, and is gone within a few minutes', () => {
    expect(run(1, false, 60)).toBeGreaterThan(0.3);
    expect(run(1, false, 240)).toBeLessThan(LUME_VISIBLE);
  });
});
