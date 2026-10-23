// Level 2: Main Street, Founders' Day morning. From The Dog House at the end of Maple Street,
// past the barber, the bakery, the five and dime and the root beer fountain, to the Town
// Commons, where Gwinn's pink leash is tangled round the gazebo's weathervane. The Town
// Crier is asleep on his feet (ring his bell); the electric company's bucket truck is idle
// (ring for service, and its bucket rides up and down: the way to the gazebo roof). The
// bank, the charging station and THE CHEZ are past the Commons.
//
// The map wraps: walk left from Maple Street long enough and you come out behind the tall
// hedge at the far end of town, where Gwinn has a digging spot of her own. Dig it, and
// Teddy drops into her den (a scene of its own), where the felt egg sits on her loot.
//
// The blocks are in level2Tiles.ts, the monsters in level2Beasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import { G, bandRow, mainTiles, skyAt } from './level2Tiles';
import { mainBeasts } from './level2Beasts';

/** The street after the den: the egg taken, Gwinn's dirt dug out. */
function afterDen(m: LevelMap, egg: [number, number], plug: number): GameMap {
  const map = structuredClone(m.done());
  map.blocks[egg[1] * 100 + egg[0]] = m.bs.id('den');
  for (const p of map.monsters) if (p.monnum === plug) p.monnum = 64;
  reindexMonsters(map);
  return map;
}

