// HEAT WAVES' two palettes. Both hold the same 256 slots in the same order (the Starters' palette,
// then this game's own ramps), so a block drawn with a slot shows that slot's color in whichever
// palette its scene loads. HOT.PAL is a bleached noon: a pale sky, rose hills, orange sand.
// COOL.PAL changes only this game's ramps, to an evening's blues and grays; Kit, the signs and the
// door keep their colors. Day and Night (games/day-night) shows the same trick with three palettes.
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = readonly [number, number, number];
/** A ramp: its name, how many shades, and its darkest, lightest and middle colors. */
type Ramp = readonly [string, number, RGB, RGB, RGB?];

/** The noon colors. */
const HOT: Ramp[] = [
  ['haze', 5, [128, 176, 220], [252, 244, 212], [196, 216, 228]],
  ['mesa', 4, [150, 84, 74], [238, 172, 128], [204, 120, 94]],
  ['flat', 3, [214, 162, 104], [248, 222, 166]],
  ['sand', 4, [184, 116, 58], [246, 200, 124], [226, 160, 86]],
  ['tar', 3, [66, 58, 60], [132, 118, 108]],
  ['paint', 1, [250, 214, 78], [250, 214, 78]],
  ['glint', 3, [150, 200, 236], [252, 254, 255], [206, 230, 250]],
  ['rock', 4, [108, 58, 44], [214, 140, 94], [164, 94, 64]],
  ['brush', 2, [124, 112, 50], [178, 162, 80]],
];

/** The evening colors: the same ramps, cool. */
const COOL: Ramp[] = [
  ['haze', 5, [34, 48, 104], [176, 204, 228], [86, 116, 176]],
  ['mesa', 4, [52, 46, 92], [134, 124, 174], [88, 78, 134]],
  ['flat', 3, [92, 96, 132], [152, 158, 188]],
  ['sand', 4, [78, 78, 100], [170, 166, 174], [122, 118, 140]],
  ['tar', 3, [34, 38, 54], [82, 86, 106]],
  ['paint', 1, [204, 194, 124], [204, 194, 124]],
  ['glint', 3, [110, 140, 190], [220, 230, 250], [160, 186, 226]],
  ['rock', 4, [54, 44, 70], [142, 116, 142], [96, 78, 110]],
  ['brush', 2, [58, 76, 70], [100, 122, 102]],
];

const build = (ramps: Ramp[]): Pal => buildStarterPalette((b) => ramps.forEach(([name, n, from, to, mid]) => b.ramp(name, n, from, to, mid)), 'heat-waves');

/** The noon palette (every picture is drawn with its slots) and the evening one's colors. */
export function buildPalettes(): { pal: Pal; hot: Uint8Array; cool: Uint8Array } {
  const pal = build(HOT);
  return { pal, hot: Uint8Array.from(pal.pal), cool: Uint8Array.from(build(COOL).pal) };
}
