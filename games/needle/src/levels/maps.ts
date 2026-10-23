// The four levels, from the song, each laid out block by block in its own block set; everything
// outside a level is solid:
//   1. The City Gate: mindin' his humps by the gate as the rich man walks off; through the
//      market, giving the rich man's gold away, out the little "needle gate" on his knees.
//   2. The Desert Road: "ain't no real gate"; dunes, sandstorms, scorpions, slot canyons and
//      the narrow ways (eye gates), to the tailor's tent.
//   3. The Tailor's Shop: "I asked a tailor what thread feel feels"; spools of thread, threads
//      to climb, pins, scissors, the sewing machine, needles to crawl through.
//   4. The Eye of the Needle: up the great golden needle in the night, and through its eye.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/common';
import { MON } from '../ids';

export interface LinkSpec {
  from: [number, number];
  toScene: 'next' | 'won';
}

/** Where a level's map sits in the 100x100 world (the rest is solid). */
export const ORIGIN = 2;

export class MapBuilder {
  readonly map: GameMap = newMap();
  readonly links: LinkSpec[] = [];
  private monCount = 0;
  constructor(
    private book: BlockBook,
    private legend: Record<string, string>,
    filler: string,
  ) {
    this.map.blocks.fill(book.n(filler));
  }

  private block(ch: string): number {
    const name = this.legend[ch];
    if (!name) throw new Error(`Unknown map char "${ch}"`);
    return this.book.n(name);
  }

  /** Sets a block at level coordinates (a char from the legend, or a block name). */
  set(x: number, y: number, what: string): this {
    this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = what.length === 1 ? this.block(what) : this.book.n(what);
    return this;
  }

  fill(x: number, y: number, w: number, h: number, ch: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch);
    return this;
  }

  /** A column of `ch` from row y0 to y1 (inclusive). */
  col(x: number, y0: number, y1: number, ch: string): this {
    return this.fill(x, y0, 1, y1 - y0 + 1, ch);
  }

  /** A run of `ch` along row y from x0 to x1 (inclusive). */
  row(y: number, x0: number, x1: number, ch: string): this {
    return this.fill(x0, y, x1 - x0 + 1, 1, ch);
  }

  /** Puts each char of `s` at (x + i, y); spaces are left alone. */
  text(x: number, y: number, s: string): this {
    [...s].forEach((ch, i) => ch !== ' ' && this.set(x + i, y, ch));
    return this;
  }

  /** ASCII rows at (x, y); spaces are left alone. */
  patch(x: number, y: number, rows: string[]): this {
    rows.forEach((row, dy) => this.text(x, y + dy, row));
    return this;
  }

  mon(id: number, x: number, y: number): this {
    if (this.monCount >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum: id, status: 0, xtra: 0, curx: x + ORIGIN, cury: y + ORIGIN, extra: 0 };
    return this;
  }

  /** The rich man, two blocks wide, his back at (x, y), walking right first. */
  richMan(x: number, y: number): this {
    return this.mon(MON.richAR, x, y).mon(MON.richBR, x + 1, y);
  }

  link(x: number, y: number, toScene: LinkSpec['toScene']): this {
    this.links.push({ from: [x + ORIGIN, y + ORIGIN], toScene });
    return this;
  }

  build(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}

