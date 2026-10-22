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
