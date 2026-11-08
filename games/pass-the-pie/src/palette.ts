// PASS THE PIE's palettes, in the look of a hand-pulled block print: paper, one ink and two accent inks a level.
// The shared ramps PLAYGAME needs (designer colors, menu blue, plum, hot red) stay where every game keeps them, but
// none of the art uses the Starters' ramps: every picture is drawn from the ramps added here.
//
// Five "press" ramps change from level to level (a palette swap, so a block keeps its index and the whole street is
// reprinted in other inks): paper, ink, acc, acc2 and leaf. Rory's streets are a picture book (soft paper, brown
// ink, pastel accents); Mr. Plume's are a fight poster (hot paper, black ink, loud accents). The rest are fixed:
// Rory's and Mr. Plume's clothes and feathers, and the dishes.
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { type Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { buildStarterPalette } from '../../kit/starter/palette';

type RGB = [number, number, number];

/** The fixed ramps: [name, shades, darkest, lightest, middle?]. */
const FIXED: [string, number, RGB, RGB, RGB?][] = [
  ['rSkin', 3, [150, 92, 60], [246, 204, 164], [212, 150, 106]],
  ['rHair', 2, [58, 34, 24], [118, 72, 44]],
  ['rCap', 3, [150, 98, 16], [250, 222, 120], [222, 170, 40]],
  ['rScarf', 3, [150, 40, 34], [248, 236, 214], [214, 72, 52]],
  ['rCoat', 3, [52, 84, 62], [150, 186, 140], [92, 132, 96]],
  ['rJeans', 3, [30, 40, 70], [110, 130, 176], [56, 72, 118]],
  ['tBrown', 4, [62, 34, 22], [196, 140, 92], [130, 78, 44]],
  ['tFan', 4, [150, 46, 26], [252, 222, 150], [228, 140, 50]],
  ['tRed', 2, [170, 20, 30], [240, 70, 64]],
  ['tBeak', 2, [214, 130, 20], [252, 200, 70]],
  ['tHat', 3, [14, 12, 16], [84, 80, 92], [40, 38, 46]],
  ['tGold', 2, [190, 140, 30], [255, 232, 120]],
  ['crust', 3, [150, 84, 30], [250, 210, 140], [214, 150, 70]],
  ['gravy', 3, [70, 40, 22], [176, 116, 66], [118, 72, 38]],
  ['cran', 3, [110, 10, 36], [236, 80, 110], [180, 24, 60]],
  ['bean', 3, [40, 90, 40], [170, 210, 120], [96, 150, 70]],
  ['steel', 3, [80, 86, 100], [230, 234, 240], [160, 166, 180]],
];

/** One level's inks: paper (the background), ink (outlines and carved shadow), two accents and the leaves. */
export interface Inks {
  paper: RGB;
  ink: RGB;
  acc: RGB;
  acc2: RGB;
  leaf: RGB;
}

/** Each mood's inks. The first three are Rory's picture book, the next three Mr. Plume's poster; `base` is the pages'. */
export const MOODS = {
  base: { paper: [248, 236, 210], ink: [28, 20, 20], acc: [204, 52, 36], acc2: [232, 172, 48], leaf: [104, 128, 70] },
  yard: { paper: [252, 240, 214], ink: [86, 52, 36], acc: [236, 132, 66], acc2: [146, 188, 212], leaf: [136, 166, 104] },
  lawn: { paper: [242, 198, 76], ink: [22, 16, 16], acc: [204, 40, 30], acc2: [250, 240, 222], leaf: [96, 108, 36] },
  kitchen: { paper: [250, 234, 192], ink: [78, 50, 38], acc: [214, 96, 76], acc2: [100, 174, 170], leaf: [126, 156, 100] },
  park: { paper: [214, 224, 200], ink: [18, 18, 22], acc: [234, 98, 24], acc2: [20, 116, 120], leaf: [56, 104, 56] },
  dusk: { paper: [226, 212, 230], ink: [62, 42, 66], acc: [196, 104, 136], acc2: [232, 184, 86], leaf: [112, 132, 112] },
  dojo: { paper: [172, 210, 194], ink: [12, 30, 28], acc: [212, 56, 44], acc2: [244, 200, 72], leaf: [30, 96, 74] },
  rooftop: { paper: [184, 192, 228], ink: [24, 22, 66], acc: [240, 132, 84], acc2: [250, 224, 124], leaf: [74, 96, 144] },
  parade: { paper: [198, 52, 42], ink: [18, 10, 12], acc: [250, 204, 64], acc2: [252, 240, 220], leaf: [40, 70, 48] },
} as const satisfies Record<string, Inks>;
export type Mood = keyof typeof MOODS;

const PRESS = ['paper', 'ink', 'acc', 'acc2', 'leaf'] as const;
const SHADES = { paper: 4, ink: 3, acc: 4, acc2: 4, leaf: 4 } as const;

const mix = (a: readonly number[], b: readonly number[], t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;

/** A press ramp's shades, darkest first: the ink toward the paper for the ink ramp, the color toward ink and paper for the others. */
function shades(inks: Inks, name: (typeof PRESS)[number]): RGB[] {
  const n = SHADES[name];
  const col = inks[name];
  if (name === 'ink') return [col as RGB, mix(col, inks.paper, 0.25), mix(col, inks.paper, 0.5)];
  if (name === 'paper') return [mix(col, inks.ink, 0.22), mix(col, inks.ink, 0.1), col as RGB, mix(col, [255, 255, 255], 0.45)];
  const out: RGB[] = [mix(col, inks.ink, 0.45), mix(col, inks.ink, 0.2), col as RGB, mix(col, inks.paper, 0.5)];
  return out.slice(0, n);
}

/** The base palette: the shared ramps, then the press ramps in the pages' inks, then the fixed ramps. */
export function buildPalette(): Pal {
  return buildStarterPalette((b: PaletteBuilder) => {
    for (const name of PRESS) {
      const s = shades(MOODS.base, name);
      b.ramp(
        name === 'ink' ? 'pInk' : name === 'paper' ? 'pPaper' : `p${name[0].toUpperCase()}${name.slice(1)}`,
        s.length,
        s[0],
        s[s.length - 1],
        s.length > 2 ? s[Math.floor(s.length / 2)] : undefined,
      );
    }
    for (const [name, n, from, to, mid] of FIXED) b.ramp(name, n, from, to, mid);
  });
}

/** The palette ramp each press ramp is stored as. */
export const RAMP = { paper: 'pPaper', ink: 'pInk', acc: 'pAcc', acc2: 'pAcc2', leaf: 'pLeaf' } as const;

/** A copy of the palette bytes with the press ramps in `mood`'s inks (every shade set exactly). */
export function moodBytes(pal: Pal, mood: Mood): Uint8Array {
  const out = new Uint8Array(pal.pal);
  for (const name of PRESS) {
    const s = shades(MOODS[mood], name);
    pal.r(RAMP[name]).forEach((at, i) =>
      out.set(
        s[i].map((v) => v >> 2),
        at * 3,
      ),
    ); // VGA keeps 6 bits a component
  }
  return out;
}

/** The base palette's bytes set exactly to the base inks (the builder's ramp spreads them a little). */
export const basePal = (pal: Pal): Pal => {
  pal.pal.set(moodBytes(pal, 'base'));
  return pal;
};
