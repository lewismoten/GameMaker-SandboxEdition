// Friends from the Bard's gospel oddities, drawn by their own games and recolored into this
// game's palette (as kit/cameos.ts does for the Sandbox regulars): Loaf #13, the loaf nobody
// picked, and the mustard seed with the greatest feet.
import { recolor } from '../../../kit/cameos';
import type { Pixels } from '../../../kit/pixels';
import { buildPalette as loafPalette } from '../../../loaf/src/art/pal';
import { loafArt, type LoafPose } from '../../../loaf/src/sprites/sprites';
import { buildPalette as seedPalette } from '../../../mustard/src/art/pal';
import { seedArt, type SeedPose } from '../../../mustard/src/sprites/sprites';
import { T } from '../../../snowbound/src/sprites/kidArt';
import { PAL } from '../art/pal';

let loafPal: ReturnType<typeof loafPalette> | undefined;
/** Loaf #13, from the front (`mood`), in this game's colors. */
export function loaf(mood: LoafPose['mood'] = 'smile'): Pixels {
  loafPal ??= loafPalette('noon');
  return recolor(loafArt(loafPal).body({ face: 'front', mood, steam: mood === 'joy' }), loafPal.pal, PAL.pal, { clear: T });
}

let seedPal: ReturnType<typeof seedPalette> | undefined;
/** The mustard seed (a sprout now, the plant grown), from the front, in this game's colors. */
export function seed(mood: SeedPose['mood'] = 'smile', top: SeedPose['top'] = 'sprout'): Pixels {
  seedPal ??= seedPalette('garden');
  return recolor(seedArt(seedPal).body({ face: 'front', feet: 0, top, mood }), seedPal.pal, PAL.pal, { clear: T });
}
