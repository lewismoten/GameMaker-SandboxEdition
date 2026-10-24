// Level 8: The Old Mill, on a summer afternoon (the mill by the river from the sequel). The
// Klown Klub left its banner up in the mill loft after the Fair. The new idea is the water
// wheel: a paddle coming up the near side of a wheel is a lift (stand on it at the bottom,
// step off at the top). Teach: stand by the first wheel and a paddle lifts Teddy up to the
// sill. Test: the next two wheels rise through holes in the floors, so Teddy must step on
// when a paddle comes level and step off before it goes over the top (a miss drops him a
// floor, to try again); pigeons on the ledges. Twist: out of the loft the flume pours Teddy
// into the millrace, whose current carries him to the big wheel by the quay, turning the
// other way; its paddles scoop him out of the water and up to THE CHEZ.
//
// The blocks are in millTiles.ts, the monsters in millBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, MILL, millTiles } from './millTiles';
import { WHEEL, millBeasts } from './millBeasts';
import { bandAt } from './common';
import { sky } from '../blocks/tiles';
import { millSong } from '../sound/millSong';

/** A wheel: the column its paddles rise up, and the row of the bottom of its ring. */
type Wheel = { x: number; bottom: number };

/** Where things are, for the bot's route. */
export const MILL_AT = {
  start: 3,
  /** The wheels in the mill, low to high, rising on their left sides. */
  wheels: [
    { x: 9, bottom: G },
    { x: 18, bottom: 37 },
    { x: 26, bottom: 34 },
    { x: 34, bottom: 31 },
  ],
  /** The big wheel by the quay, rising on its right side. */
  big: { x: 65, bottom: G },
  /** The floor Teddy steps off onto at the top of each wheel in the mill (their rows). */
  floors: [37, 34, 31, 28],
  banner: 42,
  door: 46,
  flume: 47,
  quay: 66,
  car: 68,
  /** The perch over the race with the bone (hop to it off a paddle of the big wheel). */
  perch: { x: 63, y: 34 },
};

