// THE MOUNTAIN MOVED NEXT DOOR's levels in order, each at its time of the day (a story from dawn to the next
// sunrise). Scenes marked (watch) mostly play by themselves: walk along, read and look.
//   1. Next Door           (watch) dawn fog lifts off a mountain in the lot next door; it wakes and lifts its toe
//   2. Gate Hunt           climb the mountain's ledges for four garden gates; carry each home to its garden
//   3. Footprints          follow the prints back through the misty park; blaze every post and tree
//   4. Stepping Stones     rain; cross the stream four times on stones that sink and rise on a clock
//   5. Nutmeg's Signposts  noon; three switchbacks; a squirrel turns the arrows, the blazes tell the truth
import { buildMountainPalette } from '../palette';
import type { Level } from '../level';
import { levelGates } from './gates';
import { levelPrints } from './prints';
import { levelSigns } from './signs';
import { levelStream } from './stream';
import { levelNext } from './next';

/** The base palette and every level. */
export function buildLevels(): { pal: ReturnType<typeof buildMountainPalette>; levels: Level[] } {
  const pal = buildMountainPalette();
  const levels: Level[] = [levelNext(pal), levelGates(pal), levelPrints(pal), levelStream(pal), levelSigns(pal)];
  return { pal, levels };
}
