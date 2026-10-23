// The four levels, laid out with a little builder: fills, ASCII patches for parks and the
// sled run, and stamps for houses, street-name signs and LaVale Mall. The streets are the
// real ones of Fort Ashby, winter of 1992: Gale Street, Dunn Drive, Leota Street,
// Leon Drive, Jamie Street and Bowden Drive.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/blocks';
import { MON } from '../ids';

/** ASCII legend → block name ('.' picks a yard variant). */
const LEGEND: Record<string, string> = {
  ',': 'plain',
  T: 'tree',
  b: 'bush',
  f: 'fence',
  L: 'lamp',
  y: 'hydrant',
  n: 'snowman',
  D: 'deep',
  a: 'asphalt',
  S: 'deepWalk',
  s: 'walk',
  P: 'deepLot',
  p: 'lot',
  '=': 'roadA',
  '-': 'roadB',
  B: 'bank2',
  K: 'bank1',
  _: 'bank0',
  '^': 'iceN',
  '>': 'iceE',
  v: 'iceS',
  '<': 'iceW',
  '#': 'bridge',
  F: 'fort',
  O: 'pile',
  c: 'cocoa',
  $: 'bill',
  '5': 'tip',
  h: 'signHill',
  t: 'signTown',
  m: 'signMall',
  H: 'signHome',
  w: 'signPlow',
  u: 'signBus',
  '~': 'slope',
  ':': 'slopeT',
  '!': 'steep',
  o: 'mogul',
  R: 'rock',
  Y: 'slopeTree',
  r: 'flagRed',
  e: 'flagBlue',
  X: 'finish',
  Q: 'slopeBill',
  q: 'slopeCocoa',
  '[': 'parkedL',
  ']': 'parkedR',
};

export interface LinkSpec {
  from: [number, number];
  toScene: 'next' | 'won' | 'woods';
  to: [number, number];
}

export class MapBuilder {
  readonly map: GameMap = newMap();
  readonly links: LinkSpec[] = [];
  private monCount = 0;
  money = 0;
  constructor(private book: BlockBook) {
    this.fill(0, 0, 100, 100, 'T');
  }

  private block(ch: string, x: number, y: number): number {
    if (ch === '.') return this.book.n(((x * 7 + y * 13) % 5) % 2 ? 'yardA0' : 'yardB0');
    const name = LEGEND[ch];
    if (!name) throw new Error(`Unknown map char "${ch}"`);
    return this.book.n(name);
  }

  set(x: number, y: number, what: string): this {
    const n = what.length === 1 ? this.block(what, x, y) : this.book.n(what);
    this.map.blocks[y * 100 + x] = n;
    return this;
  }

  fill(x: number, y: number, w: number, h: number, ch: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch);
    return this;
  }

  /** ASCII rows at (x, y); spaces are left alone. */
  patch(x: number, y: number, rows: string[]): this {
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => ch !== ' ' && this.set(x + dx, y + dy, ch)));
    return this;
  }

  mon(id: number, x: number, y: number): this {
    if (this.monCount >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum: id, status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
    return this;
  }

  /** A two-block vehicle whose left half is at (x, y). */
  vehicle(a: number, b: number, x: number, y: number): this {
    return this.mon(a, x, y).mon(b, x + 1, y);
  }

  link(fx: number, fy: number, toScene: LinkSpec['toScene'], tx = 0, ty = 0): this {
    this.links.push({ from: [fx, fy], toScene, to: [tx, ty] });
    return this;
  }

  /** A house: 5 wide; returns the columns of its door and garage. */
  house(x: number, y: number, color: 'red' | 'blue' | 'yellow', garageLeft: boolean, chimney = true): { door: number; garage: number } {
    this.set(x, y, 'roofL')
      .set(x + 1, y, 'roofM')
      .set(x + 2, y, chimney ? 'chimney' : 'roofM')
      .set(x + 3, y, 'roofM')
      .set(x + 4, y, 'roofR');
    this.set(x, y + 1, 'eaveL')
      .set(x + 1, y + 1, 'eaveM')
      .set(x + 2, y + 1, 'eaveM')
      .set(x + 3, y + 1, 'eaveM')
      .set(x + 4, y + 1, 'eaveR');
    const front = garageLeft ? ['GarageL', 'GarageR', 'Win', 'Door', 'Win'] : ['Win', 'Door', 'Win', 'GarageL', 'GarageR'];
    front.forEach((f, i) => this.set(x + i, y + 2, `${color}${f}`));
    return garageLeft ? { door: x + 3, garage: x } : { door: x + 1, garage: x + 3 };
  }

  /** A green street-name sign on its corner post: two blocks, left half at (x, y). */
  street(x: number, y: number, sign: string): this {
    return this.set(x, y, `${sign}0`).set(x + 1, y, `${sign}1`);
  }

  build(): GameMap {
    reindexMonsters(this.map);
    // Count the money on the map (for the manual and the build log).
    let money = 0;
    const b = this.book.blocks;
    for (const n of this.map.blocks) if (b[n].effect === 3 && b[n].eamt > 0) money += b[n].eamt;
    this.money = money;
    return this.map;
  }
}

