// The bot's way through course.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import { at, leap } from './helpers';
import type { Sim } from '../../../kit/sceneSim';
import { mapBlock, shownBlock } from '../../../../web/src/engine/world';
import { COURSE } from '../../src/levels/course';
import { G } from '../../src/levels/courseTiles';
import { WHEEL } from '../../src/levels/millBeasts';
import { board, level } from './mill';

/** Has the board at column x just come back (solid, with most of its time still to go)? */
const fresh = (s: Sim, x: number) => shownBlock(s.w, mapBlock(s.w, x, 40)).solid !== 0 && s.w.nxtchg[mapBlock(s.w, x, 40)] - s.w.clock > 16;

export const route: Order[] = [
  { walk: 4 },
  { until: 'a mouse comes near', maxTicks: 80, check: (s) => s.monsters('mouse').some((m) => m.x <= 6) },
  { trick: 'space', after: 16 },
  { walk: COURSE.btnDoor - 1 },
  { face: 'right' },
  { trick: 'five', after: 20 },
  { walk: COURSE.plug },
  { trick: 'down', after: 20 },
  { walk: COURSE.up },
  { hop: 6, after: 6 },
  { walk: COURSE.step - 1 },
  { trick: 'e', hold: 4, after: 8 },
  { until: 'the see-saw is level', maxTicks: 160, check: (s) => at(s, 'saw', COURSE.saw, 38) },
  { walk: COURSE.saw, maxTicks: 20 },
  { until: 'up on the see-saw', maxTicks: 80, check: (s) => s.pos.by <= 34 && at(s, 'saw', COURSE.saw, 35) },
  ...leap(COURSE.crates),
  { walk: COURSE.crates + 1 },
  { walk: COURSE.beltEnd - 1, grab: false },
  { trick: 'e', hold: 10, after: 0 },
  { walk: COURSE.landing + 1, maxTicks: 30, grab: false },
  { walk: COURSE.pit0 - 1 },
  { until: 'the red boards are back', maxTicks: 120, check: (s) => fresh(s, COURSE.pit0) },
  { walk: COURSE.pit0 + 2, grab: false },
  { until: 'the blue boards are back', maxTicks: 120, check: (s) => fresh(s, COURSE.pit0 + 3) },
  { walk: COURSE.pit0 + 5, grab: false },
  { until: 'the red boards are back again', maxTicks: 120, check: (s) => fresh(s, COURSE.pit1) },
  { walk: COURSE.pit1 + 1, grab: false },
  { walk: COURSE.sit - 1, dodge: ['pie'] },
  { trick: 'sit', after: 30 },
  { walk: COURSE.turn - 1 },
  { trick: 'spin', after: 30 },
  // the spotlight: wait out of its reach until it comes out of the wing, then go to meet it,
  // play dead as it passes over, and go on past the wing while it is still out
  { walk: COURSE.wing - 5 },
  { until: 'the light comes out', maxTicks: 100, check: (s) => s.monsters('endS').some((m) => m.x < COURSE.wing) },
  { walk: COURSE.wheel - 1, dodge: ['endS'] },
  // the water wheel up to the crates, and down to the balloon pump
  ...board(COURSE.wheel, G),
  level(G - WHEEL.size),
  { walk: COURSE.ledge + 2 },
  { walk: COURSE.pump - 1 },
  { until: 'the pump is clear', maxTicks: 80, check: (s) => !s.monsters('pumpBalloon').some((m) => m.y >= COURSE.high) },
  { walk: COURSE.pump, maxTicks: 20 },
  { until: 'up on a balloon dog', maxTicks: 120, check: (s) => s.pos.by <= COURSE.high - 2 },
  { walk: COURSE.scent - 1 },
  { face: 'right' },
  { trick: 'space', after: 16 },
  { trick: 's', after: 30 },
  { until: 'the button is up', maxTicks: 60, check: (s) => s.monsters('btnFlap').length > 0 },
  { trick: 'five', after: 4 },
  { walk: COURSE.ring },
];
