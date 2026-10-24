// The scene half of every palette: one list of color roles for every kind of scene, so a
// monster set drawn in "hide" colors fits any planet, and any planet theme can recolor any
// block set. What a role means depends on the place: "sky" is open air on a planet, the
// void in space and the water column in the seas.
import type { Role, Theme, RGB } from './palette';
import { hsl, hueRamp } from './palette';
import { rng } from '../../../kit/pixels';

export const ROLES: Role[] = [
  { name: 'sky', n: 21 },
  { name: 'cloud', n: 4 },
  { name: 'far', n: 5 },
  { name: 'top', n: 6 },
  { name: 'soil', n: 7 },
  { name: 'rock', n: 8 },
  { name: 'deep', n: 6 },
  { name: 'cave', n: 6 },
  { name: 'plant', n: 8 },
  { name: 'stem', n: 5 },
  { name: 'bloom', n: 5 },
  { name: 'crystal', n: 8 },
  { name: 'liquid', n: 10 },
  { name: 'ruin', n: 7 },
  { name: 'tech', n: 7 },
  { name: 'glow', n: 8 },
  { name: 'hideA', n: 7 },
  { name: 'hideB', n: 7 },
  { name: 'hideC', n: 6 },
  { name: 'hideD', n: 6 },
  { name: 'eye', n: 4 },
  { name: 'hazard', n: 5 },
  { name: 'accent', n: 6 },
  { name: 'star', n: 7 },
];

export type Biome =
  'verdant' | 'desert' | 'ice' | 'lava' | 'toxic' | 'crystal' | 'fungal' | 'ash' | 'autumn' | 'jungle' | 'ocean' | 'abyss' | 'station' | 'space' | 'core';

const r = (a: number, b: number, rnd: () => number) => a + (b - a) * rnd();

/** How much light each sector's skies keep (sector level 1..5): the outer sectors dim toward The Deep Black. */
const SKY_LIGHT = [1, 1, 1, 1, 0.7, 0.3];

/**
 * A theme for a biome, varied by seed: hues drift so no two planets look alike. `level` is
 * the sector's (1..5): the sky, its clouds and the far hills dim in the outer sectors, so The
 * Deep Black is dark. Ground, caves and creature hides keep their light.
 */
export function themeFor(biome: Biome, seed: number, level = 0): Theme {
  const t = biomeTheme(biome, seed);
  const k = SKY_LIGHT[level] ?? 1;
  if (k === 1) return t;
  const dim = (c: RGB | undefined): RGB | undefined => c && [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)];
  const out: Theme = { ...t };
  for (const role of ['sky', 'cloud', 'far']) {
    const [a, b, mid] = t[role];
    // the top of the sky dims more than the horizon, so a faint glow stays low
    out[role] = [dim(dim(a))!, dim(b)!, dim(mid)];
  }
  return out;
}

