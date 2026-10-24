// Level 5: Downtown at noon, by Biggles Department Store, where Teddy chased the pigeons over
// the fire escapes in the first adventure. Doc Leo wants a box of birthday candles from the
// bakery (Teddy has no idea whose birthday). The new idea is the conveyor belt. Teach: a slow
// belt carries Teddy along out of the oven, with the cookie trays. Test: belts going the other
// way, with pits between them (hop the gaps; a fall costs only a climb back up), and mice
// after the crumbs (one guards a bone up on the rack). Twist: the fast belt. There's no walking back on it, and it throws Teddy
// far enough off its end to clear a gap no dog could hop on foot, down onto the counter where
// the baker keeps the candles. Miss, and the tray return in the cellar carries him back to the
// foot of the fast belt. Then up the baker's racks to the packing loft, where the express belt
// whisks him home (hop the flour sacks), out the window onto Biggles' fire escape, and down
// to THE CHEZ.
//
// The blocks are in bakeryTiles.ts, the monsters in bakeryBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { CEIL, G, LOFT, bakeryTiles } from './bakeryTiles';
import { bakeryBeasts } from './bakeryBeasts';
import { bandAt } from './common';
import { bakerySong } from '../sound/bakerySong';

/** Where things are, for the bot's route. */
export const BAKERY = {
  car: 6,
  start: 11,
  door: 14,
  teach: 21,
  belt1: 32,
  pit1: 36,
  belt2: 38,
  pit2: 42,
  belt3: 44,
  pit3: 48,
  belt4: 51,
  grate: 57,
  fast: 60,
  gap: 68,
  far: 72,
  candles: 75,
  /** The racks up to the loft: [x, the row Teddy stands on]. */
  racks: [
    [77, 38],
    [77, 36],
    [77, 34],
    [77, 32],
  ],
  /** The express belt home, along the loft, and the flour sacks on it. */
  express: [24, 61],
  sacks: [52, 38],
  /** The window out onto the fire escape, and its far end. */
  window: 14,
  escape: 3,
  wall: 78,
};

