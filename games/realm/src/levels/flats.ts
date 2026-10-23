// FLATS.MAP: the drive across the Dawdle Flats. The old causeway winds east from Someday
// Harbor's side to Far Putoff's, over tide channels on stone bridges, round reefs, and twice
// along low stretches the tide floods and drains again. Off the causeway the mud is fine for
// driving, if you don't mind the crabs.
import { Plan, type Pt } from './plan';
import type { MonBook } from '../characters/monbook';

export interface FlatsPlan {
  plan: Plan;
  west: Pt;
  east: Pt;
  /** The links' cells at each end. */
  westExit: Pt;
  eastExit: Pt;
}

export function flatsPlan(mons: MonBook): FlatsPlan {
  const p = new Plan('flats', ['water', 'rock', 'road']);
  // open sea north and south of the flats, and at each end beyond the causeway's heads
  p.cm.paint('water', (_x, y) => (y < 34 || y > 66 ? 1 : 0));
  p.cm.paint('water', (x) => (x < 6 || x > 93 ? 1 : 0));
  // tide channels running north-south across the flats
  p.cm.path('water', [
    [24, 34],
    [24, 40],
    [28, 44],
    [28, 52],
    [24, 56],
    [24, 66],
  ]);
  p.cm.path('water', [
    [52, 34],
    [52, 46],
    [48, 50],
    [48, 58],
    [52, 62],
    [52, 66],
  ]);
  p.cm.path('water', [
    [74, 34],
    [74, 42],
    [78, 46],
    [78, 66],
  ]);
  // tide pools
  p.cm.region('water', [
    [36, 38],
    [40, 38],
    [42, 40],
    [42, 42],
    [40, 44],
    [36, 44],
    [34, 42],
    [34, 40],
  ]);
  p.cm.region('water', [
    [60, 56],
    [64, 56],
    [66, 58],
    [66, 60],
    [64, 62],
    [60, 62],
    [58, 60],
    [58, 58],
  ]);
  // reefs
  p.cm.region('rock', [
    [14, 56],
    [18, 56],
    [20, 58],
    [20, 62],
    [16, 62],
    [14, 60],
  ]);
  p.cm.region('rock', [
    [42, 54],
    [44, 52],
    [46, 54],
    [46, 58],
    [42, 58],
  ]);
  p.cm.region('rock', [
    [62, 38],
    [68, 38],
    [68, 42],
    [64, 44],
    [62, 42],
  ]);
  p.cm.region('rock', [
    [84, 54],
    [88, 54],
    [90, 56],
    [90, 60],
    [86, 62],
    [84, 60],
  ]);
  // the causeway
  p.cm.path('road', [
    [8, 50],
    [16, 50],
    [20, 46],
    [32, 46],
    [36, 50],
    [40, 50],
    [42, 48],
    [56, 48],
    [60, 52],
    [70, 52],
    [74, 48],
    [82, 48],
    [86, 44],
    [91, 44],
  ]);
  // keep reefs off the water and the road
  const near = (l: string, x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (p.cm.in(l, x + dx, y + dy)) return true;
    return false;
  };
  p.cm.clear('rock', (x, y) => p.cm.in('rock', x, y) && (near('water', x, y) || near('road', x, y)));
  // the low stretches the tide covers
  // the two low bridges: the tide covers them now and then
  for (const [x, y] of [
    [27, 45],
    [28, 45],
    [27, 46],
    [28, 46],
    [77, 47],
    [78, 47],
    [77, 48],
    [78, 48],
  ] as Pt[])
    p.put('tideDry', x, y);
  p.put('charger', 39, 49);
  p.put('charger', 70, 50);
  p.put('sign', 11, 48);
  p.put('sign', 88, 42);
  for (const [x, y] of [
    [12, 40],
    [30, 58],
    [46, 40],
    [70, 62],
    [84, 38],
    [58, 40],
  ] as Pt[])
    p.put('weed', x, y);
  const crab = mons.n('crab');
  const slime = mons.n('slime');
  for (const at of [
    [18, 42],
    [34, 54],
    [46, 44],
    [56, 54],
    [68, 46],
    [80, 52],
    [86, 50],
    [30, 40],
  ] as Pt[])
    p.npc(crab, at);
  // the patrols: each starts just north of the causeway and sweeps four blocks south across it
  for (const at of [
    [25, 43],
    [49, 45],
    [84, 43],
  ] as Pt[])
    p.npc(mons.n('patrol'), at);
  for (const at of [
    [22, 60],
    [40, 60],
    [62, 46],
    [82, 40],
  ] as Pt[])
    p.npc(slime, at);
  return { plan: p, west: [10, 50], east: [89, 44], westExit: [7, 50], eastExit: [92, 44] };
}
