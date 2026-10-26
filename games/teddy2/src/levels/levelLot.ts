// Level 7: MEANWHILE... Gwinn Signs Up, at noon on the Fair's back lot, before the gates
// open, on a windy day. Gwinn hops out of the Ferris wheel car on the ride truck, BOOFs a
// goose off the path, rides the big fan's breeze along the Clown Club's costume line, and
// passes under the bandstand, where Honker has the dog show's sign-up sheet (the stage is
// too high to hop onto from the ground) and Professor Pratfall practices pies (flop, and
// they sail over). Past the exhibit hall she hops into the breeze from the fan on the creek
// bank to cross the creek (fall in, and the current carries her back to the near bank),
// BOOFs a second goose at the poultry barn, and rides the updraft of a fan lying face up
// onto the barn's roof. Then back the other way over the roofs and the catwalk, into the
// wind: dash in the calm between gusts, and duck behind a vent or a loudspeaker when the
// windsocks stand out. At the bandstand Honker writes her in: number 13. Then the wind takes
// the entry card, all the way to the top of THE BIG DROP.
//
// The blocks are in levelLotTiles.ts, the monsters in levelLotBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, bandRow, lotTiles, skyAt } from './levelLotTiles';
import { lotBeasts } from './levelLotBeasts';

/** The roofs' shelters from the gusts (a vent, or the loudspeakers on the catwalk), right to left. */
export const SHELTERS = [85, 79, 74, 68, 62, 56];
/** The roofs and the catwalk run from here to here (row 33); the bandstand's stage is left of them. */
const ROOFS = { x0: 50, x1: 86, row: 33 };
/** Where the updraft lifts her to the roofs. */
export const UPDRAFT = 87;

