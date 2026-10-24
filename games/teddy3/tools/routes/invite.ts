// The bot's way through invite.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { CTR } from '../../src/ids';
import { INVITE } from '../../src/levels/invite';

/** RSVPs held (counters read one more than they hold). */
const rsvps = (s: Sim) => s.w.ci.meter[CTR.rsvps] - 1;
/** Pigeons still on the sidewalk between columns x0 and x1. */
const pigeons = (s: Sim, x0: number, x1: number) => [...s.monsters('pigeon'), ...s.monsters('pigeonShort')].some((m) => m.y === 39 && m.x >= x0 && m.x <= x1);
/** Is the doorbell at column x still unrung? */
const shut = (s: Sim, x: number) => s.monsters('bellDoor').some((m) => m.x === x);

/** BOOFs until the bell at column x rings (pigeons in the way use up a BOOF each). */
const ring = (x: number): Order[] => [
  { face: 'right' },
  { trick: 'space', after: 14 },
  { until: `the bell at ${x} rings`, maxTicks: 1, check: (s) => !shut(s, x) },
];

export const route: Order[] = [
  { walk: INVITE.crier - 3 },
  ...ring(INVITE.crier),
  { until: 'the Crier comes to the door', maxTicks: 40, check: (s) => s.monsters('yes').length > 0 },
  { walk: INVITE.crier },
  { until: 'has one RSVP', maxTicks: 10, check: (s) => rsvps(s) === 1 },
  { walk: 12 },
  { trick: 'space', after: 14 },
  { walk: 14, grab: false },
  { trick: 'space', after: 14 },
  { until: 'the pigeons are gone', maxTicks: 1, check: (s) => !pigeons(s, 13, 19) },
  { walk: INVITE.honker - 4 },
  ...ring(INVITE.honker),
  { until: 'Honker comes to the door', maxTicks: 40, check: (s) => s.monsters('yes').length > 0 },
  { walk: INVITE.honker },
  { until: 'has two RSVPs', maxTicks: 10, check: (s) => rsvps(s) === 2 },
  { walk: 27 },
  { trick: 'space', after: 14 },
  { walk: 30, grab: false },
  { trick: 'space', after: 14 },
  { until: 'the lawn pigeons are gone', maxTicks: 1, check: (s) => !pigeons(s, 27, 35) },
  { walk: INVITE.dig },
  { trick: 'down', after: 20 },
  { walk: INVITE.up },
  { walk: INVITE.up + 1 },
  { walk: INVITE.low - 1 },
  { hop: 6, dir: 'right', dirFor: 4 },
  { until: 'on the low ledge', maxTicks: 30, check: (s) => s.pos.by === 36 && s.pos.y % 20 === 0 },
  { walk: INVITE.low },
  { hop: 8 },
  { until: 'on the middle ledge', maxTicks: 30, check: (s) => s.pos.by === 33 && s.pos.y % 20 === 0 },
  { walk: INVITE.high - 1, grab: false },
  { hop: 8 },
  { until: 'on the high ledge', maxTicks: 30, check: (s) => s.pos.by === 30 && s.pos.y % 20 === 0 },
  { hop: 8 },
  { until: 'on the landing', maxTicks: 30, check: (s) => s.pos.by === 27 && s.pos.y % 20 === 0 },
  { face: 'right' },
  { trick: 'space', after: 14 },
  { trick: 'space', after: 14 },
  { until: 'the pigeon is gone and the bell rung', maxTicks: 1, check: (s) => !s.monsters('pigeonShort').length && !shut(s, INVITE.pratfall) },
  { until: 'Professor Pratfall comes to the door', maxTicks: 40, check: (s) => s.monsters('yes').length > 0 },
  { walk: INVITE.pratfall },
  { until: 'has three RSVPs', maxTicks: 10, check: (s) => rsvps(s) === 3 },
  { walk: INVITE.landing - 1, grab: false },
  { until: 'down in the alley', maxTicks: 40, check: (s) => s.pos.by === 39 && s.pos.y % 20 === 0 },
  { walk: INVITE.latch - 11, grab: false },
  { until: 'the goose comes near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= INVITE.latch - 6) },
  { trick: 'space', after: 14 },
  { walk: INVITE.seat },
];
