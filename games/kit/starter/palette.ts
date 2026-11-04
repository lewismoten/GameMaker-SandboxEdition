// The Starters' palette: bright, friendly ramps that every Starter game shares, so the block
// set, the hero and the monsters look right together. Ramps are looked up by name
// (pal.c('grass', 3) is the fourth shade of grass), lightest last.
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { type Pal, wrap } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';

export type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
type RGB = [number, number, number];

/** [name, shades, darkest, lightest, middle?] */
const RAMPS: [string, number, RGB, RGB, RGB?][] = [
  ['ink', 3, [24, 20, 44], [92, 84, 124]],
  ['sky', 6, [70, 150, 236], [200, 238, 255], [130, 200, 250]],
  ['white', 4, [180, 196, 224], [255, 255, 255]],
  ['grass', 6, [30, 110, 50], [170, 240, 90], [72, 176, 62]],
  ['dirt', 6, [86, 48, 34], [206, 140, 90], [144, 88, 56]],
  ['brick', 6, [112, 34, 40], [240, 150, 110], [196, 78, 62]],
  ['wood', 5, [84, 46, 24], [232, 176, 108], [168, 106, 54]],
  ['stone', 5, [70, 76, 100], [214, 222, 238], [138, 148, 176]],
  ['gold', 6, [150, 86, 8], [255, 250, 160], [250, 200, 40]],
  ['red', 5, [120, 18, 36], [255, 150, 130], [226, 52, 58]],
  ['blue', 5, [24, 50, 140], [140, 190, 255], [58, 108, 226]],
  ['skin', 4, [160, 92, 58], [255, 214, 176], [236, 164, 118]],
  ['hair', 3, [60, 32, 22], [140, 86, 52]],
  ['green', 5, [20, 100, 74], [150, 250, 190], [50, 190, 120]],
  ['purple', 5, [70, 30, 120], [214, 170, 255], [140, 84, 210]],
  ['orange', 5, [170, 66, 10], [255, 214, 130], [250, 138, 30]],
  ['pink', 4, [190, 70, 120], [255, 214, 232], [250, 130, 176]],
  ['parch', 5, [160, 120, 70], [255, 246, 214], [226, 190, 130]],
];

/**
 * Every Starter's palette. Index 0 is black (the border and fades use it); the designer
 * colors and the three text colors PLAYGAME writes with (menu blue, plum, hot red) are in too.
 */
export function buildStarterPalette(): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return wrap(b);
}

/** The sky color every blank block starts from. */
export const skyOf = (pal: Pal): number => pal.c('sky', 3);
