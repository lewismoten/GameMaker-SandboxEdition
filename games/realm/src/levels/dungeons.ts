// The four dungeons, each on a map of its own: rock everywhere, rooms and passages carved out
// of it (their walls curve and run diagonally like everything else), pools, the things lying
// about, the foes, and at the far end the boss, two blocks square and solid, sitting in the
// mouth of the alcove where a piece of the Round Tuit waits.
import { Plan, type Pt } from './plan';
import type { MonBook } from '../characters/monbook';

export interface DungeonPlan {
  plan: Plan;
  /** Pip's first block (just inside the stairs). */
  start: Pt;
  /** The stairs out. */
  exits: Pt[];
  /** The piece's block (a link there plays the find). */
  piece: Pt;
}

function rock(p: Plan): void {
  p.cm.paint('wall', () => 1);
}

const room = (p: Plan, pts: Pt[]) => p.cm.unregion('wall', pts);
const hall = (p: Plan, pts: Pt[], r = 1) => p.cm.carve('wall', pts, r);
/** An octagonal room: x0..x1, y0..y1 with its corners cut by c. */
const oct = (p: Plan, x0: number, y0: number, x1: number, y1: number, c = 2) =>
  room(p, [
    [x0 + c, y0],
    [x1 - c, y0],
    [x1, y0 + c],
    [x1, y1 - c],
    [x1 - c, y1],
    [x0 + c, y1],
    [x0, y1 - c],
    [x0, y0 + c],
  ]);

/** The boss: four monsters in a 2x2 at (x, y), their names `${boss}TL`... */
function boss(p: Plan, mons: MonBook, name: string, x: number, y: number): void {
  p.npc(mons.n(`${name}TL`), [x, y]);
  p.npc(mons.n(`${name}TR`), [x + 1, y]);
  p.npc(mons.n(`${name}BL`), [x, y + 1]);
  p.npc(mons.n(`${name}BR`), [x + 1, y + 1]);
}

const foes = (p: Plan, mon: number, list: Pt[]) => list.forEach((at) => p.npc(mon, at));

// ================================================================ the Snooze Barrows
export function barrowsPlan(mons: MonBook): DungeonPlan {
  const p = new Plan('barrows', ['wall', 'pool']);
  rock(p);
  oct(p, 42, 72, 58, 84); // the way in
  hall(p, [[50, 72], [50, 64]]);
  oct(p, 36, 50, 64, 64, 3); // the Hall of Snores
  hall(p, [[36, 57], [28, 57], [28, 48]]);
  oct(p, 22, 38, 34, 48); // west: the foghorn
  hall(p, [[64, 57], [72, 57], [72, 48]]);
  oct(p, 66, 38, 78, 48); // east: the treasure
  hall(p, [[50, 50], [50, 44]]);
  oct(p, 38, 30, 62, 44, 3); // Sir Snoozalot's chamber
  hall(p, [[50, 30], [50, 26]]);
  // a bog in the hall, roots and bones
  p.cm.region('pool', [[45, 56], [55, 56], [55, 59], [45, 59]]);
  // the Royal Writ's seal on the door north
  p.put('writdoor', 49, 67);
  p.put('writdoor', 50, 67);
  p.put('stairs', 50, 83);
  p.put('torch', 44, 74);
  p.put('torch', 56, 74);
  // the snoring drafts: they blow you east across the hall
  for (const y of [53, 61]) p.row('pushE', 39, 61, y);
  p.put('foghorn', 25, 41);
  p.put('chest', 32, 40);
  p.put('heartpot', 23, 46);
  p.put('bigchest', 76, 40);
  p.row('spikes', 70, 74, 44);
  p.put('heartpot', 67, 46);
  p.put('rubble', 30, 46);
  p.put('rubble', 68, 40);
  for (const [x, y] of [[40, 34], [60, 34], [40, 41], [60, 41]] as Pt[]) p.put('pillar', x, y);
  p.put('vent', 45, 31);
  p.put('vent', 55, 31);
  p.put('piece1', 50, 26);
  foes(p, mons.n('bat'), [[40, 54], [58, 60], [45, 62], [70, 43]]);
  foes(p, mons.n('wight'), [[52, 54], [26, 44], [74, 45], [44, 38], [56, 38]]);
  foes(p, mons.n('slime'), [[46, 78], [30, 40]]);
  boss(p, mons, 'snoozalot', 49, 28);
  return { plan: p, start: [50, 81], exits: [[50, 83]], piece: [50, 26] };
}

