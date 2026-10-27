// The colors: one set of named ramps shared by every block and sprite, and a palette per act.
// The block art never changes between levels; the .PAL does: moonlight through the blinds at
// 3:17 a.m., the cold glow of the open fridge, the hall with the lights flickering a sickly
// green, and the blood red of the reckoning. The glows (the clock's digits, the fridge light,
// the cheesecake's aura, fire, the Devil's eyes) keep their own light everywhere.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'night' | 'fridge' | 'dash' | 'hell' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [16, 12, 20], [48, 40, 56]],
  ['skin', 5, [96, 52, 34], [252, 206, 168], [214, 146, 108]],
  ['sweat', 2, [150, 200, 240], [240, 252, 255], undefined, true],
  ['pjs', 4, [24, 40, 96], [120, 160, 230]],
  ['hair', 3, [54, 46, 42], [170, 160, 150]],
  ['wall', 4, [70, 80, 110], [190, 196, 214]],
  ['paper', 3, [120, 96, 120], [220, 200, 210]],
  ['wood', 5, [60, 34, 18], [214, 160, 104], [150, 96, 54]],
  ['rug', 4, [90, 20, 30], [220, 90, 90]],
  ['quilt', 4, [60, 30, 90], [190, 130, 220]],
  ['white', 3, [176, 176, 184], [255, 255, 255]],
  ['gray', 4, [44, 44, 52], [200, 200, 210]],
  ['metal', 4, [70, 80, 90], [230, 236, 240]],
  ['tile', 3, [150, 156, 170], [250, 250, 255]],
  ['red', 4, [100, 16, 20], [250, 90, 70]],
  ['green', 5, [24, 60, 20], [190, 236, 100], [90, 150, 40]],
  ['celery', 3, [60, 120, 40], [200, 240, 150]],
  ['cheese', 4, [170, 110, 10], [255, 236, 120]],
  ['cream', 4, [196, 170, 120], [255, 250, 230]],
  ['crust', 4, [110, 60, 24], [236, 184, 110]],
  ['berry', 4, [110, 10, 40], [255, 120, 150]],
  ['choc', 3, [50, 26, 14], [150, 90, 50]],
  ['fur', 4, [110, 50, 16], [246, 170, 84]],
  ['liver', 3, [56, 30, 20], [150, 92, 64]],
  ['pink', 3, [170, 70, 120], [255, 170, 210]],
  ['devil', 5, [80, 6, 6], [255, 120, 90], [200, 30, 24]],
  ['suit', 4, [40, 110, 110], [170, 240, 220]],
  ['gold', 4, [150, 100, 10], [255, 244, 160], undefined, true],
  ['smoke', 4, [60, 54, 64], [210, 200, 210]],
  ['night', 4, [6, 8, 30], [60, 80, 150]],
  ['moon', 3, [190, 200, 230], [255, 255, 240], undefined, true],
  ['digit', 2, [200, 20, 10], [255, 90, 60], undefined, true],
  ['fridge', 4, [150, 200, 230], [255, 255, 255], undefined, true],
  ['aura', 4, [230, 150, 40], [255, 250, 210], undefined, true],
  ['fire', 4, [150, 20, 0], [255, 230, 110], undefined, true],
  ['eye', 2, [255, 200, 40], [255, 255, 180], undefined, true],
  // the reckoning's floor tiles: a cool slate that keeps its own light, so the play row reads in the red
  ['slate', 3, [22, 26, 40], [150, 160, 186], undefined, true],
];

/** Each act's backdrop ramp ("sky": the dark of a room, top to bottom) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  // moonlight through the blinds
  night: {
    sky: [
      [10, 12, 34],
      [60, 70, 120],
      [30, 36, 76],
    ],
    mul: [0.6, 0.66, 0.92],
    add: [4, 6, 22],
  },
  // the kitchen in the fridge's cold glow
  fridge: {
    sky: [
      [16, 24, 44],
      [120, 150, 190],
      [56, 72, 110],
    ],
    mul: [0.84, 0.92, 1.04],
    add: [8, 12, 26],
  },
  // the hall, lights flickering, a sickly green
  dash: {
    sky: [
      [14, 22, 14],
      [90, 120, 70],
      [40, 56, 34],
    ],
    mul: [0.74, 0.86, 0.62],
    add: [6, 14, 0],
  },
  // the reckoning: blood red
  hell: {
    sky: [
      [40, 0, 0],
      [200, 50, 24],
      [110, 8, 6],
    ],
    mul: [1.05, 0.66, 0.58],
    add: [34, 4, 4],
  },
  plain: {
    sky: [
      [30, 36, 76],
      [140, 150, 200],
      [70, 80, 130],
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
  b.ramp('blood', 8, [30, 0, 0], [255, 120, 60], [190, 20, 10]);
  b.ramp('dark', 6, [4, 4, 14], [70, 80, 130], [24, 28, 60]);
  b.ramp('glow', 6, [60, 90, 120], [255, 255, 255], [180, 220, 240]);
  b.ramp('parch', 5, [150, 130, 110], [250, 244, 232]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
