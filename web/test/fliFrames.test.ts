// Tests: Editing FLI frames (formats/fliFrames.ts).
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { decodeFliFrames, encodeFliFrames, fitPicture } from '../src/formats/fliFrames';
import { parseFli } from '../src/formats/fli';

const gameware = resolve(__dirname, '../../cd/gameware');
const flis = existsSync(gameware)
  ? readdirSync(gameware).flatMap((d) =>
      readdirSync(join(gameware, d))
        .filter((f) => f.toLowerCase().endsWith('.fli'))
        .map((f) => join(gameware, d, f)),
    )
  : [];

describe('fli frames', () => {
  it('keeps a palette change on the frame where it happens', () => {
    const w = 8;
    const h = 4;
    const pal = (v: number) => new Uint8Array(768).fill(v);
    const frames = [
      { pixels: new Uint8Array(w * h).fill(1), palette: pal(10) },
      { pixels: new Uint8Array(w * h).fill(1), palette: pal(40) },
      { pixels: new Uint8Array(w * h).fill(2), palette: pal(40) },
    ];
    const back = decodeFliFrames(encodeFliFrames({ width: w, height: h, speed: 7, frames }));
    expect(back.speed).toBe(7);
    expect(back.frames.map((f) => f.palette[0])).toEqual([10, 40, 40]);
    expect(back.frames.map((f) => f.pixels[0])).toEqual([1, 1, 2]);
  });

  it('centers a picture on a frame', () => {
    const px = fitPicture(new Uint8Array([5, 6, 7, 8]), 2, 2, 4, 4);
    expect([...px]).toEqual([0, 0, 0, 0, 0, 5, 6, 0, 0, 7, 8, 0, 0, 0, 0, 0]);
    expect(fitPicture(new Uint8Array(16).fill(3), 4, 4, 2, 2)).toEqual(new Uint8Array(4).fill(3));
  });

  it.skipIf(!flis.length)('re-encodes every CD animation frame for frame', () => {
    for (const f of flis) {
      const a = decodeFliFrames(new Uint8Array(readFileSync(f)));
      const bytes = encodeFliFrames(a);
      const b = decodeFliFrames(bytes);
      expect(parseFli(bytes).frameCount, f).toBe(a.frames.length);
      expect(b.frames.length, f).toBe(a.frames.length);
      const same = (x: Uint8Array, y: Uint8Array) => x.length === y.length && x.every((v, i) => v === y[i]);
      b.frames.forEach((fr, i) => {
        expect(same(fr.pixels, a.frames[i].pixels), `${f} frame ${i} pixels`).toBe(true);
        expect(
          same(
            fr.palette,
            a.frames[i].palette.map((v) => v & 63),
          ),
          `${f} frame ${i} palette`,
        ).toBe(true);
      });
    }
  });
});
