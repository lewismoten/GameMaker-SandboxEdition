// Tests: encodeFli's `runs` option (run packets inside changed spans) decodes to the same frames.
import { describe, expect, it } from 'vitest';
import { applyFliFrame, encodeFli, newFliCanvas, parseFli } from '../src/formats/fli';

/** Drawn-art frames: stripes, solid blocks, a noisy patch, and a moving box. */
function frames(): Uint8Array[] {
  const out: Uint8Array[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) & 255;
  for (let f = 0; f < 6; f++) {
    const px = new Uint8Array(320 * 200);
    for (let y = 0; y < 200; y++)
      for (let x = 0; x < 320; x++) px[y * 320 + x] = f === 0 ? 0 : y < 100 ? 1 + ((x >> 3) % 4) + f : x > 200 && y > 150 ? rnd() : 9;
    for (let y = 20; y < 60; y++) for (let x = 10 + f * 30; x < 60 + f * 30; x++) px[y * 320 + x] = (x + y) % 2 ? 40 : 41;
    out.push(px);
  }
  return out;
}

describe('encodeFli runs', () => {
  it('decodes to the same pictures as plain deltas, in fewer bytes', () => {
    const pal = new Uint8Array(768).map((_, i) => i % 64);
    const fs = frames();
    const plain = encodeFli(fs, pal, { speed: 5 });
    const packed = encodeFli(fs, pal, { speed: 5, runs: true });
    expect(packed.length).toBeLessThan(plain.length);
    const anim = parseFli(packed);
    const canvas = newFliCanvas(anim);
    for (let i = 0; i < fs.length; i++) {
      applyFliFrame(anim, i, canvas);
      expect(
        canvas.pixels.every((v, k) => v === fs[i][k]),
        `frame ${i}`,
      ).toBe(true);
    }
  });
});