export function bakery(): Level {
  const bs = bakeryTiles();
  const beasts = bakeryBeasts();
  bs.chez(
    () => bs.pic('brick'),
    'candles',
    bs.pic('brick'),
    () => bs.pic('brick'),
  );
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandAt(y, G)}`);
  for (const [cx, cy] of [
    [3, 22],
    [24, 20],
    [52, 21],
    [84, 24],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'walk');
  m.rect(0, G + 1, 100, 100 - G - 1, 'deep');

  // The street: Biggles Department Store, its fire escape, THE CHEZ and Doc Leo.
  m.rect(1, 28, 12, 12, 'brick');
  for (const x of [3, 9]) for (const y of [29, 35]) m.set(x, y, 'brickWin');
  for (let bx = 0; bx < 4; bx++) m.set(4 + bx, 37, `biggles${bx}0`);
  for (let x = BAKERY.escape; x < BAKERY.window; x++) m.set(x, LOFT + 1, 'escape').set(x, LOFT, x < 13 ? 'railBrick' : 'railSky');
  const car = BAKERY.car;
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant')
    .set(car + 3, 38, 'leoHead')
    .set(car + 3, 39, 'leoBody');
  m.rect(0, 20, 1, 20, 'edge');
  m.rect(BAKERY.wall + 1, 20, 100 - BAKERY.wall - 1, 20, 'edge');

  // The bakery, x 14..78, cut open like a dollhouse: the shop below, the packing loft above.
  const x0 = BAKERY.door;
  const x1 = BAKERY.wall;
  m.rect(x0, CEIL - 1, x1 - x0 + 1, 1, 'roof');
  for (let bx = 0; bx < 4; bx++) m.set(44 + bx, CEIL - 2, `sBakery${bx}0`);
  m.rect(x0 + 1, CEIL, x1 - x0 - 1, 1, 'ceiling');
  m.rect(x0 + 1, CEIL + 1, x1 - x0 - 1, G - CEIL - 1, 'tiles');
  m.rect(x0 + 1, G, x1 - x0 - 1, 1, 'floor');
  m.rect(x0, CEIL, 1, G - CEIL - 1, 'front');
  m.rect(x1, CEIL, 1, G - CEIL + 1, 'front');
  m.set(x0, 39, 'doorway').set(BAKERY.window, LOFT, 'window');
  m.set(x0 - 1, 38, 'awnSky').set(x0, 38, 'awnFront');
  m.set(x0 - 2, 39, 'signIn');

  // Teach: the oven and the slow belt carrying right.
  m.set(16, 39, 'case00').set(17, 39, 'case10');
  m.set(17, 37, 'signRideL').set(18, 37, 'signRideR');
  for (let bx = 0; bx < 2; bx++) for (let by = 0; by < 2; by++) m.set(19 + bx, 38 + by, `oven${bx}${by}`);
  bs.def('oven11').birthMon = beasts.id('trayOven');
  bs.def('oven11').birthTime = 40;
  const belt = (from: number, to: number, kind: string, row = 39) => {
    for (let x = from; x <= to; x++) m.set(x, row, `${kind}0`).set(x, row + 1, `${kind}Base0`);
  };
  belt(BAKERY.teach, 29, 'slowR');

  // Test: belts carrying left, with pits between them, and a mouse on two of them.
  m.set(30, 37, 'signGapsL').set(31, 37, 'signGapsR');
  const pit = (from: number, w: number, deep: number) => {
    for (let x = from; x < from + w; x++) {
      for (let y = G; y < G + deep; y++) m.set(x, y, 'cellar');
      m.set(x, G + deep, 'pitFloor');
    }
  };
  belt(BAKERY.belt1, BAKERY.pit1 - 1, 'slowL');
  pit(BAKERY.pit1, 2, 2);
  belt(BAKERY.belt2, BAKERY.pit2 - 1, 'slowL');
  pit(BAKERY.pit2, 2, 2);
  belt(BAKERY.belt3, BAKERY.pit3 - 2, 'slowL');
  pit(BAKERY.pit3, 3, 2);
  belt(BAKERY.belt4 + 1, BAKERY.belt4 + 4, 'slowL');
  for (const x of [BAKERY.pit1 - 1, BAKERY.belt4 + 4]) {
    for (let y = LOFT + 2; y < 38; y++) m.set(x, y, 'pipe');
    m.set(x, 38, 'chute');
  }
  bs.def('chute').birthMon = beasts.id('trayChute');
  bs.def('chute').birthTime = 50;
  m.set(39, 38, 'rack').set(40, 38, 'rack');

  // Twist: the fast belt, the gap, and the counter a step down beyond it. Under it all, the
  // tray return carries a dog who missed back left, to the flour sacks and the grate.
  const { grate, fast, gap, far } = BAKERY;
  m.set(fast - 4, 37, 'signFastL').set(fast - 3, 37, 'signFastR');
  belt(fast, gap - 1, 'fast');
  for (let x = grate; x < far; x++) {
    for (let y = G; y < G + 5; y++) if (x >= gap || y > G) m.set(x, y, 'cellar');
    m.set(x, G, x < fast ? 'grate' : x >= gap ? 'cellar' : 'fastBase0');
    m.set(x, G + 4, 'ret0').set(x, G + 5, 'retBase0');
  }
  // the way up from the tray return: flour sacks for stairs, and the grates over them
  for (let k = 0; k < 3; k++) for (let y = G + 2 + k; y <= G + 4; y++) m.set(grate + k, y, 'sack');
  for (let k = 0; k < 3; k++) m.set(grate + k, G + 5, 'pitFloor');
  m.set(gap + 1, G + 1, 'signBack');
  for (let x = far; x < x1; x++) m.set(x, G, 'tiles').set(x, G + 1, 'floor');
  m.set(BAKERY.candles, G, 'candles');
  m.set(73, 39, 'bakerTop').set(73, 40, 'bakerBot').set(73, 38, 'bakerSays');

  // Up the racks to the packing loft, and the express belt home; out the window.
  for (const [x, stand] of BAKERY.racks) m.set(x, stand + 1, 'rack');
  m.rect(x0 + 1, LOFT + 1, x1 - x0 - 2, 1, 'loft');
  m.set(70, LOFT - 1, 'signExpressL').set(71, LOFT - 1, 'signExpressR');
  const [e0, e1] = BAKERY.express;
  belt(e0, e1, 'express', LOFT);
  for (const x of BAKERY.sacks) m.set(x, LOFT, 'sackLoft');

  // Monsters.
  m.mon(BAKERY.belt2 + 1, 37, 'rackMouse');
  m.mon(BAKERY.belt4 + 2, 39, 'mouse');
  m.mon(66, LOFT, 'mouse');
  m.mon(9, LOFT, 'pigeon');
  const treats: [number, number][] = [
    [12, 39],
    [24, 39],
    [27, 39],
    [33, 37],
    [37, 37],
    [43, 37],
    [45, 39],
    [49, 37],
    [53, 39],
    [61, 38],
    [64, 38],
    [68, 37],
    [69, 36],
    [70, 37],
    [74, LOFT],
    [57, LOFT - 1],
    [52, LOFT - 2],
    [43, LOFT - 1],
    [38, LOFT - 2],
    [30, LOFT - 1],
    [19, LOFT],
    [11, LOFT],
    [5, LOFT],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.treat(40, 37, 'bone');
  m.mark('start', BAKERY.start, 39);
  m.mark('exit', car, 39);
  return {
    file: 'bakery',
    hero: 'teddy',
    title: 'Downtown',
    time: 'noon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [57, 35],
    pose: [61, 39, 'walk1'],
    song: bakerySong,
    card: ['Candles! A box of them, from', 'the bakery downtown.', 'NEW: CONVEYOR BELTS'],
  };
}
