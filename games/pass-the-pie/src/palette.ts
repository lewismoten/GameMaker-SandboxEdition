// PASS THE PIE's palettes. One base palette (the Starters' ramps, with Rory's own look in the five hero ramps),
// then one variant a level: a variant is the same palette with some ramps (the sky, the grass, the dirt) repainted
// from another ramp's colors, so every block keeps its index and the whole level changes mood (a palette swap).
import { skyOf, buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { recolor, type Look } from '../../kit/starter/heroLook';

/** Rory: tan skin, brown hair, a mustard knit cap, a forest-green coat and navy pants (the scarf is red and cream, drawn on). */
export const RORY_LOOK: Look = {
  skin: [4, [140, 84, 52], [248, 206, 160], [214, 148, 100]],
  hair: [3, [48, 28, 20], [124, 78, 46]],
  hat: [5, [150, 100, 10], [255, 238, 150], [236, 180, 40]],
  hood: [5, [14, 70, 52], [150, 214, 160], [40, 126, 82]],
  pants: [5, [24, 36, 84], [150, 170, 220], [58, 80, 150]],
};

/** The base palette with Rory in it. */
export function buildPalette(): Pal {
  const base = buildStarterPalette();
  base.pal.set(recolor(base, RORY_LOOK));
  return base;
}

/** What each level repaints: ramp name -> the ramp whose colors it takes (shades spread evenly). */
export const SWAPS = {
  base: {},
  yard: { grass: 'orange', sky: 'sky', dirt: 'brick' },
  kitchen: { sky: 'parch', grass: 'wood', dirt: 'dirt' },
  park: { sky: 'stone', grass: 'green' },
  cranberry: { sky: 'pink', grass: 'purple', dirt: 'brick' },
  dusk: { sky: 'blue', grass: 'teal', dirt: 'stone' },
  parade: { sky: 'teal', grass: 'gold', dirt: 'wood' },
} as const satisfies Record<string, Record<string, string>>;
export type Mood = keyof typeof SWAPS;

/** A copy of the palette bytes with the ramps of `mood` repainted. */
export function moodBytes(pal: Pal, mood: Mood): Uint8Array {
  const out = new Uint8Array(pal.pal);
  const swaps: Record<string, string> = SWAPS[mood];
  for (const [name, from] of Object.entries(swaps)) {
    const to = pal.r(name);
    const src = pal.r(from);
    to.forEach((at, i) => {
      const s = src[Math.round((i * (src.length - 1)) / Math.max(1, to.length - 1))];
      out.set(pal.pal.subarray(s * 3, s * 3 + 3), at * 3);
    });
  }
  // 'sky' swapped from 'sky' (a no-op) keeps the day blue; a bluer sky for the yard is the base
  return out;
}

export { skyOf };
