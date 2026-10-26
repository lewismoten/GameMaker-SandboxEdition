// The realm's palettes. Every scene's .PAL has two parts:
//   0..SPRITE_END   fixed colors, the same in every palette: black, the people, monsters, items
//                   and the menu text colors. Sprites (.CBL, .MBL) use only these, so one
//                   sprite file looks right in every scene.
//   SPRITE_END+1..254  the scene's own terrain colors, picked by median cut from the true-color
//                   paintings of that scene's block set (grass, shore, cobbles, cave rock...).
// 255 stays black: it is the "clear" color of sprite blocks.
import { medianCutPalette } from '../../../kit/quantize';
import { Canvas, type RGB } from './rgb';

/** The fixed colors, by name. Ramps are listed dark to light. */
const FIXED: [string, RGB[]][] = [
  ['ink', [[18, 14, 26]]],
  ['outline', [[34, 22, 30]]],
  [
    'skin',
    [
      [120, 66, 44],
      [176, 106, 72],
      [222, 156, 112],
      [246, 200, 160],
    ],
  ],
  [
    'hairBrown',
    [
      [52, 30, 18],
      [94, 56, 28],
      [140, 92, 50],
    ],
  ],
  [
    'hairBlond',
    [
      [160, 120, 40],
      [232, 196, 96],
    ],
  ],
  [
    'hairGray',
    [
      [120, 120, 128],
      [200, 200, 206],
    ],
  ],
  [
    'red',
    [
      [86, 14, 20],
      [150, 28, 32],
      [208, 54, 48],
      [246, 110, 90],
    ],
  ],
  [
    'blue',
    [
      [20, 30, 82],
      [36, 62, 146],
      [62, 110, 206],
      [130, 176, 246],
    ],
  ],
  [
    'green',
    [
      [18, 56, 30],
      [36, 104, 48],
      [72, 160, 70],
      [150, 214, 120],
    ],
  ],
  [
    'purple',
    [
      [46, 20, 70],
      [88, 40, 124],
      [140, 80, 180],
      [196, 150, 226],
    ],
  ],
  [
    'gold',
    [
      [110, 72, 10],
      [182, 132, 26],
      [236, 196, 64],
      [255, 242, 160],
    ],
  ],
  [
    'orange',
    [
      [124, 50, 10],
      [200, 98, 24],
      [248, 156, 56],
    ],
  ],
  [
    'teal',
    [
      [14, 70, 78],
      [28, 128, 128],
      [90, 200, 186],
    ],
  ],
  [
    'pink',
    [
      [150, 52, 98],
      [226, 110, 160],
      [252, 180, 210],
    ],
  ],
  [
    'leather',
    [
      [58, 34, 20],
      [100, 60, 34],
      [150, 98, 56],
      [196, 146, 96],
    ],
  ],
  [
    'steel',
    [
      [56, 62, 78],
      [106, 114, 132],
      [166, 174, 190],
      [226, 232, 240],
    ],
  ],
  [
    'white',
    [
      [214, 214, 220],
      [255, 255, 255],
    ],
  ],
  [
    'corgi',
    [
      [120, 52, 16],
      [184, 92, 30],
      [228, 140, 60],
      [250, 196, 120],
    ],
  ],
  [
    'choc',
    [
      [60, 32, 22],
      [102, 58, 38],
      [146, 92, 62],
    ],
  ],
  [
    'slime',
    [
      [30, 92, 30],
      [80, 168, 52],
      [168, 228, 96],
    ],
  ],
  [
    'bone',
    [
      [150, 140, 112],
      [204, 196, 168],
      [240, 236, 214],
    ],
  ],
  [
    'ghost',
    [
      [70, 120, 160],
      [140, 200, 228],
      [214, 246, 255],
    ],
  ],
  [
    'fire',
    [
      [176, 40, 10],
      [244, 120, 20],
      [255, 216, 80],
    ],
  ],
  [
    'night',
    [
      [28, 30, 58],
      [52, 56, 98],
    ],
  ],
  [
    'felt',
    [
      [47, 93, 58],
      [216, 176, 74],
      [201, 206, 214],
      [244, 231, 192],
    ],
  ],
  // Game-Maker's menus and status screen look for the nearest blue, red, yellow and purple
  // (RGBBlue 10,10,63 and friends); these keep those texts clear in every scene.
  [
    'ui',
    [
      [40, 40, 252],
      [252, 40, 40],
      [252, 252, 0],
      [200, 40, 200],
    ],
  ],
];

