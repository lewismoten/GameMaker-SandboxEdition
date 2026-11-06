// HEAT WAVES' pictures, drawn on 20x20 cells.
//   bandPicture(pal)        the far hills (rows 4 to 6) as one 80x60 picture that repeats every 4 blocks
//   bandCell(pal, r, c, s)  one cell of it, with the whole picture moved s pixels right (wrapping round)
//   stillCell(pal, y, x)    the sky (rows 0 to 3), the near sand (7 and 8) and the road (9)
//   rockWall(pal)           the near rock at each side of the screen (solid) and in level 1's middle
//   puddle(pal, f, h)       the mirage: half of a shiny pool on the road, in three glints
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { GROUND_ROW, PUDDLES } from './view';

export const CLEAR = 255;
/** The far hills repeat every this many pixels (4 blocks), so a few blocks draw the whole row. */
export const BAND_W = 80;

/** The sky's shade on each row: deeper at the top, bleached near the hills. */
const SKY_SHADE = [0, 1, 2, 3] as const;

/** The far hills: a wide flat-topped butte and a low hill behind it, on the far flat of the desert. */
export function bandPicture(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(BAND_W, 60, 0);
  for (let y = 0; y < 60; y++) p.rect(0, y, BAND_W, 1, c('haze', y < 16 ? 3 : 4));
  // the low hill behind, lighter (farther)
  for (let x = 0; x < BAND_W; x++) {
    const top = Math.round(34 - 9 * Math.exp(-(((x - 62) / 11) ** 2)));
    for (let y = top; y < 48; y++) p.set(x, y, c('mesa', y === top ? 3 : 2));
  }
  // the butte: a flat top with steep sides that spread at the foot, banded with darker rock
  for (let y = 12; y < 48; y++) {
    const spread = y < 18 ? (y - 12) * 0.3 : 1.8 + (y - 18) * 0.28;
    const x0 = Math.round(12 - spread);
    const x1 = Math.round(40 + spread * 0.9);
    p.rect(x0, y, x1 - x0, 1, c('mesa', 1));
    p.rect(x1 - 4, y, 4, 1, c('mesa', 0)); // the shady side
    if (y === 12) p.rect(x0, y, x1 - x0, 1, c('mesa', 3));
    if (y === 22 || y === 23 || y === 33) p.rect(x0 + 1, y, x1 - x0 - 5, 1, c('mesa', 2));
  }
  // the far flat, with a pale line where it meets the hills and a few streaks
  p.rect(0, 46, BAND_W, 14, c('flat', 1));
  p.rect(0, 46, BAND_W, 1, c('flat', 2));
  for (const [x, y, w] of [
    [6, 50, 9],
    [30, 53, 14],
    [56, 51, 10],
    [68, 56, 8],
    [16, 57, 7],
  ] as const)
    p.rect(x, y, w, 1, c('flat', 0));
  return p;
}

/** Cell `col` (0 to 3) of band row `r` (0 to 2), with the whole band moved `s` pixels right (it wraps round the 80 pixels). */
export function bandCell(band: Pixels, r: number, col: number, s: number): Pixels {
  const p = new Pixels(20, 20, 0);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, band.get((((col * 20 + x - s) % BAND_W) + BAND_W) % BAND_W, r * 20 + y));
  return p;
}

/** A still cell: sky above the hills, near sand under them, the road on the ground row. `x` picks a few sand cells with a tuft of dry brush, none near level 2's puddles. */
export function stillCell(pal: Pal, y: number, x = 0): Pixels {
  const { c } = pal;
  if (y < 4) return new Pixels(20, 20, c('haze', SKY_SHADE[y]));
  if (y === GROUND_ROW) {
    // the road's edge: a lip of sand, the gray top with a dashed yellow line, the dark side
    const p = new Pixels(20, 20, c('tar', 1));
    p.rect(0, 0, 20, 2, c('sand', 2)).rect(0, 2, 20, 1, c('tar', 2));
    p.rect(2, 8, 10, 2, c('paint', 0));
    p.rect(0, 14, 20, 6, c('tar', 0));
    return p;
  }
  // near sand, with a few darker grains, lighter toward the road
  const p = new Pixels(20, 20, c('sand', y === 7 ? 2 : 3));
  for (const [gx, gy] of [
    [3, 4],
    [11, 2],
    [16, 9],
    [7, 13],
    [14, 16],
    [1, 17],
  ] as const)
    p.set(gx, gy, c('sand', 1));
  if (y === 8 && x % 5 === 3 && !PUDDLES.some((p) => x >= p - 2 && x <= p + 3)) {
    // a tuft of dry brush: short strokes fanning up from the sand (never beside a puddle)
    for (const [x0, x1, top] of [
      [9, 6, 10],
      [10, 10, 8],
      [11, 14, 10],
      [10, 8, 12],
      [10, 12, 12],
    ] as const)
      p.line(10, 19, x0 === x1 ? x0 : x1, top, c('brush', top < 10 ? 1 : 0));
  }
  return p;
}

/** A near rock, `y` the screen row (so stacked cells differ): wavy layers of red stone, a lit top when `top`. Solid at the screen's sides. */
export function rockCell(pal: Pal, y: number, top: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('rock', 1));
  // layers of sandstone: each boundary wanders up and down across the cell (and meets itself round the edge)
  for (let k = 0; k < 3; k++) {
    const base = 3 + k * 7 + (y % 2) * 2;
    for (let x = 0; x < 20; x++) {
      const yy = Math.round(base + 1.4 * Math.sin(((x + k * 7 + y * 5) * 2 * Math.PI) / 20));
      if (k === 1) p.rect(x, yy + 1, 1, 4, c('rock', 2));
      p.set(x, (yy + 20) % 20, c('rock', 0));
    }
  }
  // a few pits and specks
  for (const [x, yy] of [
    [4, 9],
    [13, 3],
    [16, 15],
    [8, 17],
  ] as const)
    p.set((x + y * 3) % 20, yy, c('rock', 0));
  if (top) p.rect(0, 0, 20, 2, c('rock', 3)).rect(0, 2, 20, 1, c('rock', 2));
  return p;
}

/** The mirage, frame f (0 to 2), half `h` (0 left, 1 right) of a puddle two blocks wide: a thin pool of sky color
 * lying on the road, rounded at its ends, with glints that shift. */
export function puddle(pal: Pal, f: number, h: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, CLEAR);
  for (let x = 0; x < 20; x++) {
    const gx = h * 20 + x; // across the whole pool, 0 to 39
    const edge = Math.min(gx, 39 - gx); // how far in from the nearer end
    const top = edge < 2 ? 17 : edge < 4 ? 16 : edge < 8 ? 15 : 14;
    for (let y = top; y < 20; y++) p.set(x, y, c('glint', y === top ? 2 : y >= 18 ? 0 : 1));
    if (edge >= 4 && (gx + f * 3) % 7 < 2) p.set(x, 16, c('glint', 2));
    if (edge >= 6 && (gx + 4 + f * 5) % 11 < 3) p.set(x, 15, c('white', 3));
  }
  return p;
}
