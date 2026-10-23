// The colors: named ramps every file shares (the poet, the friends from other songs, tips,
// coffee, the word balloons), then the ramps of one group of monologues (each group's block and
// monster sets are drawn in its own), lit for the scene. A scene loads one group's blocks, so
// two groups can put different ramps at the same palette entries; the common ramps always sit
// at the same entries, which is what lets every scene share the poet's POET.CBL.
import { PaletteBuilder } from '../../../kit/palette';

export type RGB = [number, number, number];
/** [name, shades, dark, light, mid?, glows? (keeps its light in every scene)] */
export type Ramp = [string, number, RGB, RGB, RGB?, boolean?];

/** The ramps every scene has, in this order. */
export const COMMON: Ramp[] = [
  ['ink', 2, [18, 12, 18], [52, 40, 52]],
  ['skin', 5, [92, 50, 32], [252, 210, 172], [212, 146, 108]],
  // the poet: grey sweatpants, a velvet doublet, a starched white ruff, a feather in his cap
  ['sweats', 4, [62, 64, 74], [196, 198, 206]],
  ['velvet', 4, [50, 14, 40], [196, 80, 150], [130, 30, 96]],
  ['white', 3, [180, 178, 184], [255, 255, 255]],
  ['hair', 3, [50, 34, 24], [150, 104, 64]],
  ['gold', 4, [150, 100, 10], [255, 244, 160], undefined, true],
  ['coffee', 4, [40, 20, 10], [200, 140, 80], [110, 60, 28]],
  ['red', 4, [100, 16, 20], [250, 96, 76]],
  // Teddy (red-gold corgi) and Gwinn (liver brown, pink collar)
  ['fur', 4, [112, 50, 16], [248, 176, 90]],
  ['liver', 3, [56, 30, 20], [150, 92, 64]],
  ['pink', 3, [170, 70, 120], [255, 176, 214]],
  // Doc Leo: navy corduroy, a purple shirt, a teal tie, the yellow rubber chicken
  ['navy', 3, [20, 26, 60], [80, 100, 170]],
  ['purple', 3, [70, 30, 110], [180, 120, 230]],
  ['teal', 3, [10, 80, 80], [90, 200, 180]],
  ['yellow', 3, [190, 140, 10], [255, 246, 120]],
  // Carl the fly, the goat
  ['fly', 3, [24, 30, 44], [120, 150, 190]],
  ['grey', 4, [50, 50, 58], [204, 204, 212]],
  // the word balloons: parchment and their gold lettering
  ['paper', 3, [196, 176, 140], [255, 250, 232], undefined, true],
  ['spot', 3, [255, 220, 120], [255, 255, 236], undefined, true],
  ['green', 4, [24, 64, 20], [170, 230, 100]],
  ['metal', 3, [80, 90, 100], [230, 236, 240]],
  ['wood', 5, [56, 30, 16], [216, 162, 104], [150, 96, 54]],
];

/** A scene's light: its backdrop ramp ("sky", top to bottom) and how everything else is lit. */
export interface Lighting {
  sky: [RGB, RGB, RGB];
  mul: RGB;
  add: RGB;
}

export const PLAIN: Lighting = {
  sky: [
    [30, 26, 40],
    [150, 130, 120],
    [80, 66, 70],
  ],
  mul: [1, 1, 1],
  add: [0, 0, 0],
};

export interface Pal {
  pal: Uint8Array;
  r: (name: string) => number[];
  /** Shade k of a ramp, clamped. */
  c: (name: string, k: number) => number;
  b: PaletteBuilder;
}

function wrap(b: PaletteBuilder): Pal {
  const r = (name: string) => b.get(name);
  return {
    pal: b.pal,
    b,
    r,
    c: (name, k) => {
      const ramp = r(name);
      return ramp[Math.max(0, Math.min(ramp.length - 1, k))];
    },
  };
}

const lit =
  (t: Lighting, glows?: boolean) =>
  (c: RGB): RGB =>
    glows ? c : (c.map((v, i) => Math.max(0, Math.min(255, Math.round(v * t.mul[i] + t.add[i])))) as RGB);

/** A scene's palette: the common ramps and a group's ramps, all lit by `light`. */
export function buildPalette(group: Ramp[], light: Lighting = PLAIN): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  b.ramp('sky', 6, light.sky[0], light.sky[1], light.sky[2]);
  for (const [name, n, from, to, mid, glows] of [...COMMON, ...group]) {
    const f = lit(light, glows);
    b.ramp(name, n, f(from), f(to), mid ? f(mid) : undefined);
  }
  return wrap(b);
}
