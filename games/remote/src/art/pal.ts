// The colors: one set of named ramps shared by every block and sprite, and a palette per place.
// The block art never changes between levels; the .PAL does: the living room by lamplight on
// a 1995 evening, the kitchen under its buzzing fluorescent tube, the void between the cushions
// (everything in it a lost thing, lit purple), and the living room ride's carnival glow. The
// TV's blue, the VCR's 12:00, the lamps and the pennies keep their own light everywhere.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'den' | 'kitchen' | 'void' | 'ride' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [20, 14, 22], [58, 44, 52]],
  ['skin', 4, [120, 66, 44], [250, 206, 168], [214, 150, 112]],
  ['hair', 3, [44, 26, 16], [140, 94, 56], [92, 58, 32]],
  // the bathrobe: maroon terry cloth with a hunter-green plaid stripe (1995 all over)
  ['robe', 4, [70, 14, 26], [214, 92, 104], [150, 36, 52]],
  ['plaid', 3, [18, 52, 34], [96, 156, 104]],
  ['slipper', 3, [30, 50, 120], [130, 170, 240]],
  ['white', 3, [170, 166, 160], [255, 252, 244]],
  // the couch: dusty rose with teal-green flowers, the most 1995 upholstery there is
  ['couch', 5, [86, 40, 56], [240, 190, 196], [190, 116, 132]],
  ['flora', 4, [20, 70, 70], [130, 210, 180]],
  ['carpet', 5, [104, 86, 62], [236, 222, 190], [186, 164, 126]],
  ['rug', 4, [36, 32, 80], [130, 120, 196]],
  ['wood', 5, [60, 34, 18], [226, 170, 110], [150, 96, 54]],
  ['wall', 4, [150, 132, 104], [250, 240, 214]],
  ['crt', 4, [42, 42, 48], [196, 196, 202]],
  ['screen', 4, [16, 30, 70], [190, 230, 255], [70, 130, 210], true],
  ['led', 2, [20, 140, 40], [140, 255, 140], undefined, true],
  ['red', 4, [100, 16, 20], [250, 110, 90]],
  ['fur', 4, [120, 52, 16], [250, 196, 120], [220, 128, 50]],
  ['cat', 4, [52, 52, 60], [214, 210, 206]],
  ['pink', 3, [170, 70, 100], [255, 190, 210]],
  ['fridge', 4, [150, 140, 116], [252, 246, 226]],
  ['tile', 4, [120, 40, 40], [250, 236, 224]],
  ['counter', 3, [70, 100, 110], [170, 210, 214]],
  ['copper', 4, [110, 46, 20], [255, 206, 140], [214, 120, 60], true],
  ['gold', 3, [180, 120, 20], [255, 244, 170], undefined, true],
  ['silver', 3, [100, 106, 120], [236, 240, 250]],
  ['yellow', 3, [170, 130, 10], [255, 240, 110]],
  ['blue', 4, [20, 40, 120], [120, 180, 250]],
  ['green', 3, [30, 100, 30], [150, 230, 110]],
  ['purple', 4, [56, 20, 80], [200, 140, 240]],
  ['orange', 3, [170, 70, 10], [255, 190, 80]],
  ['lamp', 3, [230, 150, 40], [255, 246, 196], undefined, true],
  ['star', 2, [180, 170, 255], [255, 255, 255], undefined, true],
];

/** Each place's "sky" (the void's deep, the dark behind things) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  den: { sky: [[16, 12, 30], [90, 70, 120], [44, 32, 70]], mul: [0.96, 0.88, 0.8], add: [10, 4, 0] },
  kitchen: { sky: [[16, 12, 30], [90, 70, 120], [44, 32, 70]], mul: [0.96, 1, 1], add: [0, 6, 10] },
  void: { sky: [[6, 2, 20], [120, 70, 190], [40, 16, 90]], mul: [0.74, 0.62, 0.96], add: [14, 0, 30] },
  ride: { sky: [[16, 12, 30], [90, 70, 120], [44, 32, 70]], mul: [1, 0.86, 0.86], add: [24, 8, 4] },
  plain: { sky: [[16, 12, 30], [90, 70, 120], [44, 32, 70]], mul: [1, 1, 1], add: [0, 0, 0] },
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

/** The level palettes: every ramp in the same place, lit for the place, and its "sky". */
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
  b.ramp('night', 6, [8, 6, 24], [120, 90, 200], [44, 24, 100]);
  b.ramp('static', 6, [30, 34, 44], [240, 244, 250]);
  b.ramp('glow', 6, [20, 40, 90], [220, 240, 255], [80, 140, 220]);
  b.ramp('paper', 5, [160, 150, 120], [252, 248, 230]);
  b.ramp('brown', 3, [50, 28, 16], [120, 74, 40]);
  b.ramp('tape', 3, [110, 110, 116], [214, 214, 220]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
