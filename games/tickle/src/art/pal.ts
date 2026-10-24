// The colors: one set of named ramps shared by every block and sprite, and a palette per place.
// The block art never changes between levels; the .PAL does: the warm lamplight of the night
// classroom where the course is taken, the cold fluorescent lab, the green dark of the sewers
// and the storm round the tower. Doc Leo's red sneakers and sunburned nose, the rats' pink ears, the
// Tesla coils' sparks, the glowing flasks and the gold of the certificate keep their own light.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'course' | 'lab' | 'sewer' | 'storm' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [16, 12, 20], [52, 40, 56]],
  ['coat', 5, [96, 104, 124], [252, 252, 246], [196, 202, 210]],
  ['skin', 4, [120, 70, 46], [246, 206, 170]],
  ['paint', 2, [214, 214, 222], [255, 255, 255], undefined, true],
  ['nose', 3, [150, 10, 20], [255, 120, 110], undefined, true],
  ['hat', 4, [26, 22, 26], [110, 100, 96]],
  ['navy', 3, [18, 24, 60], [70, 90, 150]],
  ['purple', 3, [70, 24, 90], [176, 100, 210]],
  ['tie', 3, [10, 70, 60], [70, 190, 150]],
  ['sneaker', 3, [130, 14, 14], [250, 90, 70], undefined, true],
  ['rat', 5, [120, 112, 116], [255, 252, 248], [214, 208, 206]],
  ['agouti', 5, [52, 36, 26], [196, 160, 120], [120, 88, 62]],
  ['pink', 3, [190, 90, 110], [255, 196, 206], undefined, true],
  ['eye', 2, [180, 20, 40], [255, 80, 90], undefined, true],
  ['steel', 5, [44, 50, 60], [226, 232, 240], [130, 140, 156]],
  ['tile', 4, [120, 132, 128], [232, 240, 236]],
  ['wood', 4, [60, 34, 18], [200, 140, 80]],
  ['glass', 3, [120, 170, 190], [230, 250, 255]],
  ['potion', 4, [20, 110, 40], [190, 255, 140], undefined, true],
  ['spark', 4, [70, 90, 230], [240, 250, 255], [130, 200, 255], true],
  ['flame', 4, [190, 50, 10], [255, 240, 140], undefined, true],
  ['brick', 4, [60, 34, 30], [176, 110, 90]],
  ['slime', 4, [30, 50, 20], [150, 190, 70]],
  ['stone', 5, [40, 38, 50], [190, 186, 200], [110, 106, 124]],
  ['chalk', 3, [20, 50, 36], [70, 110, 84]],
  ['green', 4, [24, 60, 30], [120, 190, 100]],
  ['gold', 4, [150, 100, 20], [255, 244, 170], undefined, true],
  ['cheese', 3, [210, 150, 20], [255, 236, 120], undefined, true],
  ['red', 4, [100, 16, 20], [240, 90, 80]],
  ['blue', 4, [20, 40, 100], [120, 170, 240]],
  ['grey', 4, [44, 44, 52], [196, 196, 206]],
  ['coffee', 3, [50, 26, 12], [170, 110, 60]],
  ['paper', 3, [190, 180, 150], [255, 252, 236]],
  ['gator', 4, [24, 56, 28], [140, 190, 90]],
  ['crust', 4, [100, 46, 14], [250, 210, 130]],
];

/** Each place's sky or wall glow (dark to light) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  // the night classroom: warm lamplight
  course: {
    sky: [
      [40, 30, 46],
      [214, 196, 160],
      [120, 100, 100],
    ],
    mul: [1, 0.96, 0.88],
    add: [8, 4, 0],
  },
  // the lab at night: cold fluorescent tubes
  lab: {
    sky: [
      [18, 28, 40],
      [190, 220, 226],
      [90, 120, 140],
    ],
    mul: [0.9, 0.98, 1.02],
    add: [0, 4, 8],
  },
  // the sewers: green, dim, drippy
  sewer: {
    sky: [
      [10, 18, 12],
      [110, 140, 90],
      [44, 64, 40],
    ],
    mul: [0.7, 0.8, 0.64],
    add: [0, 8, 0],
  },
  // the tower in the storm: violet, with lightning
  storm: {
    sky: [
      [16, 10, 36],
      [170, 140, 220],
      [70, 50, 120],
    ],
    mul: [0.76, 0.72, 0.92],
    add: [8, 4, 20],
  },
  plain: {
    sky: [
      [40, 30, 46],
      [214, 196, 160],
      [120, 100, 100],
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
    const f = (c: RGB): RGB => (glows ? c : (c.map((v, i) => Math.min(255, Math.round(v * t.mul[i] + t.add[i]))) as RGB));
    b.ramp(name, n, f(from), f(to), mid ? f(mid) : undefined);
  }
  return wrap(b);
}

/** The same ramps (unlit) plus inks for the 320x200 screens. */
export function buildScreenPalette(): Pal & { b: PaletteBuilder } {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = LIGHT.plain;
  b.ramp('sky', 6, t.sky[0], t.sky[1], t.sky[2]);
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('night', 6, [6, 6, 20], [120, 110, 190], [40, 30, 90]);
  b.ramp('lamp', 3, [200, 120, 30], [255, 236, 160]);
  b.ramp('parch', 5, [150, 118, 76], [250, 238, 206]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  b.ramp('crt', 3, [10, 40, 20], [120, 255, 140]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
