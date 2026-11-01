// Tune-Up's palettes, built the way maximus builds its planets: one fixed half every scene
// shares and one half of scenery "roles" that each scene colors its own way. The fixed half is
// the Teddy finale's ramps in its order (so the trilogy's drawings of Teddy, Gwinn and the
// clowns keep their colors), then Doc Leo's own (the ones his sprite is drawn in) and the rubber
// chicken's. The roles (wall, floor, machinery, pipes, paint, lights, shadow) are what a block
// set is drawn in, so one set of blocks is the garage at dawn or at night, or the engine bay lit
// blue-white, brass or amber, by loading a different .PAL.
import { buildRampPalette, type PalWithBuilder as Pal, type RampSpec } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { SCREEN_RAMPS } from '../../../teddy/src/art/screenRamps';
import { P as FINALE } from '../../../teddy3/src/art/pal';

type RGB = [number, number, number];
export type { Pal };

/** The Teddy finale's ramps, unchanged and in its order. */
const TEDDY: RampSpec[] = [
  ['ink', 2, [20, 14, 18], [52, 40, 44]],
  ['sky', 8, [92, 150, 230], [214, 238, 255]],
  ['cloud', 3, [190, 204, 228], [255, 255, 255]],
  ['grass', 5, [30, 84, 26], [150, 214, 84]],
  ['leaf', 4, [16, 56, 30], [70, 140, 64]],
  ['dirt', 5, [60, 34, 18], [176, 122, 74]],
  ['wood', 5, [70, 38, 20], [212, 156, 96]],
  ['paint', 4, [150, 156, 170], [255, 255, 250]],
  ['brick', 5, [84, 26, 22], [214, 110, 82]],
  ['stone', 5, [70, 70, 80], [200, 196, 190]],
  ['asphalt', 4, [36, 36, 44], [104, 104, 116]],
  ['roof', 4, [64, 26, 34], [170, 72, 72]],
  ['siding', 4, [56, 90, 130], [150, 190, 226]],
  ['corgi', 5, [112, 44, 10], [250, 176, 92]],
  ['fur', 3, [196, 186, 176], [255, 252, 244]],
  ['gwinn', 5, [44, 22, 12], [170, 104, 62]],
  ['red', 4, [120, 10, 20], [255, 84, 84]],
  ['yellow', 4, [150, 104, 0], [255, 238, 96]],
  ['blue', 4, [20, 40, 120], [96, 160, 255]],
  ['green', 3, [20, 100, 50], [96, 220, 120]],
  ['purple', 4, [60, 20, 90], [190, 120, 240]],
  ['pink', 4, [170, 60, 110], [255, 190, 220]],
  ['skin', 4, [120, 70, 48], [255, 214, 180]],
  ['metal', 5, [50, 56, 66], [220, 226, 232]],
  ['water', 4, [24, 70, 150], [150, 220, 255]],
  ['tongue', 2, [190, 60, 80], [255, 130, 150]],
  ['glow', 4, [170, 110, 30], [255, 252, 200]],
  ['neon', 4, [255, 60, 140], [80, 220, 255], [255, 230, 80]],
  ['gold', 3, [150, 100, 10], [255, 230, 110]],
  ['peach', 4, [150, 90, 70], [255, 220, 186]],
  ['teal', 4, [20, 80, 90], [160, 232, 222]],
  ['hay', 4, [120, 84, 20], [250, 224, 130]],
  ['mud', 3, [46, 28, 14], [120, 82, 44]],
  ['frost', 3, [220, 170, 190], [255, 244, 250]],
  ['lilac', 4, [70, 40, 110], [210, 180, 250]],
  ['orange', 4, [150, 60, 10], [255, 190, 90]],
];

/**
 * Doc Leo's own ramps (his hobo clown look: a dark fedora with pins in its band, a white mouth
 * patch, a purple shirt and green tie, red sneakers), with a blue mechanic's shop coat over it
 * all for the tune-up; and the rubber chicken's (its pale rubber, its red comb).
 */