export interface Level {
  m: MapBuilder;
  /** Where the camel starts, in world blocks (his bottom block). */
  start: [number, number];
  /** The level's size in blocks (for previews and cards). */
  size: [number, number];
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

const CITY: Record<string, string> = {
  '.': 'bg',
  '^': 'skyHi',
  '~': 'wisp',
  '0': 'far0',
  '1': 'far1',
  '2': 'far2',
  '3': 'far3',
  '4': 'far4',
  '-': 'skyMid',
  _: 'band1',
  ',': 'band2',
  u: 'dune',
  '=': 'street',
  '#': 'earth',
  W: 'wall',
  T: 'wallTop',
  '(': 'archL',
  '|': 'archM',
  ')': 'archR',
  g: 'gateway',
  d: 'doorway',
  S: 'gateSign',
  R: 'awningR',
  B: 'awningB',
  I: 'post',
  p: 'counterPots',
  c: 'counterCloth',
  f: 'counterFruit',
  C: 'cart',
  X: 'crate',
  o: 'pots',
  H: 'house',
  h: 'houseWin',
  r: 'roof',
  L: 'laundry',
  s: 'step',
  P: 'palm',
  Y: 'palmTop',
  U: 'well',
  b: 'beggar',
  v: 'widow',
  k: 'kids',
  n: 'blind',
  D: 'dates',
  J: 'jar',
  O: 'lamp',
  '*': 'glint',
  '>': 'road',
};

const DESERT: Record<string, string> = {
  '.': 'bg',
  '^': 'skyHi',
  '-': 'skyMid',
  _: 'band1',
  ',': 'band2',
  O: 'sun',
  '0': 'far0',
  '1': 'far1',
  '2': 'far2',
  '=': 'sand',
  '#': 'sandFill',
  R: 'rock',
  r: 'rockTop',
  M: 'roofRock',
  s: 'shade',
  l: 'ledge',
  g: 'gust0',
  o: 'boulder',
  x: 'cactus',
  b: 'brush',
  B: 'bones',
  P: 'palm',
  Y: 'palmTop',
  w: 'pool',
  n: 'nomad',
  k: 'kids',
  G: 'gate',
  D: 'dates',
  J: 'jar',
  L: 'lamp',
  j: 'jarS',
  e: 'datesS',
  '*': 'glint',
  t: 'tentWall',
  T: 'tentSign',
  d: 'tentDoor',
  '[': 'tent0',
  '|': 'tent1',
  ']': 'tent2',
};

/** 1. The city gate: through the morning market, the poor along the way, out the needle gate on his knees. */
export function city(book: BlockBook): Level {
  const W = 80;
  const H = 13;
  const m = new MapBuilder(book, CITY, 'earth');
  // sky, the street (standing row 9), earth under it, the wall all round
  m.fill(1, 0, W - 2, 1, '^').row(1, 1, W - 2, '_').fill(1, 2, W - 2, 2, '-').row(4, 1, W - 2, ',').fill(1, 5, W - 2, 5, '.').row(10, 0, W - 1, '=').fill(0, 11, W, 2, '#').col(0, 0, 9, 'W').col(W - 1, 0, 9, 'W');
  m.set(12, 2, '~').set(36, 3, '~').set(61, 2, '~');
  // the great city gate behind him, where he was mindin' his humps
  m.row(1, 1, 3, 'T').fill(1, 2, 3, 3, 'W').text(1, 5, '(|)').fill(1, 6, 3, 4, 'g');
  m.col(7, 6, 9, 'P').set(7, 5, 'Y');
  // the city in the morning haze, where the rich man struts with his moneybags
  // the city in the haze behind the market, all along the street
  const SKYLINE = ['  3       3    ', '1 3 2  1  3 2 1', '000004000000400'];
  for (const x of [8, 23, 41, 56]) m.patch(x, 7, SKYLINE.map((r) => r.slice(0, Math.min(15, 69 - x))));
  m.set(13, 9, '*');
  // the first stall, with pots; a beggar beside it
  m.row(6, 18, 22, 'R').col(18, 7, 9, 'I').col(22, 7, 9, 'I').row(9, 19, 21, 'p').set(20, 5, '*');
  m.set(23, 9, 'b');
  m.set(25, 9, 'X').col(26, 8, 9, 'X').set(28, 9, 'v');
  // the houses: up the steps and across the roofs (children up there), laundry on the line
  m.set(29, 9, 's').col(30, 8, 9, 's').fill(31, 7, 7, 3, 'H').text(31, 8, 'h.h.h.h'.replace(/\./g, 'H')).row(6, 31, 37, 'r');
  m.row(3, 32, 36, 'L').set(34, 5, 'k').set(36, 5, 'D').set(32, 5, '*');
  m.set(39, 9, 'o').col(40, 6, 9, 'P').set(40, 5, 'Y');
  // the blind man by the well, the fruit cart (melons roll down the street at you)
  m.set(42, 9, 'n').set(43, 9, 'U').set(46, 9, 'C');
  // the second stall, with fruit
  m.row(6, 54, 58, 'B').col(54, 7, 9, 'I').col(58, 7, 9, 'I').row(9, 55, 57, 'f').set(56, 5, '*');
  // crates stacked by the wall, the golden lamp on top
  m.set(64, 9, 'X').col(65, 8, 9, 'X').col(66, 7, 9, 'X').set(66, 6, 'O').set(67, 9, 'J');
  // the city wall and the little needle gate: one block high (hump down and crawl through)
  m.col(70, 0, 8, 'W').col(71, 0, 8, 'W').set(70, 6, 'S').row(9, 70, 71, 'd');
  // outside: the road
  m.row(9, 72, 78, 'u').set(76, 9, '>');
  m.richMan(10, 9);
  m.mon(MON.pigeon, 31, 2).mon(MON.guard, 49, 9).mon(MON.dog, 59, 9).mon(MON.pigeon, 44, 3);
  m.link(76, 9, 'next');
  return { m, start: at(5, 9), size: [W, H] };
}

/** 2. The desert road: dunes, the sandstorm, the slot canyon's eye gates, the oasis, to the tailor's tent. */
export function desert(book: BlockBook): Level {
  const W = 84;
  const H = 13;
  const m = new MapBuilder(book, DESERT, 'sandFill');
  m.fill(1, 0, W - 2, 1, '^').row(1, 1, W - 2, '_').fill(1, 2, W - 2, 2, '-').row(4, 1, W - 2, ',').fill(1, 5, W - 2, 6, '.').col(0, 0, 10, 'R').col(W - 1, 0, 10, 'R');
  m.set(70, 2, 'O');
  // the ground: [from x, to x, top row] (he stands on the row above)
  const ground: [number, number, number][] = [
    [1, 6, 10],
    [7, 8, 9],
    [9, 11, 8],
    [12, 13, 9],
    [14, 40, 10],
    [41, 54, 10],
    [55, 62, 10],
    [63, 66, 9],
    [67, 69, 8],
    [70, 82, 10],
  ];
  for (const [x0, x1, top] of ground) m.row(top, x0, x1, '=').fill(x0, top + 1, x1 - x0 + 1, 12 - top, '#');
  // far mesas and dunes in the haze
  m.text(1, 9, '0200 200').text(14, 9, '02 00 20').text(55, 9, '0').text(59, 9, '02').text(74, 9, '20');
  m.set(4, 9, 'B').set(15, 9, 'x').mon(MON.scorpion, 19, 9).set(20, 9, '*').set(22, 9, 'n');
  // the sandstorm: gusts that blow him back; boulders to shelter behind
  m.set(24, 9, 'o').fill(25, 7, 5, 3, 'g').set(30, 9, 'o').fill(31, 7, 5, 3, 'g').set(36, 9, 'o').set(33, 6, '*');
  m.set(38, 9, 'k');
  // the slot canyon: a passage one block high, two eye gates, two rooms to stand up in
  m.fill(41, 2, 14, 7, 'R').row(2, 41, 54, 'r').row(8, 41, 44, 'M').row(9, 41, 44, 's');
  m.fill(45, 5, 2, 4, 's').set(45, 9, 's').set(46, 9, 'j').row(8, 47, 49, 'M').set(47, 9, 'G').row(9, 48, 49, 's');
  m.fill(50, 5, 2, 4, 's').set(50, 9, 's').set(51, 9, 'e').row(8, 52, 54, 'M').set(52, 9, 'G').row(9, 53, 54, 's');
  // the oasis: palms, the pool, the third goat on her ledge, another traveler
  m.col(56, 6, 9, 'P').set(56, 5, 'Y').row(9, 57, 58, 'w').col(61, 6, 9, 'P').set(61, 5, 'Y').set(60, 5, 'D');
  m.row(6, 58, 60, 'l').set(59, 5, '*').set(62, 9, 'n');
  // dunes and a vulture, the dry brush where tumbleweeds come from
  m.set(65, 8, 'B').set(68, 7, '*').set(73, 9, 'b').set(71, 6, 'L');
  m.row(7, 70, 72, 'l');
  // the tailor's tent at the end of the road
  // (a few blocks on past the lamp, so the song's "Thread the needle" plays out on the way in)
  m.text(79, 7, '[|]').text(79, 8, 'tTt').text(79, 9, 'tdt').col(81, 8, 9, 'tentWallR');
  m.mon(MON.goat, 58, 5).mon(MON.vulture, 63, 3).mon(MON.vulture, 18, 3);
  m.link(80, 9, 'next');
  return { m, start: at(3, 9), size: [W, H] };
}

const TAILOR: Record<string, string> = {
  '.': 'bg',
  '%': 'dark',
  '#': 'rafter',
  '=': 'floor',
  L: 'wallLamp',
  w: 'window',
  '-': 'shelf',
  r: 'boltR',
  b: 'boltB',
  p: 'boltP',
  o: 'buttonR',
  O: 'buttonG',
  _: 'tape',
  T: 'table',
  t: 'treadle',
  m: 'machine0',
  M: 'machine1',
  '|': 'thread',
  f: 'fray',
  s: 'spool',
  S: 'spoolB',
  x: 'pins',
  N: 'shaft',
  A: 'shaftOverEye',
  V: 'shaftUnderEye',
  e: 'eyeHole',
  v: 'point',
  G: 'gate',
  q: 'seamstress',
  W: 'widow',
  B: 'beggar',
  D: 'dates',
  J: 'jar',
  '1': 'lamp',
  d: 'door',
  n: 'doorTop',
  c: 'scraps',
  R: 'robe0',
  '2': 'robe1',
  K: 'cloak0',
  '3': 'cloak1',
};

/** 3. The tailor's shop: spools, threads to climb and mend, needles' eyes to crawl through, the sewing machine. */
export function tailor(book: BlockBook): Level {
  const W = 64;
  const H = 18;
  const m = new MapBuilder(book, TAILOR, 'rafter');
  m.fill(1, 1, W - 2, 15, '.').row(16, 0, W - 1, '=').row(17, 0, W - 1, '#');
  m.text(14, 1, 'R K').text(14, 2, '2 3').text(36, 1, 'K').text(36, 2, '3').text(26, 1, 'R').text(26, 2, '2');
  m.set(4, 6, 'L').set(20, 12, 'w').set(30, 3, 'L').set(40, 6, 'w').set(44, 11, 'L').set(52, 7, 'w');
  // the seamstress by the door, a spool on the floor; the first thread, frayed halfway up
  m.set(5, 15, 'q').set(7, 15, 's').col(8, 1, 15, '|').set(8, 15, 'f').fill(9, 12, 2, 4, 'r').set(3, 15, 'c');
  // the first shelf: the widow, a moth, a spool; cloth and scraps under it, and the scissors
  m.row(8, 9, 21, '-').set(13, 7, 'W').set(18, 7, 'S').set(11, 11, 'p').fill(19, 13, 3, 3, 'b').set(15, 15, 'c');
  // the first great needle: its eye (an eye gate) at the shelf, the shelf on through it
  m.col(22, 1, 5, 'N').set(22, 6, 'A').set(22, 7, 'G').set(22, 8, 'V').col(22, 9, 14, 'N').set(22, 15, 'v').row(8, 23, 25, '-');
  // the sewing machine's table: its needle stabs down (kneel under it); a spool, the beggar
  m.row(10, 26, 35, 'T').col(26, 11, 15, 't').col(35, 11, 15, 't').set(28, 9, 's').set(34, 9, 'B');
  // the machine on the table: its head over the needle at the end of the arm, the pillar and wheel
  m.text(31, 4, 'mM').set(33, 4, 'machineArm').set(33, 5, 'machineWheel').col(33, 6, 8, 'machinePillar');
  m.set(31, 9, 'machineBedL').set(32, 9, 'machineBed').set(33, 9, 'machineBase');
  // the floor: a thimble, dates; the second thread, frayed where he steps on
  m.set(37, 15, 'c').set(40, 15, 's').set(43, 15, 'D').col(46, 1, 15, '|').set(46, 15, 'f').fill(47, 12, 1, 4, 'p');
  // a middle shelf, and a third thread, frayed where he steps on from it
  m.row(9, 47, 50, '-').set(49, 8, 'J').col(51, 1, 12, '|').set(51, 8, 'f').fill(48, 13, 3, 3, 'r');
  // the high shelf: a golden lamp, a mustard seed
  m.row(4, 52, 57, '-').set(54, 3, '1');
  // the last needle: crawl through its eye at the floor to the back door
  m.col(59, 1, 13, 'N').set(59, 14, 'A').set(59, 15, 'e').set(61, 14, 'n').set(61, 15, 'd');
  m.mon(MON.moth, 15, 5).mon(MON.scissors, 12, 15).mon(MON.needle, 31, 5).mon(MON.thimble, 38, 15).mon(MON.moth, 54, 10).mon(MON.seed, 56, 3);
  m.link(61, 15, 'next');
  return { m, start: at(2, 15), size: [W, H] };
}

/** The sky's shade on each row of the needle level (5 at the top, dawn; 0 at the bottom, night), and the band rows between. */
const EYE_SHADES: [number, number, number][] = [
  [0, 5, 5],
  [6, 6, -4],
  [7, 13, 4],
  [14, 14, -3],
  [15, 21, 3],
  [22, 22, -2],
  [23, 29, 2],
  [30, 30, -1],
  [31, 37, 1],
  [38, 38, -0.5],
  [39, 43, 0],
];
export const eyeShade = (row: number): number => {
  const s = EYE_SHADES.find(([a, b]) => row >= a && row <= b)![2];
  return s < 0 ? Math.ceil(-s) : s;
};

/** 4. The eye of the needle: up the golden thread, the Spirit's updraft, through the shaft, to the eye. */
export function eye(book: BlockBook): Level {
  const W = 26;
  const H = 46;
  const m = new MapBuilder(book, { '.': 'bg' }, 'edge');
  for (const [a, b, s] of EYE_SHADES) for (let y = a; y <= b; y++) m.row(y, 1, W - 2, s < 0 ? `band${Math.floor(-s)}` : s === 0 ? 'bg' : `sky${s}`);
  m.fill(0, 44, W, 2, 'dune').col(0, 0, 43, 'edge').col(W - 1, 0, 43, 'edge');
  const cloud = (y: number, x0: number, x1: number) => m.row(y, x0, x1, `cloud${eyeShade(y)}`);
  // the sleeping city far below, the moon
  for (let x = 1; x < W - 1; x++) if (x < 11 || x > 14) m.set(x, 43, x % 2 ? 'town0' : 'town1');
  m.set(20, 34, 'moon');
  // the great golden needle: its point in the sand, its shaft, its head and its eye
  m.set(12, 43, 'pointL').set(13, 43, 'pointR');
  for (let y = 7; y <= 42; y++) m.set(12, y, `shaftL${Math.min(5, eyeShade(y))}`).set(13, y, `shaftR${Math.min(5, eyeShade(y))}`);
  for (let y = 0; y < 7; y++) m.set(12, y, `head${y}L`).set(13, y, `head${y}R`);
  m.set(13, 5, 'pupil');
  // a small eye gate through the shaft
  m.set(12, 13, 'gate').set(13, 13, 'hole');
  // the golden thread down the left, to a cloud; the Spirit's updraft up to the gate's ledge
  for (let y = 29; y <= 43; y++) m.set(5, y, `thread${Math.min(2, eyeShade(y))}`);
  cloud(31, 2, 10);
  for (let y = 13; y <= 30; y++) m.set(3, y, `lift${Math.max(1, Math.min(4, eyeShade(y)))}a`);
  cloud(14, 4, 11);
  // the right side: clouds up to the eye
  cloud(14, 14, 20);
  cloud(11, 16, 19);
  cloud(8, 19, 22);
  cloud(6, 14, 18);
  // out the back of the eye: on through a cloud bank, a way one block high (so "Hump down" plays
  // out as he crawls on; and walled all round, so the eye is the only way in)
  m.row(4, 7, 11, 'bank5').row(6, 7, 11, 'bank4').set(7, 5, 'bank5');
  // good things
  m.set(9, 29, 'jar2').set(8, 13, 'lamp4').set(21, 7, 'olive').set(17, 13, 'dates4');
  m.mon(MON.star, 7, 25).mon(MON.star, 20, 17).mon(MON.star, 16, 3).mon(MON.dove, 15, 30).mon(MON.dove, 4, 8).mon(MON.star, 9, 38);
  m.link(8, 5, 'won');
  return { m, start: at(3, 43), size: [W, H] };
}
