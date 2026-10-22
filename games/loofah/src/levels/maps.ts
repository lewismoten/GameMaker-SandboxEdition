// The four acts, from the song, each laid out by rows and runs of blocks; everything outside an
// act is solid:
//   1. Cursed in the Shower: the haunted bathroom by candlelight. Up the steam to the silver
//      rack, through the cursed bathwater (the rubber duck), over the toilet, the sink under the
//      mirror ("YOU CROSSED A LINE"), the hamper: five jars of bath salt in the mop bucket by
//      the door make the brine.
//   2. From Some Forest-Dark Aisle: the all-night store at 3 a.m., whose bath aisle has grown
//      into a forest where loofahs come from (luffa vines to climb, brambles, owls, wild
//      loofahs off the vine). Rosemary for the brine, six silver coins for the checkout, where
//      the clerk sells him a loofah of his own (black, obviously).
//   3. You Crossed a Line: home in the dark, past her asleep, the dogs, the screaming towels of
//      the linen closet and the hall mirror ("YOU MADE IT WORSE"): six candles lit for the
//      cleansing open the bathroom door.
//   4. Scrubbus Maximus: the shower at midnight. The demon sponge, smug on its tiles, spitting
//      cursed citrus suds; rosemary brine cleanses it, top and bottom, back into the pink one,
//      and her silver rack takes it back.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/blocks';
import { MON } from '../ids';

const LEGEND: Record<string, string> = {
  '.': 'tiles',
  '^': 'trim',
  _: 'baseTile',
  K: 'dark',
  '=': 'floor',
  '#': 'under',
  '!': 'crack',
  g: 'stall',
  h: 'showerHead',
  '~': 'steam0',
  v: 'vent',
  R: 'rack',
  r: 'tubRim',
  T: 'tubSide',
  c: 'claw',
  w: 'bathwater',
  t: 'tank',
  l: 'lid',
  k: 'sink',
  V: 'vanity',
  b: 'towelBar',
  O: 'window',
  s: 'shelf',
  '*': 'candles0',
  H: 'hamper',
  D: 'door',
  d: 'doorTop',
  B: 'bucket',
  '1': 'salt',
  '2': 'saltB',
  '3': 'cloth',
  '4': 'clothB',
  u: 'duck',
  q: 'quarter',
  f: 'forest',
  '-': 'tube0',
  S: 'sign',
  L: 'lino',
  M: 'moss',
  e: 'storeShelf',
  E: 'bareShelf',
  o: 'stock',
  X: 'trunk',
  C: 'crown',
  '|': 'vine',
  ':': 'vineGourd',
  '%': 'bramble',
  '5': 'rosemary',
  '$': 'coin',
  n: 'bin',
  p: 'spice',
  P: 'poster',
  '@': 'register',
  '&': 'clerk0',
  A: 'doors',
};

export interface LinkSpec {
  from: [number, number];
  toScene: 'next' | 'won';
}