export function mill(): Level {
  const bs = millTiles();
  const beasts = millBeasts();
  const at = MILL_AT;
  const skyAt = (y: number) => `sky${bandAt(y, G)}`;
  bs.chez(
    (_bx, by) => sky(bandAt(35 + by, G)),
    'banner',
    sky(bandAt(34, G)),
    (by) => sky(bandAt(35 + by, G)),
  );
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [4, 22],
    [30, 19],
    [55, 24],
    [80, 21],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'grass');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');
  for (let x = 1; x < at.wheels[0].x; x++) m.set(x, 39, x % 3 === 1 ? 'flower' : 'tuft');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');
  // a tree on the bank
  for (let y = 34; y < 40; y++) m.set(2, y, `trunk${bandAt(y, G)}`);
  for (let dy = 0; dy < 3; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + dy < 4) m.set(2 + dx, 31 + dy, `leaf${bandAt(31 + dy, G)}`);
  m.set(6, 39, 'signRideL').set(7, 39, 'signRideR');

  // The mill, x 9..46, cut open: boards above, stone below, a roof; a door out of the loft.
  const x0 = at.wheels[0].x;
  const x1 = at.door;
  m.set(x0 - 1, MILL.roof, 'roofL');
  m.rect(x0, MILL.roof, x1 - x0 + 1, 1, 'roofM');
  m.set(x1 + 1, MILL.roof, 'roofR');
  m.rect(x0, MILL.roof + 1, x1 - x0, MILL.stone - MILL.roof - 1, 'millIn');
  m.rect(x0, MILL.stone, x1 - x0, G - MILL.stone, 'millStone');
  m.rect(x0, G, x1 - x0 + 1, 1, 'millFloor');
  m.rect(x1, MILL.roof + 1, 1, G - MILL.roof - 1, 'millWall');

  // The floors: a beam from each wheel's top on past the next wheel (it rises through a hole
  // in it) to under the one after, so a dog who misses a paddle drops only one floor.
  const { wheels, floors } = at;
  const loft = floors[floors.length - 1];
  floors.forEach((row, k) => {
    const from = wheels[k].x + 1;
    const to = k + 2 < wheels.length ? wheels[k + 2].x : x1 - 1;
    m.rect(from, row, to - from + 1, 1, 'beam');
    if (k + 1 < wheels.length) m.set(wheels[k + 1].x, row, 'millStone');
  });
  m.set(x1, loft - 1, 'loftGate');

  // The wheels: a hub in the middle of each ring, and a paddle at each corner of it.
  const n = WHEEL.size;
  const wheel = (w: Wheel, name: string, hubName: string, rises: 'left' | 'right') => {
    const left = rises === 'left' ? w.x : w.x - n;
    for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) m.set(left + 1 + bx, w.bottom - n + 1 + by, `${hubName}${bx}${by}`);
    const far = rises === 'left' ? w.x + n : w.x - n;
    m.mon(w.x, w.bottom, `${name}Up`);
    m.mon(w.x, w.bottom - n, `${name}Top`);
    m.mon(far, w.bottom - n, `${name}Down`);
    m.mon(far, w.bottom, `${name}Bottom`);
  };
  for (const w of wheels) wheel(w, 'wheel', 'hub', 'left');
  wheel(at.big, 'bigWheel', 'bigHub', 'right');

  // Inside: the miller and his sacks, the signs, the banner up in the loft.
  m.set(24, 38, 'millerTop').set(24, 39, 'millerBot').set(24, 37, 'millerSays');
  m.set(27, 39, 'sack')
    .set(28, 39, 'sack')
    .set(39, loft - 1, 'sackLoft');
  m.set(wheels[1].x - 3, floors[0] - 1, 'signLevelL').set(wheels[1].x - 2, floors[0] - 1, 'signLevelR');
  m.set(at.banner, loft - 1, 'banner');
  m.set(44, loft - 1, 'signFlumeL').set(45, loft - 1, 'signFlumeR');

  // The flume, down the mill's far side into the millrace.
  for (let k = 0; at.flume + k < at.big.x - n - 1; k++) {
    const y = loft - 1 + k;
    if (y >= G) break;
    m.set(at.flume + k, y, `flume${bandAt(y, G)}`);
    if (y + 1 < G) m.set(at.flume + k, y + 1, `spray${bandAt(y + 1, G)}`);
  }
  // The millrace, from the mill to the quay; the perch over it; the quay; the hedge beyond.
  for (let x = at.flume; x < at.quay; x++) {
    m.set(x, G, 'race0');
    for (let y = G + 1; y < G + 3; y++) m.set(x, y, 'raceDeep0');
    m.set(x, G + 3, 'bed');
  }
  m.set(at.perch.x, at.perch.y, 'perch');
  const quayTop = floors[0];
  m.rect(at.quay, quayTop, 8, 1, 'quayTop');
  m.rect(at.quay, quayTop + 1, 8, G + 4 - quayTop - 1, 'quay');
  m.rect(at.quay + 8, 20, 100 - at.quay - 8, 24, 'hedgeWall');
  m.rect(at.quay + 8, 19, 100 - at.quay - 8, 1, 'hedgeTop');

  // THE CHEZ and Doc Leo, on the quay.
  const car = at.car;
  const top = quayTop - 2;
  m.set(car, top, 'carRoofL')
    .set(car + 1, top, 'carRoofR')
    .set(car, top + 1, 'carDoor')
    .set(car + 1, top + 1, 'carBack');
  m.set(car + 3, top - 1, 'leoWant')
    .set(car + 3, top, 'leoHead')
    .set(car + 3, top + 1, 'leoBody');

  // Monsters.
  m.mon(12, floors[0] - 1, 'pigeon');
  m.mon(21, floors[1] - 1, 'pigeon');
  m.mon(29, floors[2] - 1, 'pigeon');
  m.mon(38, loft - 1, 'pigeon');
  const treats: [number, number][] = [
    [4, 39],
    [7, 37],
    [12, 39],
    [18, 39],
    [11, 35],
    [14, 36],
    [20, 32],
    [24, 33],
    [28, 29],
    [32, 30],
    [36, 26],
    [40, 27],
    [44, 25],
    [51, 30],
    [55, 34],
    [67, 36],
    [70, 34],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.treat(at.perch.x, at.perch.y - 1, 'bone');
  m.mark('start', at.start, 39);
  m.mark('exit', car, top + 1);
  return {
    file: 'mill',
    hero: 'teddy',
    title: 'The Old Mill',
    time: 'afternoon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [14, 32],
    pose: [17, 36, 'frontBeg'],
    song: millSong,
    card: ["The Klub's banner! Up in", "the old mill's loft.", 'NEW: THE WATER WHEEL'],
  };
}
