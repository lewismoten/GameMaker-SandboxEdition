// Tests: decoding a GIF from only the bytes received so far (formats/gifProgressive.ts).
import { describe, expect, it } from 'vitest';
import { decodeGif } from '../src/formats/gif';
import { decodePartialGif, encodeGif89, partialPixels, storedRows } from '../src/formats/gifProgressive';

/** A 37x29 test picture: each row its own color, with some texture so LZW has work to do. */
function picture(w = 37, h = 29) {
  const pixels = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) pixels[y * w + x] = (y * 7 + ((x >> 2) & 1)) & 63;
  const palette = new Uint8Array(768);
  for (let i = 0; i < 64; i++) palette.set([i, 63 - i, (i * 5) & 63], i * 3);
  return { width: w, height: h, pixels, palette };
}

describe('progressive GIF', () => {
  it('lists interlaced rows in their four passes', () => {
    expect(storedRows(10, true).map((r) => r.y)).toEqual([0, 8, 4, 2, 6, 1, 3, 5, 7, 9]);
    expect(storedRows(10, true).map((r) => r.span)).toEqual([8, 8, 4, 2, 2, 1, 1, 1, 1, 1]);
    expect(storedRows(3, false)).toEqual([0, 1, 2].map((y) => ({ y, span: 1 })));
  });

  it('writes interlaced GIF89a files that decode to the same picture', () => {
    const img = picture();
    const bytes = encodeGif89(img, { interlaced: true, colors: 64, aspect: 38 });
    expect(String.fromCharCode(...bytes.subarray(0, 6))).toBe('GIF89a');
    expect(bytes[12]).toBe(38);
    const back = decodeGif(bytes);
    expect([...back.pixels]).toEqual([...img.pixels]);
    expect([...back.palette.subarray(0, 192)]).toEqual([...img.palette.subarray(0, 192)]);
    const whole = decodePartialGif(bytes)!;
    expect(whole.complete).toBe(true);
    expect(whole.colors).toBe(64);
    expect(whole.aspect).toBeCloseTo(53 / 64);
    expect([...partialPixels(whole)]).toEqual([...img.pixels]);
  });

  it('has nothing to show before the header and colors arrive', () => {
    const bytes = encodeGif89(picture(), { interlaced: true, colors: 64 });
    expect(decodePartialGif(bytes.subarray(0, 5))).toBeUndefined();
    expect(decodePartialGif(bytes.subarray(0, 13 + 100))).toBeUndefined();
  });

  it('fills in coarse to fine as more of an interlaced file arrives', () => {
    const img = picture(37, 29);
    const bytes = encodeGif89(img, { interlaced: true, colors: 64 });
    let last = -1;
    let sawCoarse = false;
    for (let n = 20; n <= bytes.length; n += 7) {
      const g = decodePartialGif(bytes.subarray(0, n));
      if (!g) continue;
      expect(g.received).toBeGreaterThanOrEqual(last);
      last = g.received;
      const shown = partialPixels(g, 255);
      // Once the first pass is in (rows 0, 8, 16, 24), every row shows something: a coarse copy
      // (rows 1-3 copy row 0 until row 2 arrives in the third pass).
      if (g.received >= 4 * 37 && g.received < 6 * 37) {
        sawCoarse = true;
        expect(shown.includes(255)).toBe(false);
        expect([...shown.subarray(3 * 37, 4 * 37)]).toEqual([...img.pixels.subarray(0, 37)]); // row 3 shows row 0
      }
      // Every stored row received is drawn where it belongs.
      const rows = storedRows(29, true);
      for (let i = 0; (i + 1) * 37 <= g.received; i++) {
        const y = rows[i].y;
        if (rows[i].span === 1) expect([...shown.subarray(y * 37, y * 37 + 37)]).toEqual([...img.pixels.subarray(y * 37, y * 37 + 37)]);
      }
    }
    expect(sawCoarse).toBe(true);
    expect(last).toBe(37 * 29);
  });

  it('draws a plain (not interlaced) file top down, the rest blank', () => {
    const img = picture(16, 12);
    const bytes = encodeGif89(img, { colors: 64 });
    const header = 13 + 64 * 3 + 10 + 1;
    const g = decodePartialGif(bytes.subarray(0, header + Math.floor((bytes.length - header) / 2)))!;
    expect(g.complete).toBe(false);
    expect(g.received).toBeGreaterThan(0);
    expect(g.received).toBeLessThan(16 * 12);
    const shown = partialPixels(g, 255);
    expect([...shown.subarray(0, g.received)]).toEqual([...img.pixels.subarray(0, g.received)]);
    expect(shown[16 * 12 - 1]).toBe(255);
  });
});
