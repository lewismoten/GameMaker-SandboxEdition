// What every year2000 screen is painted with: GIF/FLI encoding, chrome lettering, the
// sunset-and-grid scenery of a 1990s idea of the future, the console TV, and Art (the
// game's own sprites, handed in so the screens show the real characters and items).
import { encodeFli } from '../../../../web/src/formats/fli';
import { encodeFliFadeOut } from '../../../kit/fadeOut';
import { encodeGif } from '../../../../web/src/formats/gif';
import { Pixels, rng } from '../../../kit/pixels';
import { T, oval, shadeAt } from '../art/draw';
import { text, textWidth } from '../art/font';
import { C, PAL } from '../art/pal';

export const R = PAL.r;
export const W = 320;
export const H = 200;

export function gif(p: Pixels, palette: Uint8Array = PAL.pal): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: p.px, palette });
}

/** An .FLI of the frames; `fadeOut` adds a fade to black at the end (an intro before a picture). */
export function fli(frames: Pixels[], speed: number, palettes?: Uint8Array[], fadeOut = false): Uint8Array {
  return (fadeOut ? encodeFliFadeOut : encodeFli)(
    frames.map((f) => Uint8Array.from(f.px)),
    PAL.pal,
    { speed, palettes },
  );
}

/** Copies a picture scaled up by an integer factor, skipping transparent pixels. */
export function scaleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false): Pixels {
  for (let yy = 0; yy < src.h; yy++)
    for (let xx = 0; xx < src.w; xx++) {
      const c = src.px[yy * src.w + (flip ? src.w - 1 - xx : xx)];
      if (c !== T) dst.rect(x + xx * s, y + yy * s, s, s, c);
    }
  return dst;
}

// ------------------------------------------------------------------ lettering
/** 80s chrome lettering: sky-blue top, dark horizon line, bright bottom, outlined. */
export function chrome(p: Pixels, x: number, y: number, s: string, scale: number, warm = false): void {
  const mask = new Pixels(W, H, 0);
  text(mask, x, y, s, 1, scale);
  const h = 8 * scale;
  const ink = C('night', 0);
  // Drop shadow, then a thick outline.
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (mask.get(xx - 3, yy - 3) === 1 && mask.get(xx, yy) !== 1) p.set(xx, yy, C('purple', 1));
  for (let yy = 0; yy < H; yy++)
    for (let xx = 0; xx < W; xx++) {
      if (mask.get(xx, yy) === 1) continue;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
        [-1, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
      ])
        if (mask.get(xx + dx, yy + dy) === 1) {
          p.set(xx, yy, ink);
          break;
        }
    }
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + s.length * 8 * scale; xx++) {
      if (mask.get(xx, yy) !== 1) continue;
      const t = (yy - y) / h;
      let c: number;
      if (warm) c = t < 0.48 ? shadeAt(R('gold'), 5, 3, t * 2, xx, yy) : t < 0.55 ? C('orange', 1) : shadeAt(R('orange'), 2, 4, (t - 0.55) * 2.2, xx, yy);
      else c = t < 0.48 ? shadeAt(R('sky'), 7, 3, t * 2, xx, yy) : t < 0.54 ? C('night', 2) : shadeAt(R('pink'), 2, 5, (t - 0.54) * 2.2, xx, yy);
      p.set(xx, yy, c);
    }
  // Glints.
  const r = rng(s.length * 17 + x);
  for (let i = 0; i < Math.max(2, s.length / 2); i++) {
    const gx = x + Math.floor(r() * s.length * 8 * scale);
    const gy = y + Math.floor(r() * h * 0.4);
    if (mask.get(gx, gy) !== 1) continue;
    for (let k = -3; k <= 3; k++) {
      p.set(gx + k, gy, C('grey', 7));
      p.set(gx, gy + k, C('grey', 7));
    }
  }
}

export function chromeCentered(p: Pixels, y: number, s: string, scale: number, warm = false): void {
  chrome(p, Math.round((W - textWidth(s, scale)) / 2), y, s, scale, warm);
}

export function centeredText(p: Pixels, y: number, s: string, col: number, shadow?: number, scale = 1): void {
  const x = Math.round((W - textWidth(s, scale)) / 2);
  if (shadow !== undefined) text(p, x + 1, y + 1, s, shadow, scale);
  text(p, x, y, s, col, scale);
}

// ------------------------------------------------------------------ scenery
export function sunsetSky(p: Pixels, horizon: number, seed = 1): void {
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) p.set(x, y, shadeAt(R('sunset'), 0, 11, (y / horizon) ** 1.4, x, y));
  const r = rng(seed);
  for (let i = 0; i < 70; i++) {
    const y = Math.floor(r() * horizon * 0.45);
    p.set(Math.floor(r() * W), y, C('grey', 5 + Math.floor(r() * 3)));
  }
}

/** The striped setting sun every 1980s album cover had. */
export function stripedSun(p: Pixels, cx: number, cy: number, rad: number): void {
  for (let y = cy - rad; y <= cy; y++)
    for (let x = cx - rad; x <= cx + rad; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > rad * rad) continue;
      const t = (y - (cy - rad)) / rad;
      const gap = t > 0.45 && Math.floor((y - cy) / 3) % 2 === 0 && cy - y < rad * 0.55 && (cy - y) % (2 + Math.floor((t - 0.45) * 8)) === 0;
      if (gap) continue;
      p.set(x, y, shadeAt(R('gold'), 5, 2, t, x, y));
    }
}

