// IN THE YEAR 2000: one VGA palette for everything, blocks and screens alike. Chrome,
// hot pink, teal and purple: the future as it looked from a 1992 sticker book.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];

/** [name, shades, dark, light, mid?] */
const RAMPS: [string, number, RGB, RGB, RGB?][] = [
  ['gray', 8, [0, 0, 0], [255, 255, 255]],
  ['chrome', 8, [26, 30, 56], [244, 250, 255], [120, 140, 186]],
  ['teal', 6, [0, 54, 66], [150, 255, 236], [0, 176, 170]],
  ['pink', 6, [80, 0, 46], [255, 182, 232], [234, 40, 160]],
  ['purple', 6, [30, 10, 64], [206, 166, 255], [110, 50, 190]],
  ['gold', 6, [96, 56, 0], [255, 252, 160], [250, 196, 30]],
  ['orange', 5, [110, 38, 0], [255, 184, 84], [240, 112, 16]],
  ['red', 5, [72, 0, 6], [255, 128, 116], [220, 24, 30]],
  ['green', 6, [8, 46, 18], [160, 244, 120], [40, 150, 50]],
  ['neon', 4, [50, 130, 0], [214, 255, 100]],
  ['sky', 8, [36, 74, 170], [214, 242, 255], [96, 160, 236]],
  ['night', 8, [4, 4, 18], [56, 44, 120]],
  ['skin', 4, [112, 62, 34], [255, 212, 172]],
  ['hair', 3, [36, 18, 8], [128, 74, 30]],
  ['brick', 4, [84, 36, 36], [214, 134, 112]],
  ['concrete', 5, [104, 104, 116], [228, 228, 234]],
  ['asphalt', 4, [26, 26, 38], [92, 92, 116]],
  ['glass', 4, [30, 110, 156], [206, 252, 255]],
  ['wood', 4, [58, 32, 14], [186, 124, 70]],
  ['paper', 3, [184, 184, 164], [255, 255, 246]],
  ['moon', 6, [44, 44, 56], [214, 214, 222]],
  ['denim', 5, [10, 18, 88], [96, 146, 255]],
  ['sunset', 12, [24, 10, 66], [255, 214, 120], [222, 56, 140]],
  ['alien', 4, [20, 90, 30], [170, 255, 140]],
];

interface Pal {
  pal: Uint8Array;
  r: (name: string) => number[];
  /** Shade k of a ramp, clamped. */
  c: (name: string, k: number) => number;
  /** Game-Maker's text colors: the nearest to these are used for menus and text pages. */
  textPurple: number;
  menuBlue: number;
  moreRed: number;
}

function buildPalette(): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  // Display_File writes in the color nearest (50,10,50)*4, menus in (10,10,63)*4 and
  // "MORE..." in (63,10,10)*4; give each an exact match so text always reads.
  const textPurple = b.color(200, 40, 200);
  const menuBlue = b.color(40, 40, 252);
  const moreRed = b.color(252, 40, 40);
  const r = (name: string) => b.get(name);
  return {
    pal: b.pal,
    r,
    c: (name, k) => {
      const ramp = r(name);
      return ramp[Math.max(0, Math.min(ramp.length - 1, k))];
    },
    textPurple,
    menuBlue,
    moreRed,
  };
}

export const PAL = buildPalette();
export const C = PAL.c;
