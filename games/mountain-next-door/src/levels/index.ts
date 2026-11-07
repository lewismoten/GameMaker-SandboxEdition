// THE MOUNTAIN MOVED NEXT DOOR's levels in order, each at its time of the day (a story from dawn to the next
// sunrise). Scenes marked (watch) mostly play by themselves: walk along, read and look.
//   1. Next Door           (watch) dawn fog lifts off a mountain in the lot next door; it wakes and lifts its toe
//   2. Gate Hunt           climb the mountain's ledges for four garden gates; carry each home to its garden
import { buildMountainPalette } from '../palette';
import type { Level } from '../level';
import { levelGates } from './gates';
import { levelNext } from './next';

/** The base palette and every level. */
export function buildLevels(): { pal: ReturnType<typeof buildMountainPalette>; levels: Level[] } {
  const pal = buildMountainPalette();
  const levels: Level[] = [levelNext(pal), levelGates(pal)];
  return { pal, levels };
}