/** A dome city skyline: domes, needle towers, a monorail. */
export function skyline(p: Pixels, base: number, seed = 3, dark = 'purple'): void {
  const r = rng(seed);
  const col = (k: number) => C(dark, k);
  // Back row of needles and towers.
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(r() * W);
    const h = 40 + Math.floor(r() * 50);
    p.rect(x - 2, base - h, 4, h, col(1));
    oval(p, x, base - h, 9, 3, col(1));
    p.rect(x - 1, base - h - 12, 2, 12, col(1));
    for (let k = 0; k < 4; k++) p.set(x - 6 + k * 4, base - h, C('gold', 5));
  }
  // Front row of domes with lit windows.
  for (let i = 0; i < 8; i++) {
    const cx = 20 + i * 42 + Math.floor(r() * 12);
    const rad = 14 + Math.floor(r() * 14);
    for (let y = base - rad; y <= base; y++)
      for (let x = cx - rad; x <= cx + rad; x++) if ((x - cx) ** 2 + ((y - base) * 1.1) ** 2 <= rad * rad) p.set(x, y, x - cx < -rad / 3 ? col(2) : col(1));
    for (let x = cx - rad + 3; x < cx + rad - 2; x += 4) if (r() < 0.7) p.set(x, base - Math.floor(rad / 2), C('gold', 4));
  }
  // The monorail.
  p.rect(0, base - 30, W, 2, col(2));
  for (let x = 10; x < W; x += 50) p.rect(x, base - 30, 3, 30, col(1));
}

/** A neon perspective grid floor. */
export function grid(p: Pixels, top: number): void {
  for (let y = top; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, shadeAt(R('night'), 1, 3, (y - top) / (H - top), x, y));
  for (let k = -20; k <= 20; k++) p.line(160 + k * 4, top, 160 + k * 40, H, C('pink', 3));
  let y = top + 1;
  let step = 2;
  while (y < H) {
    p.rect(0, y, W, 1, C('pink', 3));
    y += step;
    step += 2;
  }
  p.rect(0, top, W, 1, C('pink', 5));
}

export function speedLines(p: Pixels, x: number, y: number, len: number, col: number): void {
  for (let k = 0; k < 3; k++) p.rect(x - len + k * 4, y + 4 + k * 5, len - k * 8, 1, col);
}

/** A big 1992 console TV, screen rectangle given. Returns nothing; draws in place. */
export function consoleTv(p: Pixels, sx: number, sy: number, sw: number, sh: number, screen: number): void {
  const x0 = sx - 18;
  const y0 = sy - 16;
  const w = sw + 64;
  const h = sh + 32;
  p.rect(x0, y0, w, h, C('wood', 2));
  for (let y = y0 + 2; y < y0 + h; y += 4) p.rect(x0, y, w, 1, C('wood', 1));
  p.frame(x0, y0, w, h, C('wood', 0));
  p.rect(sx - 6, sy - 6, sw + 12, sh + 12, C('grey', 1));
  p.rect(sx - 4, sy - 4, sw + 8, sh + 8, C('grey', 2));
  p.rect(sx, sy, sw, sh, screen);
  // Rounded corners of the tube.
  for (const [cx, cy] of [
    [sx, sy],
    [sx + sw - 1, sy],
    [sx, sy + sh - 1],
    [sx + sw - 1, sy + sh - 1],
  ])
    p.set(cx, cy, C('grey', 2));
  // Knobs and speaker grille on the right.
  const kx = sx + sw + 14;
  oval(p, kx + 10, sy + 12, 7, 7, C('chrome', 3));
  oval(p, kx + 10, sy + 12, 5, 5, C('chrome', 5));
  oval(p, kx + 10, sy + 34, 7, 7, C('chrome', 3));
  oval(p, kx + 10, sy + 34, 5, 5, C('chrome', 5));
  for (let y = sy + 50; y < sy + sh; y += 3) p.rect(kx + 2, y, 18, 1, C('wood', 0));
  // Rabbit ears.
  p.line(sx + sw / 2 - 4, y0, sx + sw / 2 - 50, y0 - 40, C('chrome', 5));
  p.line(sx + sw / 2 + 4, y0, sx + sw / 2 + 40, y0 - 44, C('chrome', 5));
  oval(p, sx + sw / 2, y0 - 2, 10, 4, C('grey', 1));
  p.disc(sx + sw / 2 - 50, y0 - 40, 2, C('chrome', 6));
  p.disc(sx + sw / 2 + 40, y0 - 44, 2, C('chrome', 6));
}

export interface Art {
  dex: Pixels;
  dexSide: Pixels;
  dexUp: Pixels;
  dexMoon: Pixels;
  sparky: Pixels;
  sparkyMad: Pixels;
  car: Pixels;
  carT: Pixels;
  truck: Pixels;
  alien: Pixels;
  alien2: Pixels;
  mower: Pixels;
  tele: Pixels;
  grandma: Pixels;
  page: Pixels;
  quarter: Pixels;
  pill: Pixels;
  zapper: Pixels;
  cover: Pixels;
  booth: Pixels;
  boothTop: Pixels;
  meteor: Pixels;
  dino: Pixels;
}
