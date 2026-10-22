// Snowbound's colors: one set of named ramps shared by every block, and a palette per
// time of day. The block art never changes between scenes; the .PAL does, so the same
// street goes from a pink winter morning to a blue night with glowing windows.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type TimeOfDay = 'morning' | 'noon' | 'dusk' | 'night';

/** [name, shades, dark, light, mid?, glows at night?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [14, 14, 28], [40, 40, 64]],
  ['snow', 7, [84, 96, 140], [255, 255, 255], [176, 196, 232]],
  ['ice', 5, [60, 110, 170], [225, 248, 255]],
  ['asphalt', 5, [28, 28, 36], [118, 118, 130]],
  ['concrete', 4, [104, 104, 116], [204, 204, 210]],
  ['brick', 5, [70, 18, 20], [206, 96, 72]],
  ['siding', 5, [28, 48, 92], [136, 176, 226]],
  ['butter', 4, [120, 88, 28], [244, 214, 128]],
  ['wood', 5, [46, 26, 14], [186, 134, 82]],
  ['pine', 5, [8, 36, 24], [84, 152, 92]],
  ['skin', 3, [150, 88, 58], [252, 204, 164]],
  ['hair', 2, [52, 28, 12], [112, 66, 30]],
  ['coat', 4, [92, 10, 20], [244, 72, 60]],
  ['gold', 4, [140, 88, 0], [255, 232, 96]],
  ['jeans', 3, [20, 30, 82], [72, 104, 176]],
  ['orange', 4, [128, 48, 0], [255, 164, 40], undefined, true],
  ['dog', 4, [86, 48, 20], [232, 184, 112]],
  ['glow', 4, [150, 96, 30], [255, 250, 196], undefined, true],
  ['pink', 5, [124, 26, 78], [255, 186, 224], undefined, true],
  ['money', 3, [18, 78, 30], [150, 222, 140]],
  ['grey', 6, [0, 0, 0], [255, 255, 255]],
  ['bulbs', 4, [255, 60, 60], [80, 160, 255], [80, 255, 120], true],
];

const SKY: Record<TimeOfDay, { mul: RGB; add: RGB }> = {
  morning: { mul: [1.0, 0.95, 0.97], add: [10, 0, 6] },
  noon: { mul: [1, 1, 1], add: [0, 0, 0] },
  dusk: { mul: [0.82, 0.74, 0.86], add: [22, 8, 14] },
  night: { mul: [0.48, 0.54, 0.8], add: [6, 10, 26] },
};

export interface Pal {
  pal: Uint8Array;
  r: (name: string) => number[];
  /** Shade k of a ramp, clamped. */
  c: (name: string, k: number) => number;
}

export function buildPalette(time: TimeOfDay): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = SKY[time];
  for (const [name, n, from, to, mid, glows] of RAMPS) {
    const shade = (c: RGB): RGB => (glows && time !== 'noon' ? c : (c.map((v, i) => Math.min(255, Math.round(v * t.mul[i] + t.add[i]))) as RGB));
    if (name === 'bulbs') {
      // Christmas light colors: red, yellow, green, blue (not a ramp).
      const out = [
        [255, 60, 60],
        [255, 220, 60],
        [80, 255, 120],
        [80, 160, 255],
      ].map((c) => b.color(...(time === 'noon' || time === 'morning' ? (c.map((v) => v * 0.8) as RGB) : (c as RGB))));
      b.ramps.set(name, out);
      continue;
    }
    // At night the window light gets brighter, not darker.
    const f = glows && time === 'night' ? (c: RGB): RGB => c.map((v) => Math.min(255, v * 1.08 + 8)) as RGB : shade;
    b.ramp(name, n, f(from), f(to), mid ? f(mid) : undefined);
  }
  return wrap(b);
}

function wrap(b: PaletteBuilder): Pal {
  const r = (name: string) => b.get(name);
  return {
    pal: b.pal,
    r,
    c: (name, k) => {
      const ramp = r(name);
      return ramp[Math.max(0, Math.min(ramp.length - 1, k))];
    },
  };
}

/** The same ramps (noon) plus sky gradients and text inks for the 320x200 screens. */
export function buildScreenPalette(): Pal & { b: PaletteBuilder } {
  const b = new PaletteBuilder();
  b.designerColors();
  for (const [name, n, from, to, mid] of RAMPS) {
    if (name === 'bulbs') {
      b.ramps.set(
        name,
        [
          [255, 60, 60],
          [255, 220, 60],
          [80, 255, 120],
          [80, 160, 255],
        ].map((c) => b.color(c[0], c[1], c[2])),
      );
      continue;
    }
    b.ramp(name, n, from, to, mid);
  }
  b.ramp('dusksky', 16, [22, 18, 60], [250, 170, 150], [130, 70, 130]);
  b.ramp('nightsky', 8, [6, 8, 26], [40, 52, 110]);
  b.ramp('paper', 5, [150, 140, 116], [250, 246, 232]);
  b.ramp('newsink', 3, [22, 20, 24], [90, 86, 90]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('red', 1, [252, 40, 40], [252, 40, 40]);
  b.ramp('wall', 4, [70, 60, 90], [170, 150, 170]);
  return { ...wrap(b), b };
}
