// The four levels, from the song, each laid out by rows and runs of blocks; everything outside a
// level is solid:
//   1. The Hungry Crowd: out of the basket in the shade of the fig tree and across the hillside at
//      noon, past the hungry hands, the stomping feet and the flying fish, to the stack of baskets.
//   2. The Wicker Wasteland: lonely in the stacked baskets, climbing the weave and burrowing
//      through the chaff for seven holy crumbs, to the lid.
//   3. Twelve Baskets Full: at dusk, every empty basket on the hillside gathered up full; the
//      twelfth takes you in. Nothing's ever wasted.
//   4. The Way Home: wrapped in the child's cloth, through the village at night to her door.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/blocks';
import { MON } from '../ids';

const LEGEND: Record<string, string> = {
  '.': 'sky',
  '^': 'skyHi',
  w: 'wisp',
  c: 'crowd0',
  C: 'crowd1',
  '~': 'sea',
  '#': 'earth',
  '=': 'grass',
  R: 'rock',
  K: 'rockE',
  _: 'slab',
  r: 'road',
  s: 'sand',
  l: 'lilyW',
  L: 'lilyP',
  ',': 'tuft',
  T: 'trunk',
  U: 'trunkShade',
  F: 'fig',
  v: 'leaves',
  h: 'shade',
  W: 'wicker',
  m: 'rim',
  n: 'rimLedge',
  i: 'basketIn',
  f: 'fishBasket',
  g: 'fishBasketL',
  x: 'fire0',
  u: 'warm0',
  '*': 'crumb',
  $: 'holy0',
  j: 'jar',
  H: 'honey',
  o: 'gloom',
  Y: 'weave',
  '|': 'shaft',
  b: 'bottom',
  z: 'chaff',
  '+': 'crumbG',
  '%': 'holyG0',
  '&': 'holyW',
  J: 'jarG',
  D: 'lid',
  e: 'basketE',
  B: 'twelve',
  O: 'olive',
  M: 'wall',
  N: 'wallTop',
  A: 'house',
  p: 'roof',
  q: 'window',
  d: 'doorway',
  k: 'lamp',
  t: 'stars',
  P: 'palmT',
  Q: 'palmC',
  y: 'well',
  '-': 'brook0',
  S: 'step',
  '@': 'holyN0',
  '!': 'door',
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

  /** ASCII rows at (x, y); spaces are left alone. */
  patch(x: number, y: number, rows: string[]): this {
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => ch !== ' ' && this.set(x + dx, y + dy, ch)));
    return this;
  }

  mon(id: number, x: number, y: number): this {
    if (this.monCount >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum: id, status: 0, xtra: 0, curx: x + ORIGIN, cury: y + ORIGIN, extra: 0 };
    return this;
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
  /** Where the loaf starts, in world blocks. */
  start: [number, number];
  /** The level's size in blocks (for previews and cards). */
  size: [number, number];
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** The hillside's band of the far crowd (row 9) from x0 to x1, the sea glinting here and there. */
function crowdBand(m: MapBuilder, x0: number, x1: number, sea = false): void {
  for (let x = x0; x <= x1; x++) m.set(x, 9, sea && x % 5 === 2 ? '~' : x % 2 ? 'C' : 'c');
}

/** 1. The hungry crowd: out of the basket in the shade and across the hillside at noon. */
export function hillside(book: BlockBook): Level {
  const W = 70;
  const H = 12;
  const m = new MapBuilder(book, 'earth');
  m.fill(1, 0, W - 2, 2, '^').fill(1, 2, W - 2, 8, '.').row(10, 0, W - 1, '=').row(11, 0, W - 1, '#').col(0, 0, 11, '#').col(W - 1, 0, 11, '#');
  m.set(15, 1, 'w').set(33, 2, 'w').set(55, 1, 'w');
  crowdBand(m, 9, 18, true);
  crowdBand(m, 22, 31);
  crowdBand(m, 46, 60, true);
  // the fig tree and its shade, and the basket Loaf #13 was left in
  m.fill(1, 4, 9, 6, 'h').fill(1, 1, 11, 2, 'v').row(3, 2, 10, 'F').col(9, 4, 9, 'U');
  m.text(3, 2, '*.$').set(8, 2, '*');
  m.set(2, 9, 'W').set(2, 8, 'm').set(6, 9, 'W').set(6, 8, 'm').fill(3, 8, 3, 2, 'i');
  // the first of the crowd: a hungry man stomping, crumbs dropped in the grass
  m.text(11, 6, '*..*').set(19, 7, '*');
  m.mon(MON.man, 12, 9);
  // the fish basket: fish fly like a prayer
  m.set(20, 9, 'f').set(23, 5, '*').set(27, 6, '*');
  m.mon(MON.hand, 24, 2).mon(MON.hand, 29, 3);
  // brothers passed hand to hand overhead; a rock to get over
  m.mon(MON.brother, 28, 4);
  m.set(33, 9, 'R').set(33, 8, 'R').set(31, 7, '_').text(30, 6, '*');
  // the cooking fire: its warm air lifts you up into another fig tree
  m.set(36, 9, 'R').set(36, 8, 'R').set(37, 9, 'x').col(37, 2, 8, 'u');
  m.col(42, 3, 9, 'T').fill(38, 0, 8, 2, 'v').row(2, 38, 45, 'F').text(39, 1, '$.H.$');
  m.mon(MON.gull, 46, 3);
  // the third goat from the left, grazing; a jar of water
  m.text(45, 9, 'l.,.L').set(52, 9, 'j');
  m.mon(MON.goat, 47, 9);
  // another hungry man, and a fish basket throwing to the left
  m.text(54, 6, '*.*.*');
  m.mon(MON.man, 54, 9);
  m.set(62, 9, 'g').set(60, 5, '$');
  // the stack of empty baskets the disciples left: roll in at the bottom
  m.fill(64, 3, 4, 7, 'W').row(2, 64, 67, 'n').set(64, 9, 'i').set(65, 9, 'i');
  m.link(65, 9, 'next');
  return { m, start: at(4, 9), size: [W, H] };
}

/** 2. The wicker wasteland: the stacked baskets, seven holy crumbs, the lid. */
export function wicker(book: BlockBook): Level {
  const W = 34;
  const H = 22;
  const m = new MapBuilder(book, 'wicker');
  // R1 (the start): where Loaf #13 tumbled in
  m.fill(1, 1, 8, 4, 'o').set(7, 2, '%').set(4, 1, '|');
  // a chaff plug into R2
  m.col(9, 3, 4, 'z');
  m.fill(10, 1, 8, 4, 'o').set(14, 2, '%').set(11, 4, '+').set(15, 4, '+').set(12, 1, '|');
  // down the weave into R3, the long room with a weevil and a mouse
  m.col(17, 5, 9, 'Y');
  m.fill(8, 8, 17, 5, 'o').set(9, 11, '%').set(22, 11, '%').text(12, 12, '+oo+').set(18, 8, '|');
  m.mon(MON.weevil, 10, 12).mon(MON.mouse, 18, 12);
  // R4, through the chaff to the west, a holy crumb on a basket bottom
  m.col(7, 11, 12, 'z');
  m.fill(1, 7, 6, 6, 'o').row(10, 1, 4, 'b').set(2, 9, '%').set(5, 12, 'J');
  // the weave down from R3 to R5, the bottom room
  m.col(25, 10, 19, 'Y');
  m.fill(18, 17, 13, 4, 'o').set(20, 19, '%').set(28, 19, '%').set(24, 20, 'J').text(21, 17, '|oo|');
  m.mon(MON.mouse, 19, 20).mon(MON.moth, 26, 18);
  // the weave up the east wall to the lid, a side room on the way
  m.col(31, 3, 20, 'Y');
  m.fill(26, 6, 5, 3, 'o').set(28, 7, '%').set(26, 8, '+');
  m.mon(MON.weevil, 26, 8);
  // the lid, and out on top of the basket in the light coming in (no gravity, like the weave):
  // a few rolls along its rim to the way on, so "I'm still bread!" is sung to the end
  m.set(31, 2, 'D');
  m.fill(25, 0, 7, 2, 'lidOpen').row(2, 25, 30, 'm');
  m.link(25, 0, 'next').link(25, 1, 'next');
  return { m, start: at(3, 4), size: [W, H] };
}

/** 3. Twelve baskets full: at dusk, gather up every empty basket on the hillside; the twelfth takes you in. */
export function baskets(book: BlockBook): Level {
  const W = 72;
  const H = 12;
  const m = new MapBuilder(book, 'earth');
  m.fill(1, 0, W - 2, 2, '^').fill(1, 2, W - 2, 8, '.').row(10, 0, W - 1, '=').row(11, 0, W - 1, '#').col(0, 0, 11, '#').col(W - 1, 0, 11, '#');
  m.set(12, 1, 'w').set(40, 2, 'w');
  crowdBand(m, 14, 22, true);
  crowdBand(m, 40, 50);
  // the baskets: on the grass, on stones, up in an olive tree, over the fire
  m.set(5, 9, 'e').set(9, 7, '_').set(9, 6, 'e');
  m.set(13, 9, 'e').set(16, 9, 'O').set(18, 9, 'e');
  m.set(22, 8, 'R').set(22, 9, 'R').set(23, 7, '_').set(24, 7, '_').set(24, 6, 'e');
  m.mon(MON.fox, 25, 9);
  m.set(30, 9, 'e').set(34, 9, 'e');
  m.mon(MON.seed, 32, 9);
  // the fire and its warm air up to the fig branches, a basket at the top
  m.set(37, 8, 'R').set(37, 9, 'R').set(38, 9, 'x').col(38, 2, 8, 'u');
  m.col(43, 3, 9, 'T').fill(39, 0, 8, 2, 'v').row(2, 39, 44, 'F').set(45, 2, 'e').set(42, 1, '$');
  m.set(48, 9, 'e').set(51, 9, 'l').set(52, 9, 'j').set(54, 9, 'e');
  m.mon(MON.gull, 48, 3).mon(MON.man, 61, 9);
  m.set(58, 7, '_').set(59, 7, '_').set(59, 6, 'e');
  m.mon(MON.owl, 60, 2);
  // the twelfth basket
  m.set(68, 9, 'B').set(66, 9, ',');
  m.link(68, 9, 'next');
  return { m, start: at(2, 9), size: [W, H] };
}

/** 4. The way home: through the village at night, wrapped in the child's cloth, to her door. */
export function home(book: BlockBook): Level {
  const W = 66;
  const H = 13;
  const m = new MapBuilder(book, 'earth');
  m.fill(1, 0, W - 2, 3, 't').fill(1, 3, W - 2, 7, '.').row(10, 0, W - 1, 'r').fill(0, 11, W, 2, 's').col(0, 0, 12, '#').col(W - 1, 0, 12, '#');
  // the first houses: their roofs to stand on, lamplight in the windows
  m.fill(4, 7, 8, 3, 'A').row(6, 3, 12, 'p').set(6, 8, 'q').set(9, 8, 'd').set(7, 5, '@').set(10, 5, '*');
  m.set(14, 9, 'k').set(16, 9, 'P').set(16, 8, 'Q');
  m.mon(MON.dog, 15, 9);
  // the brook and its stepping stones
  m.fill(23, 10, 7, 2, '-').set(24, 10, 'S').set(26, 10, 'S').set(28, 10, 'S');
  // the well, and Brother Camel kneeling by it
  m.set(33, 9, 'y').set(33, 8, '@');
  m.mon(MON.camelA, 35, 9).mon(MON.camelB, 36, 9);
  // more houses; a lamp with its moth
  m.fill(39, 7, 9, 3, 'A').row(6, 38, 48, 'p').set(41, 8, 'q').set(45, 8, 'q').text(40, 5, '*...*');
  m.set(49, 9, 'k').set(51, 8, '@');
  m.mon(MON.moth, 48, 7).mon(MON.dog, 41, 9).mon(MON.owl, 44, 1);
  // the child, walking home ahead of you
  m.mon(MON.girlA, 52, 8).mon(MON.girlB, 52, 9);
  // home: her door
  m.fill(58, 5, 7, 5, 'A').row(4, 57, 64, 'p').set(59, 8, 'q').set(61, 9, '!').set(60, 3, 'k');
  m.link(61, 9, 'won');
  return { m, start: at(2, 9), size: [W, H] };
}
