// flashMeter.ts: a strobe is counted, a slow blink and a small blink and a fade are not.
import { describe, expect, it } from 'vitest';
import { FlashMeter } from '../../games/kit/flashMeter';

/** A palette: 0 black, 1 white, 2 saturated red, 3 dark gray, 4 a little lighter gray, all 6-bit. */
const PAL = new Uint8Array(768);
PAL.set([63, 63, 63], 3);
PAL.set([63, 0, 0], 6);
PAL.set([10, 10, 10], 9);
PAL.set([14, 14, 14], 12);

const frame = (index: number, area = 1): Uint8Array => {
  const f = new Uint8Array(64000);
  f.fill(index, 0, Math.floor(64000 * area));
  return f;
};

/** One second of 60 frames flipping between `a` and `b` `perSecond` times (each way) for `seconds` seconds. */
function strobe(a: number, b: number, perSecond: number, seconds: number, area = 1): FlashMeter {
  const m = new FlashMeter(60);
  const half = 30 / perSecond;
  for (let i = 0; i < 60 * seconds; i++) m.push(frame(Math.floor(i / half) % 2 ? b : a, area), PAL);
  return m;
}

describe('FlashMeter', () => {
  it('counts a full-screen white and black strobe at 6 flashes a second', () => {
    expect(strobe(0, 1, 6, 2).general.worst.flashes).toBeGreaterThan(3);
  });
  it('lets 3 flashes a second through', () => {
    expect(strobe(0, 1, 3, 2).general.worst.flashes).toBeLessThanOrEqual(3);
  });
  it('lets a slow blink through', () => {
    expect(strobe(0, 1, 1, 4).general.worst.flashes).toBeLessThanOrEqual(1);
  });
  it('ignores a strobe of a small area', () => {
    expect(strobe(0, 1, 8, 2, 0.05).general.worst.flashes).toBe(0);
  });
  it('ignores a quick change between two near-equal grays', () => {
    expect(strobe(3, 4, 8, 2).general.worst.flashes).toBe(0);
  });
  it('counts a red strobe as a red flash', () => {
    expect(strobe(0, 2, 6, 2).red.worst.flashes).toBeGreaterThan(3);
  });
  it('does not count a fade as flashing', () => {
    const m = new FlashMeter(60);
    for (let i = 0; i < 60; i++) {
      const p = new Uint8Array(768);
      p.set([i, i, i], 3);
      m.push(frame(1), p);
    }
    expect(m.general.worst.flashes).toBe(0);
  });
});
