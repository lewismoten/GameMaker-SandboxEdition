// TOWN.MAP: Nowish in the west half, Laterburg in the east half, each walled in by hedges
// thick enough that you never see one from the other.
import { Plan, type Pt } from './plan';
import { TALK } from './script';
import type { MonBook } from '../characters/monbook';

export interface TownSpots {
  /** Where Pip arrives from the world. */
  arrive: Pt;
}

/** Hedges everywhere in a half except the town's own ground. */
export function hedgeAround(p: Plan, x0: number, x1: number, inside: Pt[]): void {
  p.cm.paint('hedge', (x) => (x >= x0 && x <= x1 ? 1 : 0), [x0, 0, x1, 99]);
  p.cm.unregion('hedge', inside);
}

const trees = (p: Plan, list: Pt[]) => list.forEach(([x, y], i) => p.put(i % 3 === 1 ? 'pine' : 'tree', x, y));
const flowers = (p: Plan, list: Pt[]) => list.forEach(([x, y]) => p.put('flowers', x, y));

export function townMap(mons: MonBook): { plan: Plan; nowish: TownSpots; laterburg: TownSpots } {
  const p = new Plan('town', ['street', 'hedge', 'wall']);
  const npc = (key: string) => mons.npc(key);

  // ================================================================ Nowish (x 0-49)
  hedgeAround(p, 0, 49, [
    [10, 7], [33, 7], [36, 10], [36, 31], [33, 34], [25, 34], [25, 40], [20, 40], [20, 34], [10, 34], [7, 31], [7, 10],
  ]);
  p.cm.path('street', [[22, 40], [22, 27], [19, 24], [19, 14], [15, 14], [15, 13]]);
  p.cm.path('street', [[19, 18], [26, 18], [29, 15], [29, 14]]);
  p.cm.path('street', [[22, 27], [14, 27], [14, 26]]);
  p.cm.path('street', [[22, 30], [30, 30]]);
  p.stamp('cottA', 14, 11, 2, 2); // Grandma Pim's
  p.stamp('cottC', 21, 9, 2, 2);
  p.stamp('cottB', 28, 12, 2, 2);
  p.stamp('cottA', 13, 24, 2, 2);
  p.stamp('cottC', 9, 17, 2, 2);
  p.stamp('pond', 14, 18, 2, 2);
  p.put('well', 18, 12);
  for (let y = 22; y <= 26; y++) p.row('crops', 26, 33, y);
  p.row('fenceH', 25, 34, 21);
  p.row('fenceH', 25, 34, 27);
  flowers(p, [[13, 13], [17, 13], [24, 11], [27, 14], [12, 21], [17, 21], [16, 28], [26, 32]]);
  trees(p, [[9, 9], [34, 9], [9, 29], [34, 31], [25, 8], [11, 14], [32, 18], [17, 32], [29, 32], [8, 23]]);
  p.put('barrels', 31, 14);
  p.put('barrels', 23, 12);
  p.npc(npc('grandma'), [13, 13], TALK.gran, [13, 14]);
  p.npc(npc('docleo'), [16, 21], TALK.leo1, [16, 22]);
  p.npc(npc('farmer'), [24, 24], TALK.hodge, [23, 24]);
  // Teenage Lewie, from Snowbound, with his shovel by the turnip field (Hodge tells you about him)
  p.npc(npc('lewie'), [34, 24]);
  p.npc(npc('kid'), [26, 16]);
  p.put('signT', 23, 33);
  p.link([23, 33], 'nowsign', [0, 0]);
  p.spot.home = [15, 14];
  const nowish = { arrive: [22, 37] as Pt };

  // ================================================================ Laterburg (x 50-99)
  hedgeAround(p, 50, 99, [
    [60, 5], [88, 5], [91, 8], [91, 60], [88, 63], [78, 63], [78, 68], [71, 68], [71, 63], [61, 63], [58, 60], [58, 8],
  ]);
  // the Garden Court: a curtain wall with its gate open to the street. (The roof was always
  // going to go on next year.)
  p.cm.path('wall', [[72, 26], [61, 26], [61, 7], [88, 7], [88, 26], [77, 26]]);
  for (const [x, y] of [[60, 6], [87, 6], [60, 25], [87, 25]] as Pt[]) p.stamp('ctower', x, y, 2, 2, true);
  p.stamp('throne', 74, 9, 1, 2, true);
  p.put('carpetTop', 74, 11);
  p.col('carpet', 74, 12, 25);
  p.put('ped1', 67, 11);
  p.put('ped2', 69, 11);
  p.put('ped3', 71, 11);
  p.put('signT', 69, 13);
  p.stamp('kennel', 82, 9, 2, 2);
  p.put('kgate', 83, 11);
  p.cm.path('hedge', [[64, 17], [71, 17]]);
  p.cm.path('hedge', [[78, 17], [85, 17]]);
  p.cm.path('hedge', [[64, 21], [71, 21]]);
  p.cm.path('hedge', [[78, 21], [85, 21]]);
  flowers(p, [[64, 19], [66, 19], [68, 19], [70, 19], [79, 19], [81, 19], [83, 19], [85, 19], [72, 14], [76, 14], [64, 24], [85, 24]]);
  trees(p, [[63, 9], [86, 13], [63, 14], [79, 13]]);
  // the main street, two blocks wide; the market square; the side streets
  for (const x of [74, 75]) p.cm.path('street', [[x, 27], [x, 68]]);
  p.cm.region('street', [[64, 34], [85, 34], [85, 43], [64, 43]]);
  p.cm.path('street', [[64, 39], [61, 39], [61, 48]]);
  p.cm.path('street', [[85, 39], [87, 39], [87, 48]]);
  p.cm.path('street', [[74, 53], [65, 53], [65, 58]]);
  p.cm.path('street', [[75, 53], [84, 53], [84, 58]]);
  p.stamp('fountain', 74, 37, 2, 2);
  // the market: Brokk's swords, Mother Tansy's tonics
  p.stamp('stallR', 66, 31, 2, 1, true);
  p.put('sword', 66, 32);
  p.put('counter', 67, 32);
  p.stamp('stallG', 81, 31, 2, 1, true);
  p.put('tonic', 81, 32);
  p.put('tonic', 82, 32);
  p.put('barrels', 65, 32);
  p.put('barrels', 84, 32);
  // the Procrastinating Pony and the Royal Library
  p.stamp('inn', 60, 45, 3, 3);
  p.put('bed', 59, 48);
  p.stamp('library', 86, 45, 3, 3);
  p.put('lgate', 87, 48);
  for (const [k, x, y] of [
    ['cottA', 64, 28], ['cottB', 84, 28], ['cottC', 66, 46], ['cottB', 80, 46], ['cottA', 59, 55], ['cottC', 67, 58], ['cottB', 81, 58], ['cottA', 88, 55], ['cottC', 70, 47], ['cottA', 77, 47],
  ] as [string, number, number][])
    p.stamp(k, x, y, 2, 2);
  trees(p, [[59, 29], [90, 29], [59, 37], [90, 36], [63, 51], [86, 51], [72, 60], [78, 59], [60, 61], [89, 61]]);
  flowers(p, [[70, 44], [79, 44], [62, 37], [88, 42], [69, 61], [80, 62]]);
  // the people of Laterburg
  p.npc(npc('king'), [74, 10], TALK.king, [74, 12]);
  p.npc(npc('kennel'), [81, 12], TALK.kennel, [81, 13]);
  p.npc(npc('guard'), [72, 27]);
  p.npc(npc('guard'), [77, 27]);
  p.npc(npc('smith'), [68, 32], TALK.smith, [68, 33]);
  p.npc(npc('shopkeep'), [83, 32]);
  p.npc(npc('barkeep'), [62, 48], TALK.barkeep, [62, 49]);
  p.npc(npc('librarian'), [85, 48], TALK.librar, [85, 49]);
  // Mystery Robot Joe, from Keep It Brief!, by the library door (Ms. Pagely tells you about him)
  p.npc(npc('joe'), [89, 49]);
  p.npc(npc('docleo'), [77, 41], TALK.leo2, [77, 42]);
  p.npc(npc('guard'), [72, 62], TALK.guard, [72, 61]);
  p.npc(npc('kid'), [70, 41]);
  p.link([69, 13], 'tuitsign', [0, 0]);
  // through the kennel gate and the library's rope: the rewards
  p.link([83, 10], 'kenrew', [0, 0]);
  p.link([87, 47], 'librew', [0, 0]);
  p.spot.king = [74, 10];
  const laterburg = { arrive: [74, 65] as Pt };
  // every talking npc's spot is a link to their talk
  p.links.push(...p.npcs.filter((n) => n.talk).map((n) => ({ from: n.at, to: n.talk!.id, at: [0, 0] as Pt })));
  return { plan: p, nowish, laterburg };
}