const FIXED_INDEX = new Map<string, number[]>();
let next = 1;
const fixedRgb: RGB[] = [[0, 0, 0]];
for (const [name, cols] of FIXED) {
  const ids: number[] = [];
  for (const c of cols) {
    ids.push(next++);
    fixedRgb.push(c);
  }
  FIXED_INDEX.set(name, ids);
}
/** The last fixed palette entry. */
const SPRITE_END = next - 1;

/** A fixed color's 8-bit RGB: name and shade (clamped). */
export function C(name: string, k = 0): RGB {
  const ids = FIXED_INDEX.get(name);
  if (!ids) throw new Error(`No color ${name}`);
  return fixedRgb[ids[Math.max(0, Math.min(ids.length - 1, k))]];
}

/** A finished scene palette and its color matcher. */
export class Pal {
  readonly vga: Uint8Array;
  private lut = new Map<number, number>();
  constructor(vga: Uint8Array) {
    this.vga = vga;
  }

  /** The nearest entry in [lo, hi] to an 8-bit color. */
  nearest(r: number, g: number, b: number, lo = 1, hi = 254): number {
    const R = Math.max(0, Math.min(63, Math.round(r / 4.048)));
    const G = Math.max(0, Math.min(63, Math.round(g / 4.048)));
    const B = Math.max(0, Math.min(63, Math.round(b / 4.048)));
    const key = (((R << 12) | (G << 6) | B) << 1) | (hi <= SPRITE_END ? 1 : 0);
    const hit = this.lut.get(key);
    if (hit !== undefined && lo <= 1) return hit;
    let best = 1e9;
    let v = lo;
    for (let i = lo; i <= hi; i++) {
      const dr = this.vga[i * 3] - R;
      const dg = this.vga[i * 3 + 1] - G;
      const db = this.vga[i * 3 + 2] - B;
      const d = 3 * dr * dr + 4 * dg * dg + 2 * db * db;
      if (d < best) {
        best = d;
        v = i;
      }
    }
    if (lo <= 1) this.lut.set(key, v);
    return v;
  }

  /**
   * A canvas as palette indices with a 4x4 ordered dither of `amount` (8-bit steps). Pixels
   * with less than half coverage become `clear` (255 for sprites); `spritesOnly` keeps to the
   * fixed colors.
   */
  index(cv: Canvas, opts: { amount?: number; spritesOnly?: boolean; clear?: number; ox?: number; oy?: number } = {}): Uint8Array {
    const amount = opts.amount ?? 7;
    const hi = opts.spritesOnly ? SPRITE_END : 254;
    const out = new Uint8Array(cv.w * cv.h);
    for (let y = 0; y < cv.h; y++)
      for (let x = 0; x < cv.w; x++) {
        const p = y * cv.w + x;
        if (cv.a[p] < 0.5) {
          out[p] = opts.clear ?? 0;
          continue;
        }
        const d = (BAYER[((y + (opts.oy ?? 0)) & 3) * 4 + ((x + (opts.ox ?? 0)) & 3)] / 16 - 0.47) * amount;
        out[p] = this.nearest(cv.c[p * 3] + d, cv.c[p * 3 + 1] + d, cv.c[p * 3 + 2] + d, 1, hi);
      }
    return out;
  }
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** The fixed part alone (for sprite files and screens that only show sprites). */
export function fixedPalette(): Pal {
  const vga = new Uint8Array(768);
  fixedRgb.forEach((c, i) =>
    vga.set(
      c.map((v) => v >> 2),
      i * 3,
    ),
  );
  return new Pal(vga);
}

/**
 * A scene palette: the fixed colors, then median cut over the scene's paintings for the rest
 * (index 255 left black for "clear").
 */
export function scenePalette(paintings: Canvas[], tweak?: (c: RGB) => RGB): Pal {
  const frames = paintings.map((cv) => {
    const out = new Uint8Array(cv.w * cv.h * 3);
    for (let i = 0; i < cv.w * cv.h; i++) {
      let c: RGB = [cv.c[i * 3], cv.c[i * 3 + 1], cv.c[i * 3 + 2]];
      if (tweak) c = tweak(c);
      for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.max(0, Math.min(255, Math.round(c[k])));
    }
    return out;
  });
  // medianCutPalette fills the entries after the fixed ones; 255 is then set back to black
  // for "clear" (sprite pixels never use it).
  const vga = medianCutPalette(frames, fixedRgb as [number, number, number][]);
  vga.set([0, 0, 0], 255 * 3);
  return new Pal(vga);
}
