// THE SAME HOUSE's palettes. Every one holds the same 256 slots in the same order, so a block drawn
// with slot 60 shows slot 60 of whichever palette its scene loaded. Four ramps are this game's own
// and are the only slots that change from one palette to the next:
//   carpet  the floor (a carpet in a house, boards, ice or stone in a tower room)
//   paper   the wall behind you (wallpaper, siding, or the bricks of a tower)
//   roof    the roof of a house, the top and corners of a tower
//   cloth   curtains, the sofa and the picture; the lamps and banners of a tower
// STREET.PAL is the base: the Starters' palette plus the four ramps in plain colors. RED, BLUE and
// GREEN are three houses. WOOD, ICE and LAVA are three tower rooms. Everything else (Mia, the sky, the
// coins, the brick, the signs, the designer and text colors) is the same slot with the same color in all seven.
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];
type Look = Record<'carpet' | 'paper' | 'roof' | 'cloth', [RGB, RGB, RGB]>;

/** The four ramps: [darkest, lightest, middle] for each palette. */
const LOOKS = {
  street: {
    carpet: [
      [90, 80, 70],
      [170, 160, 150],
      [130, 120, 110],
    ],
    paper: [
      [196, 176, 136],
      [255, 244, 210],
      [232, 212, 168],
    ],
    roof: [
      [130, 40, 40],
      [226, 120, 96],
      [184, 70, 60],
    ],
    cloth: [
      [10, 90, 100],
      [170, 250, 240],
      [24, 170, 170],
    ],
  },
  red: {
    carpet: [
      [120, 16, 30],
      [236, 100, 100],
      [200, 40, 50],
    ],
    paper: [
      [214, 170, 60],
      [255, 244, 170],
      [240, 208, 110],
    ],
    roof: [
      [40, 56, 110],
      [140, 160, 210],
      [76, 100, 170],
    ],
    cloth: [
      [16, 100, 70],
      [150, 240, 190],
      [40, 170, 110],
    ],
  },
  blue: {
    carpet: [
      [18, 40, 120],
      [120, 170, 255],
      [50, 90, 210],
    ],
    paper: [
      [206, 100, 146],
      [255, 220, 236],
      [236, 156, 190],
    ],
    roof: [
      [24, 90, 50],
      [130, 210, 130],
      [50, 150, 80],
    ],
    cloth: [
      [200, 140, 16],
      [255, 236, 120],
      [250, 196, 50],
    ],
  },
  green: {
    carpet: [
      [16, 90, 40],
      [140, 232, 124],
      [40, 160, 70],
    ],
    paper: [
      [110, 160, 214],
      [226, 242, 255],
      [164, 202, 240],
    ],
    roof: [
      [150, 40, 26],
      [244, 140, 100],
      [210, 80, 56],
    ],
    cloth: [
      [86, 36, 146],
      [210, 160, 250],
      [140, 84, 210],
    ],
  },
  wood: {
    carpet: [
      [84, 46, 24],
      [210, 160, 108],
      [150, 96, 54],
    ],
    paper: [
      [170, 130, 84],
      [240, 220, 176],
      [208, 172, 124],
    ],
    roof: [
      [60, 36, 20],
      [140, 100, 64],
      [96, 62, 36],
    ],
    cloth: [
      [200, 110, 16],
      [255, 244, 170],
      [250, 190, 60],
    ],
  },
  ice: {
    carpet: [
      [140, 184, 224],
      [248, 254, 255],
      [200, 226, 246],
    ],
    paper: [
      [80, 140, 196],
      [196, 230, 252],
      [132, 188, 232],
    ],
    roof: [
      [56, 84, 130],
      [176, 204, 234],
      [110, 146, 196],
    ],
    cloth: [
      [20, 120, 170],
      [200, 252, 255],
      [70, 200, 236],
    ],
  },
  lava: {
    carpet: [
      [36, 22, 26],
      [122, 62, 52],
      [76, 40, 38],
    ],
    paper: [
      [84, 18, 24],
      [172, 62, 40],
      [126, 36, 32],
    ],
    roof: [
      [22, 16, 20],
      [84, 54, 54],
      [48, 32, 36],
    ],
    cloth: [
      [214, 50, 10],
      [255, 236, 110],
      [255, 140, 30],
    ],
  },
} satisfies Record<string, Look>;

export type PalName = keyof typeof LOOKS;
export const PAL_NAMES = Object.keys(LOOKS) as PalName[];

export interface Palettes {
  /** The base palette: block art is drawn with its ramps, and the cards and pictures are painted in it. */
  pal: Pal;
  /** Each palette file's 768 bytes. */
  files: Record<PalName, Uint8Array>;
  /** The slots that change from palette to palette. */
  changing: number[];
}

const RAMPS = ['carpet', 'paper', 'roof', 'cloth'] as const;
const SHADES = 4;

/** Sets a ramp's slots to the shades between `from` and `to` (through `mid`), as the builder did. */
function setRamp(bytes: Uint8Array, ids: number[], [from, to, mid]: [RGB, RGB, RGB]): void {
  ids.forEach((id, k) => {
    const t = k / (ids.length - 1);
    const [a, b, u] = t < 0.5 ? [from, mid, t * 2] : [mid, to, (t - 0.5) * 2];
    bytes.set(
      [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * u) >> 2),
      id * 3,
    );
  });
}

export function buildPalettes(): Palettes {
  let builder!: PaletteBuilder;
  const pal = buildStarterPalette((b) => {
    builder = b;
    for (const r of RAMPS) b.ramp(r, SHADES, ...LOOKS.street[r]);
  }, 'same-house');
  const files = {} as Record<PalName, Uint8Array>;
  for (const name of PAL_NAMES) {
    const bytes = Uint8Array.from(pal.pal);
    for (const r of RAMPS) setRamp(bytes, builder.get(r), LOOKS[name][r]);
    files[name] = bytes;
  }
  return { pal, files, changing: RAMPS.flatMap((r) => builder.get(r)) };
}