/** A plowed snowbank along a road, lamp posts every 9 blocks, gaps to cross at `gaps`. */
function bankRow(m: MapBuilder, x: number, y: number, w: number, gaps: number[]) {
  for (let i = 0; i < w; i++) m.set(x + i, y, gaps.includes(i) ? '_' : i % 9 === 5 ? 'L' : 'B');
}

// ------------------------------------------------------------------ level 1
/**
 * Gale Street, 7 AM: home is the corner house at Gale Street and Dunn Drive. Leota Street
 * runs north between the neighbors, Leon Drive crosses the east end (and leads to the
 * top of Jamie Street). One plow, Biscuit the dog, and front walks to dig out as well as
 * driveways (neighbors want to reach the car, and the paper on the mat). The paper carrier is you:
 * the paper bundle by the porch at home holds one paper for each customer's door mat.
 */
export function galeStreet(book: BlockBook) {
  const m = new MapBuilder(book);
  m.fill(10, 11, 55, 21, '.');
  // north side: houses with driveways and walks
  m.fill(10, 11, 55, 3, 'T');
  m.fill(10, 13, 55, 1, 'b');
  const houses: [number, 'red' | 'blue' | 'yellow', boolean][] = [
    [12, 'red', false],
    [21, 'blue', true],
    [30, 'yellow', false],
    [39, 'red', true],
    [49, 'blue', false],
  ];
  houses.forEach(([x, color, left], i) => {
    const { door, garage } = m.house(x, 11, color, left, i !== 2);
    if (i === 0) {
      // Home, on the corner of Gale and Dunn: Dad already shoveled it before work.
      m.fill(garage, 14, 2, 3, 'a').fill(door, 14, 1, 3, 's');
    } else {
      // a porch mat under every customer's door: the paper goes there, once it's dug out
      m.fill(garage, 14, 2, 3, 'D').set(door, 14, 'stoop').fill(door, 15, 1, 2, 'S');
      if (i % 2) m.set(left ? garage + 2 : garage - 1, 16, 'y');
    }
  });
  m.fill(10, 14, 2, 3, 'b').fill(18, 14, 2, 1, 'T').fill(27, 14, 2, 1, 'n').fill(36, 14, 2, 1, 'T').fill(45, 14, 3, 1, 'b').fill(55, 14, 9, 1, 'T');
  m.set(58, 15, 'n').set(61, 16, 'c');
  m.set(26, 14, 'n');
  m.set(43, 14, '5'); // a tip by Mrs. Haines' porch (her mat is at 42)
  // The News-Tribune bundle, dropped by the porch at home before dawn: papers first.
  m.set(12, 16, 'bundle');
  // sidewalk, plow banks, the road, banks, the south sidewalk
  m.fill(10, 17, 55, 1, 's');
  m.patch(11, 18, ['BB_BBBB_B_BBBBBBB_BB_BBBBB_BBBBBB_B_BBBBBBBB_BBBBBBB_B']);
  m.fill(8, 19, 59, 1, '=').fill(8, 20, 59, 1, '-');
  m.patch(10, 21, ['BBBBBLBB_BBBBBBLBBB_BBBBBLBBBBB_BBBBLBBBBB_BBBBLBBBBhB']);
  m.fill(10, 22, 55, 1, 's');
  // the park: your backyard snowman, the frozen pond, a practice fort
  m.patch(11, 23, [
    'T.c.....TT....,,,,,,,,,,,,,..........ff.fff......T....',
    '.n...........,>>>>>>>>>>v,....T.....f..........F...T..',
    '..TT........,^>>>$>>>>>vv,.........f.......K.......b..',
    '.....b......,^^<<<<$<<<<v,..n......f...............B..',
    'T...........,^<<<<<<<<<<<,.........f..T.....F.........',
    '..TT.........,,,,,,,,,,,,,......b..f..........T...T...',
    '.......n.....................T.....ffffff.f.....c.....',
    'TT...T....T....TT...........T....................TT...',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ]);
  m.fill(10, 23, 1, 8, '.');
  // The pines behind the park. The snowman out back has lost a mitten, and the pine behind
  // it is only drawn: a trail winds through the woods to a hollow where something lies in
  // the snow, and an old toboggan waits at the head of a run down to Jamie Street.
  m.set(18, 30, 'mitten');
  for (const [x, y] of [
    [18, 31],
    [18, 32],
    [18, 33],
    [19, 33],
    [20, 33],
    [21, 33],
    [21, 34],
    [21, 35],
  ])
    m.set(x, y, 'pineDrawn');
  m.patch(18, 36, ['TT....TTT', 'T......TT', 'T......TT', 'TT....TTT']);
  m.set(22, 38, 'feltEgg').set(25, 37, 'toboggan');
  m.link(25, 37, 'woods', 24, 37);
  // Dunn Drive runs north-south past the house, plowed down to the asphalt.
  m.fill(8, 4, 2, 27, 'a');
  m.street(10, 18, 'stGaleDunn');
  // Leota Street runs north between the yellow house and the red one, to two more customers.
  m.fill(28, 4, 19, 7, '.').fill(28, 4, 19, 1, 'T');
  m.fill(36, 4, 2, 15, 'a');
  const lh = [m.house(29, 5, 'blue', true), m.house(40, 5, 'yellow', false, false)];
  for (const h of lh) m.fill(h.garage, 8, 2, 2, 'D').set(h.door, 8, 'stoop').set(h.door, 9, 'S');
  m.fill(28, 10, 19, 1, 's').fill(36, 10, 2, 1, 'a');
  m.set(28, 9, 'b').set(46, 8, 'T').set(34, 8, 'n').set(46, 10, 'c');
  m.street(38, 18, 'stGaleLeota');
  // Leon Drive crosses the east end; take it north to the top of Jamie Street.
  m.fill(65, 12, 2, 17, 'a');
  m.street(63, 18, 'stGaleLeon');
  for (let y = 12; y < 29; y++) m.link(66, y, 'next', 0, 0);
  // traffic: one plow working the street; Biscuit; a cardinal
  m.vehicle(MON.plowAR, MON.plowBR, 12, 19);
  m.mon(MON.dog, 30, 26).mon(MON.cardinal, 16, 24).mon(MON.cardinal, 52, 29);
  return { m, start: [13, 16] as [number, number] };
}

