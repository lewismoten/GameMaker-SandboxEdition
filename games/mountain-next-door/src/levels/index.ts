// THE MOUNTAIN MOVED NEXT DOOR's levels in order, each at its time of the day (a story from dawn to the next
// sunrise). Scenes marked (watch) mostly play by themselves: walk along, read and look.
//   1. Next Door           (watch) dawn fog lifts off a mountain in the lot next door; it wakes and lifts its toe
import { buildMountainPalette } from '../palette';
import type { Level } from '../level';
import { levelNext } from './next';

/** The base palette and every level. */
export function buildLevels(): { pal: ReturnType<typeof buildMountainPalette>; levels: Level[] } {
  const pal = buildMountainPalette();
  const levels: Level[] = [levelNext(pal)];
  return { pal, levels };
}
