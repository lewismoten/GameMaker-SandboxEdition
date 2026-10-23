// Ohm Sweet Ohm's colors: one 256-color palette shared by every circuit board, sprite and
// screen. Named ramps keep the art readable ("copper at shade 3"), and the inks that
// PLAYGAME looks up by color (menu blue, warning red, text purple) are exact matches so
// its own words come out crisp on our screens.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];

/** [name, shades, dark, light, mid?] */
const RAMPS: [string, number, RGB, RGB, RGB?][] = [
  ['ink', 3, [8, 10, 16], [44, 48, 60]],
  ['pcb', 6, [6, 34, 22], [70, 150, 96], [24, 84, 52]],
  ['mask', 4, [10, 52, 70], [70, 150, 170]],
  ['copper', 5, [90, 40, 14], [255, 196, 120], [196, 110, 50]],
  ['gold', 4, [130, 90, 10], [255, 236, 130]],
  ['metal', 6, [40, 44, 54], [236, 240, 246]],
  ['plastic', 5, [92, 80, 64], [246, 236, 210]],
  ['red', 5, [90, 8, 14], [255, 120, 110], [220, 40, 40]],
  ['blue', 5, [16, 24, 90], [130, 180, 255], [40, 80, 220]],
  ['green', 4, [10, 80, 30], [150, 255, 140]],
  ['yellow', 4, [150, 104, 0], [255, 250, 140]],
  ['orange', 4, [140, 50, 0], [255, 180, 60]],
  // the garage's board: a dark brown-orange phenolic, so copper and Watt (orange) stand out on it
  ['rust', 4, [44, 18, 6], [110, 52, 20]],
  ['spark', 5, [60, 140, 255], [255, 255, 255], [160, 230, 255]],
  ['zap', 4, [255, 140, 0], [255, 255, 200], [255, 230, 60]],
  ['teal', 5, [10, 60, 70], [140, 240, 230]],
  ['purple', 4, [50, 16, 80], [200, 140, 255]],
  ['pink', 3, [190, 60, 120], [255, 190, 220]],
  ['wood', 4, [70, 38, 20], [200, 146, 90]],
  ['sky', 6, [16, 18, 60], [120, 150, 230]],
  ['night', 4, [4, 4, 14], [30, 30, 66]],
  ['skin', 3, [150, 90, 60], [255, 214, 180]],
  ['paper', 4, [176, 168, 146], [255, 252, 238]],
];

export interface Pal {
  pal: Uint8Array;
  r(name: string): number[];
  c(name: string, k: number): number;
  /** The exact inks PLAYGAME matches for menus and text pages. */
  ink: { red: number; blue: number; purple: number; yellow: number; white: number; black: number };
}

export function buildPalette(): Pal {
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
