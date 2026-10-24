// The bot's way through each level (also the source of the title demo).
import type { Order } from './bot';
import type { Sim } from '../../kit/sceneSim';
import { CTR } from '../src/ids';
import { GARAGE } from '../src/levels/garage';
import { MAPLE } from '../src/levels/maple';
import { PARK } from '../src/levels/park';

/** The car's charge (counters read one more than they hold). */
const charge = (s: Sim) => s.w.ci.meter[CTR.charge] - 1;

/** Is monster `name` at block (x, y), right on the block? */
const at = (s: Sim, name: string, x: number, y: number) =>
  s.w.mm.some((m, i) => s.scene.names?.[m.monnum] === name && s.w.mi[i].curx[0] === x && s.w.mi[i].cury[0] === y && s.w.mi[i].cury[1] === 0);
/** From the step beside it, walks onto see-saw end `name` at column x when it comes level. */
const board = (name: string, x: number): Order[] => [
  { until: `${name} at ${x} is level`, maxTicks: 160, check: (s) => at(s, name, x, 38) },
  { walk: x, maxTicks: 20 },
];

/** A long hop to column x: E (up and right), then Right while coming down. */
const leap = (x: number, hold = 6): Order[] => [
  { trick: 'e', hold, after: 0 },
  { walk: x, maxTicks: 16, grab: false },
];

export const ROUTES: Record<string, Order[]> = {
  garage: [
    { walk: 3 },
    { trick: 's', after: 30 },
    { until: 'the wobble ball lands', maxTicks: 40, check: (s) => s.monsters('wobble').length > 0 },
    { walk: 5 },
    { until: 'the mouse comes near', maxTicks: 80, check: (s) => s.monsters('mouse').some((m) => m.x <= 7) },
    { trick: 'space', after: 20 },
    { walk: GARAGE.btnDoor - 1 },
    { face: 'right' },
    { trick: 'five', after: 20 },
    { walk: 16 },
    { trick: 'space', after: 20 },
    { walk: GARAGE.bench - 1 },
    { hop: 8, dir: 'right', dirFor: 6 },
    { walk: GARAGE.btnCab - 1 },
    { face: 'right' },
    { trick: 'five', after: 24 },
    { walk: GARAGE.cab },
    { trick: 'f', after: 8 },
    { until: 'has the keys', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
    { hop: 7, dir: 'right', dirFor: 9 },
    { walk: 32 },
    { trick: 'e', hold: 6, after: 10 },
    { trick: 'e', hold: 6, after: 10 },
    { walk: 41 },
    { walk: GARAGE.btnGarage - 1, grab: false },
    { face: 'right' },
    { trick: 'five', after: 2 },
    { walk: GARAGE.door + 2 },
    { walk: GARAGE.car + 1 },
  ],
  maple: [
    { until: 'charged', maxTicks: 60, check: (s) => charge(s) >= 1 },
    { walk: MAPLE.geese - 3, grab: false },
    { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= MAPLE.geese) },
    { trick: 'space', after: 16 },
    { walk: MAPLE.hump - 1 },
    { trick: 'e', hold: 4, after: 12 },
    { walk: MAPLE.pothole + 3 },
    { walk: MAPLE.hill1 + 2 },
    { walk: MAPLE.charger2 },
    { until: 'charged on the hill', maxTicks: 60, check: (s) => charge(s) >= 1 },
    { walk: MAPLE.geese2 - 3 },
    { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= MAPLE.geese2) },
    { trick: 'space', after: 16 },
    { walk: MAPLE.charger3 },
    { until: 'two charges', maxTicks: 80, check: (s) => charge(s) >= 2 },
    { walk: MAPLE.exit },
  ],
  park: [
    { walk: PARK.sawA - 2 },
    { trick: 'e', hold: 4, after: 8 },
    ...board('sawDown', PARK.sawA),
    { until: 'up at the hedge', maxTicks: 80, check: (s) => s.pos.by <= 34 },
    { walk: PARK.bank },
    ...board('sawUp', PARK.sawB),
    { until: 'up over the pond', maxTicks: 80, check: (s) => s.pos.by <= 34 && at(s, 'sawUp', PARK.sawB, 35) },
    ...leap(PARK.sawC),
    { until: 'up at the high bank', maxTicks: 80, check: (s) => s.pos.by <= 34 && at(s, 'sawUp', PARK.sawC, 35) },
    ...leap(PARK.highBank),
    { walk: PARK.superSaw - 2 },
    { wait: 10 },
    { trick: 'e', hold: 4, after: 8 },
    ...board('sawSuper', PARK.superSaw),
    { until: 'up in the oak', maxTicks: 120, check: (s) => s.pos.by <= 31 },
    { walk: PARK.branch },
    { until: 'the squirrel comes near', maxTicks: 80, check: (s) => s.monsters('squirrel').some((m) => m.x <= PARK.branch + 2) },
    { trick: 'space', after: 16 },
    { walk: PARK.streamers },
    { trick: 'f', after: 8 },
    { until: 'has the streamers', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
    { walk: 52 },
    { walk: PARK.car + 1, dodge: ['disc'] },
  ],
};
