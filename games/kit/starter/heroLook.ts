// Kit's look as palette ramps, and the helpers who share his blocks. Kit's skin, hair, beanie, hoodie and pants are five
// ramps of their own (kskin, khair, khat, khood, kpants) in the Starter palette, so a different palette in those index
// ranges is a different person drawn from the very same character blocks: another skin tone, hair, hat and hoodie, or
// an alien. A helper's name is spelled by sign blocks that hold two letters each (nameBlocks), so a small set of
// blocks spells every helper's name.
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from './palette';

type RGB = [number, number, number];
/** [shades, darkest, lightest, middle?] */
type RampDef = [number, RGB, RGB, RGB?];
export type Role = 'skin' | 'hair' | 'hat' | 'hood' | 'pants';
export const ROLES: Role[] = ['skin', 'hair', 'hat', 'hood', 'pants'];
export type Look = Record<Role, RampDef>;

/** Kit himself: the teal knit beanie, the orange hoodie, gray-blue pants. */
export const KIT_LOOK: Look = {
  skin: [4, [160, 92, 58], [255, 214, 176], [236, 164, 118]],
  hair: [3, [60, 32, 22], [140, 86, 52]],
  hat: [5, [10, 90, 100], [170, 250, 240], [24, 170, 170]],
  hood: [5, [170, 66, 10], [255, 214, 130], [250, 138, 30]],
  pants: [5, [70, 76, 100], [214, 222, 238], [138, 148, 176]],
};

/** Kit with a coral hoodie instead of orange (a choice for the maintainer; the default stays orange). */
export const KIT_CORAL: Look = { ...KIT_LOOK, hood: [5, [150, 40, 50], [255, 210, 190], [246, 110, 96]] };

const rampName = (role: Role): string => `k${role}`;

/** Adds Kit's five ramps to a palette under construction (buildStarterPalette does this). */
export function addKitRamps(b: PaletteBuilder, look: Look = KIT_LOOK): void {
  for (const role of ROLES) {
    const [n, from, to, mid] = look[role];
    b.ramp(rampName(role), n, from, to, mid);
  }
}

/** One of Kit's ramps (a palette without them falls back to the shared teal, orange, skin, hair and stone). */
export function kitRamp(pal: Pal, role: Role): number[] {
  try {
    return pal.r(rampName(role));
  } catch {
    return pal.r({ skin: 'skin', hair: 'hair', hat: 'teal', hood: 'orange', pants: 'stone' }[role]);
  }
}

/** A copy of the palette with Kit's index ranges recolored: the same blocks, a different person. */
export function recolor(pal: Pal, look: Look): Uint8Array {
  const out = new Uint8Array(pal.pal);
  const scratch = new PaletteBuilder();
  for (const role of ROLES) {
    const [n, from, to, mid] = look[role];
    const idx = kitRamp(pal, role);
    const made = scratch.ramp(rampName(role), n, from, to, mid);
    idx.forEach((at, i) => out.set(scratch.pal.subarray(made[i] * 3, made[i] * 3 + 3), at * 3));
  }
  return out;
}

export interface Helper {
  /** 2 to 4 uppercase letters, spelled by nameBlocks (an odd count ends in a blank half). */
  name: string;
  /** What the look is, for the sheet and the manual. */
  about: string;
  look: Look;
}

const SKIN = {
  fair: [4, [176, 106, 80], [255, 224, 200], [244, 184, 150]],
  tan: [4, [150, 86, 48], [240, 196, 140], [214, 150, 96]],
  brown: [4, [86, 48, 30], [200, 140, 96], [140, 88, 56]],
  deep: [4, [52, 30, 24], [150, 98, 70], [96, 58, 42]],
  green: [4, [30, 120, 70], [190, 250, 160], [90, 200, 110]],
  purple: [4, [90, 50, 150], [226, 190, 255], [160, 110, 214]],
  blue: [4, [40, 90, 180], [190, 236, 255], [100, 170, 240]],
} satisfies Record<string, RampDef>;
const HAIR = {
  black: [3, [16, 14, 24], [70, 62, 84]],
  auburn: [3, [96, 30, 16], [200, 100, 48]],
  blond: [3, [170, 120, 30], [250, 226, 130]],
  silver: [3, [120, 126, 150], [226, 232, 248]],
  plum: [3, [90, 20, 100], [214, 110, 200]],
  teal: [3, [10, 100, 110], [110, 230, 220]],
  brown: [3, [60, 32, 22], [140, 86, 52]],
} satisfies Record<string, RampDef>;
const ramp = (n: number, from: RGB, to: RGB, mid?: RGB): RampDef => (mid ? [n, from, to, mid] : [n, from, to]);
const HAT = {
  red: ramp(5, [120, 18, 36], [255, 170, 150], [226, 52, 58]),
  purple: ramp(5, [70, 30, 120], [214, 170, 255], [140, 84, 210]),
  blue: ramp(5, [24, 50, 140], [140, 190, 255], [58, 108, 226]),
  pink: ramp(5, [190, 70, 120], [255, 220, 236], [250, 130, 176]),
  gold: ramp(5, [150, 86, 8], [255, 250, 160], [250, 200, 40]),
  green: ramp(5, [20, 100, 74], [150, 250, 190], [50, 190, 120]),
};
const HOOD = {
  blue: HAT.blue,
  pink: HAT.pink,
  green: HAT.green,
  purple: HAT.purple,
  red: HAT.red,
  teal: KIT_LOOK.hat,
  gold: HAT.gold,
};
const PANTS = {
  denim: ramp(5, [24, 44, 110], [150, 190, 240], [60, 96, 176]),
  brown: ramp(5, [70, 40, 24], [210, 160, 110], [140, 90, 52]),
  charcoal: ramp(5, [30, 30, 44], [150, 154, 176], [76, 80, 100]),
  gray: KIT_LOOK.pants,
  olive: ramp(5, [60, 70, 24], [200, 214, 130], [120, 140, 56]),
};

