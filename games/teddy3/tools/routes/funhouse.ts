// The bot's way through funhouse.ts (the level's own comment says what happens there): it
// waits at each edge for the next run of boards to come back, and steps on as they do.
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { CTR } from '../../src/ids';
import { FUNHOUSE } from '../../src/levels/funhouse';
import { funhouseTiles } from '../../src/levels/funhouseTiles';

const ids = funhouseTiles();
/** What a family's boards show now (the map block they started as, animated). */
const shows = (fam: 'red' | 'blue', stage: string) => (s: Sim) => s.w.blkmap[ids.id(fam === 'red' ? 'redOn' : 'blueWait')] === ids.id(`${fam}${stage}`);
// (the stairs' boards are a chain of their own, always in step with these)
/** Waits for `fam`'s boards to come back (their bright outline), then for them to be solid. */
const onBeat = (fam: 'red' | 'blue'): Order[] => [
  { until: `${fam} boards coming back`, maxTicks: 60, check: shows(fam, 'Coming') },
  { until: `${fam} boards there`, maxTicks: 10, check: shows(fam, 'On') },
];

const F = FUNHOUSE;
export const route: Order[] = [
  { walk: F.teach[0] - 1 },
  ...onBeat('red'),
  { walk: F.teach[1] + 1, grab: false },
  { walk: F.jack1 - 2 },
  { face: 'right' },
  { trick: 'space', after: 12 },
  { walk: F.runs[0][0] - 1 },
  ...F.runs.flatMap(([, b, fam]): Order[] => [...onBeat(fam), { walk: b + 1, grab: false }]),
  { walk: F.jack2 - 2 },
  { face: 'right' },
  { trick: 'space', after: 12 },
  { walk: F.barrel[0] - 1 },
  ...onBeat('red'),
  { walk: F.barrel[1] + 3, grab: false },
  { walk: F.stairs[0][0] - 3 },
  { walk: F.stairs[0][0] - 1 },
  ...F.stairs.flatMap(([x, y, fam]): Order[] => [
    ...onBeat(fam),
    { trick: 'e', hold: 4, after: 10 },
    { until: `on the step at ${x}`, maxTicks: 20, check: (s) => s.pos.bx === x && s.pos.by === y - 1 && s.pos.y % 20 === 0 },
  ]),
  { walk: F.horns, grab: false },
  { trick: 'f', after: 8 },
  { until: 'has the horns', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  { walk: F.balcony[1] + 1 },
  { until: 'down off the balcony', maxTicks: 30, check: (s) => s.pos.by === 39 },
  { walk: F.jack3 - 2 },
  { face: 'right' },
  { trick: 'space', after: 12 },
  { walk: F.car + 1 },
];
