// Pictures for the screens and cartoons: the family room at night, the beige 486 and its
// monitor, the floppy, GLITCH grinning on the screen, the BLASTER, and the logo.
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, bevel, blob, centered, gradient, micro, outlined, scaleBlit, shadeAt, text, textWidth } from '../art/draw';
import { buildPalette, type Pal } from '../art/pal';
import { shipBlocks } from '../characters/ship';

export const SP: Pal = buildPalette('screen');
export const c = (n: string, k: number) => SP.c(n, k);
export const W = 320;
export const H = 200;

/** The BLASTER, as a 20x20 sprite. */
export const SHIP = shipBlocks(SP).pic('ship0');
export const SHIP_FLAME = shipBlocks(SP).pic('ship1');

/** The night sky through the window, the wall, the desk. */
export function room(seed = 1): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 150, SP.r('wall'), 0, 2);
  // wallpaper stripes
  for (let x = 0; x < W; x += 16) p.rect(x, 0, 1, 150, c('wall', 1));
  // the window: night sky and the moon
  bevel(p, 228, 12, 80, 70, SP.r('wood'), 2, 3);
  gradient(p, 232, 16, 72, 62, SP.r('blue'), 0, 1);
  const r = rng(seed);
  for (let i = 0; i < 25; i++) p.set(234 + Math.floor(r() * 68), 18 + Math.floor(r() * 58), c('gray', 6 + (i % 2)));
  blob(p, 284, 32, 7, 7, SP.r('label'), 2, 4);
  p.rect(267, 16, 2, 62, c('wood', 3)).rect(232, 46, 72, 2, c('wood', 3));
  // a poster
  bevel(p, 14, 20, 54, 70, SP.r('label'), 3, 1);
  outlined(p, 20, 26, 'RAD', c('red', 2), c('ink', 0), 2);
  micro(p, 20, 46, 'SANDBOX', c('blue', 2));
  micro(p, 20, 54, 'SOFTWARE', c('blue', 2));
  scaleBlit(p, SHIP, 27, 62, 1);
  // the desk
  p.rect(0, 150, W, 50, c('wood', 2));
  for (let y = 152; y < 200; y += 6) p.rect(0, y, W, 1, c('wood', 1));
  p.rect(0, 150, W, 3, c('wood', 4));
  return p;
}

/** The monitor: a beige CRT with whatever screen() draws on its glass (120 x 82 at gx, gy). */
export function monitor(p: Pixels, x: number, y: number, glass: (g: Pixels) => void, glow = 1): void {
  bevel(p, x, y, 150, 112, SP.r('beige'), 4, 3);
  bevel(p, x + 10, y + 10, 130, 92, SP.r('beige'), 2, 2);
  const g = new Pixels(120, 82, c('crt', 0));
  glass(g);
  // scanlines and the curve of the glass
  for (let yy = 0; yy < g.h; yy += 2) for (let xx = 0; xx < g.w; xx++) if (g.get(xx, yy) === c('crt', 0)) g.set(xx, yy, c('ink', 0));
  p.blit(g, x + 15, y + 15);
  for (let k = 0; k < 3; k++) p.rect(x + 16 + k * 6, y + 17 + k, 10, 1, c('crt', 2 + glow));
  micro(p, x + 60, y + 104, 'SVGA', c('beige', 1));
  p.rect(x + 128, y + 104, 4, 3, c('slime', 4));
  // the stand
  bevel(p, x + 50, y + 112, 50, 8, SP.r('beige'), 3, 1);
}

