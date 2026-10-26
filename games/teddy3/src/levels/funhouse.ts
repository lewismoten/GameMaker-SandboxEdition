// Level 11: The Funhouse, at the Fairgrounds at sunset (the Fair Midway from the second
// adventure is just outside). Doc Leo wants party horns from the funhouse's prize stand.
// The new idea is the blinking floor: boards over the ball pit that come and go on a beat.
// Each one flashes twice before it goes and shows a bright outline just before it comes
// back, and a mirror over each run lights in its color in step with it. Teach: one run of
// red boards (the sign says so). Test: red and blue runs taking turns, half a beat apart,
// with a pillar to wait on between them (red, then blue, then red, then blue). Twist: the
// spinning barrel, a fast belt over ten red boards: far too long to walk in one beat, but
// a quick ride if Teddy steps in as they come back. Then the blinking stairs: single
// boards, red, blue, red, climbing to the balcony where the prize stand is: hop to each
// step as it comes back, before the one under Teddy goes. Jack-in-the-box toys pop up along the
// way (a WOOF latches one shut). A fall only lands in the ball pit: a padded UP step at each
// pit's near end leads back up. Then the prize stand, the horns, and out to THE CHEZ.
//
// The blocks are in funhouseTiles.ts, the monsters in funhouseBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { CEIL, G, PIT, funhouseTiles, skyAt } from './funhouseTiles';
import { funhouseBeasts } from './funhouseBeasts';
import { funhouseSong } from '../sound/funhouseSong';

type Fam = 'red' | 'blue';

/** Where things are, for the bot's route. */
export const FUNHOUSE = {
  start: 3,
  front: 14,
  /** The teaching run of red boards. */
  teach: [20, 23] as [number, number],
  jack1: 27,
  /** The test's runs, and the pillars between them. */
  runs: [
    [30, 32, 'red'],
    [34, 36, 'blue'],
    [38, 40, 'red'],
    [42, 44, 'blue'],
  ] as [number, number, Fam][],
  pillars: [33, 37, 41],
  jack2: 48,
  /** The spinning barrel over its run of red boards. */
  barrel: [53, 62] as [number, number],
  /** The blinking stairs: [x, the board's row], red, blue, red; then the balcony's row and ends. */
  stairs: [
    [66, 38, 'red'],
    [67, 36, 'blue'],
    [68, 34, 'red'],
  ] as [number, number, Fam][],
  balcony: [69, 78, 34] as [number, number, number],
  horns: 75,
  jack3: 84,
  back: 88,
  car: 92,
};

