// The colors: one set of named ramps shared by every block and sprite, and a palette per
// place. The block art never changes between levels; the .PAL does: the sky is the song cover's
// rose at dawn in the garden, the dark of the dirt underground, a clear blue over the
// mountain and gold in the evening up the tree. The mustard seed, the sun and the faith
// glimmers keep their own light everywhere.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'dawn' | 'garden' | 'under' | 'day' | 'gold' | 'plain';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [18, 10, 14], [48, 34, 40]],
  ['soil', 6, [34, 20, 14], [150, 104, 70], [84, 54, 36]],
  ['dust', 4, [96, 70, 48], [214, 180, 136]],
  ['grass', 5, [26, 64, 24], [168, 214, 92]],
  ['leaf', 5, [30, 82, 24], [196, 232, 96]],
  ['stone', 6, [46, 46, 54], [222, 218, 210], [128, 124, 128]],
  ['bark', 5, [44, 26, 16], [176, 128, 84]],
  ['clay', 4, [110, 44, 26], [236, 140, 96]],
  ['wood', 4, [70, 44, 24], [208, 160, 104]],
  ['water', 4, [24, 60, 130], [170, 220, 250]],
  ['red', 4, [90, 12, 16], [240, 90, 70]],
  ['blue', 4, [24, 34, 96], [110, 150, 230]],
  ['purple', 3, [60, 24, 80], [190, 120, 220]],
  ['white', 3, [170, 166, 160], [255, 255, 252]],
  ['crow', 3, [12, 12, 20], [80, 84, 110]],
  ['beetle', 3, [18, 46, 40], [80, 190, 150]],
  ['fur', 4, [50, 44, 50], [170, 160, 170]],
  ['pink', 4, [150, 70, 86], [255, 196, 200]],
  ['root', 4, [120, 86, 50], [240, 214, 160]],
  ['seed', 5, [150, 84, 6], [255, 246, 150], [242, 190, 30], true],
  ['sun', 4, [220, 140, 20], [255, 252, 210], undefined, true],
  ['faith', 3, [210, 160, 40], [255, 255, 230], undefined, true],
  ['grey', 6, [0, 0, 0], [255, 255, 255]],
];

/** Each place's sky (top to bottom) and how the rest is lit. */
const LIGHT: Record<Light, { sky: [RGB, RGB, RGB]; mul: RGB; add: RGB }> = {
  // the cover: a deep rose wall fading to pink, the light warm
  dawn: {
    sky: [
      [150, 62, 70],
      [246, 176, 172],
      [216, 120, 122],
    ],
    mul: [1, 0.92, 0.9],
    add: [16, 4, 6],
  },
  // the garden level: the cover's rose a step deeper, so the yellow seed stands out against it
  garden: {
    sky: [
      [124, 46, 62],
      [228, 146, 150],
      [184, 86, 100],
    ],
    mul: [1, 0.92, 0.9],
    add: [16, 4, 6],
  },
  // underground: the "sky" is the dark of the earth itself
  under: {
    sky: [
      [28, 16, 12],
      [92, 62, 42],
      [56, 36, 26],
    ],
    mul: [0.82, 0.76, 0.72],
    add: [6, 2, 0],
  },
  day: {
    sky: [
      [70, 130, 214],
      [214, 236, 250],
      [140, 190, 240],
    ],
    mul: [1, 1, 1],
    add: [0, 0, 0],
  },
  gold: {
    sky: [
      [120, 60, 110],
      [255, 214, 130],
      [236, 130, 96],
    ],
    mul: [1, 0.9, 0.74],
    add: [20, 8, 0],
  },
  plain: {
    sky: [
      [70, 130, 214],
      [214, 236, 250],
      [140, 190, 240],
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

/** The same ramps (as by day, with the cover's rose sky) plus inks for the 320x200 screens. */
export function buildScreenPalette(): Pal & { b: PaletteBuilder } {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = LIGHT.dawn;
  b.ramp('sky', 6, t.sky[0], t.sky[1], t.sky[2]);
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('rose', 8, [70, 20, 34], [255, 214, 210], [196, 96, 104]);
  b.ramp('blue2', 6, [10, 20, 60], [180, 220, 250], [60, 110, 190]);
  b.ramp('gold2', 6, [110, 50, 20], [255, 236, 170], [236, 150, 60]);
  b.ramp('parch', 5, [150, 118, 76], [250, 238, 206]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