function biomeTheme(biome: Biome, seed: number): Theme {
  const rnd = rng(seed * 7919 + 13);
  const j = (h: number, d = 18) => h + r(-d, d, rnd);
  const ramp = (h: number, s = 0.55, dark = 0.08, light = 0.85, shift = 18) => hueRamp(j(h), s, dark, light, shift);
  const flat = (a: RGB, b: RGB, mid?: RGB): [RGB, RGB, RGB?] => [a, b, mid];
  // creature hides: three contrasting hues so monsters read against the ground
  const hideBase = j(r(0, 360, rnd), 0);
  const base: Theme = {
    hideA: ramp(hideBase, 0.65, 0.1, 0.85),
    hideB: ramp(hideBase + 120, 0.6, 0.1, 0.85),
    hideC: ramp(hideBase + 220, 0.55, 0.1, 0.8),
    hideD: ramp(hideBase + 60, 0.5, 0.12, 0.88),
    eye: flat([60, 0, 0], [255, 255, 200], [250, 220, 40]),
    hazard: ramp(j(5, 10), 0.8, 0.12, 0.8),
    accent: ramp(j(45, 20), 0.85, 0.15, 0.9),
    star: flat([90, 90, 120], [255, 255, 255]),
    glow: ramp(j(185, 30), 0.9, 0.3, 0.95),
    tech: flat(hsl(j(220), 0.15, 0.1), hsl(j(220), 0.15, 0.85), hsl(j(220), 0.2, 0.45)),
    ruin: ramp(j(35, 15), 0.2, 0.12, 0.75),
    crystal: ramp(j(r(160, 300, rnd)), 0.7, 0.15, 0.95),
    cloud: flat([180, 180, 200], [255, 255, 255]),
    far: ramp(j(240), 0.2, 0.25, 0.55),
    bloom: ramp(j(r(0, 360, rnd)), 0.75, 0.2, 0.9),
  };
  const sky = (top: RGB, horizon: RGB, mid?: RGB): [RGB, RGB, RGB?] => [top, horizon, mid];
  switch (biome) {
    case 'verdant':
      return {
        ...base,
        sky: sky([10, 20, 70], hsl(j(200), 0.6, 0.78), hsl(j(215), 0.6, 0.55)),
        top: ramp(110, 0.6, 0.15, 0.7),
        soil: ramp(28, 0.45, 0.1, 0.55),
        rock: ramp(30, 0.12, 0.12, 0.65),
        deep: ramp(250, 0.15, 0.05, 0.35),
        cave: ramp(30, 0.2, 0.04, 0.28),
        plant: ramp(120, 0.6, 0.1, 0.75),
        stem: ramp(25, 0.5, 0.12, 0.55),
        liquid: ramp(205, 0.7, 0.15, 0.8),
        far: ramp(210, 0.3, 0.35, 0.65),
      };
    case 'desert':
      return {
        ...base,
        sky: sky([60, 20, 50], hsl(j(30), 0.8, 0.78), hsl(j(15), 0.7, 0.6)),
        top: ramp(40, 0.6, 0.3, 0.9),
        soil: ramp(32, 0.55, 0.2, 0.75),
        rock: ramp(18, 0.45, 0.15, 0.65),
        deep: ramp(10, 0.35, 0.06, 0.35),
        cave: ramp(20, 0.35, 0.05, 0.3),
        plant: ramp(95, 0.35, 0.12, 0.6),
        stem: ramp(30, 0.4, 0.15, 0.55),
        liquid: ramp(170, 0.6, 0.15, 0.75),
        far: ramp(20, 0.4, 0.35, 0.6),
      };
    case 'ice':
      return {
        ...base,
        sky: sky([20, 10, 60], hsl(j(190), 0.4, 0.85), hsl(j(220), 0.45, 0.6)),
        top: flat([150, 170, 210], [255, 255, 255]),
        soil: ramp(205, 0.4, 0.3, 0.85),
        rock: ramp(215, 0.3, 0.15, 0.7),
        deep: ramp(230, 0.35, 0.06, 0.4),
        cave: ramp(220, 0.4, 0.05, 0.3),
        plant: ramp(170, 0.3, 0.2, 0.8),
        stem: ramp(210, 0.2, 0.2, 0.6),
        liquid: ramp(195, 0.8, 0.2, 0.9),
        crystal: ramp(185, 0.6, 0.3, 0.98),
        far: ramp(220, 0.25, 0.45, 0.75),
      };
    case 'lava':
      return {
        ...base,
        sky: sky([10, 0, 0], hsl(j(10), 0.7, 0.35), hsl(j(0), 0.6, 0.18)),
        top: ramp(15, 0.15, 0.08, 0.4),
        soil: ramp(10, 0.2, 0.05, 0.3),
        rock: ramp(0, 0.1, 0.06, 0.4),
        deep: ramp(350, 0.3, 0.03, 0.2),
        cave: ramp(5, 0.4, 0.03, 0.2),
        plant: ramp(30, 0.6, 0.1, 0.6),
        stem: ramp(0, 0.2, 0.05, 0.3),
        liquid: flat([120, 10, 0], [255, 250, 160], [255, 120, 0]),
        far: ramp(0, 0.5, 0.12, 0.3),
        crystal: ramp(40, 0.9, 0.2, 0.9),
      };
    case 'toxic':
      return {
        ...base,
        sky: sky([30, 40, 0], hsl(j(70), 0.6, 0.6), hsl(j(80), 0.5, 0.35)),
        top: ramp(280, 0.45, 0.12, 0.65),
        soil: ramp(290, 0.35, 0.08, 0.45),
        rock: ramp(260, 0.2, 0.08, 0.5),
        deep: ramp(270, 0.3, 0.04, 0.25),
        cave: ramp(275, 0.35, 0.03, 0.22),
        plant: ramp(75, 0.7, 0.12, 0.7),
        stem: ramp(300, 0.3, 0.1, 0.45),
        liquid: ramp(95, 0.9, 0.15, 0.85),
        far: ramp(90, 0.35, 0.2, 0.45),
      };
    case 'crystal':
      return {
        ...base,
        sky: sky([0, 0, 20], hsl(j(265), 0.5, 0.35), hsl(j(250), 0.6, 0.15)),
        top: ramp(285, 0.4, 0.2, 0.8),
        soil: ramp(265, 0.35, 0.1, 0.5),
        rock: ramp(250, 0.25, 0.08, 0.55),
        deep: ramp(240, 0.3, 0.03, 0.25),
        cave: ramp(255, 0.35, 0.03, 0.2),
        plant: ramp(175, 0.6, 0.15, 0.8),
        stem: ramp(260, 0.3, 0.12, 0.5),
        liquid: ramp(310, 0.8, 0.2, 0.9),
        crystal: ramp(185, 0.8, 0.25, 0.98),
        far: ramp(260, 0.4, 0.15, 0.35),
      };
    case 'fungal':
      return {
        ...base,
        sky: sky([0, 20, 25], hsl(j(170), 0.45, 0.45), hsl(j(180), 0.5, 0.25)),
        top: ramp(330, 0.4, 0.15, 0.7),
        soil: ramp(15, 0.3, 0.08, 0.45),
        rock: ramp(160, 0.12, 0.08, 0.5),
        deep: ramp(200, 0.2, 0.03, 0.25),
        cave: ramp(190, 0.3, 0.03, 0.2),
        plant: ramp(320, 0.6, 0.15, 0.8),
        stem: ramp(40, 0.25, 0.3, 0.85),
        liquid: ramp(160, 0.7, 0.15, 0.8),
        far: ramp(175, 0.35, 0.15, 0.4),
      };
    case 'ash':
      return {
        ...base,
        sky: sky([20, 20, 22], hsl(j(30), 0.12, 0.6), hsl(j(20), 0.1, 0.4)),
        top: ramp(30, 0.08, 0.2, 0.7),
        soil: ramp(20, 0.1, 0.1, 0.45),
        rock: ramp(0, 0.05, 0.08, 0.55),
        deep: ramp(0, 0.05, 0.03, 0.25),
        cave: ramp(10, 0.1, 0.03, 0.2),
        plant: ramp(40, 0.2, 0.1, 0.5),
        stem: ramp(20, 0.15, 0.05, 0.35),
        liquid: ramp(15, 0.85, 0.15, 0.8),
        far: ramp(0, 0.05, 0.25, 0.45),
      };
    case 'autumn':
      return {
        ...base,
        sky: sky([40, 30, 90], hsl(j(35), 0.7, 0.8), hsl(j(330), 0.4, 0.6)),
        top: ramp(28, 0.75, 0.15, 0.7),
        soil: ramp(20, 0.45, 0.1, 0.45),
        rock: ramp(35, 0.15, 0.12, 0.6),
        deep: ramp(15, 0.2, 0.05, 0.3),
        cave: ramp(20, 0.25, 0.04, 0.25),
        plant: ramp(20, 0.8, 0.15, 0.75),
        stem: ramp(15, 0.45, 0.08, 0.4),
        liquid: ramp(200, 0.5, 0.15, 0.75),
        far: ramp(280, 0.25, 0.4, 0.7),
      };
    case 'jungle':
      return {
        ...base,
        sky: sky([0, 30, 30], hsl(j(160), 0.5, 0.75), hsl(j(150), 0.5, 0.5)),
        top: ramp(150, 0.6, 0.1, 0.6),
        soil: ramp(340, 0.35, 0.08, 0.4),
        rock: ramp(150, 0.15, 0.06, 0.45),
        deep: ramp(180, 0.25, 0.03, 0.22),
        cave: ramp(170, 0.3, 0.03, 0.2),
        plant: ramp(300, 0.6, 0.12, 0.75),
        stem: ramp(120, 0.4, 0.08, 0.45),
        liquid: ramp(60, 0.7, 0.15, 0.75),
        far: ramp(160, 0.4, 0.25, 0.5),
      };
    case 'ocean':
    case 'abyss': {
      const deep = biome === 'abyss';
      return {
        ...base,
        sky: sky(deep ? [0, 0, 10] : [0, 20, 60], hsl(j(deep ? 220 : 190), 0.7, deep ? 0.25 : 0.55), hsl(j(205), 0.7, deep ? 0.12 : 0.35)),
        top: ramp(45, 0.5, 0.25, 0.85),
        soil: ramp(40, 0.4, 0.15, 0.65),
        rock: ramp(200, 0.2, 0.08, 0.5),
        deep: ramp(220, 0.3, 0.02, 0.2),
        cave: ramp(215, 0.45, 0.02, 0.18),
        plant: ramp(deep ? 280 : 130, 0.55, 0.1, 0.7),
        stem: ramp(100, 0.4, 0.08, 0.45),
        bloom: ramp(j(deep ? 170 : 350, 30), 0.8, 0.2, 0.9),
        liquid: ramp(185, 0.7, 0.2, 0.9),
        crystal: ramp(deep ? 160 : 300, 0.8, 0.2, 0.95),
        far: ramp(205, 0.5, 0.15, 0.4),
        cloud: flat([120, 170, 220], [230, 250, 255]),
      };
    }
    case 'station':
      return {
        ...base,
        sky: sky([0, 0, 0], hsl(j(230), 0.3, 0.2), hsl(j(240), 0.3, 0.08)),
        top: ramp(j(210), 0.15, 0.25, 0.85),
        soil: ramp(j(215), 0.12, 0.15, 0.6),
        rock: ramp(j(220), 0.1, 0.1, 0.55),
        deep: ramp(j(230), 0.15, 0.04, 0.3),
        cave: ramp(j(225), 0.2, 0.04, 0.22),
        plant: ramp(j(130), 0.5, 0.12, 0.65),
        stem: ramp(j(30), 0.4, 0.1, 0.5),
        liquid: ramp(j(100), 0.85, 0.15, 0.8),
        far: ramp(j(240), 0.3, 0.1, 0.35),
      };
    case 'space':
    case 'core': {
      const core = biome === 'core';
      return {
        ...base,
        sky: sky([0, 0, 0], hsl(j(core ? 330 : 250), 0.5, core ? 0.22 : 0.14), hsl(j(core ? 300 : 240), 0.5, 0.06)),
        top: ramp(j(30), 0.15, 0.12, 0.75),
        soil: ramp(j(25), 0.2, 0.08, 0.55),
        rock: ramp(j(20), 0.12, 0.08, 0.65),
        deep: ramp(j(240), 0.2, 0.03, 0.3),
        cave: ramp(j(core ? 320 : 260), 0.6, 0.05, 0.4),
        plant: ramp(j(core ? 300 : 190), 0.7, 0.15, 0.8),
        stem: ramp(j(core ? 20 : 280), 0.6, 0.15, 0.8),
        liquid: ramp(j(core ? 10 : 200), 0.8, 0.2, 0.95),
        far: ramp(j(core ? 320 : 270), 0.5, 0.06, 0.35),
        cloud: ramp(j(core ? 340 : 210), 0.5, 0.15, 0.6),
      };
    }
  }
}
