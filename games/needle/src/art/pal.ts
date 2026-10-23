// The colors: one set of named ramps shared by every block and sprite, and a palette per
// place. The sprites never change between levels; the .PAL does: a soft gold morning at the
// city gate, the white-hot noon over the desert, lamplight in the tailor's shop, and night
// turning to dawn up the needle. The camel's gold, the stars and grace keep their own light.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'morning' | 'noon' | 'lamp' | 'night' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [22, 12, 10], [56, 38, 32]],
  ['camel', 6, [70, 40, 18], [246, 214, 150], [184, 132, 72]],
  ['sand', 6, [120, 84, 44], [252, 232, 178], [214, 170, 104]],
  ['stone', 6, [62, 50, 44], [244, 230, 200], [170, 146, 116]],
  ['wood', 5, [52, 30, 16], [200, 146, 88]],
  ['leaf', 5, [24, 60, 30], [170, 214, 96]],
  ['water', 4, [20, 70, 120], [170, 230, 240]],
  ['red', 4, [96, 16, 18], [244, 98, 72]],
  ['blue', 4, [22, 34, 92], [110, 160, 232]],
  ['purple', 4, [56, 20, 72], [196, 128, 220]],
  ['white', 3, [176, 168, 156], [255, 255, 250]],
  ['skin', 4, [96, 54, 32], [236, 186, 140]],
  ['hair', 3, [26, 18, 16], [96, 74, 60]],
  ['cloth', 4, [104, 86, 62], [234, 218, 186]],
  ['grey', 5, [36, 36, 42], [210, 210, 214]],
  ['pink', 3, [160, 76, 100], [255, 190, 200]],
  ['steel', 4, [70, 76, 92], [236, 240, 250]],
  ['seed', 3, [150, 84, 6], [255, 236, 120], undefined, true],
  ['gold', 5, [120, 70, 10], [255, 248, 180], [236, 176, 40], true],
  ['grace', 3, [140, 170, 230], [255, 255, 255], undefined, true],
  ['star', 3, [200, 170, 80], [255, 255, 220], undefined, true],
];

/** Each place's sky (top to bottom) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  // a soft gold morning over the city
  morning: {
    sky: [
      [96, 140, 210],
      [252, 226, 176],
      [184, 196, 222],
    ],
    mul: [1, 0.97, 0.92],
    add: [10, 6, 0],
  },
  // white-hot noon over the desert
  noon: {
    sky: [
      [110, 170, 230],
      [250, 244, 220],
      [180, 214, 240],
    ],
    mul: [1.04, 1.02, 0.96],
    add: [8, 6, 0],
  },
  // the tailor's shop: lamplight on dark wood paneling
  lamp: {
    sky: [
      [46, 26, 18],
      [140, 92, 56],
      [92, 58, 36],
    ],
    mul: [1, 0.9, 0.76],
    add: [14, 6, 0],
  },
  // night over the needle, turning to dawn at the top
  night: {
    sky: [
      [14, 12, 48],
      [250, 196, 150],
      [80, 60, 140],
    ],
    mul: [0.78, 0.78, 0.92],
    add: [4, 4, 16],
  },
  plain: {
    sky: [
      [96, 140, 210],
      [252, 226, 176],
      [184, 196, 222],
    ],
    mul: [1, 1, 1],
    add: [0, 0, 0],
  },
};

export interface Pal {
  pal: Uint8Array;
  r: (name: string) => number[];
  /** Shade k of a ramp, clamped. */
  c: (name: string, k: number) => number;
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

/** The level palettes: every ramp in the same place, lit for the place, and its sky. */
export function buildPalette(light: Light): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = LIGHT[light];
  b.ramp('sky', 6, t.sky[0], t.sky[1], t.sky[2]);
  for (const [name, n, from, to, mid, glows] of RAMPS) {
    const f = (c: RGB): RGB => (glows ? c : (c.map((v, i) => Math.max(0, Math.min(255, Math.round(v * t.mul[i] + t.add[i])))) as RGB));
    b.ramp(name, n, f(from), f(to), mid ? f(mid) : undefined);
  }
  return wrap(b);
}

/** The same ramps (by morning light) plus inks for the 320x200 screens. */
export function buildScreenPalette(): Pal & { b: PaletteBuilder } {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = LIGHT.plain;
  b.ramp('sky', 6, t.sky[0], t.sky[1], t.sky[2]);
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('dusk', 8, [30, 20, 60], [255, 210, 160], [190, 96, 120]);
  b.ramp('night2', 6, [6, 6, 24], [90, 80, 170], [30, 26, 90]);
  b.ramp('parch', 5, [150, 118, 76], [250, 238, 206]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  b.ramp('heaven', 6, [150, 120, 60], [255, 255, 240], [255, 222, 140]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
