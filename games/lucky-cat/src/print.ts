// LUCKY CAT's look: a white-line woodcut at night. Like a Provincetown print, every shape is cut from a dark block
// and kept apart from its neighbors by a thin line of bare paper, so the town is ink on ink with cream cut lines, and
// one spot color (gold, by default) is printed on top for what matters: Midnight's eyes, the charms, a lit window.
// The palette is small on purpose: the ink, the night plate (the `sky` ramp, so the kit's checks still find it),
// the paper, the spot gold, a vermilion red and Rascal's smoke grays. Each level recolors the plate and the spot
// (palette.ts), the way a printer changes inks between runs.
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { wrap, type Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export type { Pal };
type RGB = [number, number, number];

/** Transparent, for sprites drawn before they go onto a block. */
export const T = 255;

/** [name, shades, darkest, lightest, middle?]: the whole print. */
const RAMPS: [string, number, RGB, RGB, RGB?][] = [
  ['ink', 4, [10, 9, 18], [58, 52, 84], [28, 25, 44]],
  ['sky', 6, [18, 20, 40], [108, 116, 164], [42, 48, 84]],
  ['paper', 5, [124, 110, 90], [248, 240, 216], [216, 202, 168]],
  ['gold', 4, [118, 70, 12], [255, 228, 124], [236, 172, 40]],
  ['red', 3, [92, 18, 22], [240, 100, 66], [192, 44, 40]],
  ['smoke', 3, [66, 64, 76], [172, 168, 172], [116, 112, 124]],
];

/** The game's palette: index 0 is black, then the designer colors, the print's ramps and PLAYGAME's three text colors. */
export function buildPrintPalette(): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return wrap(b);
}

/** The cut line: bare paper around a sprite's every edge (the print's one rule). */
export const cut = (pal: Pal, p: Pixels, shade = 3): Pixels => outline(p, pal.c('paper', shade), { transparent: T });

/** An empty sprite. */
export const blank = (w = 20, h = 20): Pixels => new Pixels(w, h, T);

/**
 * The night plate: the sky block. Flat plate tone with a few gouge strokes in the next tone up, the marks a carving
 * tool leaves where the block was cleared. Placed so neighboring blocks don't line up into stripes.
 */
export function skyTile(pal: Pal): Pixels {
  const p = new Pixels(20, 20, pal.c('sky', 1));
  const mark = pal.c('sky', 2);
  for (const [x, y, w] of [
    [2, 3, 5],
    [12, 6, 4],
    [6, 11, 3],
    [15, 14, 4],
    [1, 17, 4],
  ])
    p.rect(x, y, w, 1, mark);
  return p;
}

/** A sprite printed onto the night plate (props and charms stand in the sky, so they carry its gouge marks). */
export function onSky(pal: Pal, sprite: Pixels, cutLine = true): Pixels {
  const p = skyTile(pal);
  return p.blit(cutLine ? cut(pal, sprite) : sprite, 0, 0, T);
}

/** Parallel hatching (the carved shading of a woodcut) over a rectangle: every `step` pixels, slanting `dir`. */
export function hatch(p: Pixels, x0: number, y0: number, w: number, h: number, color: number, step = 3, dir: 1 | -1 = 1): Pixels {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if ((((x + dir * y) % step) + step) % step === 0) p.set(x, y, color);
  return p;
}

/** Fills the triangle a, b, c. */
export function tri(p: Pixels, a: [number, number], b: [number, number], c: [number, number], color: number): Pixels {
  const side = (p1: number[], p2: number[], p3: number[]) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const pt = [x + 0.5, y + 0.5];
      const d1 = side(pt, a, b);
      const d2 = side(pt, b, c);
      const d3 = side(pt, c, a);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) p.set(x, y, color);
    }
  return p;
}

/** An ASCII drawing: one letter a pixel, '.' left clear. The keys are print colors by letter. */
export function art(pal: Pal, rows: string[], extra: Record<string, number> = {}, w = 20, h = 20): Pixels {
  const { c } = pal;
  const key: Record<string, number> = {
    K: c('ink', 0),
    k: c('ink', 1),
    n: c('ink', 2),
    N: c('ink', 3),
    s: c('sky', 1),
    S: c('sky', 3),
    P: c('paper', 4),
    p: c('paper', 3),
    q: c('paper', 2),
    Q: c('paper', 0),
    G: c('gold', 3),
    g: c('gold', 2),
    y: c('gold', 1),
    Y: c('gold', 0),
    R: c('red', 2),
    r: c('red', 1),
    m: c('smoke', 2),
    M: c('smoke', 1),
    w: c('smoke', 0),
    ...extra,
  };
  return new Pixels(w, h, T).draw(0, 0, rows, key);
}
