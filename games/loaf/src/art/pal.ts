// The colors: one set of named ramps shared by every block and sprite, and a palette per place.
// The block art never changes between levels; the .PAL does: a bright Galilee noon on the
// hillside, the warm brown dark inside the stacked baskets, a purple and orange dusk when the
// twelve baskets are gathered, and night on the way home. The loaf's golden crust, the holy
// crumbs, the lamps and the fire keep their own light everywhere.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'noon' | 'shade' | 'dusk' | 'night' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [22, 12, 10], [56, 36, 30]],
  ['crust', 6, [70, 30, 10], [250, 214, 140], [196, 112, 40], true],
  ['crumb', 3, [214, 184, 130], [255, 248, 222], undefined, true],
  ['wicker', 5, [72, 46, 18], [236, 200, 120], [168, 118, 52]],
  ['grass', 5, [34, 66, 24], [180, 210, 96]],
  ['leaf', 4, [26, 70, 30], [130, 190, 90]],
  ['olive', 4, [60, 70, 44], [170, 180, 140]],
  ['stone', 5, [64, 58, 56], [226, 218, 200], [150, 140, 130]],
  ['earth', 5, [70, 36, 22], [210, 150, 100], [150, 90, 56]],
  ['sand', 4, [150, 120, 80], [246, 226, 180]],
  ['blue', 4, [24, 40, 96], [120, 170, 230]],
  ['red', 4, [96, 18, 18], [240, 100, 80]],
  ['ochre', 4, [110, 70, 20], [240, 196, 90]],
  ['purple', 3, [60, 24, 70], [180, 110, 200]],
  ['white', 3, [176, 168, 156], [255, 252, 244]],
  ['skin', 4, [92, 52, 30], [230, 176, 128]],
  ['hair', 2, [26, 16, 12], [80, 52, 34]],
  ['fish', 4, [50, 70, 90], [230, 240, 246]],
  ['water', 4, [24, 70, 120], [150, 210, 236]],
  ['wood', 4, [64, 38, 20], [196, 146, 92]],
  ['fur', 4, [90, 46, 20], [236, 150, 70]],
  ['grey', 4, [40, 40, 46], [200, 200, 206]],
  ['cloth', 3, [150, 20, 30], [250, 110, 100], undefined, true],
  ['sun', 4, [230, 150, 30], [255, 252, 214], undefined, true],
  ['gold', 4, [200, 140, 20], [255, 250, 200], undefined, true],
  ['lamp', 3, [230, 120, 20], [255, 236, 150], undefined, true],
  ['fire', 4, [150, 30, 10], [255, 230, 120], undefined, true],
];

/** Each place's sky (top to bottom) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  noon: {
    sky: [
      [70, 140, 220],
      [226, 240, 250],
      [140, 196, 244],
    ],
    mul: [1, 1, 0.98],
    add: [6, 4, 0],
  },
  // inside the stacked baskets: the "sky" is the warm dark between the weave
  shade: {
    sky: [
      [30, 18, 10],
      [110, 72, 36],
      [64, 40, 20],
    ],
    mul: [0.84, 0.74, 0.62],
    add: [8, 2, 0],
  },
  // the sky behind the ground line is a deep rose-violet, so the orange fox and the baskets stand out
  dusk: {
    sky: [
      [40, 26, 84],
      [255, 170, 100],
      [134, 62, 112],
    ],
    mul: [0.9, 0.74, 0.74],
    add: [18, 0, 10],
  },
  night: {
    sky: [
      [8, 10, 40],
      [60, 70, 130],
      [24, 30, 80],
    ],
    mul: [0.62, 0.64, 0.84],
    add: [6, 8, 22],
  },
  plain: {
    sky: [
      [70, 140, 220],
      [226, 240, 250],
      [140, 196, 244],
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
    // the night dims even the loaf a little, but the lamps and fire not at all
    const own = glows && !(light === 'night' && (name === 'crust' || name === 'crumb' || name === 'cloth'));
    const f = (c: RGB): RGB => (own ? c : (c.map((v, i) => Math.min(255, Math.round(v * t.mul[i] + t.add[i]))) as RGB));
    b.ramp(name, n, f(from), f(to), mid ? f(mid) : undefined);
  }
  return wrap(b);
}

/** The same ramps (as at noon) plus inks for the 320x200 screens. */
export function buildScreenPalette(): Pal & { b: PaletteBuilder } {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = LIGHT.noon;
  b.ramp('sky', 6, t.sky[0], t.sky[1], t.sky[2]);
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('dusk', 8, [50, 30, 90], [255, 200, 120], [220, 100, 110]);
  b.ramp('night2', 6, [6, 8, 30], [110, 120, 180], [30, 40, 100]);
  b.ramp('gold2', 6, [110, 50, 20], [255, 236, 170], [236, 150, 60]);
  b.ramp('parch', 5, [150, 118, 76], [250, 238, 206]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
