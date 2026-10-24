// Level 4: The River, late morning. Doc Leo's rubber chicken went in the river (Gwinn had it
// last night, on the way to the wagon) and the current has carried it down to the pool below
// the old mill. Teddy hops the stepping stones over the rapids (fall in and the water carries
// him down to the mill), sits pretty for the miller, who starts the grain hoist up to the
// loft, crosses the high bank, and swims out into the pool for the chicken going round the
// eddy. THE CHEZ is charging by the boat ramp.
//
// The blocks are in level4Tiles.ts, the monsters in level4Beasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, bandRow, riverTiles, skyAt } from './level4Tiles';
import { riverBeasts } from './level4Beasts';

export function river(): Level {
  const bs = riverTiles();
  const beasts = riverBeasts();
  bs.chez(
    () => bs.pic('sky3'),
    'chicken',
    bs.pic(skyAt(37)),
    () => bs.pic('sky3'),
  );
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [5, 27],
    [26, 29],
    [48, 26],
    [70, 28],
    [90, 27],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'grass');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 56, 'deep');
  for (let x = 0; x < 100; x++) m.set(x, 39, x % 4 === 1 ? 'flower' : 'tuft');

  // The start: the bank, a tree, a picnic table, a sign.
  const tree = (x: number, ground = G) => {
    for (let y = ground - 5; y < ground; y++) m.set(x, y, bandRow(y) === 3 ? 'trunk' : `trunk${bandRow(y)}`);
    for (let dy = 0; dy < 3; dy++)
      for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + dy < 4) m.set(x + dx, ground - 8 + dy, `leaf${bandRow(ground - 8 + dy)}`);
  };
  tree(2);
  m.set(7, 39, 'picnic');
  m.set(10, 39, 'signSwim');
  m.set(8, 39, 'signHopE');
  // The rapids, x 12..29: stepping stones; the waterwheel at the end.
  for (let x = 12; x < 30; x++) {
    m.set(x, 39, 'sky3');
    m.set(x, G, 'rapid0')
      .set(x, G + 1, 'rapidDeep0')
      .set(x, G + 2, 'rapidDeep0')
      .set(x, G + 3, 'bed');
  }
  for (const x of [14, 17, 20, 23, 26, 29]) m.set(x, G, 'stone');
  for (let bx = 0; bx < 2; bx++) for (let by = 0; by < 3; by++) m.set(27 + bx, 38 + by, `wheel${bx}${by}_0`);
  // The mill, x 31..44.
  m.rect(31, 31, 14, 9, 'millIn');
  m.rect(31, 39, 1, 1, 'millIn');
  m.set(30, 39, 'signMill');
  m.rect(44, 31, 1, 9, 'millWallHi');
  m.rect(44, 34, 1, 6, 'millWall');
  m.set(44, 32, 'millDoor');
  m.set(30, 30, 'millRoofL');
  m.rect(31, 30, 14, 1, 'millRoof');
  m.set(45, 30, 'millRoofR');
  m.set(31, 29, 'millRoofL');
  m.rect(32, 29, 12, 1, 'millRoof');
  m.set(44, 29, 'millRoofR');
  m.rect(31, 33, 13, 1, 'loft');
  m.set(38, 33, 'shaft');
  for (let y = 34; y < 40; y++) m.set(38, y, 'shaft');
  m.set(34, 38, 'millerTop').set(34, 39, 'millerBot');
  m.set(32, 39, 'millstone');
  m.set(41, 39, 'sack').set(42, 39, 'sack');
  m.set(33, 32, 'sackLoft').set(40, 32, 'sackLoft');
  // The high bank, x 45..56, with a fisherman casting into the pool.
  m.rect(45, 35, 12, 1, 'cliffTop');
  m.rect(45, 36, 12, 8, 'cliff');
  tree(49, 35);
  m.set(55, 33, 'fisherTop').set(55, 34, 'fisherBot');
  for (let y = 35; y < 38; y++) m.set(58, y, y < 38 ? 'line' : 'lineLow');
  // The pool, x 57..72.
  for (let x = 57; x < 73; x++) {
    m.set(x, 39, 'sky3');
    m.set(x, G, 'pool0');
    for (let y = G + 1; y < G + 4; y++) m.set(x, y, 'poolDeep0');
    m.set(x, G + 4, 'bed');
  }
  // The beach, the charging post, THE CHEZ and Doc Leo; the woods beyond.
  m.rect(73, G, 14, 1, 'sand');
  const car = 79;
  m.set(car - 1, 39, 'charger');
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant')
    .set(car + 3, 38, 'leoHead')
    .set(car + 3, 39, 'leoBody');
  m.rect(87, 30, 13, 10, 'hedgeWall');
  m.rect(87, 29, 13, 1, 'hedgeTop');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');

  // Monsters.
  m.mon(35, 37, 'askSit');
  m.mon(38, 39, 'hoistIdle');
  m.mon(58, 38, 'hook');
  m.mon(60, 39, 'duck');
  m.mon(68, 39, 'duck');
  m.mon(63, 40, 'chicken');
  m.mon(20, 41, 'fish');
  m.mon(42, 32, 'scentPoodle');
  m.mon(51, 34, 'scentBone');
  for (const [x, y] of [
    [17, 36],
    [36, 31],
    [70, 36],
  ])
    m.mon(x, y, 'poodle');
  const treats: [number, number][] = [
    [5, 39],
    [8, 38],
    [14, 39],
    [17, 39],
    [20, 39],
    [23, 39],
    [26, 39],
    [33, 39],
    [36, 39],
    [40, 39],
    [32, 32],
    [35, 32],
    [37, 32],
    [42, 32],
    [46, 34],
    [48, 34],
    [53, 34],
    [61, 38],
    [64, 38],
    [67, 38],
    [74, 39],
    [76, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 4, 39);
  m.mark('exit', car, 39);
  return {
    file: 'river',
    hero: 'teddy',
    title: 'The River',
    time: 'noon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [28, 35],
    pose: [35, 39, 'frontBeg'],
  };
}
