// Level 13: Firefly Meadow, at night, at the foot of Lookout Hill (the Big Top glows far up
// the hill). The breather before the last stretch: short and gentle, with lots of treats.
// Doc Leo wants a paper lantern for the Big Top, and it's somewhere out in the dark. The new
// idea is the firefly: sleepy ones doze in the grass, and a sniff (S) wakes one. It glows
// along its own way and off into the sky, and the deep dark melts wherever it goes (Teddy
// won't walk into the dark, and nothing of his can chase it off). Teach: one firefly lights
// the arch through a tall hedge. Test: follow the light: a firefly lights the next hedge and
// sails off over the brook (hop the stepping stones; fall in and it floats Teddy back), and
// another lights the hedge beyond. Twist: the last firefly dozes up in the old oak; climb the
// branches, and it swoops down across the meadow into the old tunnel through Lookout Hill,
// where the lantern is. Optional: higher in the oak, a raccoon paces a branch with a balloon
// dog and treats behind it. Then through the tunnel and out to THE CHEZ by the road.
//
// The blocks are in meadowTiles.ts, the monsters in meadowBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, HEDGE, meadowTiles } from './meadowTiles';
import { meadowBeasts } from './meadowBeasts';
import { bandAt } from './common';
import { meadowSong } from '../sound/meadowSong';

/** Where things are, for the bot's route. */
export const MEADOW = {
  start: 3,
  /** Each firefly's spot (x, row) and the hedge (its left column) or tunnel it lights. */
  sleepA: [9, 39],
  hedgeA: 11,
  sleepB: [18, 39],
  hedgeB: 20,
  /** The brook: [first, last] columns, and its stepping stones. */
  brook: [23, 28] as [number, number],
  stones: [24, 25, 27],
  sleepC: [31, 39],
  hedgeC: 33,
  /** The old oak's trunk and its branches: [x0, x1, row]. */
  trunk: 41,
  branches: [
    [38, 40, 38],
    [41, 43, 36],
    [39, 41, 34],
  ] as [number, number, number][],
  /** The high branch (the optional detour). */
  high: [42, 46, 32] as [number, number, number],
  sleepD: [38, 33],
  /** Lookout Hill and the tunnel through it. */
  hill: [50, 57] as [number, number],
  lantern: 54,
  car: 62,
};

