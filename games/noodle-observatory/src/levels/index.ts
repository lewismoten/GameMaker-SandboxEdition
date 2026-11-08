// THE NOODLE OBSERVATORY's scenes in order: six chapters of three levels each, and three scenes you watch unfold
// (a story from clear winter dusk in the kitchen to the indigo night on the roof).
//   First Lens (watch)                          the tin monkey rolls the first lens into the scope; the moon
//   1 Cupboard Astronomy: hinges, drawers, scope      parts for the telescope
//   2 Pantry Orbit: roundway, narrow, uphill          up the pantry in the pasta ring
//   3 Carry the Sky: softstep, lensrise, rimwalk, lensloop      one lens at a time
//   4 Shutter Constellation: slitone, slittwo, slitend   nine pads set nine shutters
//   Kitchen in the Stars (watch)                the stars make a spoon, a fork and a colander
//   5 The Colander Has Other Plans: rattle, garden, roofrim, chimneys   follow it across the roof garden
//   6 Supper Under the Window: setwest, seteast, moonmeal, napkins     set supper where the view is best
//   A Most Local Moon (watch)                   the moon has a windowsill; the ring takes the tablecloth
//   7 The Tablecloth Trail: porch, drifts, lane, woodpile      after the ring, across the snowy yards (after.ts)
//   8 The Night Bakery: pegboard, racks, ovens, chute (the ring), drying   every tool back on its hook; the cloth
//   From the Other Side (watch)                 the bakery's logbook: a new star in the west is Nell's lamp
//   9 The Real Sky: homeward, loftback, roofset, parapet       the scope packed up and set up outside
//   Moonrise (watch)                            the real moon; the bakery's light goes out
import type { Level } from '../level';
import { buildNoodlePalette } from '../palette';
import { SHAFTS, buildShaft } from './ring';
import { ROOMS, buildRoom } from './rooms';
import { AFTER } from './after';
import { MORE } from './more';
import { levelBakery, levelLensroll, levelStarview } from './watch';
import { levelMoonrise, levelOtherside } from './watch2';

/** Which chapter each scene belongs to (0 for the opening scene), for the cards. */
export const CHAPTER: Record<string, number> = {};

export function buildLevels(): { pal: ReturnType<typeof buildNoodlePalette>; levels: Level[] } {
  const pal = buildNoodlePalette();
  const room = (k: string) => buildRoom(pal, ROOMS[k]);
  const after = (k: string) => buildRoom(pal, AFTER[k]);
  const more = (k: string) => buildRoom(pal, MORE[k]);
  const levels: Level[] = [
    levelLensroll(pal),
    room('hinges'),
    room('drawers'),
    room('scope'),
    ...SHAFTS.filter((s) => s.place !== 'bakery').map((s) => buildShaft(pal, s)),
    room('softstep'),
    room('lensrise'),
    room('rimwalk'),
    more('lensloop'),
    room('slitone'),
    room('slittwo'),
    room('slitend'),
    levelStarview(pal),
    room('rattle'),
    room('garden'),
    room('roofrim'),
    more('chimneys'),
    room('setwest'),
    room('seteast'),
    room('moonmeal'),
    more('napkins'),
    levelBakery(pal),
    after('porch'),
    after('drifts'),
    after('lane'),
    more('woodpile'),
    after('pegboard'),
    after('racks'),
    more('ovens'),
    buildShaft(pal, SHAFTS.find((x) => x.file === 'chute')!),
    after('drying'),
    levelOtherside(pal),
    after('homeward'),
    after('loftback'),
    after('roofset'),
    more('parapet'),
    levelMoonrise(pal),
  ];
  return { pal, levels };
}
