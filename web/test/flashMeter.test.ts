// flashMeter.ts: a strobe is counted, a slow blink and a small blink and a fade are not.
import { describe, expect, it } from 'vitest';
import { FlashMeter, LocalFlashMeter } from '../../games/kit/flashMeter';

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
  it('ignores a scroll of stripes, which moves as many pixels lighter as darker', () => {
    const m = new FlashMeter(60);
    for (let i = 0; i < 120; i++) {
      const f = new Uint8Array(64000);
      for (let k = 0; k < 64000; k++) f[k] = Math.floor(((k % 320) + i) / 4) % 2;
      m.push(f, PAL);
    }
    expect(m.general.worst.flashes).toBe(0);
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

/** Frames of `seconds` seconds where a 30x30 patch at (100,60) takes the colors from `colors(i)`. */
function patch(colors: (i: number) => number, seconds: number): LocalFlashMeter {
  const m = new LocalFlashMeter(60);
  for (let i = 0; i < 60 * seconds; i++) {
    const f = new Uint8Array(64000);
    for (let y = 60; y < 90; y++) f.fill(colors(i), y * 320 + 100, y * 320 + 130);
    m.push(f, PAL);
  }
  return m;
}

describe('LocalFlashMeter', () => {
  it('catches a small patch blinking six times a second, which the area rule lets through', () => {
    const m = patch((i) => Math.floor(i / 5) % 2, 2);
    expect(m.worst.flashes).toBeGreaterThan(3);
    expect(m.worst.x).toBeGreaterThanOrEqual(90);
    expect(m.worst.x).toBeLessThanOrEqual(110);
  });
  it('lets a patch blinking twice a second through', () => {
    expect(patch((i) => Math.floor(i / 15) % 2, 3).worst.flashes).toBeLessThanOrEqual(2);
  });
  it('counts a zigzag of small steps in one direction once, and every turn of a real back-and-forth', () => {
    // 0 -> 3 -> 4: small steps up (dark grays), then back down to black: one flash, not none, not many
    const m = patch((i) => (i < 30 ? 0 : i < 31 ? 3 : i < 32 ? 4 : i < 33 ? 3 : i < 34 ? 4 : 0), 1);
    expect(m.worst.flashes).toBeLessThanOrEqual(1);
  });
  it('ignores a near-equal gray swap and a fade', () => {
    expect(patch((i) => (i % 4 < 2 ? 3 : 4), 2).worst.flashes).toBe(0);
    const f = new LocalFlashMeter(60);
    for (let i = 0; i < 60; i++) {
      const p = new Uint8Array(768);
      p.set([i, i, i], 3);
      f.push(frame(1), p);
    }
    expect(f.worst.flashes).toBeLessThanOrEqual(1);
  });
});