export function meadow(): Level {
  const bs = meadowTiles();
  const beasts = meadowBeasts();
  bs.chez(
    (_bx, by) => (by ? bs.pic('lawn') : bs.pic('far')),
    'lantern',
    bs.pic('farTop'),
    (by) => (by ? bs.pic('lawn') : bs.pic('far')),
  );
  const M = MEADOW;
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandAt(y, G)}`);
  for (const [x, y] of [
    [3, 22],
    [14, 25],
    [19, 21],
    [27, 27],
    [33, 23],
    [47, 24],
    [52, 29],
    [58, 22],
    [66, 26],
    [70, 21],
  ])
    m.set(x, y, `star${bandAt(y, G) ? 1 : 0}`);
  for (let bx = 0; bx < 2; bx++) for (let by = 0; by < 2; by++) m.set(8 + bx, 24 + by, `moon${bx}${by}`);
  m.rect(0, 37, 100, 1, 'farTop');
  m.rect(0, 38, 100, 1, 'far');
  m.rect(0, 39, 100, 1, 'lawn');
  m.rect(0, G, 100, 1, 'grass');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');
  for (const x of [2, 7, 16, 30, 46, 60, 67]) m.set(x, 39, 'lawnFlower');
  // the meadow's hedges close it off at both ends (the map wraps around)
  m.rect(0, 30, 1, 10, 'edge');
  m.set(0, 29, 'edgeTop');
  m.rect(72, 30, 28, 10, 'edge');
  m.rect(72, 29, 28, 1, 'edgeTop');

  /** A tall hedge two wide, with the dark in its arch. */
  const hedge = (x: number) => {
    for (const hx of [x, x + 1]) {
      m.set(hx, HEDGE, 'hedgeTop');
      for (let y = HEDGE + 1; y < 39; y++) m.set(hx, y, 'hedge');
      m.set(hx, 39, 'arch');
    }
    m.mon(x, 39, 'dark');
  };

  // Teach: one firefly, one hedge.
  m.set(4, 39, 'signSniffL').set(5, 39, 'signSniffR');
  m.mon(M.sleepA[0], M.sleepA[1], 'sleepA');
  hedge(M.hedgeA);

  // Test: follow the light, over the brook to the next hedge.
  m.set(14, 39, 'signFollowL').set(15, 39, 'signFollowR');
  m.mon(M.sleepB[0], M.sleepB[1], 'sleepB');
  hedge(M.hedgeB);
  const [w0, w1] = M.brook;
  for (let x = w0; x <= w1; x++) {
    const stone = M.stones.includes(x);
    m.set(x, G, stone ? 'stone' : 'brookTop')
      .set(x, G + 1, stone ? 'stone' : 'brook')
      .set(x, G + 2, 'brookBed');
  }
  m.mon(M.sleepC[0], M.sleepC[1], 'sleepC');
  hedge(M.hedgeC);

  // Twist: the old oak, its branches, the firefly up in it.
  m.set(35, 39, 'signUpL').set(36, 39, 'signUpR');
  for (let x = 37; x <= 46; x++) for (let y = 27; y <= 31; y++) m.set(x, y, `leaf${bandAt(y, G)}`);
  for (const [x, y] of [
    [37, 27],
    [46, 27],
    [37, 31],
  ])
    m.set(x, y, `sky${bandAt(y, G)}`);
  for (let y = 32; y < 40; y++) m.set(M.trunk, y, y < 37 ? `trunk${bandAt(y, G)}` : y === 37 ? 'trunkFarTop' : y === 38 ? 'trunkFar' : 'trunkLawn');
  for (const [x0, x1, y] of M.branches)
    for (let x = x0; x <= x1; x++) m.set(x, y, x === M.trunk ? 'branchTrunk' : y === 38 ? 'branchFar' : `branch${bandAt(y, G)}`);
  {
    const [x0, x1, y] = M.high;
    for (let x = x0; x <= x1; x++) m.set(x, y, `branch${bandAt(y, G)}`);
  }
  m.mon(M.sleepD[0], M.sleepD[1], 'sleepD');

  // Lookout Hill, the Big Top far up it, and the old tunnel through it with the lantern.
  const [h0, h1] = M.hill;
  for (let x = h0; x <= h1; x++) {
    m.set(x, HEDGE, 'hillTop');
    for (let y = HEDGE + 1; y < 39; y++) m.set(x, y, 'hill');
    m.set(x, 39, 'tunnel');
  }
  m.set(53, HEDGE - 1, 'bigTop00').set(54, HEDGE - 1, 'bigTop10');
  m.set(M.lantern, 39, 'lantern');
  m.mon(h0, 39, 'dark').mon(h0 + 1, 39, 'dark');

  // The road, THE CHEZ and Doc Leo.
  for (let x = h1 + 1; x < 72; x++) m.set(x, G, 'road');
  const car = M.car;
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant')
    .set(car + 3, 38, 'leoHead')
    .set(car + 3, 39, 'leoBody');

  // Monsters and treats.
  m.mon(43, 31, 'raccoon');
  m.mon(46, 31, 'poodle');
  const treats: [number, number][] = [
    [6, 39],
    [8, 39],
    [13, 39],
    [16, 39],
    [22, 39],
    [24, 38],
    [25, 38],
    [27, 38],
    [29, 39],
    [35, 39],
    [37, 39],
    [40, 37],
    [43, 35],
    [40, 33],
    [44, 31],
    [45, 31],
    [52, 39],
    [56, 39],
    [59, 39],
    [61, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', M.start, 39);
  m.mark('exit', car, 39);
  return {
    file: 'meadow',
    hero: 'teddy',
    title: 'Firefly Meadow',
    time: 'night',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [4, 35],
    pose: [8, 39, 'walk1'],
    song: meadowSong,
    card: ['A paper lantern for the Big', 'Top, out in the dark meadow.', 'NEW: SNIFF OUT FIREFLIES'],
  };
}
