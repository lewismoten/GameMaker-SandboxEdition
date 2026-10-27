// The colors: one set of named ramps shared by every block and sprite, and a palette per level.
// The block art of a pair of levels never changes; the .PAL does: the banquet by lamplight (warm
// Pompeian red and gold), the battlefield at noon (a dusty blue sky), the rooftops of Rome at
// sunset, the kitchen at night (one oil lamp), the baths (aqua and steam) and the theater in the
// afternoon sun. The glows (lamp flames, gold, the diva's scales, the spells) keep their own light.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'banquet' | 'battle' | 'roofs' | 'kitchen' | 'baths' | 'theater' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [14, 10, 8], [48, 40, 34]],
  ['skin', 5, [96, 52, 34], [252, 210, 172], [214, 150, 110]],
  ['toga', 4, [150, 140, 120], [255, 252, 240]],
  ['purple', 3, [60, 10, 60], [180, 70, 170]],
  ['hair', 3, [40, 28, 20], [150, 110, 80]],
  ['gray', 4, [50, 50, 56], [200, 200, 206]],
  ['marble', 4, [150, 146, 140], [250, 248, 242]],
  ['vein', 2, [120, 110, 120], [176, 170, 176]],
  ['stone', 5, [90, 74, 56], [236, 220, 186], [180, 160, 124]],
  ['tile', 4, [110, 36, 20], [236, 130, 80]],
  ['pompeii', 4, [90, 14, 12], [220, 70, 50]],
  ['ochre', 4, [130, 80, 20], [250, 210, 110]],
  ['wood', 5, [50, 28, 16], [200, 150, 100], [130, 80, 46]],
  ['bronze', 4, [90, 54, 20], [236, 180, 100]],
  ['gold', 4, [150, 100, 10], [255, 244, 160], undefined, true],
  ['laurel', 4, [20, 50, 20], [150, 210, 100]],
  ['olive', 3, [50, 60, 20], [150, 160, 70]],
  ['grape', 3, [50, 20, 70], [170, 100, 200]],
  ['grass', 4, [40, 80, 20], [170, 210, 90]],
  ['dirt', 4, [70, 48, 26], [200, 160, 110]],
  ['water', 5, [10, 50, 90], [170, 236, 240], [40, 140, 170]],
  ['steam', 3, [150, 170, 176], [240, 248, 250]],
  ['fish', 4, [190, 70, 0], [255, 230, 120], undefined, true],
  ['cheese', 4, [170, 110, 10], [255, 236, 120]],
  ['fur', 4, [110, 50, 16], [246, 170, 84]],
  ['liver', 3, [56, 30, 20], [150, 92, 64]],
  ['rufus', 4, [90, 40, 20], [220, 140, 80]],
  ['mouse', 3, [80, 76, 80], [190, 186, 190]],
  ['cat', 4, [40, 34, 30], [170, 150, 130]],
  ['gas', 4, [70, 90, 20], [200, 220, 110]],
  ['red', 4, [100, 16, 20], [250, 90, 70]],
  ['blue', 4, [20, 30, 90], [110, 150, 230]],
  ['iron', 3, [50, 54, 60], [170, 176, 186]],
  ['flame', 4, [180, 50, 0], [255, 250, 190], undefined, true],
  ['spell', 3, [120, 60, 230], [230, 210, 255], undefined, true],
  ['eye', 2, [255, 200, 40], [255, 255, 180], undefined, true],
];

/** Each level's backdrop ramp ("sky": top to bottom) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  // the banquet by lamplight: warm
  banquet: {
    sky: [
      [40, 16, 10],
      [150, 70, 40],
      [96, 36, 24],
    ],
    mul: [1.0, 0.88, 0.76],
    add: [14, 6, 0],
  },
  // the battlefield at noon: a pale, dusty blue
  battle: {
    sky: [
      [80, 120, 190],
      [230, 220, 190],
      [150, 180, 220],
    ],
    mul: [1, 1, 1],
    add: [0, 0, 0],
  },
  // the rooftops at sunset: orange to violet
  roofs: {
    sky: [
      [70, 40, 110],
      [255, 190, 110],
      [220, 100, 90],
    ],
    mul: [1.0, 0.86, 0.8],
    add: [16, 4, 4],
  },
  // the kitchen at night: one oil lamp, blue shadows
  kitchen: {
    sky: [
      [10, 10, 24],
      [70, 60, 70],
      [36, 30, 44],
    ],
    mul: [0.72, 0.68, 0.8],
    add: [8, 4, 12],
  },
  // the baths: aqua and steam
  baths: {
    sky: [
      [20, 70, 90],
      [200, 236, 236],
      [90, 160, 170],
    ],
    mul: [0.9, 0.98, 1.0],
    add: [4, 10, 14],
  },
  // the theater in the afternoon sun under a red awning
  theater: {
    sky: [
      [110, 150, 210],
      [250, 236, 200],
      [180, 200, 230],
    ],
    mul: [1.0, 0.96, 0.9],
    add: [8, 4, 0],
  },
  plain: {
    sky: [
      [60, 90, 150],
      [230, 220, 200],
      [140, 160, 190],
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

/** The level palettes: every ramp in the same place, lit for the level, and its backdrop. */
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

/** The same ramps (unlit) plus inks for the 320x200 screens. */
export function buildScreenPalette(): Pal & { b: PaletteBuilder } {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = LIGHT.plain;
  b.ramp('sky', 6, t.sky[0], t.sky[1], t.sky[2]);
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('dark', 6, [12, 8, 6], [110, 80, 60], [50, 30, 22]);
  b.ramp('parch', 5, [150, 130, 100], [252, 244, 224]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  b.ramp('dusk', 6, [40, 20, 70], [255, 200, 120], [200, 90, 90]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
