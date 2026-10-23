// OUT AND ABOUT: the ramps every errand is drawn in (the grocery store's cream walls and
// linoleum, the self-checkout's screen, the parking lot's asphalt and the beige minivan, the
// restaurant's wallpaper and its china, the banquet's uprising), the puff every beaten foe of
// the set goes up in, and the drawing helpers the four monologues share.
import { Pixels } from '../../../../kit/pixels';
import type { Lighting, Pal, Ramp } from '../../art/pal';
import type { BlockBook } from '../../common/blocks';
import { T, outline, type SpriteBook } from '../../common/sprites';

export const ERRANDS_RAMPS: Ramp[] = [
  // the grocery store
  ['cream', 4, [150, 138, 108], [252, 246, 226]],
  ['lino', 3, [96, 108, 100], [212, 222, 210]],
  ['lcd', 3, [16, 50, 80], [130, 236, 250], undefined, true],
  ['orange', 4, [140, 56, 8], [255, 196, 96]],
  // the parking lot
  ['asphalt', 4, [36, 38, 44], [134, 134, 140]],
  ['van', 3, [118, 100, 74], [232, 214, 178]],
  ['facade', 3, [60, 80, 112], [170, 190, 214]],
  // the restaurant and the banquet hall
  ['wallpaper', 4, [76, 24, 36], [206, 120, 116]],
  ['china', 3, [146, 156, 176], [246, 250, 255]],
  ['gas', 3, [70, 100, 20], [214, 236, 120]],
];

/** The parking lot: Tuesday, cloudy skies, unforgiving humidity (a muggy grey-green cast). */
export const MUGGY: Lighting = {
  sky: [
    [118, 124, 120],
    [214, 214, 200],
    [168, 172, 162],
  ],
  mul: [0.94, 0.96, 0.9],
  add: [6, 8, 0],
};
/** The restaurant after dinner: warm lamps, night in the windows. */
export const DINNER: Lighting = {
  sky: [
    [12, 14, 40],
    [60, 70, 120],
    [30, 34, 76],
  ],
  mul: [1, 0.94, 0.86],
  add: [8, 2, 0],
};
/** The banquet at 6:42 p.m.: the sun going down in the tall windows. */
export const DUSK: Lighting = {
  sky: [
    [60, 40, 100],
    [255, 190, 110],
    [220, 110, 110],
  ],
  mul: [1, 0.95, 0.9],
  add: [6, 0, 0],
};

/** A transparent canvas. */
export const clear = (w = 20, h = 20) => new Pixels(w, h, T);

/** Draws a thing on a transparent canvas, outlines it in ink, and lays it over a copy of `bg`. */
export function over(bg: Pixels, pal: Pal, draw: (p: Pixels) => void): Pixels {
  const thing = clear(bg.w, bg.h);
  draw(thing);
  outline(thing, pal.c('ink', 0));
  return bg.crop(0, 0, bg.w, bg.h).blit(thing, 0, 0, T);
}

/**
 * Cuts a picture (whole blocks) into blocks named `<name>.<col>.<row>` over `bg` (whose pixels
 * show through the picture's T), adding only the cells `only` names (all of them by default).
 */
export function cut(
  book: BlockBook,
  name: string,
  pic: Pixels,
  bg: Pixels | ((col: number, row: number) => Pixels),
  attrs: (col: number, row: number) => object,
  only?: [number, number][],
): void {
  const cols = Math.ceil(pic.w / 20);
  const rows = Math.ceil(pic.h / 20);
  for (let r = 0; r < rows; r++)
    for (let col = 0; col < cols; col++) {
      if (only && !only.some(([a, b]) => a === col && b === r)) continue;
      const back = typeof bg === 'function' ? bg(col, r) : bg;
      const p = back.crop(0, 0, 20, 20);
      p.blit(pic.crop(col * 20, r * 20, 20, 20), 0, 0, T);
      book.add(`${name}.${col}.${r}`, p, attrs(col, r));
    }
}

/** The puff every beaten foe of the set goes up in: a ring of dust and stars. */
export function poofSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const puff = (f: number) => {
    const p = clear();
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + f;
      const r = 4 + f * 3;
      p.disc(10 + Math.cos(a) * r, 11 + Math.sin(a) * r * 0.8, 2.4 - f * 0.8, c('grey', 3 - f));
    }
    p.set(10, 4 - f, c('gold', 3))
      .set(9, 5 - f, c('gold', 2))
      .set(11, 5 - f, c('gold', 2))
      .set(10, 6 - f, c('gold', 3));
    return p;
  };
  book.add('poof0', puff(0));
  book.add('poof1', puff(1));
}