/**
 * The helpers: eight palettes for the same character blocks. Names are not anyone famous; the last three are aliens.
 * Kit himself (KI + T) is KIT_LOOK.
 */
export const helperPalettes: Helper[] = [
  {
    name: 'MIA',
    about: 'fair skin, auburn hair, purple beanie, gold hoodie',
    look: { skin: SKIN.fair, hair: HAIR.auburn, hat: HAT.purple, hood: HOOD.gold, pants: PANTS.denim },
  },
  {
    name: 'LENA',
    about: 'deep skin, black hair, red beanie, teal hoodie',
    look: { skin: SKIN.deep, hair: HAIR.black, hat: HAT.red, hood: HOOD.teal, pants: PANTS.charcoal },
  },
  {
    name: 'MARA',
    about: 'tan skin, brown hair, green beanie, pink hoodie',
    look: { skin: SKIN.tan, hair: HAIR.brown, hat: HAT.green, hood: HOOD.pink, pants: PANTS.brown },
  },
  {
    name: 'LIAN',
    about: 'fair skin, silver hair, blue beanie, red hoodie',
    look: { skin: SKIN.fair, hair: HAIR.silver, hat: HAT.blue, hood: HOOD.red, pants: PANTS.gray },
  },
  {
    name: 'YANA',
    about: 'brown skin, blond hair, pink beanie, blue hoodie',
    look: { skin: SKIN.brown, hair: HAIR.blond, hat: HAT.pink, hood: HOOD.blue, pants: PANTS.olive },
  },
  {
    name: 'NEKA',
    about: 'green alien, teal hair, gold beanie, purple hoodie',
    look: { skin: SKIN.green, hair: HAIR.teal, hat: HAT.gold, hood: HOOD.purple, pants: PANTS.charcoal },
  },
  {
    name: 'RIMA',
    about: 'purple alien, plum hair, teal beanie, gold hoodie',
    look: { skin: SKIN.purple, hair: HAIR.plum, hat: KIT_LOOK.hat, hood: HOOD.gold, pants: PANTS.denim },
  },
  {
    name: 'LAMI',
    about: 'blue alien, silver hair, red beanie, green hoodie',
    look: { skin: SKIN.blue, hair: HAIR.silver, hat: HAT.red, hood: HOOD.green, pants: PANTS.brown },
  },
];

/** Every two-letter block there is ('·' is blank): Lewis's set, plus T· for Kit. */
export const NAME_BLOCK_IDS = ['··', 'A·', 'AL', 'AN', 'CO', 'KA', 'KI', 'LA', 'LE', 'LI', 'LO', 'MA', 'MI', 'NA', 'NE', 'NI', 'RA', 'RI', 'TA', 'YA', 'T·'];

/** The block ids that spell a name, two letters each ('MIA' is MI + A·). */
export function nameBlockIds(name: string): string[] {
  const padded = name.length % 2 ? `${name}·` : name;
  const ids = padded.match(/../g) ?? [];
  const bad = ids.filter((id) => !NAME_BLOCK_IDS.includes(id));
  if (bad.length) throw new Error(`Name ${name} needs block(s) ${bad.join(', ')}`);
  return ids;
}

/** One name block, 20x20: a cream board with a wood edge and two dark letters (the PC's 8x8 font), as sign blocks. */
export function nameBlock(pal: Pal, id: string): Pixels {
  const p = new Pixels(20, 20, 255);
  const wood = pal.r('wood');
  p.rect(0, 0, 20, 20, wood[2]).rect(1, 1, 18, 18, pal.c('parch', 3)).rect(1, 1, 18, 1, pal.c('parch', 4));
  p.rect(0, 19, 20, 1, wood[1]);
  [...id].forEach((ch, i) => {
    if (ch === '·') return;
    for (let y = 0; y < 8; y++) {
      const bits = FONT8X8[ch.charCodeAt(0) * 8 + y];
      for (let x = 0; x < 8; x++) if (bits & (1 << x)) p.set(2 + i * 9 + x, 6 + y, pal.c('ink', 0));
    }
  });
  return p;
}
