// The scenery the screens are painted from (screens.ts): snow-capped title lettering, a row
// of little houses, a church and pines, dusk and night skies, falling snow, and the GIF and
// scaled-blit helpers every picture goes through.
import { encodeGif } from '../../../../web/src/formats/gif';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient, shadeAt } from '../art/draw';
import { text, textWidth } from '../art/font';
import type { Pal } from '../art/pal';

export const W = 320;
export const H = 200;

/** A picture as a GIF file in the given palette. */
export function gif(p: Pixels, pal: Uint8Array): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: p.px, palette: pal });
}

/** Copies a picture scaled up by an integer factor, skipping transparent (255) pixels. */
export function scaleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false): void {
  for (let yy = 0; yy < src.h; yy++)
    for (let xx = 0; xx < src.w; xx++) {
      const c = src.px[yy * src.w + (flip ? src.w - 1 - xx : xx)];
      if (c !== 255) dst.rect(x + xx * s, y + yy * s, s, s, c);
    }
}

/** Big snow-capped title lettering. */
export function snowTitle(p: Pixels, pal: Pal, y: number, s: string, scale: number, fillRamp: string): void {
  const mask = new Pixels(W, H, 0);
  const x0 = Math.round((W - textWidth(s, scale)) / 2);
  text(mask, x0, y, s, 1, scale);
  const fill = pal.r(fillRamp);
  const ink = pal.c('ink', 0);
  for (let yy = 0; yy < H; yy++)
    for (let xx = 0; xx < W; xx++) {
      if (mask.get(xx, yy) === 1) continue;
      for (const [dx, dy] of [
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
        [-1, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [2, 2],
        [3, 3],
      ])
        if (mask.get(xx + dx, yy + dy) === 1) {
          p.set(xx, yy, ink);
          break;
        }
    }
  for (let yy = 0; yy < H; yy++)
    for (let xx = 0; xx < W; xx++) if (mask.get(xx, yy) === 1) p.set(xx, yy, shadeAt(fill, fill.length - 1, 1, (yy - y) / (8 * scale), xx, yy));
  // snow piled on every top edge
  for (let xx = 0; xx < W; xx++)
    for (let yy = 1; yy < H; yy++)
      if (mask.get(xx, yy) === 1 && mask.get(xx, yy - 1) !== 1) {
        const h = 2 + ((xx * 7 + yy) % 3 === 0 ? 1 : 0);
        for (let k = 0; k < h; k++) p.set(xx, yy - k, pal.c('snow', k === h - 1 ? 4 : 6));
        p.set(xx, yy + 1, pal.c('snow', 5));
      }
}

/** A row of little houses, a church and pines against the sky. */
export function town(p: Pixels, pal: Pal, ground: number, seed: number, night: boolean): void {
  const r = rng(seed);
  const c = pal.c;
  // far hills
  for (let x = 0; x < W; x++) {
    const h1 = ground - 38 - Math.round(Math.sin(x / 41 + seed) * 10 + Math.sin(x / 13) * 3);
    for (let y = h1; y < ground; y++) p.set(x, y, shadeAt(pal.r('snow'), 1, 3, (y - h1) / 60, x, y));
    const h2 = ground - 22 - Math.round(Math.sin(x / 29 + 2) * 6);
    for (let y = h2; y < ground; y++) p.set(x, y, shadeAt(pal.r('pine'), 0, 1, (y - h2) / 30, x, y));
  }
  const pine = (x: number, base: number, h: number) => {
    for (let y = 0; y < h; y++) {
      const w = Math.round((y / h) * h * 0.38 + 1);
      for (let xx = -w; xx <= w; xx++) p.set(x + xx, base - h + y, (y % 5 === 0 && xx < 0) || (y < 3 && xx === 0) ? c('snow', 5) : c('pine', xx < 0 ? 2 : 1));
    }
    p.rect(x - 1, base, 2, 3, c('wood', 0));
  };
  const house = (x: number, w: number, h: number, wall: string) => {
    const base = ground;
    p.rect(x, base - h, w, h, c(wall, 2)).rect(x, base - h, 2, h, c(wall, 3));
    for (let i = 0; i < Math.floor(w / 9); i++) {
      const wx = x + 4 + i * 9;
      p.rect(wx, base - h + 5, 5, 6, night ? c('glow', 3) : c('glow', 2)).rect(wx + 2, base - h + 5, 1, 6, c('wood', 1));
    }
    const roofH = Math.round(w / 2.4);
    for (let y = 0; y < roofH; y++) {
      const inset = Math.round(((roofH - y) / roofH) * (w / 2));
      for (let xx = x - 2 + inset; xx < x + w + 2 - inset; xx++)
        p.set(xx, base - h - roofH + y, y < roofH - 2 ? c('snow', xx < x + w / 2 ? 6 : 4) : c('ink', 0));
    }
    p.rect(x + w - 8, base - h - roofH + 1, 4, 6, c('brick', 1));
    for (let k = 0; k < 4; k++) blob(p, x + w - 6 + k * 2, base - h - roofH - 3 - k * 4, 2 + k * 0.5, 2, pal.r('gray'), 3, 5);
    // Christmas lights under the eave
    const bulbs = pal.r('bulbs');
    for (let xx = x; xx < x + w; xx += 3) p.set(xx, base - h, bulbs[((xx / 3) % 4) | 0]);
  };
  let x = -6;
  while (x < W) {
    const kind = r();
    if (kind < 0.35) {
      pine(x + 6, ground, 18 + Math.floor(r() * 16));
      x += 10;
    } else {
      const w = 26 + Math.floor(r() * 14);
      house(x, w, 14 + Math.floor(r() * 6), ['brick', 'siding', 'butter'][Math.floor(r() * 3)]);
      x += w + 6;
    }
  }
  // the church steeple
  const sx = 230;
  p.rect(sx, ground - 46, 18, 46, c('concrete', 3)).rect(sx, ground - 46, 3, 46, c('concrete', 2));
  for (let y = 0; y < 26; y++)
    for (let xx = -Math.round(y / 2.6); xx <= Math.round(y / 2.6); xx++) p.set(sx + 9 + xx, ground - 72 + y, c(xx < 0 ? 'snow' : 'concrete', xx < 0 ? 6 : 1));
  p.rect(sx + 8, ground - 82, 2, 10, c('gold', 3)).rect(sx + 5, ground - 79, 8, 2, c('gold', 3));
  p.rect(sx + 6, ground - 38, 6, 9, night ? c('glow', 3) : c('glow', 2));
  p.rect(sx + 6, ground - 16, 6, 16, c('wood', 1));
  // the snowy ground
  for (let y = ground; y < H; y++)
    for (let xx = 0; xx < W; xx++) p.set(xx, y, shadeAt(pal.r('snow'), 3, 6, 0.4 + (y - ground) / 50 + Math.sin(xx / 17 + y / 9) * 0.08, xx, y));
}

/** Dusk or night sky, with stars and the moon. */
export function sky(p: Pixels, pal: Pal, night: boolean, seed: number): void {
  if (night) gradient(p, 0, 0, W, H, pal.r('nightsky'), 0, 7);
  else gradient(p, 0, 0, W, 150, pal.r('dusksky'), 0, 15);
  const r = rng(seed);
  for (let k = 0; k < 60; k++) p.set(Math.floor(r() * W), Math.floor(r() * 60), pal.c('snow', 6));
  blob(p, 268, 26, 11, 11, pal.r('butter'), 2, 3).set(0, 0, p.get(0, 0));
}

/** Falling snowflakes scattered over a picture. */
export function snowfall(p: Pixels, pal: Pal, seed: number, n = 160): void {
  const r = rng(seed);
  for (let k = 0; k < n; k++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * H);
    p.set(x, y, pal.c('snow', 6));
    if (r() < 0.3) p.set(x + 1, y, pal.c('snow', 5)).set(x, y + 1, pal.c('snow', 5));
  }
}
