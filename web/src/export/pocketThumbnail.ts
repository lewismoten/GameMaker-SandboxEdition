// Build a single indexed PTH1 preview; ESP32 never decodes source animations.
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { titlePixels } from '../gfx/titlePicture';
import { firstLevels, levelPixels } from '../gfx/levelPicture';
import type { PocketSource } from './pocketPack';

/**
 * The picture's 320x200 pixels (or any size) boxed down to 96x60: each output pixel is the average of the source pixels it covers
 * (so a title's lettering stays readable instead of dropping every other pixel), then cut to 256 RGB565 colors (median cut).
 */
function shrink(pic: { width: number; height: number; pixels: Uint8Array; palette: Uint8Array }) {
  const v8 = (c: number) => ((c & 63) << 2) | ((c & 63) >> 4);
  const rgb: number[][] = [];
  for (let y = 0; y < 60; y++)
    for (let x = 0; x < 96; x++) {
      const x0 = Math.floor((x * pic.width) / 96),
        x1 = Math.max(x0 + 1, Math.floor(((x + 1) * pic.width) / 96)),
        y0 = Math.floor((y * pic.height) / 60),
        y1 = Math.max(y0 + 1, Math.floor(((y + 1) * pic.height) / 60));
      const sum = [0, 0, 0];
      for (let yy = y0; yy < y1; yy++)
        for (let xx = x0; xx < x1; xx++) for (let k = 0; k < 3; k++) sum[k] += v8(pic.palette[pic.pixels[yy * pic.width + xx] * 3 + k]);
      const n = (x1 - x0) * (y1 - y0);
      rgb.push(sum.map((v) => Math.round(v / n)));
    }
  // median cut: split the box with the widest channel range at its median until there are 256
  const boxes: number[][] = [rgb.map((_, i) => i)];
  const range = (b: number[], k: number) => {
    let lo = 255,
      hi = 0;
    for (const i of b) ((lo = Math.min(lo, rgb[i][k])), (hi = Math.max(hi, rgb[i][k])));
    return hi - lo;
  };
  while (boxes.length < 256) {
    let best = -1,
      bestK = 0,
      bestR = 0;
    boxes.forEach((b, bi) => {
      if (b.length < 2) return;
      for (let k = 0; k < 3; k++) if (range(b, k) > bestR) ((bestR = range(b, k)), (best = bi), (bestK = k));
    });
    if (best < 0) break;
    const b = boxes[best].sort((p, q) => rgb[p][bestK] - rgb[q][bestK]);
    boxes.splice(best, 1, b.slice(0, b.length >> 1), b.slice(b.length >> 1));
  }
  const colors = new Array<number>(256).fill(0),
    indices = new Uint8Array(96 * 60);
  boxes.forEach((b, bi) => {
    const m = [0, 1, 2].map((k) => Math.round(b.reduce((a, i) => a + rgb[i][k], 0) / b.length));
    colors[bi] = ((m[0] >> 3) << 11) | ((m[1] >> 2) << 5) | (m[2] >> 3);
    for (const i of b) indices[i] = bi;
  });
  return { colors, indices };
}

export async function pocketThumbnail(
  files: PocketSource['files'],
  gam: string,
  deflate: (b: Uint8Array) => Uint8Array | Promise<Uint8Array>,
): Promise<Uint8Array | undefined> {
  try {
    const game = parseGame(files.get(gam)!);
    let pic = titlePixels(files, game);
    if (!pic) for (const [i, at] of firstLevels(game, 1)) pic = levelPixels(files, game.scenes[i], at, 16, 10);
    if (!pic) return;
    const raw = new Uint8Array(6284),
      view = new DataView(raw.buffer);
    raw.set([80, 84, 72, 49]);
    view.setUint16(4, 96, true);
    view.setUint16(6, 60, true);
    view.setUint16(8, 256, true);
    const { colors, indices } = shrink(pic);
    colors.forEach((c, i) => view.setUint16(12 + i * 2, c, true));
    raw.set(indices, 524);
    const packed = await deflate(raw),
      out = new Uint8Array(4 + packed.length);
    new DataView(out.buffer).setUint32(0, raw.length, true);
    out.set(packed, 4);
    return out;
  } catch {
    return;
  }
}