// ------------------------------------------------------------------ level 2
/**
 * Jamie Street, noon: the steep end of Jamie Street is closed for sledding, and it is the
 * fast way down from Leon Drive to Bowden Drive.
 */
export function jamieHill(book: BlockBook) {
  const m = new MapBuilder(book);
  const x0 = 30;
  const rows = [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T,,,,,,,,,,,,,,,,,,,,,,T',
    'T,,,,,n,,,,,,,,,,,,n,,,T',
    'T,,,,,,,,,,,,,,,,,,,,,,T',
    'T,,T,,,,,,,,,,,,,,,,T,,T',
    'T!!!!!!!!!!!!!!!!!!!!!!T',
    'T~~~~~~~~~~Q~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'TY~~~~~R~~~~~~~~~~~~~YYT',
    'T~~~~~~~~~~Q~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~R~~~~~~~T',
    'T~~~~~~Q~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'TYY~~~~~r~~~~e~~~~~~~~~T',
    'T~~~~~~~~~Q~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~YT',
    'T~~~~~~~~~~~~r~~~~e~~~~T',
    'T~~~~~~~~~~~~~~Q~~~~~~~T',
    'T~~~~R~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~r~~~~e~~~~~~~~T',
    'T~~~~~~~~~~Q~~~~~~~~~~~T',
    'T~~oo~~oo~~~~~oo~~oo~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~YYY~~~~~~~~~~~~~T',
    'T~~~~~YYYYY~~~~~~RR~~~~T',
    'T~~Q~~~YYY~~~~~~~~~~~~~T',
    'T~~~~~~~Y~~~~~~~~~~~~qYT',
    'T~~~~~~~~~~~~~~YYY~~~~YT',
    'T~~~~~~~~~~~~~YYYYY~~~~T',
    'T~~~~~~~~~~~~~~YYY~~~~~T',
    'T~~~~~~~~~~~~~~~Y~~~Q~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T!!!!!!!!!!!!!!!!!!!!!!T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~Q~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~Q~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'TYYYYYY~~~~~~~~~~YYYYYYT',
    'TYYYYYYY~~~~~~~~YYYYYYYT',
    'TYYYYYYY~~~R~~~~YYYYYYYT',
    'TYYYYYYY~~~~~~~~YYYYYYYT',
    'TYYYYYY~~~Q~~~~~~YYYYYYT',
    'TYYYYY~~~~~~~~~~~~YYYYYT',
    'TYYY~~~~~~~~~~~~~~~~YYYT',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~o~~o~~o~~o~~o~~o~~o~T',
    'T~o~~o~~o~~Q~~o~~o~~o~~T',
    'T~~o~~o~~o~~o~~o~~o~~o~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T!!!!!!!!!!!!!!!!!!!!!!T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~YY~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~YY~~~~~T',
    'T~~~Q~~~~~YY~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~Q~~T',
    'TYY~~~~~~~~~~~YY~~~~~~~T',
    'T~~~~~~~YY~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~YY~~~T',
    'T~~~~YY~~~~~~Q~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~YY~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~r~~~~e~~~~~~~~~T',
    'T~~~~~~~~~~Q~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~e~~~~r~~~~~T',
    'T~~~~~~~~~~~~~Q~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~r~~~~e~~~~~~~~~~~T',
    'T~~~~~~~Q~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'T~~~~~~~~~~~~~~~~~~~~~~T',
    'TTXXXXXXXXXXXXXXXXXXXXTT',
    'T,,,,,,,,,,,,,,,,,,,,,,T',
    'T,,,,,,,,,,,,,,,,,,,,,,T',
    'T,,,,,,,,,,,,,,,,,,,,,,T',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ];
  const y0 = 4;
  // ':' tracks on plain slope rows for texture
  m.patch(
    x0,
    y0,
    rows.map((r, i) => (i % 9 === 4 ? r.replace(/~/g, ':') : r)),
  );
  const finishY = y0 + rows.findIndex((r) => r.includes('X'));
  // the corner signs at the top and the bottom of the run
  m.street(x0 + 7, y0 + 1, 'stLeonJamie');
  m.street(x0 + 18, finishY - 2, 'stJamieBowden');
  for (let x = x0 + 2; x < x0 + 22; x++) m.link(x, finishY, 'next', 0, 0);
  // kids on toboggans cutting across
  for (const [x, y] of [
    [x0 + 3, y0 + 27],
    [x0 + 12, y0 + 33],
    [x0 + 4, y0 + 38],
    [x0 + 13, y0 + 55],
    [x0 + 2, y0 + 62],
    [x0 + 9, y0 + 70],
  ])
    m.mon(MON.sledder, x, y);
  return { m, start: [x0 + 11, y0 + 2] as [number, number] };
}