export function main(): Level {
  const bs = mainTiles();
  const beasts = mainBeasts();
  bs.chez(() => bs.pic('sky3'), 'leash', bs.pic('sky3'), () => bs.pic('sky3'));
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [6, 28],
    [24, 26],
    [44, 29],
    [66, 27],
    [86, 28],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, (x) => (x < 10 || x > 92 ? 'grass' : x >= 45 && x <= 68 ? 'pave' : x % 2 ? 'walk' : 'walk2'));
  m.rect(10, G + 1, 83, 1, 'road');
  m.rect(10, G + 2, 83, 1, (x) => (x % 3 ? 'road' : 'roadLine'));
  m.rect(0, G + 1, 10, 2, 'deep');
  m.rect(93, G + 1, 7, 2, 'dirt');
  m.rect(0, G + 3, 100, 100 - G - 3, 'deep');

  // Maple Street's end: a tree, the picket fence, The Dog House, a lamp post.
  for (let x = 0; x < 10; x++) m.set(x, 39, 'lawn');
  m.set(0, 39, 'picket').set(2, 39, 'picket');
  m.set(1, 37, 'trunk').set(1, 38, 'trunk').set(1, 39, 'trunk');
  for (const [x, y] of [
    [0, 34],
    [1, 33],
    [2, 34],
    [0, 35],
    [1, 34],
    [1, 35],
    [2, 35],
    [0, 36],
    [2, 36],
  ])
    m.set(x, y, bandRow(y) === 1 ? 'leafHi' : 'leaf');
  m.set(4, 37, 'libRoofL').set(5, 37, 'libRoofR');
  m.set(4, 38, 'libBooks').set(5, 38, 'libDrawer');
  m.set(4, 39, 'libRocksL').set(5, 39, 'libRocksR');
  m.set(9, 38, 'lampTop').set(9, 39, 'lampPost');

  // Main Street: four shops, seven blocks each.
  const shops: [string, string, string][] = [
    ['sBarber', 'winBarber', 'awnBlue'],
    ['sBakery', 'winCakes', 'awnRed'],
    ['sDime', 'winToys', 'awnGreen'],
    ['sSoda', 'winFloats', 'awnRed'],
  ];
  shops.forEach(([sign, win, awn], i) => {
    const x0 = 12 + i * 7;
    m.rect(x0, 30, 7, 1, 'cornice');
    m.rect(x0, 31, 7, 9, 'brick');
    for (const x of [x0 + 1, x0 + 3, x0 + 5]) m.set(x, 32, 'brickWin');
    m.set(x0 + 2, 35, `${sign}L`).set(x0 + 3, 35, `${sign}R`);
    m.rect(x0 + 1, 37, 5, 1, awn);
    m.set(x0 + 1, 38, win).set(x0 + 2, 38, win).set(x0 + 3, 38, win);
    m.set(x0 + 5, 38, 'doorTop').set(x0 + 5, 39, 'doorBot');
  });
  m.set(12, 38, 'pole').set(12, 39, 'pole');
  // the alley, and Gwinn's handiwork: trash cans
  m.set(41, 39, 'can').set(43, 39, 'can');

  // The Town Commons.
  for (let x = 45; x <= 68; x++) m.set(x, 39, x % 4 === 0 ? 'beds2' : x % 3 === 0 ? 'beds' : 'lawn');
  for (const x of [45, 68]) m.set(x, 38, 'lampTop').set(x, 39, 'lampPost');
  for (let x = 46; x < 68; x++) m.set(x, 34, x % 2 ? 'bunting1' : 'bunting2');
  m.set(47, 38, 'crierTop').set(47, 39, 'crierBot');
  m.set(50, 39, 'bench');
  // the gazebo, x 53..59
  const gz = 53;
  m.rect(gz, 39, 7, 1, 'gzFloor');
  for (let x = gz; x < gz + 7; x++) {
    const post = (x - gz) % 3 === 0;
    m.set(x, 38, post ? 'gzPost' : 'gzRail');
    m.set(x, 37, post ? 'gzPostHi' : 'gzOpenHi');
    m.set(x, 36, 'gzEave');
  }
  m.set(gz, 35, 'gzRoofL35');
  m.rect(gz + 1, 35, 5, 1, 'gzRoof35');
  m.set(gz + 6, 35, 'gzRoofR35');
  m.set(gz + 1, 34, 'gzRoofL34');
  m.rect(gz + 2, 34, 3, 1, 'gzRoof34');
  m.set(gz + 5, 34, 'gzRoofR34');
  m.set(gz + 2, 33, 'gzRoofL33').set(gz + 3, 33, 'gzRoof33').set(gz + 4, 33, 'gzRoofR33');
  m.set(gz + 3, 32, 'gzPeak');
  m.set(gz + 3, 31, 'gzLeash');
  // the bucket truck, its bell, the idle bucket in front of it
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 2; by++) m.set(61 + bx, 38 + by, `truck${bx}${by}`);
  m.set(64, 39, 'signRing');

  // The bank, the charging station, THE CHEZ and Doc Leo.
  m.rect(69, 30, 7, 1, 'cornice');
  m.rect(69, 31, 7, 9, 'bankWall');
  for (const x of [70, 72, 74]) for (let y = 34; y < 40; y++) m.set(x, y, 'column');
  m.set(72, 32, 'clock');
  m.set(71, 31, 'sBankL').set(72, 31, 'sBankR');
  m.set(76, 38, 'evSign').set(77, 39, 'charger');
  const car = 78;
  m.set(car, 38, 'carRoofL').set(car + 1, 38, 'carRoofR').set(car, 39, 'carDoor').set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant').set(car + 3, 38, 'leoHead').set(car + 3, 39, 'leoBody');

  // The tall hedge at the end of town, and behind it (round the back of the map) Gwinn's spot.
  m.rect(84, 31, 9, 9, 'hedgeWall');
  m.rect(84, 30, 9, 1, 'hedgeTop');
  for (let x = 93; x < 100; x++) m.set(x, 39, 'garden');
  m.set(94, 39, 'boneSign');
  const stash = 97;
  m.set(stash, G, 'hole').set(stash, G + 1, 'holeDeep');

  // Her den, deep under the town: Teddy drops in through the hole, takes the egg, climbs out.
  const [rx, ry] = [30, 64];
  m.rect(rx - 2, ry - 2, 18, 10, 'denWall');
  m.rect(rx, ry, 14, 5, 'den');
  m.rect(rx, ry + 5, 14, 1, 'denFloor');
  m.set(rx + 3, ry, 'roots').set(rx + 8, ry, 'roots');
  m.set(rx + 6, ry + 4, 'loot1').set(rx + 8, ry + 4, 'loot2');
  const egg: [number, number] = [rx + 7, ry + 4];
  m.set(egg[0], egg[1], 'keepsake');
  for (let y = ry; y < ry + 5; y++) m.set(rx + 12, y, 'denUp');

  // Monsters.
  m.mon(48, 38, 'crierBell');
  m.mon(61, 38, 'truckBell');
  m.mon(60, 39, 'bucketIdle');
  for (const [x, y] of [
    [20, 39],
    [27, 36],
    [34, 39],
    [38, 36],
  ])
    m.mon(x, y, 'pigeon');
  m.mon(5, 39, 'scentPoodle');
  m.mon(66, 39, 'scentBone');
  m.mon(42, 39, 'scentTreat');
  m.mon(stash, G, 'plug');
  m.mon(95, G, 'buried');
  for (const [x, y] of [
    [14, 35],
    [gz + 1, 33],
    [73, 29],
  ])
    m.mon(x, y, 'poodle');
  const treats: [number, number][] = [
    [7, 39],
    [8, 39],
    [11, 39],
    [14, 36],
    [15, 36],
    [16, 36],
    [22, 39],
    [23, 39],
    [29, 36],
    [30, 36],
    [31, 36],
    [36, 39],
    [37, 39],
    [44, 39],
    [46, 39],
    [gz + 5, 33],
    [gz, 34],
    [gz + 1, 38],
    [gz + 2, 38],
    [gz + 4, 38],
    [gz + 5, 38],
    [65, 39],
    [67, 39],
    [70, 39],
    [72, 39],
    [74, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 7, 39);
  m.mark('exit', car, 39);
  return {
    file: 'main',
    hero: 'teddy',
    title: 'Main Street',
    time: 'noon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [46, 35],
    pose: [52, 39, 'frontReach'],
    egg: { x: egg[0], y: egg[1] },
    nook: {
      map: 'mainb.map',
      after: afterDen(m, egg, beasts.id('plug')),
      door: { x: stash, y: G + 1 },
      room: { x: rx + 1, y: ry + 4 },
      out: { x: rx + 12, y: ry + 4 },
      back: { x: 95, y: 39 },
      title: "Gwinn's Den",
      card: 'egg.lst',
    },
  };
}
