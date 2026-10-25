// The game's one palette layout: named ramps that every block, sprite and screen draws in, and
// the lights each scene sees them by (evening, lamplight, inside the clock, the black of a pass
// scene). A light tints every ramp but the ones that glow (Joe's bulb, gold, lit windows), so
// one block set can be used in any scene, and a dark scene is the same art by a dimmer light.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];

/** Ramps: name, shades, dark, light (and an optional middle). */
const RAMPS: [string, number, RGB, RGB, RGB?][] = [
  ['ink', 2, [12, 10, 20], [44, 38, 54]],
  ['tin', 7, [44, 50, 62], [240, 244, 248]],
  ['brass', 5, [74, 48, 12], [250, 216, 116]],
  ['red', 5, [74, 10, 12], [252, 118, 96]],
  ['paper', 5, [128, 110, 86], [255, 250, 236]],
  ['wood', 6, [42, 24, 14], [206, 146, 84]],
  ['brick', 5, [64, 26, 22], [206, 116, 84]],
  ['stone', 6, [34, 34, 46], [196, 194, 206]],
  ['grass', 5, [16, 42, 22], [136, 204, 96]],
  ['dusk', 6, [22, 18, 54], [252, 178, 116], [126, 62, 112]],
  ['blue', 5, [12, 22, 64], [128, 176, 244]],
  ['purple', 4, [42, 12, 54], [196, 128, 224]],
  ['green', 4, [12, 54, 32], [96, 206, 128]],
  ['skin', 4, [116, 64, 44], [255, 214, 186]],
  ['pink', 3, [156, 64, 84], [255, 176, 186]],
  ['yellow', 4, [124, 92, 0], [255, 242, 128]],
  ['gold', 6, [84, 52, 0], [255, 252, 196]],
  ['window', 3, [140, 96, 20], [255, 236, 150]],
];

/** Ramps that give light, and keep their color whatever the light. */
const GLOWS = new Set(['yellow', 'gold', 'window']);

/** The colors PLAYGAME asks for by RGB (text pages in purple, the menu in blue, scores in red and yellow). */
/** Ramps added after the system colors (so every earlier index stays put): snow and ice, the sky. */
const MORE: [string, number, RGB, RGB, RGB?][] = [
  ['snow', 5, [120, 136, 172], [250, 252, 255]],
  ['sky', 5, [20, 40, 96], [150, 196, 246]],
  ['leaf', 5, [14, 52, 20], [150, 222, 92]],
];

const SYSTEM: [string, RGB][] = [
  ['sysPurple', [176, 0, 176]],
  ['sysBlue', [40, 40, 252]],
  ['sysRed', [252, 40, 40]],
  ['sysYellow', [252, 252, 0]],
  ['sysBlack', [0, 0, 0]],
];

export type Light = 'day' | 'evening' | 'night' | 'dark' | 'lamp' | 'clock' | 'black' | 'snow' | 'gold';

const LIGHTS: Record<Light, RGB> = {
  day: [1, 1, 1],
  evening: [0.86, 0.8, 0.92],
  lamp: [1, 0.9, 0.76],
  clock: [0.82, 0.78, 0.74],
  night: [0.58, 0.62, 0.86],
  /** The cove with the lighthouse out: next to nothing shows but what glows. */
  dark: [0.14, 0.15, 0.24],
  black: [0, 0, 0],
  /** A snow day: bright, a little blue. */
  snow: [0.96, 0.98, 1.04],
  /** Watt's workshop when the tally counter goes gold: everything warm. */
  gold: [1.12, 0.92, 0.52],
};

export interface Pal {
  pal: Uint8Array;
  c: (name: string, k: number) => number;
  r: (name: string) => number[];
}

export function buildPalette(light: Light = 'day'): Pal {
  const pb = new PaletteBuilder();
  const tint = LIGHTS[light];
  const lit = (name: string, v: RGB): RGB => (GLOWS.has(name) && light !== 'black' ? v : (v.map((x, i) => Math.min(255, Math.round(x * tint[i]))) as RGB));
  for (const [name, n, from, to, mid] of RAMPS) {
    pb.ramp(name, n, lit(name, from), lit(name, to), mid && lit(name, mid));
  }
  for (const [name, rgb] of SYSTEM) pb.ramp(name, 1, rgb, rgb);
  for (const [name, n, from, to, mid] of MORE) pb.ramp(name, n, lit(name, from), lit(name, to), mid && lit(name, mid));
  return {
    pal: pb.pal,
    c: (name, k) => {
      const r = pb.get(name);
      return r[Math.max(0, Math.min(r.length - 1, k))];
    },
    r: (name) => pb.get(name),
  };
}

/** The daylight palette: the one every picture is drawn in (the indexes are the same in all). */
export const PAL = buildPalette('day');
export const c = (name: string, k: number) => PAL.c(name, k);
export const r = (name: string) => PAL.r(name);
