// THE THANK-YOU PARADE's look: a screen-printed parade poster. Cream paper stock, a handful of flat inks (navy, vermilion,
// brass, teal, a poster green), a near-black ink line around everything, and halftone dots where other games shade with
// smooth ramps. This file holds the game's own palette (no other game's ramps) and the drawing helpers every picture uses:
// halftone fills, diagonal stripes, sunburst rays and a misregistered "second ink" offset.
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { wrap, type Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export type { Pal };
type RGB = [number, number, number];
export type Ramp = [number, RGB, RGB, RGB?];

/**
 * The inks, darkest shade first. Several names are kept for the older drawings (blue is the navy ink, gold the brass,
 * stone the gray of the street, wood the brown of poles and planks); every one of them is this game's own color.
 */
const INKS: [string, number, RGB, RGB, RGB?][] = [
  ['ink', 3, [24, 18, 30], [88, 72, 92]],
  ['sky', 4, [214, 176, 132], [250, 232, 196], [238, 210, 168]], // the paper the poster is printed on (shade 3 is every block's background)
  ['paper', 4, [204, 184, 150], [255, 248, 228], [240, 226, 196]],
  ['white', 4, [196, 190, 186], [255, 255, 250]],
  ['blue', 5, [16, 26, 64], [136, 156, 206], [36, 60, 128]], // navy
  ['red', 5, [96, 16, 22], [255, 172, 140], [222, 56, 40]], // vermilion
  ['gold', 6, [104, 58, 6], [255, 240, 160], [230, 168, 30]], // brass
  ['teal', 5, [8, 60, 66], [168, 230, 214], [26, 134, 128]],
  ['green', 5, [22, 64, 40], [184, 214, 120], [64, 138, 72]],
  ['grass', 6, [22, 64, 40], [200, 222, 128], [70, 146, 74]],
  ['dirt', 6, [52, 30, 34], [190, 130, 96], [116, 66, 54]],
  ['brick', 6, [86, 20, 24], [244, 146, 112], [178, 58, 44]],
  ['wood', 5, [66, 34, 20], [226, 170, 100], [150, 92, 46]],
  ['stone', 5, [44, 44, 62], [214, 208, 204], [116, 112, 128]],
  ['parch', 5, [176, 140, 96], [255, 246, 220], [232, 206, 160]],
  ['pink', 4, [170, 60, 96], [255, 210, 214], [240, 120, 140]],
  ['orange', 5, [150, 54, 8], [255, 210, 140], [244, 128, 34]],
  ['purple', 5, [48, 20, 74], [214, 176, 240], [112, 60, 160]], // the Ridgemont band's ink
  ['skin', 4, [106, 56, 34], [230, 172, 124], [178, 110, 70]], // Penny
  ['skinB', 4, [168, 104, 84], [255, 222, 196], [232, 168, 136]], // Marge
  ['skinC', 4, [70, 40, 30], [178, 118, 80], [128, 76, 50]],
  ['skinD', 4, [150, 96, 60], [250, 206, 156], [214, 150, 100]],
  ['hair', 3, [16, 10, 22], [84, 60, 80]],
  ['silver', 4, [96, 98, 116], [250, 250, 252], [186, 188, 200]],
  ['leather', 4, [56, 28, 18], [196, 128, 70], [128, 70, 36]],
];

/** The game's palette: Game-Maker's designer colors first (black at 0), the inks, then the three text colors PLAYGAME writes with. */
export function printPalette(): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  for (const [name, n, from, to, mid] of INKS) b.ramp(name, n, from, to, mid);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return wrap(b);
}

/** The paper every block is printed on. */
export const paperOf = (pal: Pal): number => pal.c('sky', 3);

/** A copy of `pal` with some ramps recolored (same indices, other colors): the same blocks printed in another run of inks. */
export function swap(pal: Pal, ramps: Record<string, Ramp>): Pal {
  const out = new Uint8Array(pal.pal);
  const scratch = new PaletteBuilder();
  for (const [name, [n, from, to, mid]] of Object.entries(ramps)) {
    const made = scratch.ramp(name, n, from, to, mid);
    pal.r(name).forEach((at, i) => out.set(scratch.pal.subarray(made[i] * 3, made[i] * 3 + 3), at * 3));
  }
  return { ...pal, pal: out };
}

/**
 * Halftone: is (x, y) inside a dot of a screen whose dots sit on a diagonal lattice ten pixels across (dots at (0,0) and
 * (5,5) of every 10x10 cell, so it tiles across 20x20 blocks)? `tone` 0 is no dots, 1 a single pixel, 2 a 2x2 square, 3 a
 * 3x3 square, up to 5 nearly solid.
 */
export function dot(x: number, y: number, tone: number): boolean {
  if (tone <= 0) return false;
  const u = ((x % 10) + 10) % 10;
  const v = ((y % 10) + 10) % 10;
  // tone 2 is a 2x2 square at each lattice point (never a plus sign)
  if (tone === 2) return (u < 2 && v < 2) || (u >= 5 && u < 7 && v >= 5 && v < 7);
  // the distance to the nearest lattice point: a corner of the cell or its middle
  const a = Math.hypot(Math.min(u, 10 - u), Math.min(v, 10 - v));
  const b = Math.hypot(u - 5, v - 5);
  const r = [0, 0.5, 0, 1.5, 2.3, 3.2][Math.min(5, tone)];
  return Math.min(a, b) <= r;
}

/** Dots of color `c` over the pixels of `p` in a rectangle whose color is one of `on` (or every pixel, when `on` is empty). */
export function halftone(p: Pixels, x0: number, y0: number, w: number, h: number, c: number, tone: number | ((x: number, y: number) => number), on: number[] = []): Pixels {
  const only = new Set(on);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= p.w || y >= p.h) continue;
      if (only.size && !only.has(p.get(x, y))) continue;
      if (dot(x, y, typeof tone === 'number' ? tone : tone(x, y))) p.set(x, y, c);
    }
  return p;
}

/** Diagonal stripes `width` pixels wide, every `period` pixels, of color `c` (tiling across 20x20 blocks when period divides 20). */
export function stripes(p: Pixels, x0: number, y0: number, w: number, h: number, c: number, period = 10, width = 5, on: number[] = []): Pixels {
  const only = new Set(on);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      if (only.size && !only.has(p.get(x, y))) continue;
      if ((((x + y) % period) + period) % period < width) p.set(x, y, c);
    }
  return p;
}

/** Sunburst rays from (cx, cy): `n` wedges, every other one in color `c`, over the rectangle. */
export function rays(p: Pixels, cx: number, cy: number, n: number, c: number, x0 = 0, y0 = 0, w = p.w, h = p.h, turn = 0): Pixels {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const a = (Math.atan2(y - cy, x - cx) / (Math.PI * 2) + 1 + turn) % 1;
      if (Math.floor(a * n * 2) % 2 === 0) p.set(x, y, c);
    }
  return p;
}

/** The ink line: every transparent pixel next to a drawn one becomes `ink` (four neighbors), then drawn pixels touching the edge stay. */
export function inkLine(p: Pixels, ink: number, clear = 255): Pixels {
  const out = p.crop(0, 0, p.w, p.h);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (p.get(x, y) !== clear) continue;
      const n = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => {
        const xx = x + dx;
        const yy = y + dy;
        return xx >= 0 && yy >= 0 && xx < p.w && yy < p.h && p.get(xx, yy) !== clear && p.get(xx, yy) !== ink;
      });
      if (n) out.set(x, y, ink);
    }
  return out;
}
