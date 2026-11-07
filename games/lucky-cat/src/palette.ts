// LUCKY CAT's palette: the Starters' bright ramps, plus Midnight's fur and a few sky and wall tints, and a way to
// give each level its own look by recoloring named ramps (the same blocks, a different time and place).
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];

/** Midnight's fur: a dark ramp with a violet sheen, light enough to read against the ink outline. */
function furRamp(b: PaletteBuilder): void {
  b.ramp('fur', 5, [26, 22, 48], [104, 94, 164], [48, 42, 86]);
}

/** The game's palette (index 0 is black; the shared ramps keep their indices). */
export function buildCatPalette(): Pal {
  return buildStarterPalette(furRamp);
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

/** Each level's look. Level 1 keeps the base palette. */
export const LOOKS: Record<string, Record<string, Tint>> = {
  // a funhouse of mirrors: lilac sky, purple walls, teal floor
  mirror: {
    sky: [
      [96, 80, 190],
      [226, 214, 255],
      [160, 140, 236],
    ],
    brick: [
      [60, 40, 120],
      [230, 190, 250],
      [140, 90, 200],
    ],
    grass: [
      [20, 90, 110],
      [150, 245, 235],
      [50, 170, 170],
    ],
    dirt: [
      [40, 30, 90],
      [150, 130, 220],
      [90, 70, 170],
    ],
  },
  // the town hall: warm cream walls, wooden floor
  hall: {
    sky: [
      [220, 180, 120],
      [255, 246, 214],
      [244, 214, 160],
    ],
    brick: [
      [120, 60, 40],
      [250, 190, 140],
      [200, 110, 80],
    ],
    grass: [
      [110, 60, 30],
      [240, 190, 110],
      [180, 120, 60],
    ],
    dirt: [
      [80, 44, 28],
      [200, 140, 90],
      [140, 88, 56],
    ],
  },
  // the afternoon of the fair: peach sky
  fair: {
    sky: [
      [250, 150, 90],
      [255, 240, 190],
      [255, 196, 130],
    ],
    brick: [
      [150, 40, 60],
      [255, 170, 130],
      [220, 80, 80],
    ],
  },
  // rooftops and wind: mint sky
  roof: {
    sky: [
      [60, 170, 170],
      [220, 255, 240],
      [140, 220, 210],
    ],
    brick: [
      [90, 50, 70],
      [230, 160, 150],
      [170, 90, 100],
    ],
    grass: [
      [60, 90, 140],
      [190, 220, 255],
      [110, 150, 210],
    ],
  },
  // inside the clock tower: dark teal and warm amber
  tower: {
    sky: [
      [30, 50, 80],
      [150, 190, 220],
      [70, 100, 140],
    ],
    brick: [
      [90, 60, 40],
      [240, 190, 120],
      [170, 110, 70],
    ],
    grass: [
      [70, 50, 30],
      [210, 170, 100],
      [140, 100, 60],
    ],
  },
  // sunset over the town for the finale
  dusk: {
    sky: [
      [120, 70, 170],
      [255, 214, 190],
      [236, 130, 160],
    ],
    brick: [
      [80, 30, 70],
      [240, 150, 130],
      [180, 70, 100],
    ],
    grass: [
      [30, 90, 70],
      [150, 220, 120],
      [60, 150, 90],
    ],
  },
};