// ------------------------------------------------------------------ level 3
/**
 * Bowden Drive, 4:30 PM: a long row of customers, two plows and a car, the snowball war in
 * the park, and the frozen creek. East end: the road to LaVale.
 */
export function bowdenDrive(book: BlockBook) {
  const m = new MapBuilder(book);
  const X = 6;
  m.fill(X, 21, 74, 26, '.');
  // houses all along the north side
  m.fill(X, 21, 74, 3, 'T');
  m.fill(X, 24, 74, 1, 's').fill(X, 25, 74, 1, 's');
  const north: [number, 'red' | 'blue' | 'yellow', boolean, 'D' | 'a'][] = [
    [2, 'red', false, 'D'],
    [9, 'blue', true, 'D'],
    [16, 'yellow', true, 'a'],
    [23, 'red', false, 'D'],
    [30, 'blue', false, 'D'],
    [37, 'red', false, 'a'],
    [44, 'yellow', true, 'D'],
    [52, 'blue', true, 'D'],
  ];
  north.forEach(([x, color, left, snow], i) => {
    const h = m.house(X + x, 21, color, left, i % 3 !== 2);
    m.fill(h.garage, 24, 2, 2, snow);
    if (snow === 'D') m.set(h.door, 24, 'S');
  });
  m.fill(X + 58, 21, 16, 3, 'T');
  m.set(X + 59, 23, 'b')
    .set(X + 62, 23, 'n')
    .set(X + 66, 23, 'b');
  m.set(X + 24, 25, '5'); // the Kellers leave a tip on the walk
  m.set(X + 35, 25, 'y').set(X + 57, 25, 'y');
  m.patch(X + 13, 25, ['vv'])
    .patch(X + 42, 25, ['vv'])
    .patch(X + 50, 25, ['v']);
  bankRow(m, X, 26, 74, [2, 9, 13, 14, 20, 27, 34, 35, 36, 41, 48, 50, 51, 57, 66, 71]);
  m.fill(X, 27, 75, 1, '=').fill(X, 28, 75, 1, '-');
  bankRow(m, X, 29, 74, [4, 12, 22, 30, 39, 46, 53, 62, 70]);
  m.fill(X, 30, 74, 1, 's');
  // the park: forts, Big Pete, Biscuit, and the creek frozen solid
  m.patch(X, 31, [
    '..T.....F.......T......b......T.....F........T......n.....T......F.....T..',
    '.T..........n.........................................................T...',
    '.....b..........T....F.........K.........T.........F...........b.........',
    '..........T.........................c..........T..........................',
    'T....F.........b...........T...............................T......F....T..',
    '...............................................b...........................',
    '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>#>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
    '>>>>>>>>$>>>>>>>>>>>>>>>>>>>>>>>>>>>>>#>>>>>>>>>>>>>>$>>>>>>>>>>>>>>>>>>>',
    '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>#>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
    '..........................................................................',
  ]);
  // south of the creek: two more customers
  const s1 = m.house(X + 20, 41, 'blue', false);
  const s2 = m.house(X + 46, 41, 'yellow', true);
  m.fill(X, 41, 20, 3, 'T')
    .fill(X + 25, 41, 21, 3, 'T')
    .fill(X + 51, 41, 23, 3, 'T');
  m.fill(X, 44, 74, 2, '.');
  for (const h of [s1, s2]) m.fill(h.garage, 44, 2, 2, 'D').set(h.door, 44, 'S');
  m.set(X + 30, 44, 'c')
    .set(X + 60, 45, 'n')
    .set(X + 10, 44, 'b')
    .set(X + 70, 44, 'T');
  // the corner where you come off Jamie Street, and the road to LaVale at the east end
  m.street(X + 3, 26, 'stJamieBowden');
  m.fill(X + 74, 27, 1, 2, '=').set(X + 74, 28, '-');
  m.street(X + 70, 26, 'stBowdenLaVale');
  m.set(X + 72, 26, 'm');
  m.link(X + 74, 27, 'next', 0, 0).link(X + 74, 28, 'next', 0, 0);
  // traffic: a plow in the near lane, a car in the far one
  m.vehicle(MON.plowAR, MON.plowBR, X + 1, 27);
  m.vehicle(MON.plow2AR, MON.plow2BR, X + 40, 27);
  m.vehicle(MON.carAR, MON.carBR, X + 20, 28);
  m.mon(MON.bully, X + 40, 33)
    .mon(MON.dog, X + 12, 34)
    .mon(MON.dog, X + 60, 32)
    .mon(MON.cardinal, X + 30, 44);
  return { m, start: [X + 1, 25] as [number, number] };
}