export function lot(): Level {
  const bs = lotTiles();
  const beasts = lotBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [6, 25],
    [26, 23],
    [58, 24],
    [80, 22],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'grass');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 56, 'deep');
  for (let x = 8; x < 92; x++) m.set(x, 39, x % 7 === 3 ? 'flower' : 'tuft');
  m.rect(0, 30, 1, 10, 'hedgeWall').set(0, 29, 'hedgeTop');
  m.rect(92, 30, 8, 10, 'hedgeWall');
  m.rect(92, 29, 8, 1, 'hedgeTop');

  // The ride truck Gwinn came in on (she starts in its Ferris wheel car).
  m.rect(1, 39, 5, 1, 'flatbed');
  m.set(2, 37, 'carL0').set(3, 37, 'carR0').set(2, 38, 'gondola').set(3, 38, 'carR1');
  m.set(6, 38, 'cab00').set(7, 38, 'cab10').set(6, 39, 'cab01').set(7, 39, 'cab11');
  m.set(9, 39, 'signFolks');
  // Juggles, and the Clown Club's trailer.
  m.set(10, 38, 'juggles0Top').set(10, 39, 'juggles0Bot');
  for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 2; by++) m.set(12 + bx, 38 + by, `trailer${bx}${by}`);

  // The costume line and the big fan at its foot: a breeze along the ground.
  m.set(26, 36, 'linePostTop').set(26, 37, 'linePostLow').set(26, 38, 'fanTop0').set(26, 39, 'fanBot0');
  m.set(35, 36, 'linePostTop');
  for (let y = 37; y < 40; y++) m.set(35, y, 'linePostLow');
  for (let x = 27; x < 35; x++) {
    m.set(x, 36, `wash${x - 27}`);
    m.set(x, 38, 'breeze0').set(x, 39, 'breeze0');
  }

  // The bandstand: the awning, its posts, the stage floor and its legs. Honker and the
  // sign-up table are up on the stage (the way out); under it, Pratfall's pie practice.
  const s0 = 37;
  const s1 = 49;
  m.rect(s0, 29, s1 - s0 + 1, 1, 'awning');
  for (const x of [s0, s1]) for (let y = 30; y < 33; y++) m.set(x, y, x === s0 ? 'standRail' : 'standPost');
  m.rect(s0, 33, s1 - s0 + 1, 1, 'stage');
  for (const x of [s0, 43, s1]) for (let y = 34; y < 40; y++) m.set(x, y, y < 37 ? 'standLeg' : 'standLegLow');
  m.set(40, 31, 'honkerTop').set(40, 32, 'honkerBot').set(41, 32, 'signupTable');
  m.set(44, 32, 'signSignUpL').set(45, 32, 'signSignUpR');
  m.set(39, 38, 'targetTop').set(39, 39, 'targetBot');
  m.set(41, 39, 'signPieL').set(42, 39, 'signPieR');
  m.set(48, 38, 'pratfallTop').set(48, 39, 'pratfallBot');
  bs.def('pratfallBot').birthMon = beasts.id('pie');
  bs.def('pratfallBot').birthTime = 50;

  // The exhibit hall, the creek and its catwalk, the poultry barn.
  const front = (x0: number, x1: number, wins: number[], door: number, sign: string, signX: number) => {
    m.rect(x0, ROOFS.row + 1, x1 - x0 + 1, 39 - ROOFS.row, 'hall');
    m.rect(x0, ROOFS.row, x1 - x0 + 1, 1, 'hallRoof');
    for (const x of wins) m.set(x, 37, 'hallWin');
    m.set(door, 39, 'hallDoor');
    m.set(signX, 35, `${sign}L`).set(signX + 1, 35, `${sign}R`);
  };
  front(ROOFS.x0, 60, [52, 57], 54, 'signHall', 54);
  front(73, ROOFS.x1, [75, 84], 79, 'signBarn', 80);
  m.set(59, 39, 'signBreezeL').set(60, 39, 'signBreezeR');
  const c0 = 62;
  const c1 = 71;
  m.set(c0 - 1, 38, 'bigFanTop0').set(c0 - 1, 39, 'bigFanBot');
  for (let x = c0; x <= c1; x++) {
    m.set(x, G, 'creek0')
      .set(x, G + 1, 'creekDeep0')
      .set(x, G + 2, 'creekDeep0');
    m.set(x, 37, 'breeze0').set(x, 38, 'breeze0');
  }
  m.set(c1 + 1, 39, 'reeds');
  m.rect(c0 - 1, ROOFS.row, c1 - c0 + 3, 1, 'catwalk');
  for (const x of [c0 - 1, c1 + 1]) for (let y = ROOFS.row + 1; y < 37; y++) m.set(x, y, 'catwalkLeg');

  // The fan lying face up past the barn: its updraft lifts her to the roofs.
  m.set(UPDRAFT, 39, 'upFan0').set(UPDRAFT + 1, 39, 'signUp');
  for (let y = 34; y < 39; y++) m.set(UPDRAFT, y, `updraft${bandRow(y)}_0`);

  // The gusts over the roofs (rows 30-32), blowing from the west. Each shelter and the spot
  // just downwind of it (to its right) stay calm; the windsocks stand on the shelters.
  for (let x = ROOFS.x0; x <= ROOFS.x1; x++) {
    const shelter = SHELTERS.includes(x);
    const lee = SHELTERS.includes(x - 1);
    for (let y = 30; y <= 32; y++) {
      if (shelter) m.set(x, y, y === 32 ? (x >= c0 - 1 && x <= c1 + 1 ? 'speaker' : 'vent') : y === 31 ? 'sockPoleOn' : 'sockOn');
      else if (!lee) m.set(x, y, `gust${bandRow(y)}On`);
    }
  }

  // Monsters.
  m.mon(17, 39, 'goose');
  m.mon(76, 39, 'gooseB');
  // two balloon dogs, each a hop up out of a breeze (off the way: a treat for the curious)
  for (const [x, y] of [
    [30, 36],
    [66, 35],
  ])
    m.mon(x, y, 'poodle');
  const treats: [number, number][] = [
    [8, 39],
    [11, 39],
    [16, 39],
    [21, 39],
    [24, 39],
    [28, 39],
    [30, 39],
    [32, 39],
    [34, 39],
    [44, 39],
    [46, 39],
    [51, 39],
    [56, 39],
    [64, 38],
    [68, 38],
    [74, 39],
    [82, 39],
    [86, 39],
    ...SHELTERS.map((x) => [x + 1, 32] as [number, number]),
    [47, 32],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 2, 38);
  m.mark('exit', 41, 32);
  return {
    file: 'lot',
    hero: 'gwinn',
    title: 'Gwinn Signs Up',
    time: 'noon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [24, 35],
    pose: [30, 39, 'gwinnRun1'],
    outro: 'gust.fli',
  };
}
