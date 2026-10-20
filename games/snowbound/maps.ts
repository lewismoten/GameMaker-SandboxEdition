// The four levels, laid out with a little builder: fills, ASCII patches for parks and the
// sled run, and stamps for houses, shops and the mall.
import { newMap, reindexMonsters, type GameMap } from '../../web/src/formats/map';
import type { BlockBook } from './blocks';
import { MON } from './ids';

/** ASCII legend → block name ('.' picks a yard variant). */
const LEGEND: Record<string, string> = {
  ',': 'plain',
  T: 'tree',
  b: 'bush',
  f: 'fence',
  L: 'lamp',
  M: 'mailbox',
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
  toScene: 'next' | 'won';
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

  /** A shop: flat roof, sign (padded with wall), windows and a door. */
  shop(x: number, y: number, w: number, sign: string, signTiles: number, doorAt = 1): this {
    for (let i = 0; i < w; i++) {
      this.set(x + i, y, 'flatRoof');
      const s = i - Math.floor((w - signTiles) / 2);
      this.set(x + i, y + 1, s >= 0 && s < signTiles ? `${sign}${s}` : 'shopWall');
      this.set(x + i, y + 2, i === doorAt ? 'shopDoor' : 'shopWin');
    }
    return this;
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
/** Pine Street, 7 AM: your own street. Five houses, one plow, Biscuit the dog. */
export function pineStreet(book: BlockBook) {
  const m = new MapBuilder(book);
  m.fill(11, 11, 54, 21, '.');
  // north side: houses with driveways and walks
  m.fill(11, 11, 54, 3, 'T');
  m.fill(11, 13, 54, 1, 'b');
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
      // Your own house: Dad already shoveled it before work.
      m.fill(garage, 14, 2, 3, 'a').fill(door, 14, 1, 3, 's');
    } else {
      m.fill(garage, 14, 2, 3, 'D').set(door, 14, 's').fill(door, 15, 1, 2, 'S');
      m.set(left ? garage + 2 : garage - 1, 16, 'M');
    }
  });
  m.fill(11, 14, 1, 3, 'b').fill(18, 14, 2, 1, 'T').fill(27, 14, 2, 1, 'n').fill(36, 14, 2, 1, 'T').fill(45, 14, 3, 1, 'b').fill(55, 14, 9, 1, 'T');
  m.set(58, 15, 'n').set(61, 16, 'c');
  m.set(26, 14, 'n');
  m.set(42, 14, '5'); // a tip on Mrs. Haines' porch
  // sidewalk, plow banks, the road, banks, the south sidewalk
  m.fill(11, 17, 54, 1, 's');
  m.patch(11, 18, ['BB_BBBB_B_BBBBBBB_BB_BBBBB_BBBBBB_B_BBBBBBBB_BBBBBBB_B']);
  m.fill(11, 19, 55, 1, '=').fill(11, 20, 55, 1, '-');
  m.patch(11, 21, ['BBBBLBB_BBBBBBLBBB_BBBBBLBBBBB_BBBBLBBBBB_BBBBLBBBBhB']);
  m.fill(11, 22, 54, 1, 's');
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
  // the road out of town runs off the east end
  m.fill(65, 19, 1, 2, '=').set(65, 20, '-');
  m.link(65, 19, 'next', 0, 0).link(65, 20, 'next', 0, 0);
  // traffic: one plow working the street; Biscuit; a cardinal
  m.vehicle(MON.plowAR, MON.plowBR, 12, 19);
  m.mon(MON.dog, 30, 26).mon(MON.cardinal, 16, 24).mon(MON.cardinal, 52, 29);
  return { m, start: [13, 16] as [number, number] };
}

// ------------------------------------------------------------------ level 2
/** Knobley Hill, noon: the sled run down to town. */
export function knobleyHill(book: BlockBook) {
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
/** Main Street, Fort Ashby, 4 PM: shops, traffic, the frozen creek and the snowball war. */
export function mainStreet(book: BlockBook) {
  const m = new MapBuilder(book);
  const X = 6;
  m.fill(X, 21, 74, 26, '.');
  // shops along the north side
  m.fill(X, 21, 74, 3, 'T');
  m.shop(X + 2, 21, 4, 'bakery', 3, 1);
  m.shop(X + 8, 21, 5, 'hardware', 4, 3);
  const h1 = m.house(X + 15, 21, 'yellow', true);
  m.shop(X + 22, 21, 4, 'diner', 3, 2);
  m.shop(X + 29, 21, 5, 'post', 5, 2);
  const h2 = m.house(X + 37, 21, 'red', false);
  m.shop(X + 45, 21, 4, 'bakery', 3, 2);
  const h3 = m.house(X + 52, 21, 'blue', true, false);
  m.fill(X + 58, 21, 16, 3, 'T');
  m.set(X + 59, 23, 'b')
    .set(X + 62, 23, 'n')
    .set(X + 66, 23, 'b');
  // sidewalks: deep snow in front of the shops (the owners pay), ice where it's shady
  m.fill(X, 24, 74, 1, 's').fill(X, 25, 74, 1, 's');
  m.fill(X + 2, 24, 4, 1, 'S')
    .fill(X + 8, 24, 5, 1, 'S')
    .fill(X + 22, 24, 4, 1, 'S')
    .fill(X + 29, 24, 5, 1, 'S')
    .fill(X + 45, 24, 4, 1, 'S');
  for (const h of [h1, h2, h3]) m.fill(h.garage, 24, 2, 2, 'D');
  m.set(X + 24, 25, '5'); // the diner owner leaves a tip
  m.patch(X + 13, 25, ['vv'])
    .patch(X + 34, 25, ['vvv'])
    .patch(X + 50, 25, ['vv']);
  bankRow(m, X, 26, 74, [2, 9, 13, 14, 20, 27, 34, 35, 36, 41, 48, 50, 51, 57, 66, 71]);
  m.fill(X, 27, 75, 1, '=').fill(X, 28, 75, 1, '-');
  bankRow(m, X, 29, 74, [4, 12, 22, 30, 39, 46, 53, 62, 70]);
  m.fill(X, 30, 74, 1, 's');
  // the town park: forts, Big Pete, Biscuit, and Patterson Creek frozen solid
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
  // out of town on Route 28 toward the mall
  m.fill(X + 74, 27, 1, 2, '=').set(X + 74, 28, '-');
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
/** Mill Creek Mall, 8 PM: the lot, the squall, and Bits & Bytes Software. */
export function mall(book: BlockBook) {
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
  m.link(X + 40, 13, 'won', 0, 0);
  // walk in front of the mall
  m.fill(X, 14, 60, 2, 's');
  m.patch(X, 15, ['  SSS        SSS        SSS                  SSS      SSS']);
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