export function funhouse(): Level {
  const bs = funhouseTiles();
  const beasts = funhouseBeasts();
  bs.chez(
    () => bs.pic('sky3'),
    'horns',
    bs.pic('sky3'),
    () => bs.pic('sky3'),
  );
  const F = FUNHOUSE;
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  m.rect(0, G, 100, 1, 'sawdust');
  m.rect(0, G + 1, 100, 100 - G - 1, 'deep');
  m.rect(0, 30, 1, 10, 'edge');
  m.rect(98, 30, 2, 10, 'edge');

  // Outside: the Fair's gate arch, the lights, the ring toss, and Honker by the door.
  for (let bx = 0; bx < 5; bx++) for (let by = 0; by < 2; by++) m.set(5 + bx, 38 + by, `arch${bx}${by}`);
  for (let x = 1; x < F.front; x++) m.set(x, 33, `lights${x % 2}`);
  for (let x = F.back + 1; x < 98; x++) m.set(x, 33, `lights${x % 2}`);
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) m.set(10 + bx, 37 + by, `toss${bx}${by}`);
  m.set(13, 38, 'honkerTop').set(13, 39, 'honkerBot');
  m.set(11, 36, 'signFunL').set(12, 36, 'signFunR');

  // The funhouse, x 14..88: its front and back, roof and sign, the room and its floor.
  const x0 = F.front;
  const x1 = F.back;
  m.rect(x0, CEIL - 1, x1 - x0 + 1, 1, 'roof');
  for (let bx = 0; bx < 4; bx++) m.set(49 + bx, CEIL - 2, `sFun${bx}0`);
  m.rect(x0 + 1, CEIL, x1 - x0 - 1, 1, 'ceiling');
  m.rect(x0 + 1, CEIL + 1, x1 - x0 - 1, G - CEIL - 1, 'paper');
  m.rect(x0 + 1, G, x1 - x0 - 1, 1, 'floor');
  m.rect(x0, G + 1, x1 - x0 + 1, 100 - G - 1, 'under');
  for (const x of [x0, x1]) {
    m.rect(x, CEIL, 1, G - CEIL - 2, 'front');
    m.set(x, 38, 'doorway').set(x, 39, 'doorway');
  }

  /** A run of blinking boards over the ball pit, a mirror over it, the UP step at its near end. */
  const run = (a: number, b: number, fam: Fam) => {
    for (let x = a; x <= b; x++) {
      m.set(x, G, fam === 'red' ? 'redOn' : 'blueWait');
      for (let y = G + 1; y < PIT - 1; y++) m.set(x, y, 'pit');
      m.set(x, PIT - 1, 'balls').set(x, PIT, 'pitFloor');
    }
    m.set(a, PIT - 1, 'step');
    m.set(Math.floor((a + b) / 2), 35, fam === 'red' ? 'redMirOn' : 'blueMirWait');
  };

  // Teach: one run of red boards.
  m.set(17, 39, 'signBlinkL').set(18, 39, 'signBlinkR');
  run(...F.teach, 'red');

  // Test: red and blue runs half a beat apart, with pillars to wait on between them.
  m.set(25, 39, 'signBeatL').set(26, 39, 'signBeatR');
  for (const [a, b, fam] of F.runs) run(a, b, fam);
  for (const x of F.pillars) {
    m.set(x, G, 'pillarTop');
    for (let y = G + 1; y <= PIT; y++) m.set(x, y, 'pillar');
  }

  // Twist: the spinning barrel over ten red boards.
  const [b0, b1] = F.barrel;
  m.set(b0 - 4, 39, 'signBarrelL').set(b0 - 3, 39, 'signBarrelR');
  run(b0, b1, 'red');
  m.set(Math.floor((b0 + b1) / 2) + 2, 35, 'redMirOn');
  for (let x = b0; x <= b1; x++) m.set(x, 37, 'barrelTop0').set(x, 38, 'barrelMid0').set(x, 39, 'barrel0');

  // The blinking stairs up to the balcony, the prize stand on it, the horns on its counter.
  for (const [x, y, fam] of F.stairs) m.set(x, y, fam === 'red' ? 'redStepOn' : 'blueStepWait');
  m.set(64, 35, 'blueMirWait').set(70, 37, 'redMirOn');
  const [c0, c1, crow] = F.balcony;
  for (let x = c0; x <= c1; x++) m.set(x, crow, 'balcony');
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 2; by++) m.set(F.horns - 4 + bx, crow - 2 + by, `stand${bx}${by}`);
  m.set(F.horns, crow - 1, 'horns');

  // THE CHEZ and Doc Leo, out the back door.
  const car = F.car;
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant')
    .set(car + 3, 38, 'leoHead')
    .set(car + 3, 39, 'leoBody');

  // Monsters.
  m.mon(F.jack1, 39, 'jack');
  m.mon(F.jack2, 39, 'jackLate');
  m.mon(F.jack3, 39, 'jack');
  const treats: [number, number][] = [
    [7, 39],
    [9, 39],
    [16, 39],
    [24, 39],
    [29, 39],
    [33, 37],
    [37, 37],
    [41, 37],
    [45, 39],
    [51, 39],
    [64, 39],
    [66, 37],
    [67, 35],
    [68, 33],
    [70, 33],
    [74, 33],
    [77, 33],
    [80, 39],
    [86, 39],
    [90, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', F.start, 39);
  m.mark('exit', car, 39);
  return {
    file: 'funhouse',
    hero: 'teddy',
    title: 'The Funhouse',
    time: 'sunset',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [29, 35],
    pose: [33, 39, 'walk1'],
    song: funhouseSong,
    card: ['Party horns! From the prize', 'stand in the Fair funhouse.', 'NEW: BOARDS BLINK ON A BEAT'],
  };
}