/** Where an act's map sits in the 100x100 world (the rest is solid). */
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
  /** Where the man starts, in world blocks. */
  start: [number, number];
  /** The act's size in blocks (for previews and cards). */
  size: [number, number];
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** 1. Cursed in the Shower: the haunted bathroom, five jars of bath salt, the mop bucket. */
export function bathroom(book: BlockBook): Level {
  const W = 46;
  const H = 14;
  const m = new MapBuilder(book, 'under');
  m.row(0, 1, W - 2, '^').fill(1, 1, W - 2, 10, '.').row(11, 1, W - 2, '_').row(12, 0, W - 1, '=').row(13, 0, W - 1, '#').col(0, 0, 13, '#').col(W - 1, 0, 13, '#');
  // the shower stall: glass, the shower head (drips), the steam rising out of the vents up to the silver rack
  m.fill(1, 1, 5, 11, 'g').set(5, 3, 'h').col(1, 4, 11, '~').col(2, 4, 11, '~').set(1, 12, 'v').set(2, 12, 'v');
  m.row(3, 1, 3, 'R').set(3, 2, '1');
  // the screaming towel on its bar
  m.set(9, 10, 'b').mon(MON.towel, 9, 11);
  // the tub: its rim at either end, the cursed bathwater (the rubber duck, the grapefruit soap, bubbles)
  m.set(11, 10, 'r').set(19, 10, 'r').row(10, 12, 18, 'w').row(11, 12, 18, 'T').set(11, 11, 'c').set(19, 11, 'c');
  m.set(15, 10, 'u').mon(MON.grapefruit, 12, 10);
  // a shelf over the tub: a jar of salt, a quarter in the soap dish, candles
  m.row(7, 14, 17, 's').set(15, 6, '1').set(17, 6, 'q').set(14, 6, '*');
  // the toilet, a jar on its tank
  m.set(22, 11, 'l').col(23, 10, 11, 't').set(23, 9, '1');
  // the sink and the vanity, the mirror, the shelf above (candles, a jar, the mango soap)
  m.row(10, 26, 27, 'k').row(11, 26, 27, 'V');
  for (let q = 0; q < 4; q++) m.set(25 + q, 8, `mirror0${q}0`);
  m.row(7, 25, 28, 's').set(25, 6, '*').set(28, 6, '1').mon(MON.mango, 26, 6);
  // the window, Carl, a cracked tile, the hamper (the last jar), a dry washcloth
  m.col(31, 3, 4, 'O').mon(MON.carl, 30, 5);
  m.set(30, 11, '!').set(34, 11, 'H').set(34, 10, '1').set(37, 11, '4').set(39, 11, '!');
  m.row(6, 36, 38, 's').set(37, 5, '*');
  // the door, and the mop bucket by it: five jars of salt in it make the brine
  m.set(43, 11, 'D').set(43, 10, 'd').set(41, 11, 'B');
  m.link(41, 11, 'next');
  return { m, start: at(4, 11), size: [W, H] };
}

/** 2. From Some Forest-Dark Aisle: the store, rosemary, six coins, the checkout. */
export function aisle(book: BlockBook): Level {
  const W = 66;
  const H = 14;
  const m = new MapBuilder(book, 'lino');
  m.fill(1, 0, W - 2, 12, 'f').row(12, 0, W - 1, 'L').row(13, 0, W - 1, 'L').col(0, 0, 13, 'L').col(W - 1, 0, 13, 'L');
  for (let x = 3; x < W - 2; x += 6) m.set(x, 0, '-');
  m.row(12, 14, 50, 'M');
  // the automatic doors, the sign
  m.col(1, 10, 11, 'A').set(5, 5, 'S');
  // the first shelving: a coin, rosemary, a wild loofah on the floor
  m.row(9, 7, 11, 'e').row(6, 7, 11, 'e').fill(7, 7, 5, 2, 'o').set(9, 8, '$').set(11, 5, '5');
  m.mon(MON.feral, 7, 11);
  // the first tree, grown up through the aisle: climb the vine beside it, a coin on top
  m.col(13, 3, 11, '|').col(14, 4, 11, 'X').row(2, 13, 15, 'C').set(14, 3, '$');
  // brambles, owls, the second shelving (a wild loofah on it), rosemary
  m.set(18, 11, '%').mon(MON.owl, 19, 3).mon(MON.owl, 27, 2);
  m.row(9, 20, 23, 'E').row(6, 21, 24, 'E').set(22, 8, '$').set(24, 5, '5').mon(MON.feral, 20, 8);
  // the bakery's day-old bin: Loaf #13; a coin on the floor
  m.set(28, 11, 'n').mon(MON.loaf, 28, 10).set(30, 11, '$');
  // the second tree: its vine heavy with gourds, a coin at the top
  m.col(33, 3, 11, ':').col(34, 5, 11, 'X').row(3, 34, 35, 'C').set(33, 2, '$');
  // the goat on the end cap, the spice rack (the mustard seed), rosemary, a wild loofah
  m.set(37, 5, 'P').row(9, 39, 42, 'p').mon(MON.seed, 40, 8).set(42, 8, '5').mon(MON.feral, 38, 11);
  // more brambles, the third tree
  m.set(44, 11, '%').col(46, 5, 11, '|').col(47, 6, 11, 'X').set(47, 5, '$').row(4, 46, 48, 'C').set(50, 11, '%');
  // the last shelving: rosemary up top, a wild loofah on the shelf, a spare coin
  m.row(9, 53, 57, 'e').row(6, 53, 57, 'e').fill(53, 7, 5, 2, 'o').set(55, 5, '5').mon(MON.feral, 53, 8).set(58, 11, '$');
  // the checkout: the clerk; six coins
  m.set(61, 11, '@').set(62, 11, '&').set(62, 10, 'f');
  m.link(61, 11, 'next');
  return { m, start: at(3, 11), size: [W, H] };
}

