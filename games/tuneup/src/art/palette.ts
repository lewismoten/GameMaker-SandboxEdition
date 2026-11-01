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
  /** Brake Dance: the lift pit under THE CHEZ as a disco, purple walls and magenta lights. */
  disco: {
    wall: [
      [30, 10, 50],
      [190, 140, 230],
      [90, 50, 140],
    ],
    floor: [
      [30, 24, 40],
      [170, 160, 190],
    ],
    mach: [
      [40, 30, 60],
      [230, 220, 250],
      [130, 110, 170],
    ],
    pipe: [
      [90, 20, 80],
      [255, 160, 230],
      [200, 60, 170],
    ],
    accent: [
      [10, 70, 90],
      [150, 250, 255],
      [40, 190, 220],
    ],
    lamp: [
      [180, 20, 40],
      [255, 220, 220],
      [255, 70, 80],
    ],
    shade: [
      [10, 6, 20],
      [80, 70, 100],
    ],
  },
  /** Hubcaps and Balls: a magic show at the curb, red velvet and a gold spotlight. */
  spot: {
    wall: [
      [40, 6, 14],
      [230, 120, 120],
      [140, 24, 40],
    ],
    floor: [
      [40, 30, 20],
      [220, 190, 140],
    ],
    mach: [
      [50, 54, 64],
      [240, 244, 250],
      [150, 156, 170],
    ],
    pipe: [
      [120, 80, 10],
      [255, 240, 160],
      [230, 180, 50],
    ],
    accent: [
      [20, 20, 60],
      [160, 170, 255],
      [70, 80, 200],
    ],
    lamp: [
      [200, 150, 30],
      [255, 255, 230],
      [255, 230, 120],
    ],
    shade: [
      [14, 4, 8],
      [90, 60, 70],
    ],
  },
  /** Muffled: the garage at night, moonlight through the window, everything hushed blue. */
  night: {
    wall: [
      [10, 16, 40],
      [110, 130, 190],
      [40, 56, 110],
    ],
    floor: [
      [16, 18, 30],
      [110, 116, 140],
    ],
    mach: [
      [16, 20, 40],
      [170, 180, 220],
      [70, 80, 130],
    ],
    pipe: [
      [40, 30, 30],
      [180, 150, 130],
      [110, 80, 70],
    ],
    accent: [
      [60, 20, 40],
      [220, 140, 170],
      [140, 60, 90],
    ],
    lamp: [
      [60, 80, 140],
      [240, 248, 255],
      [180, 200, 250],
    ],
    shade: [
      [4, 6, 14],
      [50, 56, 80],
    ],
  },
  /** The Fan Band's cool verse: a mint vent, pale air, bright steel. */
  cool: {
    wall: [
      [8, 40, 46],
      [120, 210, 200],
      [30, 110, 110],
    ],
    floor: [
      [20, 40, 56],
      [170, 210, 230],
    ],
    mach: [
      [20, 36, 50],
      [230, 246, 255],
      [110, 150, 176],
    ],
    pipe: [
      [30, 70, 120],
      [190, 230, 255],
      [90, 150, 220],
    ],
    accent: [
      [90, 170, 200],
      [255, 255, 255],
      [180, 236, 255],
    ],
    lamp: [
      [120, 200, 230],
      [255, 255, 255],
      [210, 250, 255],
    ],
    shade: [
      [4, 16, 20],
      [40, 80, 90],
    ],
  },
  /** The Fan Band's hot verse: the vent glowing orange, the air shimmering yellow. */
  hot: {
    wall: [
      [50, 8, 6],
      [240, 140, 70],
      [150, 40, 20],
    ],
    floor: [
      [60, 20, 10],
      [240, 190, 140],
    ],
    mach: [
      [60, 26, 16],
      [255, 220, 170],
      [180, 100, 60],
    ],
    pipe: [
      [120, 30, 10],
      [255, 220, 120],
      [230, 110, 30],
    ],
    accent: [
      [200, 90, 10],
      [255, 250, 200],
      [255, 190, 60],
    ],
    lamp: [
      [220, 120, 20],
      [255, 255, 220],
      [255, 220, 100],
    ],
    shade: [
      [20, 4, 2],
      [90, 30, 16],
    ],
  },
  /** The Horn Section: the curb in late-afternoon gold, long shadows, a peach sky. */
  gold: {
    wall: [
      [190, 110, 70],
      [255, 230, 170],
      [250, 170, 110],
    ],
    floor: [
      [70, 50, 40],
      [230, 200, 160],
    ],
    mach: [
      [50, 40, 40],
      [240, 220, 200],
      [150, 120, 100],
    ],
    pipe: [
      [30, 60, 30],
      [170, 210, 110],
      [80, 130, 60],
    ],
    accent: [
      [120, 20, 40],
      [255, 150, 140],
      [220, 60, 60],
    ],
    lamp: [
      [180, 120, 20],
      [255, 250, 210],
      [255, 210, 80],
    ],
    shade: [
      [30, 16, 20],
      [110, 70, 70],
    ],
  },
  /** Key Change, first gear: cool blue steel. */
  gear1: {
    wall: [
      [6, 14, 40],
      [90, 130, 210],
      [30, 50, 120],
    ],
    floor: [
      [16, 24, 50],
      [150, 170, 220],
    ],
    mach: [
      [20, 26, 50],
      [220, 230, 255],
      [100, 120, 180],
    ],
    pipe: [
      [20, 40, 100],
      [170, 210, 255],
      [70, 120, 220],
    ],
    accent: [
      [120, 20, 30],
      [255, 140, 120],
      [220, 50, 50],
    ],
    lamp: [
      [60, 120, 220],
      [240, 250, 255],
      [150, 200, 255],
    ],
    shade: [
      [2, 4, 14],
      [30, 40, 80],
    ],
  },
  /** Key Change, second gear: green. */
  gear2: {
    wall: [
      [6, 30, 14],
      [110, 210, 130],
      [30, 110, 50],
    ],
    floor: [
      [16, 40, 20],
      [160, 220, 160],
    ],
    mach: [
      [20, 40, 26],
      [230, 255, 230],
      [100, 170, 110],
    ],
    pipe: [
      [20, 80, 40],
      [190, 255, 190],
      [70, 190, 90],
    ],
    accent: [
      [110, 40, 120],
      [250, 170, 255],
      [200, 90, 220],
    ],
    lamp: [
      [80, 190, 90],
      [245, 255, 240],
      [170, 255, 170],
    ],
    shade: [
      [2, 12, 4],
      [30, 70, 40],
    ],
  },
  /** Key Change, third gear: gold. */
  gear3: {
    wall: [
      [40, 26, 4],
      [240, 200, 90],
      [140, 100, 20],
    ],
    floor: [
      [50, 36, 10],
      [240, 220, 150],
    ],
    mach: [
      [50, 40, 20],
      [255, 246, 210],
      [180, 150, 80],
    ],
    pipe: [
      [110, 70, 0],
      [255, 240, 150],
      [230, 170, 30],
    ],
    accent: [
      [20, 50, 120],
      [150, 200, 255],
      [60, 110, 220],
    ],
    lamp: [
      [220, 160, 20],
      [255, 255, 230],
      [255, 230, 100],
    ],
    shade: [
      [14, 8, 2],
      [80, 60, 20],
    ],
  },
  /** Key Change, top gear: red. */
  gear4: {
    wall: [
      [44, 4, 8],
      [240, 110, 100],
      [150, 20, 30],
    ],
    floor: [
      [50, 14, 14],
      [240, 180, 170],
    ],
    mach: [
      [50, 20, 20],
      [255, 230, 220],
      [180, 90, 80],
    ],
    pipe: [
      [120, 10, 20],
      [255, 190, 170],
      [230, 60, 50],
    ],
    accent: [
      [20, 90, 90],
      [170, 255, 240],
      [60, 200, 180],
    ],
    lamp: [
      [230, 80, 40],
      [255, 250, 220],
      [255, 180, 110],
    ],
    shade: [
      [16, 2, 4],
      [90, 30, 30],
    ],
  },
  /** The Instrument Panel: the cab at night, the dashboard's green glow. */
  dash: {
    wall: [
      [4, 8, 20],
      [70, 90, 140],
      [20, 30, 60],
    ],
    floor: [
      [10, 10, 16],
      [110, 110, 130],
    ],
    mach: [
      [8, 8, 12],
      [150, 150, 170],
      [50, 50, 64],
    ],
    pipe: [
      [20, 60, 30],
      [200, 255, 200],
      [80, 200, 110],
    ],
    accent: [
      [120, 50, 0],
      [255, 220, 140],
      [250, 150, 40],
    ],
    lamp: [
      [40, 140, 70],
      [230, 255, 230],
      [130, 240, 150],
    ],
    shade: [
      [0, 2, 6],
      [30, 34, 50],
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
