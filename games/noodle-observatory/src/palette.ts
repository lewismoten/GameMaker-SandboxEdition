// THE NOODLE OBSERVATORY's palette: the Starters' ramps with Nell's colors in the hero's ranges, and the game's
// own: butter-yellow cupboards, the golden pasta ring, lens glass, the colander's steel, the indigo night, warm
// bakery light and lamplight. One look per time of the evening recolors the same blocks (day-night): clear winter
// dusk in the kitchen, a deeper dusk up the pantry, then the indigo night on the roof.
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { recolor, type Look } from '../../kit/starter/heroLook';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];

/** Nell: warm brown skin, black hair in a bun with a mustard scrunchie, a periwinkle sweater, brown cords. */
export const NELL: Look = {
  skin: [4, [92, 52, 30], [222, 160, 112], [166, 104, 66]],
  hair: [3, [16, 12, 14], [86, 62, 56]],
  hat: [5, [120, 84, 10], [255, 236, 150], [218, 170, 40]],
  hood: [5, [34, 40, 110], [200, 208, 255], [96, 114, 214]],
  pants: [5, [44, 34, 28], [180, 150, 120], [104, 80, 62]],
};

/** The game's own ramps, after the shared ones. Their names are what art.ts draws with. */
export const OWN_RAMPS: [string, number, RGB, RGB, RGB?][] = [
  ['butter', 6, [118, 82, 30], [255, 244, 190], [238, 200, 104]],
  ['cab', 5, [70, 42, 22], [214, 160, 96], [150, 98, 50]],
  ['pasta', 5, [150, 92, 16], [255, 240, 170], [240, 192, 80]],
  ['glass', 4, [60, 110, 150], [236, 252, 255], [150, 206, 232]],
  ['steel', 5, [62, 70, 88], [244, 248, 255], [150, 160, 182]],
  ['night', 5, [8, 10, 34], [70, 80, 150], [26, 30, 84]],
  ['warm', 4, [176, 92, 24], [255, 244, 196], [252, 196, 96]],
  ['slate', 4, [40, 44, 62], [150, 156, 180], [86, 92, 118]],
  ['leaf', 4, [20, 66, 50], [130, 196, 120], [52, 128, 80]],
];

/** The base palette (the kitchen at dusk), with Nell in the hero's index ranges. */
export function buildNoodlePalette(): Pal {
  const base = buildStarterPalette((b: PaletteBuilder) => {
    for (const [name, n, from, to, mid] of OWN_RAMPS) b.ramp(name, n, from, to, mid);
  });
  return { ...base, pal: recolor(base, NELL) };
}

/** A ramp's new look: [darkest, lightest, middle]. */
export type Tint = [RGB, RGB, RGB?];

/** A copy of the palette bytes with the named ramps recolored. */
export function swapped(pal: Pal, tints: Record<string, Tint>): Uint8Array {
  const out = new Uint8Array(pal.pal);
  const scratch = new PaletteBuilder();
  for (const [name, [from, to, mid]] of Object.entries(tints)) {
    const idx = pal.r(name);
    const made = scratch.ramp(`t_${name}`, idx.length, from, to, mid);
    idx.forEach((at, i) => out.set(scratch.pal.subarray(made[i] * 3, made[i] * 3 + 3), at * 3));
  }
  return out;
}

export type LookName = '' | 'dusk' | 'pantry' | 'evening' | 'dark' | 'night' | 'reveal' | 'snow' | 'bakery' | 'moonrise';

/** The palette bytes of a look ('' is the base). */
export const lookOf = (pal: Pal, look: LookName): Uint8Array => (look ? swapped(pal, LOOKS[look]) : pal.pal);

/**
 * The evening, a step at a time. The base is the kitchen with clear winter dusk in the windows (the sky ramp is
 * peach low down, lavender up high). Each look recolors the sky and the light it throws.
 */
const LOOKS: Record<Exclude<LookName, ''>, Record<string, Tint>> = {
  // clear winter dusk: lavender over peach
  dusk: {
    sky: [
      [92, 86, 160],
      [255, 214, 170],
      [196, 150, 186],
    ],
  },
  // up the pantry: deeper dusk, the cupboards a shade dimmer
  pantry: {
    sky: [
      [52, 50, 120],
      [236, 170, 150],
      [130, 100, 160],
    ],
    butter: [
      [96, 64, 26],
      [244, 222, 160],
      [210, 170, 88],
    ],
  },
  // the lens room after sunset: indigo in the window, lamps on
  evening: {
    sky: [
      [24, 26, 80],
      [150, 130, 190],
      [64, 60, 130],
    ],
    butter: [
      [90, 60, 28],
      [246, 226, 168],
      [206, 164, 86],
    ],
  },
  // the shutter loft with the lamps off: only the shafts of light are bright
  dark: {
    sky: [
      [14, 16, 54],
      [110, 110, 180],
      [40, 42, 110],
    ],
    cab: [
      [30, 22, 26],
      [130, 98, 78],
      [72, 52, 46],
    ],
  },
  // the roof: clear indigo night, cool stone, warm windows
  night: {
    brick: [
      [36, 20, 36],
      [150, 96, 104],
      [92, 48, 62],
    ],
    sky: [
      [8, 10, 40],
      [60, 70, 140],
      [22, 26, 82],
    ],
    grass: [
      [16, 50, 50],
      [100, 150, 120],
      [40, 90, 80],
    ],
    stone: [
      [34, 38, 66],
      [170, 176, 206],
      [84, 90, 128],
    ],
  },
  // the reveal: the same night, the bakery window a little warmer
  reveal: {
    brick: [
      [36, 20, 36],
      [150, 96, 104],
      [92, 48, 62],
    ],
    sky: [
      [10, 12, 46],
      [70, 80, 150],
      [26, 30, 90],
    ],
    stone: [
      [34, 38, 66],
      [176, 180, 210],
      [88, 94, 132],
    ],
    warm: [
      [190, 100, 30],
      [255, 250, 210],
      [255, 206, 110],
    ],
  },
  // the yards after the reveal: snowing, a blue-white hush, brick garden walls dark
  snow: {
    sky: [
      [12, 16, 52],
      [86, 104, 168],
      [34, 44, 104],
    ],
    white: [
      [120, 140, 196],
      [236, 244, 255],
    ],
    brick: [
      [44, 24, 40],
      [160, 104, 110],
      [104, 54, 66],
    ],
    dirt: [
      [26, 20, 30],
      [110, 90, 96],
      [62, 48, 56],
    ],
  },
  // the bakery at night: everything warm, flour-pale plaster, the ovens' glow
  bakery: {
    parch: [
      [150, 96, 54],
      [255, 238, 200],
      [236, 196, 140],
    ],
    orange: [
      [120, 44, 20],
      [250, 186, 120],
      [198, 100, 52],
    ],
    brick: [
      [96, 34, 26],
      [236, 160, 110],
      [176, 82, 52],
    ],
  },
  // the last night: the clouds gone, a silver-blue sky over the roof
  moonrise: {
    sky: [
      [14, 20, 60],
      [110, 130, 190],
      [42, 56, 120],
    ],
    brick: [
      [36, 20, 36],
      [150, 96, 104],
      [92, 48, 62],
    ],
    stone: [
      [40, 46, 76],
      [196, 204, 230],
      [98, 106, 146],
    ],
  },
};