/** The 486 tower, with its floppy drive slot. Returns the slot's position. */
export function tower(p: Pixels, x: number, y: number): { sx: number; sy: number } {
  bevel(p, x, y, 56, 120, SP.r('beige'), 4, 2);
  bevel(p, x + 6, y + 10, 44, 14, SP.r('beige'), 3, 1);
  bevel(p, x + 6, y + 28, 44, 14, SP.r('beige'), 3, 1);
  p.rect(x + 10, y + 34, 30, 3, c('ink', 0));
  p.rect(x + 42, y + 33, 5, 4, c('beige', 2));
  micro(p, x + 8, y + 50, '486DX2', c('blue', 2));
  micro(p, x + 8, y + 58, '66MHZ', c('red', 2));
  p.rect(x + 8, y + 70, 4, 2, c('slime', 4)).rect(x + 16, y + 70, 4, 2, c('gold', 4));
  micro(p, x + 24, y + 69, 'TURBO', c('beige', 1));
  for (let k = 0; k < 6; k++) p.rect(x + 8, y + 84 + k * 5, 40, 2, c('beige', 2));
  return { sx: x + 10, sy: y + 34 };
}

/** GLITCH's face on a 120x82 glass. */
export function glitchFace(g: Pixels, k = 0, scale = 1): void {
  const cx = g.w / 2;
  const cy = g.h / 2 + 2;
  const s = scale;
  blob(g, cx, cy - 4 * s, 26 * s, 24 * s, SP.r('virus'), 1, 4);
  for (const side of [-1, 1]) {
    blob(g, cx + side * 11 * s, cy - 8 * s, 7 * s, 6 * s, SP.r('ink'), 0, 0);
    blob(g, cx + side * 11 * s, cy - 8 * s, 3 * s, 3 * s, SP.r('glow'), 2, 4);
  }
  g.rect(cx - 12 * s, cy + 8 * s, 24 * s, 6 * s, c('ink', 0));
  for (let x = cx - 11 * s; x < cx + 12 * s; x += 4 * s) g.rect(x, cy + 8 * s, 2 * s, 3 * s, c('gray', 7));
  // glitch tears
  const r = rng(3 + k);
  for (let i = 0; i < 6; i++) {
    const y = Math.floor(r() * g.h);
    g.rect(Math.floor(r() * g.w * 0.8), y, 10 + Math.floor(r() * 30), 1 + (i % 2), c(i % 2 ? 'slime' : 'pink', 3));
  }
}

/** A DOS prompt on the glass, with `lines` typed. */
export function dos(g: Pixels, lines: string[], color = c('crt', 5)): void {
  lines.forEach((l, i) => micro(g, 4, 4 + i * 8, l, color));
}

/** A 3.5" floppy, w x h scaled, standing shutter down with its label up top. */
export function floppy(p: Pixels, x: number, y: number, s = 1, label = 'VACCINE'): void {
  bevel(p, x, y, 36 * s, 38 * s, SP.r('blue'), 1, Math.max(1, s));
  p.rect(x + 10 * s, y + 26 * s, 18 * s, 12 * s, c('steel', 4));
  p.rect(x + 13 * s, y + 28 * s, 5 * s, 8 * s, c('steel', 1));
  bevel(p, x + 4 * s, y + 2 * s, 28 * s, 18 * s, SP.r('label'), 3, 1);
  if (s >= 2) text(p, x + 6 * s, y + 8 * s, label.slice(0, 7), c('red', 2), Math.max(1, Math.floor(s / 2)));
  else micro(p, x + 6, y + 8, label.slice(0, 6), c('red', 2));
}