// ================================================================ the Soggy Vaults
export function vaultsPlan(mons: MonBook): DungeonPlan {
  const p = new Plan('vaults', ['wall', 'pool']);
  rock(p);
  oct(p, 44, 16, 56, 26); // in from the pier
  hall(p, [[50, 26], [50, 32]]);
  oct(p, 34, 32, 66, 48, 3); // the flooded nave
  p.cm.region('pool', [[38, 38], [47, 38], [47, 44], [38, 44]]);
  p.cm.region('pool', [[53, 38], [62, 38], [62, 44], [53, 44]]);
  hall(p, [[34, 40], [26, 40], [26, 56]]);
  oct(p, 18, 56, 34, 70); // the west cistern, a current through it
  p.cm.region('pool', [[22, 62], [30, 62], [30, 66], [22, 66]]);
  hall(p, [[66, 40], [74, 40], [74, 56]]);
  oct(p, 66, 56, 82, 70); // the east cistern
  hall(p, [[34, 64], [42, 64], [42, 72], [50, 72]]);
  hall(p, [[66, 64], [58, 64], [58, 72], [50, 72]]);
  oct(p, 40, 72, 60, 86, 3); // the Kraken's pool
  p.cm.region('pool', [[43, 79], [47, 79], [47, 83], [43, 83]]);
  p.cm.region('pool', [[53, 79], [57, 79], [57, 83], [53, 83]]);
  hall(p, [[50, 86], [50, 90]]);
  p.put('stairs', 50, 17);
  p.put('torch', 46, 18);
  p.put('torch', 54, 18);
  // currents: the water runs south down the nave's middle and west through the east cistern
  p.col('pushS', 50, 33, 46);
  p.put('chest', 20, 58);
  p.put('heartpot', 32, 58);
  p.put('bigchest', 80, 68);
  p.put('heartpot', 68, 68);
  for (const [x, y] of [[36, 34], [64, 34], [36, 46], [64, 46], [42, 75], [58, 75]] as Pt[]) p.put('pillar', x, y);
  p.put('vent', 45, 85);
  p.put('vent', 55, 85);
  p.put('piece2', 50, 90);
  foes(p, mons.n('crab'), [[40, 35], [60, 35], [44, 46], [56, 47], [24, 59], [76, 62], [70, 66], [46, 76], [54, 76]]);
  foes(p, mons.n('eel'), [[42, 41], [58, 41], [26, 64]]);
  boss(p, mons, 'kraken', 49, 86);
  return { plan: p, start: [50, 19], exits: [[50, 17]], piece: [50, 90] };
}