/** 3. You Crossed a Line: home in the dark, six candles, the bathroom door. */
export function home(book: BlockBook): Level {
  const W = 69;
  const H = 12;
  const m = new MapBuilder(book, 'joists');
  m.row(0, 1, W - 2, 'crownMold').fill(1, 1, W - 2, 8, 'paper').row(9, 1, W - 2, 'base').row(10, 0, W - 1, 'boards').row(11, 0, W - 1, 'joists').col(0, 0, 11, 'joists').col(W - 1, 0, 11, 'joists');
  // the bed: her asleep, his pillow with the washcloth of shame on it; the night stand (a candle)
  m.col(1, 6, 8, 'headboard').set(2, 8, 'wife').row(8, 3, 7, 'bedTop').set(5, 8, 'pillow').row(9, 2, 7, 'bedSide').set(1, 9, 'bedSide');
  m.set(8, 9, 'stand').set(8, 8, 'unlit');
  m.set(10, 4, 'weddingPic').set(10, 9, 'creak');
  m.col(12, 8, 9, 'dresser').col(13, 8, 9, 'dresser').set(13, 7, 'unlit');
  m.set(17, 9, 'doorway').set(17, 8, 'doorwayTop');
  // the hall: Teddy, the Bard's picture, a shelf (a candle), the mirror, the hall table (a candle)
  m.mon(MON.teddy, 21, 9).set(22, 5, 'leoPic');
  m.row(6, 25, 26, 'wallShelf').set(26, 5, 'unlit');
  for (let q = 0; q < 4; q++) m.set(29 + q, 5, `mirror1${q}0`);
  m.set(31, 9, 'table').set(31, 8, 'unlit');
  // the linen closet: its shelves, a candle on top, the screaming towels flapping out down the hall
  m.row(7, 35, 37, 'linen').set(36, 6, 'unlit').mon(MON.flapper, 34, 9);
  m.mon(MON.gwinn, 41, 9).set(44, 9, 'creak');
  // the bookcase (a candle on top), another towel, a spare candle on the floor
  m.row(7, 50, 51, 'wallShelf').row(5, 50, 51, 'wallShelf').set(51, 4, 'unlit').mon(MON.flapper, 54, 9).set(59, 9, 'unlitB');
  // the bathroom door: six candles burning
  m.set(66, 9, 'bathDoor').set(66, 8, 'bathTop');
  m.link(66, 9, 'next');
  return { m, start: at(5, 7), size: [W, H] };
}

/** 4. Scrubbus Maximus: the demon sponge, its citrus suds, rosemary brine, her silver rack. */
export function shower(book: BlockBook): Level {
  const W = 34;
  const H = 12;
  const m = new MapBuilder(book, 'showerFloor');
  m.fill(1, 0, W - 2, 10, 'steamAir').row(10, 0, W - 1, 'showerFloor').row(11, 0, W - 1, 'showerFloor').col(0, 0, 11, 'showerFloor').col(W - 1, 0, 11, 'showerFloor');
  // the drain, full of cursed water
  m.row(10, 12, 13, 'drain0');
  // the caddy's shelves, rosemary on them, a dry washcloth on the floor
  m.row(7, 4, 6, 'caddy').set(5, 6, 'rosemaryS');
  m.row(5, 8, 10, 'caddy').set(9, 4, 'rosemaryS');
  m.set(8, 9, 'clothS');
  m.row(7, 15, 17, 'caddy').set(16, 6, 'rosemaryS');
  m.row(7, 19, 20, 'caddy').set(20, 6, 'rosemaryS');
  // Scrubbus Maximus, smug where it stands; the soap dish behind it up on its tiles
  m.mon(MON.spongeA0, 24, 8).mon(MON.spongeB0, 24, 9);
  m.row(7, 26, 28, 'caddy').set(27, 6, 'soapDishB');
  m.set(20, 3, 'curl0').set(30, 2, 'curl0').set(3, 2, 'curl0');
  // her silver rack
  m.set(30, 9, 'herRack');
  m.link(30, 9, 'won');
  return { m, start: at(2, 9), size: [W, H] };
}
