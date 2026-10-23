// Level 6: The Corn Maze, afternoon, on the way into the Fair. Gwinn went through it last
// night after the corn dog smell and dropped a corn dog stick at its heart. Three tiers of
// paths between walls of corn: hay bale steps lead up a tier, holes drop down one (no way
// back up). Faint scents along the way: a sniff turns each one into Gwinn's paw prints,
// pointing the way she went. Out the far side is the Fair's parking lot, and THE CHEZ.
//
// The blocks are in level6Tiles.ts, the monsters in level6Beasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, mazeTiles, skyAt } from './level6Tiles';
import { mazeBeasts } from './level6Beasts';

export function maze(): Level {
  const bs = mazeTiles();
  const beasts = mazeBeasts();
  bs.chez(
    () => bs.pic('sky3'),
    'stick',
    bs.pic('sky3'),
    () => bs.pic('sky3'),
  );
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [4, 24],
    [30, 21],
    [58, 23],
    [80, 22],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, (x) => (x > 74 && x < 92 ? (x % 4 ? 'lot' : 'lotLine') : 'grass'));
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 56, 'deep');
  for (let x = 0; x < 10; x++) m.set(x, 39, 'tuft');

  // The maze, x 10..73, rows 26..39: corn, with the paths cut through it.
  const x0 = 10;
  const x1 = 73;
  m.rect(x0, 26, x1 - x0 + 1, 1, 'cornTop');
  m.rect(x0, 27, x1 - x0 + 1, 13, (x, y) => ((x + y) % 3 ? 'corn' : 'corn2'));
  const path = (a: number, b: number, floorRow: number, standRow: number) => {
    for (let x = a; x <= b; x++) {
      m.set(x, standRow, 'path').set(x, standRow - 1, 'path');
      if (floorRow < G) m.set(x, floorRow, 'floor');
    }
  };
  // tier A (Teddy walks on row 39), B (row 35), C (row 31)
  path(10, 30, G, 39);
  path(50, 73, G, 39);
  path(12, 44, 36, 35);
  path(46, 62, 36, 35);
  path(26, 60, 32, 31);
  // steps up, holes down
  m.set(22, 37, 'step');
  m.set(40, 33, 'step');
  m.rect(54, 32, 3, 2, 'drop');
  m.rect(59, 36, 3, 2, 'drop');
  m.set(27, 30, 'scareTop').set(27, 31, 'scareBot');
  m.set(15, 35, 'signLost');

  // Outside: the sign in, the parking lot, THE CHEZ, the Ferris wheel over the hedge.
  m.set(8, 39, 'signMaze');
  for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 4; by++) m.set(86 + bx, 32 + by, `wheel${bx}${by}`);
  m.set(76, 39, 'signFair');
  const car = 80;
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant')
    .set(car + 3, 38, 'leoHead')
    .set(car + 3, 39, 'leoBody');
  m.rect(92, 30, 8, 10, 'hedgeWall');
  m.rect(92, 29, 8, 1, 'hedgeTop');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');

  // Monsters.
  m.mon(21, 39, 'scent_up');
  m.mon(39, 35, 'scent_up');
  m.mon(42, 31, 'scent_left');
  m.mon(52, 31, 'scent_down');
  m.mon(57, 35, 'scent_down');
  m.mon(30, 31, 'scentStick');
  m.mon(29, 39, 'scentBone');
  m.mon(13, 35, 'scentPoodle');
  m.mon(13, 39, 'mouse');
  m.mon(31, 35, 'mouse');
  m.mon(64, 39, 'mouse');
  m.mon(30, 25, 'crow');
  m.mon(52, 24, 'crow');
  for (const [x, y] of [
    [44, 34],
    [59, 30],
  ])
    m.mon(x, y, 'poodle');
  const treats: [number, number][] = [
    [12, 39],
    [16, 39],
    [19, 39],
    [25, 39],
    [18, 35],
    [24, 35],
    [28, 35],
    [34, 35],
    [37, 35],
    [42, 35],
    [43, 35],
    [33, 31],
    [36, 31],
    [45, 31],
    [48, 31],
    [51, 31],
    [48, 35],
    [52, 35],
    [53, 39],
    [57, 39],
    [66, 39],
    [70, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 4, 39);
  m.mark('exit', car, 39);
  return {
    file: 'maze',
    hero: 'teddy',
    title: 'The Corn Maze',
    time: 'afternoon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [20, 29],
    pose: [30, 31, 'frontSniff'],
  };
}
