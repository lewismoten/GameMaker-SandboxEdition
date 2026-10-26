// The Tiny Pockets Library's colors: one 256-color palette shared by the reading room, every
// wing, every book and every screen. Named ramps keep the art readable ("wood at shade 3"),
// and the inks PLAYGAME looks up by color (menu blue, warning red, text purple) are exact
// matches so its own words come out crisp on our pages.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];

/** [name, shades, dark, light, mid?] */
const RAMPS: [string, number, RGB, RGB, RGB?][] = [
  ['ink', 3, [10, 8, 12], [52, 46, 54]],
  ['paper', 5, [170, 150, 112], [255, 250, 232], [228, 214, 176]],
  ['wood', 6, [48, 24, 12], [226, 168, 102], [140, 80, 38]],
  ['red', 6, [70, 6, 10], [255, 150, 130], [214, 34, 30]],
  ['green', 6, [8, 44, 20], [180, 240, 130], [50, 140, 50]],
  ['blue', 6, [10, 18, 70], [170, 210, 255], [40, 90, 210]],
  ['brass', 5, [96, 60, 8], [255, 240, 150], [214, 160, 40]],
  ['tin', 6, [34, 40, 52], [240, 246, 252], [130, 146, 166]],
  ['purple', 5, [36, 10, 60], [220, 170, 255], [130, 60, 190]],
  ['yellow', 4, [160, 110, 0], [255, 250, 150]],
  ['orange', 4, [140, 50, 0], [255, 190, 90]],
  ['pink', 4, [150, 40, 90], [255, 200, 225]],
  ['skin', 4, [110, 60, 36], [255, 218, 186]],
  ['brown', 4, [44, 24, 14], [170, 110, 70]],
  ['teal', 5, [6, 50, 56], [150, 240, 226]],
  ['sky', 5, [60, 110, 190], [200, 230, 255]],
  ['night', 5, [6, 6, 20], [60, 64, 120]],
  ['gray', 6, [30, 30, 34], [230, 230, 226]],
  ['sand', 4, [150, 110, 60], [250, 230, 170]],
  ['corgi', 4, [150, 64, 14], [255, 200, 120]],
];

interface Pal {
  pal: Uint8Array;
  /** Palette entries in use (the rest are free, e.g. for color cycling). */
  used: number;
  r(name: string): number[];
  c(name: string, k: number): number;
  /** The exact inks PLAYGAME matches for menus and text pages. */
  ink: { red: number; blue: number; purple: number; yellow: number; white: number; black: number };
}

function buildPalette(): Pal {
  const p = new PaletteBuilder();
  p.designerColors();
  // PLAYGAME's text inks (6-bit 63,10,10 / 10,10,63 / 50,10,50 / 63,63,0) as exact colors.
  const red = p.color(252, 40, 40);
  const blue = p.color(40, 40, 252);
  const purple = p.color(200, 40, 200);
  const yellow = p.color(252, 252, 0);
  const white = p.color(255, 255, 255);
  const black = p.color(0, 0, 0);
  for (const [name, n, a, b, m] of RAMPS) p.ramp(name, n, a, b, m);
  return {
    pal: p.pal,
    used: p.used,
    r: (name) => p.get(name),
    c: (name, k) => {
      const r = p.get(name);
      return r[Math.max(0, Math.min(r.length - 1, k))];
    },
    ink: { red, blue, purple, yellow, white, black },
  };
}

export const PAL = buildPalette();
export const c = (name: string, k: number) => PAL.c(name, k);
export const r = (name: string) => PAL.r(name);
