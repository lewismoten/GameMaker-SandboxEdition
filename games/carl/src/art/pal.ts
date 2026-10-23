// The colors: one set of named ramps shared by every block and sprite, and a palette per place.
// The block art never changes between levels; the .PAL does: a sunny afternoon in the living
// room (mint daisy wallpaper, a burnt-orange corduroy couch, brown shag), the bright kitchen,
// the bedroom by moonlight, the backyard at noon, the nature documentary's golden hour, and the
// living room at dusk in gloom. Carl's red eyes, the lamps, the clock and the stereo's lights
// keep their own light everywhere.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'day' | 'kitchen' | 'night' | 'yard' | 'doc' | 'gloom' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [16, 14, 20], [52, 44, 56]],
  ['fly', 5, [14, 18, 26], [150, 190, 200], [40, 70, 80]],
  ['eye', 4, [110, 10, 14], [255, 150, 120], [220, 40, 34], true],
  ['wing', 3, [150, 176, 196], [244, 250, 255]],
  ['paper', 5, [120, 160, 140], [226, 246, 228], [176, 214, 190]],
  ['daisy', 3, [214, 170, 60], [255, 250, 230]],
  ['panel', 5, [62, 34, 18], [196, 140, 86], [128, 78, 40]],
  ['couch', 5, [96, 34, 10], [250, 160, 80], [204, 92, 30]],
  ['shag', 4, [56, 36, 20], [160, 112, 66]],
  ['wood', 5, [60, 34, 16], [220, 170, 110], [150, 96, 50]],
  ['skin', 4, [104, 60, 38], [244, 196, 156]],
  ['hair', 3, [30, 20, 14], [120, 84, 50]],
  ['shirt', 4, [24, 44, 96], [130, 170, 230]],
  ['red', 4, [100, 16, 20], [250, 100, 90]],
  ['white', 4, [150, 150, 156], [255, 255, 250]],
  ['grey', 4, [44, 46, 52], [196, 198, 206]],
  ['steel', 3, [80, 86, 96], [230, 236, 244]],
  ['screen', 4, [10, 20, 40], [150, 210, 255], undefined, true],
  ['chip', 4, [150, 90, 20], [255, 226, 120]],
  ['tile', 4, [150, 160, 170], [244, 248, 250]],
  ['lamp', 3, [230, 140, 30], [255, 244, 170], undefined, true],
  ['leaf', 4, [24, 66, 30], [140, 206, 96]],
  ['grass', 4, [40, 84, 30], [176, 214, 92]],
  ['earth', 4, [66, 40, 22], [176, 126, 80]],
  ['sand', 3, [170, 130, 80], [246, 222, 170]],
  ['water', 4, [20, 60, 110], [140, 206, 236]],
  ['purple', 3, [64, 30, 84], [190, 130, 220]],
  ['smoke', 3, [110, 120, 104], [226, 232, 214]],
  ['gold', 4, [190, 120, 20], [255, 248, 196], undefined, true],
  ['pink', 3, [170, 70, 110], [255, 190, 210]],
  ['fur', 4, [120, 54, 16], [250, 176, 90]],
  ['ochre', 3, [130, 90, 30], [240, 200, 100]],
  ['led', 2, [40, 230, 120], [200, 255, 210], undefined, true],
];

/** Each place's sky or window light (top to bottom) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  day: { sky: [[100, 170, 230], [236, 246, 252], [170, 214, 246]], mul: [1, 1, 0.97], add: [8, 6, 0] },
  kitchen: { sky: [[110, 180, 236], [246, 250, 255], [180, 220, 250]], mul: [1.04, 1.04, 1.04], add: [6, 6, 6] },
  night: { sky: [[6, 8, 30], [70, 80, 140], [24, 30, 80]], mul: [0.42, 0.48, 0.74], add: [4, 6, 22] },
  yard: { sky: [[70, 150, 230], [230, 244, 252], [140, 200, 246]], mul: [1, 1, 1], add: [0, 0, 0] },
  doc: { sky: [[120, 120, 70], [255, 220, 150], [214, 176, 100]], mul: [0.96, 0.9, 0.7], add: [20, 14, 0] },
  gloom: { sky: [[30, 24, 60], [200, 110, 90], [110, 60, 90]], mul: [0.66, 0.6, 0.7], add: [12, 4, 14] },
  plain: { sky: [[100, 170, 230], [236, 246, 252], [170, 214, 246]], mul: [1, 1, 1], add: [0, 0, 0] },
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
    // Carl keeps his colors everywhere (he is the star), and the lights keep theirs
    const own = glows || name === 'fly' || name === 'wing';
    const f = (c: RGB): RGB => (own ? c : (c.map((v, i) => Math.max(0, Math.min(255, Math.round(v * t.mul[i] + t.add[i])))) as RGB));
    b.ramp(name, n, f(from), f(to), mid ? f(mid) : undefined);
  }
  return wrap(b);
}

/** The same ramps (as in the afternoon) plus inks for the 320x200 screens. */
export function buildScreenPalette(): Pal & { b: PaletteBuilder } {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = LIGHT.day;
  b.ramp('sky', 6, t.sky[0], t.sky[1], t.sky[2]);
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('dusk', 8, [40, 26, 70], [255, 190, 120], [200, 90, 110]);
  b.ramp('night2', 6, [6, 8, 30], [110, 120, 180], [30, 40, 100]);
  b.ramp('doc2', 6, [40, 36, 20], [255, 230, 170], [170, 140, 80]);
  b.ramp('parch', 5, [150, 130, 90], [252, 246, 226]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
