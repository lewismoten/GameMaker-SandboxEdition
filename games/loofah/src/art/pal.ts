// The colors: one set of named ramps shared by every block and sprite, and a palette per act.
// The block art never changes between acts; the .PAL does: the haunted bathroom by candlelight
// (plum and black, the flames warm), the forest-dark aisle (green-black, the store's lights
// buzzing far away), home at night (moonlight blue) and the shower of Scrubbus Maximus (steam
// over blood-dark tile). The glows (candle flames, the demon's eyes, the mirror's writing, the
// moon) keep their own light everywhere.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'bath' | 'aisle' | 'home' | 'shower' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [14, 8, 18], [44, 34, 52]],
  ['skin', 5, [96, 52, 34], [252, 206, 168], [214, 146, 108]],
  ['wet', 2, [150, 200, 240], [240, 252, 255], undefined, true],
  ['towel', 4, [40, 90, 100], [180, 236, 230]],
  ['hair', 3, [54, 46, 42], [170, 160, 150]],
  ['wall', 4, [40, 22, 50], [130, 90, 150]],
  ['paper', 3, [90, 60, 100], [190, 160, 200]],
  ['wood', 5, [50, 28, 16], [200, 150, 100], [130, 80, 46]],
  ['tile', 4, [16, 30, 38], [90, 140, 150]],
  ['white', 3, [176, 176, 184], [255, 255, 255]],
  ['grey', 4, [44, 44, 52], [200, 200, 210]],
  ['metal', 4, [70, 76, 90], [236, 240, 250]],
  ['red', 4, [100, 16, 20], [250, 90, 70]],
  ['green', 5, [16, 44, 20], [150, 210, 110], [60, 120, 50]],
  ['rosemary', 3, [40, 70, 50], [170, 210, 170]],
  ['coral', 5, [130, 40, 30], [255, 200, 170], [240, 120, 96]],
  ['pink', 4, [150, 50, 100], [255, 190, 220]],
  ['citrus', 4, [170, 50, 40], [255, 170, 120]],
  ['mango', 4, [190, 100, 10], [255, 230, 110]],
  ['gourd', 4, [90, 70, 30], [236, 214, 150]],
  ['suds', 3, [150, 170, 200], [255, 255, 255]],
  ['wax', 3, [170, 150, 120], [250, 244, 220]],
  ['bark', 4, [26, 18, 12], [110, 80, 54]],
  ['crust', 4, [110, 60, 24], [236, 184, 110]],
  ['cheese', 4, [170, 110, 10], [255, 236, 120]],
  ['fur', 4, [110, 50, 16], [246, 170, 84]],
  ['liver', 3, [56, 30, 20], [150, 92, 64]],
  ['quilt', 4, [40, 20, 60], [160, 110, 200]],
  ['demon', 5, [70, 6, 10], [255, 120, 90], [190, 30, 30]],
  ['gold', 4, [150, 100, 10], [255, 244, 160], undefined, true],
  ['steam', 4, [90, 100, 110], [230, 236, 240]],
  ['night', 4, [6, 8, 26], [60, 70, 140]],
  ['moon', 3, [190, 200, 230], [255, 255, 240], undefined, true],
  ['flame', 4, [180, 50, 0], [255, 250, 190], undefined, true],
  ['fog', 3, [150, 170, 180], [235, 245, 250], undefined, true],
  ['neon', 3, [140, 240, 200], [240, 255, 250], undefined, true],
  ['eye', 2, [255, 200, 40], [255, 255, 180], undefined, true],
  // rims and floors that keep their own light, so the play row reads in the dark acts: a pale
  // pink rim on the wild loofahs, and a cool slate for the shower's tiles
  ['rim', 2, [230, 120, 170], [255, 200, 225], undefined, true],
  ['slate', 3, [26, 30, 44], [156, 166, 190], undefined, true],
];

/** Each act's backdrop ramp ("sky": the dark of a room, top to bottom) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  // the bathroom by candlelight: plum dark, the light warm
  bath: {
    sky: [
      [18, 8, 24],
      [80, 50, 90],
      [44, 24, 54],
    ],
    mul: [0.9, 0.78, 0.82],
    add: [12, 4, 10],
  },
  // the forest-dark aisle: green-black
  aisle: {
    sky: [
      [4, 12, 8],
      [40, 70, 50],
      [16, 34, 22],
    ],
    mul: [0.62, 0.78, 0.66],
    add: [2, 8, 4],
  },
  // home at night: moonlight
  home: {
    sky: [
      [8, 10, 30],
      [56, 64, 120],
      [26, 30, 70],
    ],
    mul: [0.62, 0.68, 0.94],
    add: [4, 6, 22],
  },
  // the shower of Scrubbus Maximus: steam over blood-dark tile
  shower: {
    sky: [
      [30, 4, 12],
      [150, 110, 120],
      [80, 30, 44],
    ],
    mul: [1.0, 0.74, 0.8],
    add: [26, 8, 12],
  },
  plain: {
    sky: [
      [30, 20, 50],
      [140, 120, 170],
      [70, 50, 100],
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

/** The level palettes: every ramp in the same place, lit for the act, and its backdrop. */
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
  b.ramp('blood', 8, [30, 0, 10], [255, 120, 110], [170, 20, 40]);
  b.ramp('dark', 6, [6, 2, 12], [90, 60, 120], [30, 16, 46]);
  b.ramp('glow', 6, [90, 40, 20], [255, 240, 200], [230, 150, 70]);
  b.ramp('parch', 5, [150, 130, 110], [250, 244, 232]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