// ================================================================ the Putoff Mines
export function minesPlan(mons: MonBook): DungeonPlan {
  const p = new Plan('mines', ['wall', 'pool']);
  rock(p);
  oct(p, 44, 74, 56, 84); // the adit
  hall(p, [[50, 74], [50, 66]]);
  oct(p, 30, 52, 70, 66, 3); // the great gallery, a lava seam down the middle
  p.cm.path('pool', [[33, 59], [46, 59]]);
  p.cm.path('pool', [[54, 59], [67, 59]]);
  hall(p, [[30, 56], [22, 56], [22, 40]]);
  oct(p, 14, 30, 30, 40); // the old workings: the Tome of Tomorrow
  p.cm.region('pool', [[18, 34], [22, 34], [22, 37], [18, 37]]);
  hall(p, [[70, 56], [78, 56], [78, 40]]);
  oct(p, 70, 30, 86, 40); // the timber stopes
  hall(p, [[50, 52], [50, 44]]);
  oct(p, 38, 26, 62, 44, 3); // Tick-Tock's engine room
  p.cm.region('pool', [[40, 37], [44, 37], [44, 41], [40, 41]]);
  p.cm.region('pool', [[56, 37], [60, 37], [60, 41], [56, 41]]);
  hall(p, [[50, 26], [50, 22]]);
  p.put('lampdoor', 49, 70);
  p.put('lampdoor', 50, 70);
  p.put('stairs', 50, 83);
  p.put('torch', 46, 76);
  p.put('torch', 54, 76);
  p.put('tome', 26, 32);
  p.put('chest', 16, 38);
  p.put('heartpot', 28, 38);
  p.put('bigchest', 84, 32);
  p.put('heartpot', 72, 38);
  for (let x = 72; x <= 84; x += 3) p.put('floor2', x, 35);
  p.row('spikes', 76, 80, 44);
  for (const [x, y] of [[40, 29], [60, 29], [32, 54], [68, 54], [32, 64], [68, 64]] as Pt[]) p.put('pillar', x, y);
  p.put('vent', 45, 27);
  p.put('vent', 55, 27);
  p.put('piece3', 50, 22);
  foes(p, mons.n('golem'), [[36, 55], [64, 55], [40, 63], [60, 63], [22, 34], [80, 36], [44, 32], [56, 32]]);
  foes(p, mons.n('bat'), [[48, 57], [52, 62], [18, 32], [82, 33]]);
  boss(p, mons, 'ticktock', 49, 24);
  return { plan: p, start: [50, 81], exits: [[50, 83]], piece: [50, 22] };
}

// ================================================================ Deadline Keep
export function keepPlan(mons: MonBook): DungeonPlan {
  const p = new Plan('keep', ['wall', 'pool']);
  rock(p);
  oct(p, 42, 76, 58, 86); // the gatehouse
  hall(p, [[50, 76], [50, 70]]);
  oct(p, 36, 56, 64, 70, 3); // the clock court
  p.cm.region('pool', [[40, 60], [45, 60], [45, 66], [40, 66]]);
  p.cm.region('pool', [[55, 60], [60, 60], [60, 66], [55, 66]]);
  hall(p, [[36, 63], [28, 63], [28, 48], [36, 48]]);
  hall(p, [[64, 63], [72, 63], [72, 48], [64, 48]]);
  oct(p, 36, 42, 64, 54, 3); // the Hall of Sockets
  hall(p, [[50, 42], [50, 36]], 1);
  oct(p, 38, 20, 62, 36, 3); // the throne of Lord Deadline
  hall(p, [[50, 20], [50, 15]]);
  // the three sockets across the way north: each opens for its piece
  p.put('socket1', 49, 39);
  p.put('socket2', 49, 38);
  p.put('socket3', 49, 37);
  p.put('socket1', 50, 39);
  p.put('socket2', 50, 38);
  p.put('socket3', 50, 37);
  p.put('stairs', 50, 85);
  for (const [x, y] of [[44, 78], [56, 78], [40, 44], [60, 44], [42, 22], [58, 22]] as Pt[]) p.put('torch', x, y);
  for (const [x, y] of [[38, 58], [62, 58], [38, 68], [62, 68], [44, 25], [56, 25], [44, 32], [56, 32]] as Pt[]) p.put('pillar', x, y);
  p.col('floor2', 50, 21, 34);
  p.col('floor2', 50, 43, 53);
  p.put('heartpot', 30, 50);
  p.put('heartpot', 70, 50);
  p.put('bigchest', 30, 60);
  p.put('chest', 70, 60);
  p.row('spikes', 46, 54, 72);
  p.put('vent', 45, 21);
  p.put('vent', 55, 21);
  p.put('tuit', 50, 15);
  foes(p, mons.n('goblin'), [[44, 58], [56, 58], [48, 66], [52, 68], [30, 55], [70, 55], [42, 46], [58, 46]]);
  foes(p, mons.n('tick'), [[46, 62], [54, 62], [40, 50], [60, 50], [44, 30], [56, 30]]);
  boss(p, mons, 'deadline', 49, 17);
  return { plan: p, start: [50, 83], exits: [[50, 85]], piece: [50, 15] };
}
