// PORT.MAP: Someday Harbor in the west half (a harbor town on the south sea, with the long pier
// out to the fog over the Soggy Vaults), Eventually Falls in the east half (a river town under a
// waterfall, a hermit's garden hidden behind it).
import { Plan, type Pt } from './plan';
import { TALK } from './script';
import { hedgeAround, type TownSpots } from './townMap';
import type { MonBook } from '../characters/monbook';

const trees = (p: Plan, list: Pt[]) => list.forEach(([x, y], i) => p.put(i % 3 === 1 ? 'pine' : 'tree', x, y));
const flowers = (p: Plan, list: Pt[]) => list.forEach(([x, y]) => p.put('flowers', x, y));

/** Keeps hedges a corner away from water so no block mixes the two. */
function hedgeOffWater(p: Plan): void {
  const near = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (p.cm.in('water', x + dx, y + dy)) return true;
    return false;
  };
  p.cm.clear('hedge', (x, y) => p.cm.in('hedge', x, y) && near(x, y));
}

export function portMap(mons: MonBook): { plan: Plan; harbor: TownSpots; falls: TownSpots } {
  const p = new Plan('port', ['street', 'hedge', 'water']);
  const npc = (key: string) => mons.npc(key);

  // ================================================================ Someday Harbor (x 0-49)
  hedgeAround(p, 0, 49, [
    [22, 0], [27, 0], [27, 5], [38, 5], [41, 8], [41, 36], [9, 36], [9, 8], [12, 5], [22, 5],
  ]);
  // the sea along the south, the quay, the long pier and the fishing pier
  p.cm.region('water', [[0, 37], [49, 37], [49, 62], [0, 62]]);
  p.cm.path('street', [[24, 0], [24, 33]]);
  p.cm.path('street', [[24, 12], [31, 12], [31, 14]]);
  p.cm.path('street', [[24, 20], [14, 20], [14, 30]]);
  p.cm.path('street', [[24, 26], [35, 26], [35, 31]]);
  p.cm.region('street', [[12, 31], [38, 31], [38, 34], [12, 34]]);
  hedgeOffWater(p);
  p.col('pier', 16, 36, 47);
  p.put('fog', 16, 48);
  p.put('pierEnd', 16, 49);
  p.col('pier', 30, 36, 40);
  p.stamp('boat', 31, 39, 2, 1, true);
  p.stamp('lighthouse', 10, 28, 1, 3);
  p.stamp('garage', 30, 9, 3, 2);
  p.put('chezgate', 31, 11);
  // the stalls: Lyra's reeds; tonics and a bed
  p.stamp('stallB', 12, 16, 2, 1, true);
  p.put('reeds', 12, 17);
  p.put('reeds', 13, 17);
  p.stamp('stallG', 34, 19, 2, 1, true);
  p.put('tonic', 34, 20);
  p.put('bed', 35, 20);
  for (const [k, x, y] of [
    ['cottB', 16, 7], ['cottC', 28, 15], ['cottB', 18, 23], ['cottA', 29, 21], ['cottC', 37, 12], ['cottB', 11, 10],
  ] as [string, number, number][])
    p.stamp(k, x, y, 2, 2);
  trees(p, [[10, 7], [39, 7], [39, 27], [20, 14], [28, 29], [11, 24]]);
  flowers(p, [[19, 9], [26, 9], [15, 25], [33, 23], [21, 29], [38, 17]]);
  p.put('barrels', 22, 32);
  p.put('barrels', 37, 33);
  p.npc(npc('harbor'), [17, 35], TALK.marlow, [17, 34]);
  // Will the playwright, visiting from Shakespeare in Sweatpants, at the end of the quay
  p.npc(npc('tinker'), [29, 12], TALK.volta, [29, 13]);
  p.npc(npc('fisher'), [30, 40], TALK.salt, [30, 39]);
  p.npc(npc('docleo'), [12, 32], TALK.leo3, [13, 32]);
  p.npc(npc('minstrel'), [14, 17], TALK.minstr, [14, 18]);
  p.npc(npc('shopkeep'), [36, 20]);
  p.npc(npc('kid'), [20, 27]);
  // Will the playwright, visiting from Shakespeare in Sweatpants, at the end of the quay (Lyra
  // tells you about him), and a tin heart in the grass by the lighthouse (100 points)
  p.npc(npc('poet'), [38, 32]);
  p.put('tinHeart', 10, 33);
  p.spot.vaults = [16, 49];
  p.spot.garage = [31, 10];
  const harbor = { arrive: [24, 3] as Pt };

  // ================================================================ Eventually Falls (x 50-99)
  hedgeAround(p, 50, 99, [
    [68, 2], [88, 2], [88, 8], [92, 12], [92, 56], [89, 59], [74, 59], [74, 66], [69, 66], [69, 59], [61, 59], [58, 56], [58, 12], [62, 8], [68, 8],
  ]);
  // the falls under the cliff, the river through town, Eventually Pond
  p.stamp('falls', 77, 8, 3, 3);
  p.cm.path('water', [[79, 11], [79, 26], [83, 30]]);
  p.cm.region('water', [[83, 28], [89, 28], [91, 30], [91, 38], [89, 40], [83, 40], [81, 38], [81, 30]]);
  hedgeOffWater(p);
  // the hermit's garden behind the falls: hedged in, reached only through the spray
  p.cm.unregion('hedge', [[70, 3], [86, 3], [86, 7], [70, 7]]);
  p.cm.path('hedge', [[69, 8], [76, 8]]);
  p.cm.path('hedge', [[81, 8], [87, 8]]);
  p.put('nest', 80, 5);
  p.put('eggstone', 82, 5);
  // the stone's note is in a nook only the stone opens onto
  for (const [x, y] of [[83, 4], [83, 6], [84, 5], [84, 4], [84, 6]] as Pt[]) p.put(x === 84 && y === 5 ? 'pine' : 'tree', x, y);
  p.put('flowers', 72, 4);
  p.put('flowers', 86, 5);
  p.put('tree', 71, 6);
  p.npc(npc('hermit'), [75, 4], TALK.hermit, [75, 5]);
  p.link([83, 5], 'eggnote', [0, 0]);
  // streets: the main street up from the south gate, a bridge east across the river
  p.cm.path('street', [[71, 66], [71, 14], [74, 11], [77, 11]]);
  p.cm.path('street', [[71, 22], [86, 22], [86, 26]]);
  p.cm.path('street', [[71, 44], [84, 44], [84, 48]]);
  p.cm.path('street', [[71, 34], [64, 34], [64, 40]]);
  p.stamp('tent', 84, 46, 2, 2);
  p.put('tentgate', 85, 48);
  p.stamp('stallG', 62, 27, 2, 1, true);
  p.put('lamp', 62, 28);
  p.put('feather', 63, 28);
  p.stamp('stallB', 62, 47, 2, 1, true);
  p.put('tonic', 62, 48);
  p.put('bed', 63, 48);
  for (const [k, x, y] of [
    ['cottA', 61, 14], ['cottB', 64, 19], ['cottC', 87, 15], ['cottA', 74, 26], ['cottB', 60, 37], ['cottC', 76, 38], ['cottA', 76, 50], ['cottB', 87, 52], ['cottC', 61, 52],
  ] as [string, number, number][])
    p.stamp(k, x, y, 2, 2);
  trees(p, [[60, 11], [68, 30], [90, 46], [66, 56], [80, 56], [88, 24], [60, 44]]);
  flowers(p, [[73, 17], [66, 24], [74, 31], [67, 43], [78, 47], [70, 54]]);
  p.npc(npc('foreman'), [73, 14], TALK.duff, [72, 14]);
  p.npc(npc('shopkeep'), [64, 28], TALK.hattie, [64, 29]);
  p.npc(npc('docleo'), [83, 49], TALK.leo4, [83, 50]);
  p.npc(npc('kid'), [68, 50]);
  p.link([85, 47], 'leorew', [0, 0]);
  p.spot.nest = [80, 5];
  const falls = { arrive: [71, 62] as Pt };
  p.links.push(...p.npcs.filter((n) => n.talk).map((n) => ({ from: n.at, to: n.talk!.id, at: [0, 0] as Pt })));
  return { plan: p, harbor, falls };
}