// ------------------------------------------------------------------ level 4
/** LaVale Mall, 8 PM: the lot, the squall, the Timeout arcade and Bits & Bytes Software. */
export function lavaleMall(book: BlockBook) {
  const m = new MapBuilder(book);
  const X = 10;
  m.fill(X, 11, 60, 34, 'p');
  // the mall front
  m.fill(X, 11, 60, 1, 'flatRoof');
  m.fill(X, 12, 60, 2, 'mallWall');
  for (let i = 0; i < 6; i++) m.set(X + 6 + i, 12, `mall${i}`);
  for (let i = 0; i < 60; i += 3) m.set(X + i + 1, 13, 'mallDoor');
  m.set(X + 8, 13, 'mallDoor').set(X + 9, 13, 'mallDoor');
  m.set(X + 37, 13, 'mallWall')
    .set(X + 39, 13, 'mallWall')
    .set(X + 41, 13, 'mallWall')
    .set(X + 43, 13, 'mallWall');
  for (let i = 0; i < 5; i++) m.set(X + 38 + i, 12, `store${i}`);
  m.set(X + 38, 13, 'boxWindow')
    .set(X + 40, 13, 'storeDoor')
    .set(X + 42, 13, 'boxWindow');
  m.set(X + 24, 13, 'mallDoor').set(X + 25, 13, 'mallDoor');
  // Timeout, the arcade, with its chasing marquee
  for (let i = 0; i < 3; i++) m.set(X + 17 + i, 12, `arcade0${i}`);
  m.set(X + 17, 13, 'arcadeWin')
    .set(X + 18, 13, 'arcadeDoor')
    .set(X + 19, 13, 'arcadeWin');
  m.link(X + 40, 13, 'won', 0, 0);
  // walk in front of the mall
  m.fill(X, 14, 60, 2, 's');
  m.patch(X, 15, ['  SSS        SSS        SSS                  SSS      SSS']);
  // the History Fair table on the walk, and the corkboard on the wall behind it
  m.set(X + 27, 14, 'fairMan').set(X + 28, 14, 'fairBell').set(X + 29, 14, 'fairFlag');
  m.set(X + 32, 13, 'board0').set(X + 33, 13, 'board1');
  // Timeout's snack bar: root beer, and only root beer
  m.set(X + 16, 14, 'rootBeer');
  m.patch(X, 16, ['BB_LB_BBBBLBBB_BBBLBBBB_BBBLBBBB__BBBLBBB_BBBBLBBB_BBBLBB_B']);
  // the fire lane
  m.fill(X, 17, 60, 1, '=').fill(X, 18, 60, 1, '-');
  m.patch(X, 19, ['BBBB_BBLBB_BBBBBLBBB_BBBBBLBBBB__BBBLBBBB_BBBBBLBB_BBBB_BBBB']);
  // the lot: three rows of buried cars with lamp islands; some cars still need digging out
  for (const [row, y] of [21, 26, 31].entries()) {
    for (let k = 0; k < 11; k++) {
      const cx = X + 2 + k * 5 + (k >= 5 ? 3 : 0);
      m.set(cx, y, '[').set(cx + 1, y, ']');
      if ((k + row) % 2 === 0) m.set(cx, y + 1, 'P').set(cx + 1, y + 1, 'P');
      else if ((k + row) % 3 === 0) m.set(cx - 1, y, 'P');
    }
    m.set(X + 28, y, 'L').fill(X + 27, y + 1, 3, 1, 'B');
  }
  // THE CHEZ, the CitiCar, buried with the rest in the back row by the way in
  m.set(X + 2, 31, 'chezL').set(X + 3, 31, 'chezR');
  m.patch(X, 35, ['BBBB', 'u', '']).patch(X + 55, 35, ['BBBBB']);
  m.fill(X, 36, 4, 2, ',')
    .fill(X + 55, 36, 5, 2, ',')
    .set(X + 57, 37, 'T')
    .set(X, 36, 'u');
  m.set(X + 52, 27, 'c');
  m.fill(X, 38, 60, 7, 'T');
  m.fill(X - 1, 11, 1, 34, 'T').fill(X + 60, 11, 1, 34, 'T');
  // traffic: the plow sweeps the fire lane; another works the middle aisle; carts roll free
  m.vehicle(MON.plowAR, MON.plowBR, X + 1, 17);
  m.vehicle(MON.plow2AR, MON.plow2BR, X + 3, 29);
  for (const [x, y] of [
    [X + 14, 23],
    [X + 44, 24],
    [X + 30, 33],
  ])
    m.mon(MON.cart, x, y);
  m.mon(MON.bully, X + 50, 31).mon(MON.dog, X + 20, 34);
  return { m, start: [X + 1, 36] as [number, number] };
}