/** The title logo: VIRUS in slime green, BLASTER in fire, chunky and glitched. */
export function logo(p: Pixels, y: number, cx = W / 2, glitch = true): void {
  const word = (s: string, yy: number, scale: number, ramp: string, lo: number, hi: number) => {
    const w = textWidth(s, scale);
    const x = Math.round(cx - w / 2);
    // shadow and outline
    const tmp = new Pixels(w + 8, 8 * scale + 8, CLEAR);
    text(tmp, 4, 4, s, 1, scale);
    for (let yy2 = 0; yy2 < tmp.h; yy2++)
      for (let xx = 0; xx < tmp.w; xx++) {
        if (tmp.get(xx, yy2) !== 1) continue;
        for (const [dx, dy] of [
          [3, 3],
          [4, 4],
        ])
          p.set(x - 4 + xx + dx, yy - 4 + yy2 + dy, c('ink', 0));
      }
    for (let yy2 = 0; yy2 < tmp.h; yy2++)
      for (let xx = 0; xx < tmp.w; xx++) {
        if (tmp.get(xx, yy2) !== 1) continue;
        for (const [dx, dy] of [
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
          [-1, -1],
          [1, 1],
          [1, -1],
          [-1, 1],
        ])
          if (tmp.get(xx + dx, yy2 + dy) !== 1) p.set(x - 4 + xx + dx, yy - 4 + yy2 + dy, c('ink', 0));
      }
    for (let yy2 = 0; yy2 < tmp.h; yy2++)
      for (let xx = 0; xx < tmp.w; xx++) {
        if (tmp.get(xx, yy2) !== 1) continue;
        const t = (yy2 - 4) / (8 * scale);
        const edge = tmp.get(xx, yy2 - 1) !== 1;
        p.set(x - 4 + xx, yy - 4 + yy2, edge ? SP.r(ramp)[hi] : shadeAt(SP.r(ramp), hi - 1, lo, t, xx, yy2));
      }
    if (glitch) {
      const r = rng(s.length * 7);
      for (let i = 0; i < 3; i++) {
        const gy = yy + Math.floor(r() * 8 * scale);
        const row = p.crop(x - 4, gy, w + 8, 2);
        p.blit(row, x - 4 + (i % 2 ? 3 : -3), gy);
      }
    }
  };
  word('VIRUS', y, 4, 'slime', 1, 5);
  word('BLASTER', y + 36, 5, 'fire', 2, 7);
}

/** Speed lines radiating from (cx, cy). */
export function speedLines(p: Pixels, cx: number, cy: number, t: number, ramp = 'cyan', n = 40): void {
  const r = rng(11);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d0 = ((r() * 200 + t * 18) % 220) + 10;
    const len = 8 + d0 * 0.25;
    for (let k = 0; k < len; k++) {
      const d = d0 + k;
      p.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, SP.r(ramp)[Math.min(SP.r(ramp).length - 1, Math.floor((k / len) * 5))]);
    }
  }
}

/** A light panel Game-Maker can write on, with a frame (x0, y0, x1, y1 inclusive). */
export function panel(p: Pixels, x0: number, y0: number, x1: number, y1: number, face = c('label', 4), frame = c('steel', 2)): void {
  p.rect(x0 - 3, y0 - 3, x1 - x0 + 7, y1 - y0 + 7, c('ink', 0));
  p.rect(x0 - 2, y0 - 2, x1 - x0 + 5, y1 - y0 + 5, frame);
  p.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, face);
}

/** A circuit-board backdrop in the screen palette (for the pages). */
export function circuit(seed: number): Pixels {
  const p = new Pixels(W, H);
  const r = rng(seed);
  p.map((x, y) => shadeAt(SP.r('base'), 0, 2, 0.3 + ((x * 7 + y * 13) % 11) * 0.02, x, y));
  for (let i = 0; i < 30; i++) {
    let x = Math.floor(r() * W);
    let y = Math.floor(r() * H);
    for (let k = 0; k < 6; k++) {
      const horiz = r() < 0.5;
      const len = 10 + Math.floor(r() * 40);
      if (horiz) {
        p.rect(Math.min(x, x + len), y, len, 2, c('trim', 2));
        x += len;
      } else {
        p.rect(x, Math.min(y, y + len), 2, len, c('trim', 2));
        y += len;
      }
    }
    blob(p, x, y, 2.5, 2.5, SP.r('trim'), 2, 5);
  }
  return p;
}

export { centered, outlined, text, scaleBlit, blob, bevel, micro, gradient };
