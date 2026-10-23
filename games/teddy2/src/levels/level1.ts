// Level 1: Doc Leo's House, at dawn the morning after the Big Show. Gwinn's bed is empty.
// The house is cut open like a dollhouse: the living room, hall, kitchen, laundry and mud
// room downstairs; Doc Leo's bedroom, the bathroom and the craft room upstairs; the attic
// over the bed; the basement under it all. Gwinn slipped out of her collar down the
// laundry chute: sniff it out of the basket in the basement, climb out through the mud
// room and the doggy door, and bring it to Doc Leo at THE CHEZ in the driveway.
//
// The blocks are in level1Tiles.ts, the monsters in level1Beasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { ATTIC, BASE, G, UP, art, houseTiles } from './level1Tiles';
import { houseBeasts } from './level1Beasts';
import { addTinHeart } from '../sprites/hidden';
import { bandAt } from './common';
import { sky } from '../blocks/tiles';

export function house(): Level {
  const bs = houseTiles();
  const beasts = houseBeasts();
  // THE CHEZ in the driveway, Doc Leo beside it, waiting for the collar.
  bs.chez(() => sky(3), 'collar', sky(bandAt(37, G)), () => sky(3));
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandAt(y, G)}`);
  for (const [cx, cy] of [
    [70, 31],
    [86, 33],
    [94, 30],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'grass');
  m.rect(0, G + 1, 100, 100 - G - 1, 'dirt');
  m.rect(0, BASE + 3, 100, 100 - BASE - 3, 'deep');

  // The house: x 1..66, the roof over it.
  const x0 = 1;
  const x1 = 66;
  const rooms = (y0: number, y1: number, spans: [number, number, string][]) => {
    for (const [a, b, paper] of spans) m.rect(a, y0, b - a + 1, y1 - y0 + 1, paper);
  };
  rooms(34, 39, [
    [2, 13, 'living'],
    [14, 24, 'hall'],
    [25, 41, 'kitchen'],
    [42, 65, 'laundry'],
  ]);
  rooms(27, 32, [
    [2, 13, 'bedroom'],
    [14, 24, 'hall'],
    [25, 36, 'bath'],
    [37, 65, 'craft'],
  ]);
  rooms(22, 25, [[2, 65, 'attic']]);
  rooms(41, 46, [[2, 65, 'cinder']]);
  // floors between the stories, the outer walls, the foundation
  m.rect(x0, UP, x1 - x0 + 1, 1, 'floor');
  m.rect(x0, G, x1 - x0 + 1, 1, (x) => (x >= 25 && x <= 41 ? 'kfloor' : 'floor'));
  m.rect(x0, ATTIC, x1 - x0 + 1, 1, 'floor');
  m.rect(x0, BASE, x1 - x0 + 1, 1, 'concrete');
  m.rect(x0, BASE + 1, x1 - x0 + 1, 2, 'foundation');
  m.rect(x0, 22, 1, BASE - 22, 'outer');
  m.rect(x1, 22, 1, BASE - 22, 'outerR');
  // the roof: a slope each side over the attic, shingles, a chimney
  for (let y = 18; y < 22; y++) {
    const inset = 21 - y;
    m.set(x0 + inset, y, 'roofL');
    m.set(x1 - inset, y, 'roofR');
    m.rect(x0 + inset + 1, y, x1 - x0 - 2 * inset - 1, 1, 'roof');
  }
  m.set(x0 + 1, 21, 'rafterL').set(x0 + 2, 21, 'rafterL');
  m.rect(x0 + 1, 22, 1, 4, 'rafterL');
  m.rect(x1 - 1, 22, 1, 4, 'rafterR');
  m.rect(50, 15, 1, 3, 'chimney');
  // the attic's rafters slope down at its ends
  // windows
  for (const [x, y, room] of [
    [5, 35, 'living'],
    [11, 35, 'living'],
    [9, 28, 'bedroom'],
    [19, 28, 'hall'],
    [33, 28, 'bath'],
    [46, 28, 'craft'],
    [60, 28, 'craft'],
    [38, 35, 'kitchen'],
  ] as [number, number, string][])
    m.set(x, y, `${room}Win`);
  for (const x of [10, 30, 44]) m.set(x, 42, 'cinderWin');
  // door frames between rooms
  for (const [x, y, room] of [
    [14, 39, 'hall'],
    [24, 39, 'hall'],
    [14, 32, 'hall'],
    [24, 32, 'hall'],
    [37, 32, 'craft'],
  ] as [number, number, string][])
    m.set(x, y, `${room}Door`).set(x, y - 1, `${room}DoorTop`);

  // Downstairs. The living room: Teddy's bed, Gwinn's (empty), the couch, the TV, confetti.
  m.set(3, 39, 'teddyBed').set(5, 39, 'gwinnBed');
  m.set(8, 38, 'couch00').set(9, 38, 'couch10').set(10, 38, 'couch20');
  m.set(8, 39, 'couch01').set(9, 39, 'couch11').set(10, 39, 'couch21');
  m.set(9, 36, 'klubPhoto');
  m.set(12, 38, 'tv00').set(12, 39, 'tv01');
  m.set(6, 37, 'signSniff').set(7, 37, 'signSniffR');
  for (const x of [2, 4, 6, 11, 13]) m.set(x, 39, x === 4 || x === 6 ? 'rug' : 'confetti');
  // The hall: stairs up (ledges), the coat on its hook.
  // (the stairwell's top is ledges too, so Teddy comes up through it and walks on it)
  for (let k = 0; k < 6; k++) m.set(16 + k, 38 - k, 'hallRail');
  for (let k = 0; k < 7; k++) m.set(16 + k, 39 - k, 'hallStep');
  m.rect(15, UP, 7, 1, 'hallStep');
  m.set(20, 38, 'coat');
  // The kitchen: counters (the toaster on one), the fridge, the table; the mouse.
  m.rect(26, 39, 7, 1, 'counter');
  m.rect(26, 35, 7, 1, 'cabinet');
  m.set(28, 38, 'sink').set(31, 38, 'toaster');
  m.set(33, 37, 'fridge00').set(34, 37, 'fridge10');
  m.set(33, 38, 'fridge01').set(34, 38, 'fridge11');
  m.set(33, 39, 'fridge02').set(34, 39, 'fridge12');
  m.set(37, 39, 'table00').set(38, 39, 'table10').set(39, 39, 'table20');
  // The laundry room: the washer and dryer, the chute's hole in the floor.
  m.set(44, 39, 'washer0').set(46, 39, 'dryer');
  const chute = 50;
  for (let y = UP + 1; y < G; y++) m.set(chute, y, 'chute_laundry');
  m.set(chute, G, 'chuteHole');
  // The mud room: boots, the hook where Gwinn's leash should be, the stairs down, the doggy door.
  m.set(57, 39, 'boots');
  // (the top of the stairs down is ledges in the floor: walk over them, come up through them)
  m.rect(57, G, 6, 1, 'laundryStep');
  for (let k = 0; k < 6; k++) m.set(61 - k, G + 1 + k, 'cinderStep');
  m.set(x1, 39, 'doggyDoor');

  // Upstairs. Doc Leo's bed bounces Teddy up through the hatch; the closet; the nightstand.
  m.set(3, 32, 'headboard');
  for (const x of [4, 5, 6]) m.set(x, 32, 'bed0');
  for (let y = 27; y < 32; y++) m.set(5, y, 'boing0');
  m.set(5, ATTIC, 'hatch');
  m.set(7, 32, 'nightstand');
  m.set(10, 31, 'closet00').set(11, 31, 'closet10').set(10, 32, 'closet01').set(11, 32, 'closet11');
  // The bathroom: the tub of bubbles, the toilet.
  m.rect(27, 32, 4, 1, 'tub0');
  // The craft room: felting table, balloons, the breadboard computer, the chute.
  m.set(39, 32, 'felting00').set(40, 32, 'felting10').set(41, 32, 'felting20');
  m.set(43, 31, 'balloons00').set(43, 32, 'balloons01');
  m.set(45, 32, 'bread00').set(46, 32, 'bread10');
  for (let y = 27; y < UP; y++) m.set(chute, y, 'chute_craft');
  m.set(chute, UP, 'chuteHole');
  // The attic: boxes and a trunk.
  for (const [x, y] of [
    [10, 25],
    [11, 25],
    [11, 24],
    [20, 25],
    [30, 25],
    [31, 25],
    [44, 25],
    [56, 25],
  ])
    m.set(x, y, 'box');

  // The basement: furnace, workbench, the root beer crocks, jars, the laundry basket.
  m.set(4, 45, 'furnace00').set(5, 45, 'furnace10').set(4, 46, 'furnace01').set(5, 46, 'furnace11');
  m.set(13, 46, 'bench00').set(14, 46, 'bench10').set(15, 46, 'bench20');
  m.set(22, 46, 'crocks00').set(23, 46, 'crocks10').set(24, 46, 'crocks20');
  m.set(28, 43, 'shelfJars').set(29, 43, 'shelfJars').set(36, 43, 'shelfJars');
  for (let y = 41; y < 46; y++) m.set(chute, y, 'chute_cinder');
  m.set(chute, 46, 'basket');

  // Outside the doggy door: the step, the lawn, the driveway, THE CHEZ and Doc Leo.
  m.set(67, 39, 'step');
  m.rect(72, G, 20, 1, 'drive');
  const car = 77;
  m.set(car - 2, 38, 'charger00').set(car - 2, 39, 'charger01');
  m.set(car, 38, 'carRoofL').set(car + 1, 38, 'carRoofR').set(car, 39, 'carDoor').set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant').set(car + 3, 38, 'leoHead').set(car + 3, 39, 'leoBody');
  // a hedge closes the yard off at both ends (the map wraps around)
  m.rect(90, 30, 10, 10, 'hedgeWall');
  m.rect(90, 29, 10, 1, 'hedgeTop');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');
  for (const x of [68, 69, 71, 82, 84, 86, 88]) if (m.get(x, 39).startsWith('sky')) m.set(x, 39, 'tuft');

  // Monsters.
  m.mon(9, 37, 'scentTreat');
  m.mon(10, 37, 'scentTreat');
  m.mon(5, 38, 'scentBone');
  m.mon(6, 31, 'scentBall');
  m.mon(chute, 45, 'scentCollar');
  m.mon(15, 39, 'bunny');
  m.mon(18, 32, 'bunny');
  m.mon(40, 46, 'bunny');
  m.mon(36, 39, 'mouse');
  m.mon(40, 32, 'teeth');
  m.mon(20, 41, 'spider');
  m.mon(42, 41, 'spider');
  // Doc Leo's balloon dogs: on top of the fridge, in the attic, on the workbench.
  m.mon(33, 36, 'poodle');
  m.mon(34, 36, 'poodle');
  m.mon(24, 25, 'poodle');
  m.mon(15, 45, 'poodle');
  const treats: [number, number][] = [
    [11, 37],
    [12, 37],
    [17, 37],
    [19, 35],
    [21, 32],
    [27, 38],
    [29, 38],
    [30, 38],
    [32, 38],
    [37, 38],
    [38, 38],
    [39, 38],
    [45, 38],
    [47, 39],
    [48, 39],
    [26, 31],
    [28, 30],
    [30, 30],
    [42, 31],
    [44, 32],
    [47, 32],
    [53, 32],
    [58, 32],
    [60, 32],
    [62, 32],
    [8, 24],
    [14, 25],
    [16, 25],
    [26, 25],
    [40, 25],
    [48, 25],
    [52, 25],
    [8, 46],
    [10, 46],
    [18, 46],
    [27, 46],
    [33, 46],
    [44, 46],
    [47, 46],
    [72, 39],
    [74, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  bs.def('toaster').birthMon = beasts.id('toast');
  bs.def('toaster').birthTime = 70;
  // a tin heart tucked behind Teddy's bed, just behind where he starts (100 points)
  m.set(2, 39, addTinHeart(bs, m.get(2, 39)));
  m.mark('start', 4, 39);
  m.mark('exit', car, 39);
  void art;
  return {
    file: 'house',
    hero: 'teddy',
    title: "Doc Leo's House",
    time: 'morning',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [0, 34],
    pose: [5, 39, 'frontSniff'],
  };
}
