// LUCKY CAT's palette (the woodcut's inks, print.ts), and each level's look: the same blocks printed with a
// different plate (the `sky` ramp) and spot color (`gold`), the way a printer changes inks between runs.
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { buildPrintPalette, type Pal } from './print';

type RGB = [number, number, number];

/** The game's palette (index 0 is black). */
export function buildCatPalette(): Pal {
  return buildPrintPalette();
}

/** A ramp's new look: [darkest, lightest, middle]. */
export type Tint = [RGB, RGB, RGB?];

/** A copy of the palette bytes with the named ramps recolored. */
export function swapped(pal: Pal, tints: Record<string, Tint>): Uint8Array {
  const out = new Uint8Array(pal.pal);
  const scratch = new PaletteBuilder();
  for (const [name, [from, to, mid]] of Object.entries(tints)) {
    const idx = pal.r(name);
    const made = scratch.ramp(`t_${name}`, idx.length, from, to, mid);
    idx.forEach((at, i) => out.set(scratch.pal.subarray(made[i] * 3, made[i] * 3 + 3), at * 3));
  }
  return out;
}

/** Each level's inks. Level 1 keeps the base: a blue-black night and gold. */
export const LOOKS: Record<string, Record<string, Tint>> = {
  // the funhouse: a cold teal plate, silver-blue spot
  mirror: {
    sky: [
      [10, 34, 40],
      [96, 170, 170],
      [26, 70, 78],
    ],
    gold: [
      [40, 80, 110],
      [220, 246, 255],
      [130, 196, 230],
    ],
  },
  // the town hall at an emergency meeting: oxblood walls, gold
  hall: {
    sky: [
      [40, 12, 18],
      [170, 90, 90],
      [84, 28, 34],
    ],
  },
  // saucer alley: a brick-brown plate and a cream-white spot
  alley: {
    sky: [
      [30, 14, 10],
      [176, 118, 88],
      [66, 34, 24],
    ],
    gold: [
      [120, 100, 60],
      [255, 252, 224],
      [236, 216, 150],
    ],
  },
  // the mirror shop: a plum plate and a silver spot
  shop: {
    sky: [
      [24, 10, 34],
      [150, 110, 170],
      [56, 26, 74],
    ],
    gold: [
      [90, 100, 120],
      [250, 252, 255],
      [180, 196, 214],
    ],
  },
  // the granary stair: a green-gray plate and a lantern-orange spot
  steps: {
    sky: [
      [14, 24, 22],
      [128, 160, 140],
      [34, 56, 50],
    ],
    gold: [
      [120, 50, 0],
      [255, 220, 150],
      [240, 140, 40],
    ],
  },
  // earlier that morning: the print turned over, a pale dawn plate and a tangerine spot (Rascal's hour)
  morning: {
    sky: [
      [196, 178, 170],
      [255, 248, 230],
      [238, 222, 200],
    ],
    gold: [
      [130, 50, 10],
      [255, 210, 130],
      [246, 130, 40],
    ],
  },
  // the race to the fair: a violet dusk, gold and hot red
  fair: {
    sky: [
      [36, 16, 50],
      [180, 110, 170],
      [74, 34, 90],
    ],
    red: [
      [130, 10, 40],
      [255, 120, 110],
      [236, 40, 60],
    ],
  },
  // inside the clock tower: sepia and brass
  tower: {
    sky: [
      [30, 20, 12],
      [170, 130, 90],
      [64, 44, 28],
    ],
    gold: [
      [110, 80, 20],
      [250, 230, 150],
      [210, 170, 70],
    ],
  },
  // the rooftops: a slate plate and a moon-green spot
  roof: {
    sky: [
      [16, 24, 30],
      [120, 150, 150],
      [36, 52, 60],
    ],
    gold: [
      [60, 90, 40],
      [230, 255, 190],
      [170, 220, 110],
    ],
  },
  // the other side of the mirror: the town in negative, a pale silver plate
  glass: {
    sky: [
      [170, 196, 206],
      [252, 255, 255],
      [214, 230, 236],
    ],
    gold: [
      [60, 70, 96],
      [190, 200, 230],
      [110, 126, 170],
    ],
  },
  // the night market: an indigo plate and lantern red
  market: {
    sky: [
      [12, 10, 40],
      [120, 120, 190],
      [34, 30, 88],
    ],
    red: [
      [120, 16, 24],
      [255, 170, 100],
      [240, 70, 36],
    ],
  },
  // payback: a red-black plate and the hottest gold
  dusk: {
    sky: [
      [30, 6, 12],
      [190, 70, 70],
      [72, 14, 24],
    ],
    gold: [
      [140, 80, 0],
      [255, 246, 150],
      [255, 196, 30],
    ],
  },
};
