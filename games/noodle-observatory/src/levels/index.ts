// THE NOODLE OBSERVATORY's scenes in order: six chapters of three levels each, and three scenes you watch unfold
// (a story from clear winter dusk in the kitchen to the indigo night on the roof).
//   First Lens (watch)                          the tin monkey rolls the first lens into the scope; the moon
//   1 Cupboard Astronomy: hinges, drawers, scope      parts for the telescope
//   2 Pantry Orbit: roundway, narrow, uphill          up the pantry in the pasta ring
//   3 Carry the Sky: softstep, lensrise, rimwalk      one lens at a time
//   4 Shutter Constellation: slitone, slittwo, slitend   nine pads set nine shutters
//   Kitchen in the Stars (watch)                the stars make a spoon, a fork and a colander
//   5 The Colander Has Other Plans: rattle, garden, roofrim   follow it across the roof garden
//   6 Supper Under the Window: setwest, seteast, moonmeal     set supper where the view is best
//   A Most Local Moon (watch)                   the moon has a windowsill; the ring takes the tablecloth
import type { Level } from '../level';
import { buildNoodlePalette } from '../palette';
import { SHAFTS, buildShaft } from './ring';
import { ROOMS, buildRoom } from './rooms';
import { levelBakery, levelLensroll, levelStarview } from './watch';

/** Which chapter each scene belongs to (0 for the opening scene), for the cards. */
export const CHAPTER: Record<string, number> = {};

export function buildLevels(): { pal: ReturnType<typeof buildNoodlePalette>; levels: Level[] } {
  const pal = buildNoodlePalette();
  const room = (k: string) => buildRoom(pal, ROOMS[k]);
  const levels: Level[] = [
    levelLensroll(pal),
    room('hinges'),
    room('drawers'),
    room('scope'),
    ...SHAFTS.map((s) => buildShaft(pal, s)),
    room('softstep'),
    room('lensrise'),
    room('rimwalk'),
    room('slitone'),
    room('slittwo'),
    room('slitend'),
    levelStarview(pal),
    room('rattle'),
    room('garden'),
    room('roofrim'),
    room('setwest'),
    room('seteast'),
    room('moonmeal'),
    levelBakery(pal),
  ];
  return { pal, levels };
}
