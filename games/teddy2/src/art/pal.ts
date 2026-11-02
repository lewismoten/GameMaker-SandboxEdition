// Teddy's colors: one set of named ramps shared by every block, sprite and screen, and a
// palette per time of day. The art never changes between levels; the .PAL does, so the
// same town goes from a pink morning in the backyard to the Clown Club's lights at night.

type RGB = [number, number, number];
export type { TimeOfDay } from '@lewismoten/gamemaker-sandbox-tools/colors';

/** [name, shades, dark, light, mid?, glows at night?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [20, 14, 18], [52, 40, 44]],
  ['sky', 8, [92, 150, 230], [214, 238, 255]],
  ['cloud', 3, [190, 204, 228], [255, 255, 255]],
  ['grass', 5, [30, 84, 26], [150, 214, 84]],
  ['leaf', 4, [16, 56, 30], [70, 140, 64]],
  ['dirt', 5, [60, 34, 18], [176, 122, 74]],
  ['wood', 5, [70, 38, 20], [212, 156, 96]],
  ['paint', 4, [150, 156, 170], [255, 255, 250]],
  ['brick', 5, [84, 26, 22], [214, 110, 82]],
  ['stone', 5, [70, 70, 80], [200, 196, 190]],
  ['asphalt', 4, [36, 36, 44], [104, 104, 116]],
  ['roof', 4, [64, 26, 34], [170, 72, 72]],
  ['siding', 4, [56, 90, 130], [150, 190, 226]],
  ['corgi', 5, [112, 44, 10], [250, 176, 92]],
  ['fur', 3, [196, 186, 176], [255, 252, 244]],
  ['gwinn', 5, [44, 22, 12], [170, 104, 62]],
  ['red', 4, [120, 10, 20], [255, 84, 84]],
  ['yellow', 4, [150, 104, 0], [255, 238, 96]],
  ['blue', 4, [20, 40, 120], [96, 160, 255]],
  ['green', 3, [20, 100, 50], [96, 220, 120]],
  ['purple', 4, [60, 20, 90], [190, 120, 240]],
  ['pink', 4, [170, 60, 110], [255, 190, 220]],
  ['skin', 4, [120, 70, 48], [255, 214, 180]],
  ['metal', 5, [50, 56, 66], [220, 226, 232]],
  ['water', 4, [24, 70, 150], [150, 220, 255]],
  ['tongue', 2, [190, 60, 80], [255, 130, 150]],
  ['glow', 4, [170, 110, 30], [255, 252, 200], undefined, true],
  ['neon', 4, [255, 60, 140], [80, 220, 255], [255, 230, 80], true],
  ['gold', 3, [150, 100, 10], [255, 230, 110]],
  // new in the sequel: wallpaper, tile, hay and mud
  ['peach', 4, [150, 90, 70], [255, 220, 186]],
  ['teal', 4, [20, 80, 90], [160, 232, 222]],
  ['hay', 4, [120, 84, 20], [250, 224, 130]],
  ['mud', 3, [46, 28, 14], [120, 82, 44]],
];

/** Ramps dimmed less at night, and the night light they get instead. */
const MOONLIT = new Set(['fur']);
const MOON: RGB = [0.78, 0.82, 0.94];
export type { PalWithBuilder as Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
export function buildPalette(time: TimeOfDay): Pal {
  return buildRampPalette(RAMPS, {
    overrides: { sky: SKY[time] },
    transform: (name, c, glows) => {
      if (time === 'night' && MOONLIT.has(name)) return lightColor(c, { mul: MOON, add: [12, 12, 12] });
      return glows && (time === 'night' || time === 'sunset' || time === 'show') ? c : lightColor(c, time);
    },
  });
}
/** Screen colors remain family art data; the builder is shared. */
export const buildScreenPalette = (): Pal => buildRampPalette([...RAMPS, ...SCREEN_RAMPS]);

/** Index of a ramp shade in every palette (the builders add ramps in the same order). */
export const P = buildPalette('noon');

import { buildRampPalette, type PalWithBuilder as Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { lightColor, TIME_OF_DAY_SKY as SKY, type TimeOfDay } from '@lewismoten/gamemaker-sandbox-tools/colors';
import { SCREEN_RAMPS } from '../../../teddy/src/art/screenRamps';