const CAST: RampSpec[] = [
  ['coat', 5, [34, 52, 92], [196, 214, 240], [90, 120, 176]],
  ['nose', 3, [150, 10, 20], [255, 120, 110]],
  ['hat', 4, [26, 22, 26], [110, 100, 96]],
  ['navy', 3, [18, 24, 60], [70, 90, 150]],
  ['tie', 3, [10, 70, 60], [70, 190, 150]],
  ['sneaker', 3, [130, 14, 14], [250, 90, 70]],
  ['steel', 5, [44, 50, 60], [226, 232, 240], [130, 140, 156]],
  ['potion', 4, [20, 110, 40], [190, 255, 140]],
  ['spark', 4, [70, 90, 230], [240, 250, 255], [130, 200, 255]],
  ['cheese', 3, [210, 150, 20], [255, 236, 120]],
  ['gray', 4, [44, 44, 52], [196, 196, 206]],
  ['rubber', 4, [176, 120, 20], [255, 246, 170], [250, 214, 70]],
];

/** The scenery roles every level's blocks are drawn in, and their shades. */
const ROLES: [string, number][] = [
  ['wall', 6],
  ['floor', 5],
  ['mach', 7],
  ['pipe', 5],
  ['accent', 5],
  ['lamp', 5],
  ['shade', 4],
];

/** A role's colors: dark, light and an optional middle. */
type Ramp = [RGB, RGB, RGB?];
export type Theme = Record<(typeof ROLES)[number][0], Ramp>;

/** Every scene's look, by name. */
export const THEMES = {
  /** The garage at dawn: a pegboard wall, a gray slab floor, blue tool chests, copper, red paint. */
  dawn: {
    wall: [
      [70, 52, 40],
      [246, 222, 176],
      [178, 140, 100],
    ],
    floor: [
      [60, 62, 70],
      [196, 196, 192],
    ],
    mach: [
      [24, 40, 74],
      [190, 214, 240],
      [70, 104, 160],
    ],
    pipe: [
      [90, 40, 20],
      [250, 190, 130],
      [196, 110, 60],
    ],
    accent: [
      [110, 14, 20],
      [255, 150, 120],
      [220, 50, 40],
    ],
    lamp: [
      [180, 110, 20],
      [255, 250, 210],
      [255, 210, 90],
    ],
    shade: [
      [18, 14, 20],
      [90, 70, 62],
    ],
  },
  /** The engine bay lit blue-white: the plug wires' sparks. */
  electric: {
    wall: [
      [8, 12, 34],
      [120, 150, 210],
      [40, 56, 110],
    ],
    floor: [
      [30, 34, 50],
      [170, 180, 200],
    ],
    mach: [
      [30, 36, 52],
      [220, 230, 246],
      [110, 124, 150],
    ],
    pipe: [
      [10, 10, 16],
      [110, 120, 150],
      [40, 44, 60],
    ],
    accent: [
      [120, 120, 140],
      [255, 255, 255],
      [210, 214, 230],
    ],
    lamp: [
      [40, 90, 230],
      [250, 254, 255],
      [130, 210, 255],
    ],
    shade: [
      [4, 6, 16],
      [40, 46, 80],
    ],
  },
  /** The distributor's insides as a player piano: dark wood, brass, glass and ivory. */
  brass: {
    wall: [
      [40, 20, 12],
      [170, 104, 60],
      [96, 54, 30],
    ],
    floor: [
      [100, 64, 10],
      [255, 236, 140],
      [200, 150, 40],
    ],
    mach: [
      [70, 44, 14],
      [250, 220, 140],
      [176, 128, 50],
    ],
    pipe: [
      [40, 90, 110],
      [220, 250, 255],
      [120, 190, 220],
    ],
    accent: [
      [170, 160, 140],
      [255, 252, 240],
    ],
    lamp: [
      [180, 110, 10],
      [255, 250, 200],
      [255, 214, 80],
    ],
    shade: [
      [16, 8, 6],
      [70, 40, 24],
    ],
  },
  /** The oil pan: dark umber, amber oil, bronze. */
  amber: {
    wall: [
      [24, 14, 8],
      [130, 86, 50],
      [70, 44, 24],
    ],
    floor: [
      [50, 30, 10],
      [220, 160, 70],
    ],
    mach: [
      [44, 30, 20],
      [230, 196, 150],
      [130, 96, 60],
    ],
    pipe: [
      [90, 40, 0],
      [255, 214, 100],
      [220, 130, 20],
    ],
    accent: [
      [170, 150, 120],
      [255, 248, 226],
    ],
    lamp: [
      [170, 80, 0],
      [255, 240, 170],
      [255, 170, 40],
    ],
    shade: [
      [10, 6, 4],
      [56, 36, 20],
    ],
  },
  /** The curb at noon (Pump Up the Volume). */
  noon: {
    wall: [
      [60, 120, 200],
      [220, 240, 255],
      [130, 180, 240],
    ],
    floor: [
      [60, 60, 66],
      [210, 206, 196],
    ],
    mach: [
      [50, 56, 66],
      [230, 236, 240],
      [140, 150, 160],
    ],
    pipe: [
      [30, 90, 40],
      [170, 230, 120],
      [80, 160, 70],
    ],
    accent: [
      [130, 20, 30],
      [255, 160, 150],
      [230, 60, 60],
    ],
    lamp: [
      [200, 140, 20],
      [255, 252, 220],
      [255, 220, 90],
    ],
    shade: [
      [20, 24, 30],
      [90, 96, 110],
    ],
  },
  /** The cab in the rain (The Rain Delay). */
  rain: {
    wall: [
      [30, 40, 60],
      [170, 190, 214],
      [90, 110, 140],
    ],
    floor: [
      [24, 26, 34],
      [140, 146, 160],
    ],
    mach: [
      [30, 30, 36],
      [200, 204, 214],
      [100, 104, 116],
    ],
    pipe: [
      [40, 60, 90],
      [200, 230, 255],
      [110, 150, 200],
    ],
    accent: [
      [110, 20, 24],
      [240, 120, 110],
      [200, 50, 44],
    ],
    lamp: [
      [60, 120, 140],
      [230, 252, 255],
      [140, 220, 240],
    ],
    shade: [
      [8, 10, 16],
      [50, 56, 70],
    ],
  },
  /** The parade route in the morning (the finale, and the title). */
  parade: {
    wall: [
      [90, 150, 220],
      [230, 244, 255],
      [150, 200, 250],
    ],
    floor: [
      [50, 50, 56],
      [190, 186, 180],
    ],
    mach: [
      [70, 40, 20],
      [240, 200, 150],
      [170, 110, 60],
    ],
    pipe: [
      [20, 90, 40],
      [170, 230, 120],
      [70, 160, 70],
    ],
    accent: [
      [130, 14, 20],
      [255, 150, 140],
      [230, 50, 50],
    ],
    lamp: [
      [200, 140, 20],
      [255, 252, 220],
      [255, 214, 80],
    ],
    shade: [
      [20, 20, 28],
      [90, 90, 104],
    ],
  },
} satisfies Record<string, Theme>;
export type ThemeName = keyof typeof THEMES;

