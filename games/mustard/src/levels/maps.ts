// The four levels, from the song, each laid out with ASCII rows; everything outside a level is
// packed soil:
//   1. The Mound: the seed hops out of its mound of dirt and across the garden at dawn.
//   2. Deep Down in the Dust: roots pushed down through soft dust to the groundwater, and up
//      through the crack in the sidewalk (five drops of water open it).
//   3. The Mountain: when life feels like a mountain, faith moves it, one boulder at a time.
//   4. The Palm of God's Hand: up the great plant into the evening sky.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/blocks';
import { MON } from '../ids';

const LEGEND: Record<string, string> = {
  '.': 'sky',
  '^': 'skyHi',
  w: 'wisp',
  c: 'cave',
  '#': 'soil',
  '=': 'grassTop',
  ':': 'dust',
  ';': 'dustTop',
  r: 'root',
  R: 'rock',
  K: 'rockDust',
  U: 'potTop',
  u: 'pot',
  L: 'leaf',
  l: 'leafCave',
  B: 'brickTop',
  b: 'brick',
  f: 'fence',
  p: 'flowerP',
  q: 'flowerB',
  ',': 'tuft',
  F: 'fluff0',
  D: 'dandelion',
  '{': 'cloudL',
  '}': 'cloudR',
  '(': 'cloudA',
  ')': 'cloudB',
  '*': 'sun0',
  '+': 'sunC0',
  $: 'faith0',
  o: 'water',
  O: 'waterRoot',
  Q: 'waterSky',
  d: 'dew',
  '1': 'life',
  '!': 'lifeCave',
  x: 'thistle',
  j: 'junk0',
  J: 'junk1',
  k: 'junk2',
  s: 'sidewalk',
  C: 'crack',
  M: 'crag',
  m: 'cragTop',
  X: 'boulder',
  S: 'scree',
  T: 'pine',
  N: 'snowTop',
  '[': 'stalkL',
  ']': 'stalkR',
  '-': 'branch',
  z: 'breeze0',
  n: 'nest',
  g: 'light',
  h: 'palm',
  '@': 'sunPatch',
  '>': 'pass',
};

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
    filler: string,
  ) {
    this.map.blocks.fill(book.n(filler));
  }

  private block(ch: string): number {
    const name = LEGEND[ch];
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

  /** ASCII rows at (x, y); spaces are left alone. Every row must be `width` long. */
  patch(x: number, y: number, rows: string[], width?: number): this {
    rows.forEach((row, dy) => {
      if (width !== undefined && row.length !== width) throw new Error(`Row ${dy} is ${row.length} wide, not ${width}: "${row}"`);
      [...row].forEach((ch, dx) => ch !== ' ' && this.set(x + dx, y + dy, ch));
    });
    return this;
  }

  mon(id: number, x: number, y: number): this {
    if (this.monCount >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum: id, status: 0, xtra: 0, curx: x + ORIGIN, cury: y + ORIGIN, extra: 0 };
    return this;
  }

  /** A two-block peacock whose tail is at (x, y), strutting right first. */
  peacock(x: number, y: number): this {
    return this.mon(MON.peaAR, x, y).mon(MON.peaBR, x + 1, y);
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
  /** Where the seed starts, in world blocks (its bottom block). */
  start: [number, number];
  /** The level's size in blocks (for previews and cards). */
  size: [number, number];
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** 1. The mound: out of the dirt and across the garden at dawn, over the wall on the dandelion fluff. */
export function mound(book: BlockBook): Level {
  const W = 72;
  const H = 13;
  const m = new MapBuilder(book, 'soil');
  // sky, the ground (standing row 9), soil under it, a soil border all round
  m.fill(1, 0, W - 2, 2, '^').fill(1, 2, W - 2, 8, '.').row(10, 1, W - 2, '=').fill(0, 11, W, 2, '#').col(0, 0, 10, '#').col(W - 1, 0, 10, '#');
  m.set(9, 2, 'w').set(41, 3, 'w').set(66, 2, 'w');
  // the mound the seed hops out of
  m.row(8, 3, 5, '#').row(9, 2, 6, '#').set(3, 7, ',').set(5, 7, ',');
  // the flower bed and its beetle
  m.text(8, 9, ',p.q.,').text(11, 7, '*');
  // two flowerpots, the second higher, a drop of dew on top
  m.set(15, 8, 'U').set(15, 9, 'u').set(17, 7, 'U').col(17, 8, 9, 'u').set(17, 6, 'd').set(15, 5, '*');
  // the lawn, where the peacock struts; leaves above it, and a rain cloud
  m.text(20, 9, '.p.x..q..,.');
  for (const x of [20, 23, 26, 29]) m.row(7, x, x + 1, 'L');
  m.text(21, 4, '*..*..*').text(24, 1, '{}');
  // dandelion fluff up and over the garden wall
  m.col(33, 2, 8, 'F').set(33, 9, 'D');
  m.fill(36, 6, 4, 4, 'b').row(5, 36, 39, 'B').set(40, 9, 'f').set(41, 9, 'f').text(36, 3, '*..*');
  // the vegetable patch: pots, a beetle, a bee, leaves, the golden flower up high
  m.set(45, 7, 'U').col(45, 8, 9, 'u').set(46, 7, 'U').col(46, 8, 9, 'u').set(45, 5, '*');
  m.text(48, 9, 'p.,..q.x..,');
  for (const x of [50, 56]) m.row(7, x, x + 1, 'L');
  m.text(50, 4, '*..d..*').text(52, 1, '{}');
  m.set(59, 6, 'U').col(59, 7, 9, 'u').set(60, 6, 'U').col(60, 7, 9, 'u').set(62, 4, 'L').set(62, 3, '1');
  // the sunny patch at the end of the garden: the way on
  m.text(64, 9, ',..@.,').text(64, 6, '*');
  m.mon(MON.beetleR, 8, 9);
  m.peacock(21, 9);
  m.mon(MON.crow, 40, 1).mon(MON.bee, 51, 7).mon(MON.beetleR, 48, 9).mon(MON.crow, 56, 1);
  m.link(67, 9, 'next');
  return { m, start: at(4, 7), size: [W, H] };
}

/** 2. Deep down in the dust: push roots down to the groundwater, five drops, and up through the crack in the sidewalk. */
export function dust(book: BlockBook): Level {
  const W = 48;
  const H = 20;
  const m = new MapBuilder(book, 'soil');
  m.fill(1, 1, W - 2, H - 2, ':');
  // the sidewalk overhead at the far end, and its crack
  m.row(0, 36, W - 2, 's').set(44, 0, 'C');
  // where the seed planted itself: a pocket of roots
  m.fill(1, 1, 3, 2, 'r');
  // packed earth and rocks to dig around, junk in the dirt
  m.row(5, 1, 12, '#').set(13, 5, 'K').row(11, 9, 22, 'K').fill(17, 2, 2, 6, '#').set(24, 3, 'j').set(31, 9, 'J').set(39, 17, 'k');
  m.fill(28, 1, 1, 7, 'K').fill(36, 8, 2, 7, '#').row(17, 1, 20, '#');
  // caves: air (it falls), each with its drop of water
  m.fill(4, 7, 6, 2, 'c').row(9, 4, 9, '#').set(7, 8, 'o').set(5, 7, '+');
  m.fill(12, 13, 7, 3, 'c').row(16, 12, 18, '#').set(15, 15, 'o').set(13, 13, '+').set(18, 13, '!');
  m.fill(20, 5, 6, 2, 'c').row(7, 20, 25, '#').set(22, 6, 'o').set(24, 5, '+');
  m.fill(26, 13, 10, 3, 'c').row(16, 26, 35, '#').set(30, 15, 'o').set(34, 13, '+');
  m.fill(39, 9, 5, 2, 'c').row(11, 39, 43, '#').set(41, 10, 'o');
  // groundwater in the dust itself
  m.set(32, 4, 'O').set(45, 15, 'O');
  m.mon(MON.ant, 4, 8).mon(MON.worm, 12, 15).mon(MON.mole, 26, 15).mon(MON.ant, 20, 6).mon(MON.worm, 39, 10);
  m.link(44, 0, 'next');
  return { m, start: at(2, 2), size: [W, H] };
}

/** 3. The mountain: terraces up and over, three walls of boulders that only faith moves, pebbles, an eagle and a goat. */
export function mountain(book: BlockBook): Level {
  const W = 64;
  const H = 20;
  const m = new MapBuilder(book, 'crag');
  m.fill(1, 0, W - 2, 3, '^').fill(1, 3, W - 2, 16, '.').col(0, 0, 19, 'M').col(W - 1, 0, 19, 'M').row(19, 0, W - 1, 'M');
  m.set(6, 2, 'w').set(30, 3, 'w').set(52, 2, 'w');
  // the ground under each stretch: [from x, to x, top row]
  const steps: [number, number, number][] = [
    [1, 10, 17],
    [11, 18, 15],
    [19, 26, 13],
    [27, 34, 11],
    [35, 42, 9],
    [43, 50, 11],
    [51, 62, 13],
  ];
  for (const [x0, x1, top] of steps) {
    m.row(top, x0, x1, top === 17 ? '=' : 'm').fill(x0, top + 1, x1 - x0 + 1, 18 - top, 'M');
  }
  m.row(9, 35, 42, 'N');
  // pines and tufts
  m.set(3, 16, 'T').set(8, 16, ',').set(12, 14, 'T').set(21, 12, ',').set(33, 10, 'T').set(49, 10, 'T').set(57, 12, 'T').set(53, 12, ',');
  // the walls of boulders (four high: a hop can't clear them; faith moves them two at a time)
  m.col(24, 9, 12, 'X').col(31, 7, 10, 'X').col(46, 7, 10, 'X');
  // faith, a golden glimmer at a time
  m.set(5, 15, '$').set(9, 16, '$').set(14, 12, '$').set(20, 11, '$').set(27, 9, '$').set(29, 8, '$').set(38, 6, '$').set(41, 7, '$').set(44, 9, '$');
  // sunbeams, dew, and a golden flower on the peak
  m.text(16, 10, '*').text(36, 4, '*..*').set(52, 10, '*').set(18, 14, 'd').set(40, 8, '1').set(60, 9, '*');
  // loose scree: pebbles roll out of it, down across the last terrace
  m.set(50, 12, 'S');
  // the pass over the mountain: the way on
  m.set(61, 12, '>');
  m.mon(MON.goat, 12, 14).mon(MON.eagle, 20, 4).mon(MON.eagle, 44, 3).mon(MON.bee, 6, 12);
  m.link(61, 12, 'next');
  return { m, start: at(2, 16), size: [W, H] };
}
