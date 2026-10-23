// The colors: one set of named ramps shared by every block and sprite, and a palette per room.
// The block art never changes between levels; the .PAL does: the fog hall in a sickly green
// haze, the zombie parade's crypt under purple party lights, the fake woods in blue moonlight,
// and the last hall by the red glow of the emergency exit sign. The jack-o'-lanterns, the
// candles, the glow sticks and the EXIT sign keep their own light everywhere.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'fog' | 'crypt' | 'moon' | 'exit' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [16, 12, 20], [52, 42, 56]],
  ['skin', 4, [120, 66, 44], [250, 206, 168], [214, 150, 112]],
  // you: brown hair, a red-and-navy flannel shirt (your best date shirt), khakis, sneakers
  ['hair', 3, [44, 26, 16], [140, 94, 56], [92, 58, 32]],
  ['flannel', 4, [90, 16, 22], [230, 90, 80], [170, 36, 40]],
  ['navy', 3, [16, 22, 60], [80, 100, 170]],
  ['khaki', 4, [110, 90, 54], [236, 214, 160], [184, 156, 104]],
  ['shoe', 2, [40, 40, 46], [200, 200, 210]],
  // Lily: brown pigtails, a lavender unicorn hoodie with a rainbow mane and a white horn
  ['lhair', 3, [70, 36, 18], [180, 110, 60]],
  ['hoodie', 4, [100, 70, 150], [236, 210, 255], [176, 140, 226]],
  ['rainbow', 6, [230, 60, 70], [120, 120, 255], [250, 220, 70]],
  ['caramel', 3, [130, 70, 20], [250, 196, 100], [210, 130, 40]],
  ['apple', 3, [110, 16, 16], [250, 90, 70]],
  ['white', 3, [170, 166, 160], [255, 252, 244]],
  ['foam', 3, [110, 116, 130], [220, 226, 236]],
  ['gold', 3, [180, 120, 20], [255, 244, 170], undefined, true],
  // the house
  ['board', 5, [40, 26, 20], [170, 124, 86], [104, 70, 46]],
  ['stone', 5, [40, 40, 50], [190, 188, 196], [110, 108, 120]],
  ['paper', 4, [60, 40, 56], [170, 140, 150]],
  ['velvet', 4, [60, 8, 18], [200, 50, 70]],
  ['dirt', 4, [44, 32, 22], [150, 120, 84]],
  ['leaf', 4, [60, 30, 10], [230, 140, 40]],
  ['grass', 3, [20, 50, 24], [90, 150, 70]],
  ['cardboard', 4, [110, 80, 44], [236, 200, 140]],
  ['witch', 3, [30, 90, 30], [140, 220, 110]],
  ['black', 3, [14, 12, 18], [80, 70, 96]],
  ['zombie', 4, [50, 70, 50], [180, 210, 160]],
  ['guts', 3, [150, 50, 80], [255, 160, 190]],
  ['fur', 4, [50, 30, 18], [190, 140, 90], [120, 80, 48]],
  ['web', 3, [130, 130, 140], [250, 250, 255]],
  ['purple', 4, [50, 16, 70], [200, 140, 240]],
  ['silver', 3, [100, 106, 120], [236, 240, 250]],
  ['blue', 4, [20, 40, 120], [120, 180, 250]],
  ['green', 3, [30, 100, 30], [150, 230, 110]],
  ['pink', 3, [170, 70, 100], [255, 190, 210]],
  ['yellow', 3, [170, 130, 10], [255, 240, 110]],
  ['red', 4, [100, 16, 20], [250, 110, 90]],
  ['orange', 3, [170, 70, 10], [255, 190, 80]],
  ['money', 3, [40, 90, 50], [190, 230, 180]],
  // lights that stay lit
  ['pumpkin', 3, [210, 90, 10], [255, 230, 120], undefined, true],
  ['candle', 3, [230, 150, 40], [255, 250, 210], undefined, true],
  ['glow', 3, [40, 200, 60], [210, 255, 170], undefined, true],
  ['exitred', 3, [180, 10, 10], [255, 150, 130], undefined, true],
  ['fog', 4, [120, 140, 130], [240, 252, 244], undefined, true],
];

/** Each room's "sky" (the dark behind things) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  fog: { sky: [[8, 14, 12], [70, 100, 90], [30, 48, 40]], mul: [0.82, 0.96, 0.86], add: [0, 10, 4] },
  crypt: { sky: [[12, 6, 22], [100, 60, 140], [44, 24, 70]], mul: [0.9, 0.74, 1], add: [10, 0, 20] },
  moon: { sky: [[6, 10, 28], [70, 90, 160], [26, 36, 80]], mul: [0.72, 0.82, 1], add: [0, 6, 26] },
  exit: { sky: [[20, 6, 8], [140, 50, 50], [60, 18, 20]], mul: [1, 0.78, 0.78], add: [26, 0, 0] },
  plain: { sky: [[10, 8, 20], [80, 70, 120], [34, 28, 60]], mul: [1, 1, 1], add: [0, 0, 0] },
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

/** The level palettes: every ramp in the same place, lit for the room, and its "sky". */
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
  b.ramp('night', 6, [6, 6, 22], [110, 90, 190], [40, 24, 90]);
  b.ramp('moon', 3, [190, 196, 210], [255, 255, 240]);
  b.ramp('sheet', 5, [160, 150, 120], [252, 248, 230]);
  b.ramp('brown', 3, [50, 28, 16], [120, 74, 40]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