const roleSpecs = (t: Theme): RampSpec[] => ROLES.map(([name, n]) => [name, n, t[name][0], t[name][1], t[name][2]] as RampSpec);

/** A scene's palette: the fixed half, then the roles in the scene's theme. */
export function buildPalette(theme: ThemeName): Pal {
  const pal = buildRampPalette([...TEDDY, ...CAST, ...roleSpecs(THEMES[theme])]);
  if (pal.b.used > 255) throw new Error(`tuneup palette uses ${pal.b.used} colors`);
  return pal;
}

/** The title, menu, cards and cartoons: the fixed half, the dawn's roles and the screens' inks. */
export function buildScreenPalette(): Pal {
  const pal = buildRampPalette([...TEDDY, ...CAST, ...roleSpecs(THEMES.dawn), ...SCREEN_RAMPS.filter(([n]) => n !== 'dusk')]);
  if (pal.b.used > 255) throw new Error(`tuneup screen palette uses ${pal.b.used} colors`);
  return pal;
}

/** Index of a ramp shade: the same in every palette (the builders add ramps in the same order). */
export const P = buildPalette('dawn');

// The trilogy's sprites use the finale's numbers: they must be the same here.
for (const name of FINALE.b.ramps.keys()) if (FINALE.r(name).join() !== P.r(name).join()) throw new Error(`tuneup palette: ramp ${name} moved`);
