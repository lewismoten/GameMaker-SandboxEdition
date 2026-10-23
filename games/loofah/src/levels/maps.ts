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
  $: 'coin',
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
  const W = 52;
  const H = 14;
  const m = new MapBuilder(book, 'outside');
  m.row(0, 1, W - 2, '^')
    .fill(1, 1, W - 2, 10, '.')
    .row(11, 1, W - 2, '_')
    .row(12, 0, W - 1, '=')
    .row(13, 0, W - 1, '#')
    .col(0, 0, 13, 'outside')
    .col(W - 1, 0, 13, 'outside');
  // the shower stall: glass, the shower head (drips), the steam rising out of the vents up to the silver rack
  m.fill(1, 1, 5, 11, 'g').set(5, 3, 'h').col(1, 4, 11, '~').col(2, 4, 11, '~').set(1, 12, 'v').set(2, 12, 'v');
  m.row(3, 1, 3, 'R').set(3, 2, '1');
  // the screaming towel on its bar
  m.set(9, 10, 'b').mon(MON.towel, 9, 11);
  // the tub: its rim at either end, the cursed bathwater (the rubber duck, bubbles)
  m.set(11, 10, 'r').set(19, 10, 'r').row(10, 12, 18, 'w').row(11, 12, 18, 'T').set(11, 11, 'c').set(19, 11, 'c');
  m.set(15, 10, 'u');
  // a shelf over the tub: a jar of salt, a quarter in the soap dish, candles
  m.row(8, 14, 17, 's').set(15, 7, '1').set(17, 7, 'q').set(14, 7, '*');
  // a bar of cursed grapefruit soap, sliding along the floor
  m.mon(MON.grapefruit, 20, 11);
  // the toilet, a jar on its tank
  m.set(25, 11, 'l').set(26, 10, 'tankTop').set(26, 11, 't').set(26, 9, '1');
  // the sink and the vanity, the mirror, the shelf above (candles, a jar, the mango soap)
  m.row(10, 29, 30, 'k').row(11, 29, 30, 'V');
  for (let q = 0; q < 4; q++) m.set(28 + q, 8, `mirror0${q}0`);
  m.row(7, 28, 31, 's').set(31, 6, '*').set(28, 6, '1').mon(MON.mango, 30, 6);
  // the window, Carl, a cracked tile, the hamper (the last jar), a dry washcloth
  m.col(34, 3, 4, 'O').mon(MON.carl, 33, 5);
  m.set(33, 11, '!').set(37, 11, 'H').set(37, 10, '1').set(40, 11, '4').set(42, 11, '!');
  m.row(6, 39, 41, 's').set(40, 5, '*');
  // the mop bucket, and the door a few steps past it: five jars of salt in the bucket make the
  // brine, and the walk to the door gives "Lucifer" (the bucket's 2 s line) time to be heard
  m.set(49, 11, 'D').set(49, 10, 'd').set(44, 11, 'B');
  m.link(49, 11, 'next');
  return { m, start: at(4, 11), size: [W, H] };
}

/** 2. From Some Forest-Dark Aisle: the store, rosemary, six coins, the checkout. */
export function aisle(book: BlockBook): Level {
  const W = 66;
  const H = 14;
  const m = new MapBuilder(book, 'outside');
  m.fill(1, 0, W - 2, 12, 'f')
    .row(12, 0, W - 1, 'L')
    .row(13, 0, W - 1, 'L')
    .col(0, 0, 13, 'outside')
    .col(W - 1, 0, 13, 'outside');
  for (let x = 3; x < W - 2; x += 6) m.set(x, 0, '-');
  m.row(12, 14, 50, 'M');
  // the automatic doors, the sign
  m.col(1, 10, 11, 'A').set(5, 5, 'S');
  // the first shelving: a coin, rosemary, a wild loofah on the floor
  m.row(9, 7, 11, 'e').row(6, 7, 11, 'e').fill(7, 7, 5, 2, 'o').set(9, 8, '$').set(11, 5, '5');
  m.mon(MON.feral, 7, 11);
  // the first tree, grown up through the aisle: climb the vine beside it, a coin on top
  m.col(13, 3, 11, '|').col(14, 4, 11, 'X').row(2, 13, 15, 'C').set(14, 3, 'C').set(15, 3, '$');
  // brambles, owls, the second shelving (a wild loofah on it), rosemary
  m.set(18, 11, '%').mon(MON.owl, 19, 3).mon(MON.owl, 27, 2);
  m.row(9, 20, 23, 'E').row(6, 21, 24, 'E').set(22, 8, '$').set(24, 5, '5').mon(MON.feral, 20, 8);
  // an Easter egg at the far end of the top shelf, away from the rosemary
  m.set(21, 5, 'easterEgg');
  // the bakery's day-old bin: Loaf #13; a coin on the floor
  m.set(28, 11, 'n').mon(MON.loaf, 28, 10).set(30, 11, '$');
  // the second tree: its vine heavy with gourds, a coin at the top
  m.col(33, 3, 11, ':').col(34, 5, 11, 'X').col(34, 3, 4, 'C').set(33, 2, '$');
  // the goat on the end cap, the spice rack (the mustard seed), rosemary, a wild loofah
  m.set(37, 5, 'P').row(9, 39, 42, 'p').mon(MON.seed, 40, 8).set(42, 8, '5').mon(MON.feral, 38, 11);
  // more brambles, the third tree
  m.set(44, 11, '%').col(46, 5, 11, '|').col(47, 6, 11, 'X').row(4, 46, 48, 'C').set(47, 5, 'C').set(48, 5, '$').set(50, 11, '%');
  // the last shelving: rosemary up top, a wild loofah in front of it, a spare coin
  m.row(9, 53, 57, 'e').row(6, 53, 57, 'e').fill(53, 7, 5, 2, 'o').set(55, 5, '5').mon(MON.feral, 55, 11).set(59, 11, '$');
  // the checkout: the clerk; six coins
  // Mystery Robot Joe, taking stock before the last shelves
  m.set(52, 11, 'joe');
  m.set(61, 11, '@').set(62, 11, '&').set(62, 10, 'f');
  m.link(61, 11, 'next');
  return { m, start: at(3, 11), size: [W, H] };
}

/** 3. You Crossed a Line: home in the dark, on two floors: out of bed and along the hall
 * downstairs, up the stairs at its end, and back along the landing upstairs to the bathroom,
 * lighting six candles on the way (seven burn in all, so one can be missed). The screaming
 * towels flap along both halls. */
export function home(book: BlockBook): Level {
  const W = 50;
  const H = 16;
  const UP = 33; // the upstairs landing runs from x 1 to here; past it the stairwell is open to the ceiling
  const m = new MapBuilder(book, 'joists');
  m.row(0, 1, W - 2, 'crownMold')
    .fill(1, 1, W - 2, 12, 'paper')
    .row(13, 1, W - 2, 'base')
    .row(14, 0, W - 1, 'boards')
    .row(15, 0, W - 1, 'joists')
    .col(0, 0, 15, 'joists')
    .col(W - 1, 0, 15, 'joists');
  // the landing upstairs (its floor is the hall's ceiling)
  m.row(6, 1, UP, 'base').row(7, 1, UP, 'boards');
  // the bed: her asleep, his pillow with the washcloth of shame on it; the night stand (a candle)
  m.set(1, 10, 'headboardTop')
    .col(1, 11, 12, 'headboard')
    .set(2, 12, 'wife')
    .row(12, 3, 7, 'bedTop')
    .set(5, 12, 'pillow')
    .row(13, 2, 7, 'bedSide')
    .set(1, 13, 'bedSide');
  m.set(8, 13, 'stand').set(8, 12, 'unlit');
  m.set(10, 9, 'weddingPic');
  m.col(12, 12, 13, 'dresser').col(13, 12, 13, 'dresser').set(13, 11, 'unlit');
  m.set(17, 13, 'doorway').set(17, 12, 'doorwayTop');
  // the hall downstairs: a towel flapping, the Bard's picture, the hall table (a candle), another towel
  m.mon(MON.flapper, 19, 13).set(22, 9, 'leoPic');
  m.set(25, 13, 'table').set(25, 12, 'unlit');
  m.mon(MON.flapper, 28, 13);
  // the stairwell: the hall mirror ("YOU MADE IT WORSE") up its wall, a spare candle on the floor
  // at the far end, and the stairs climbing left to the landing
  for (let q = 0; q < 4; q++) m.set(42 + q, 4, `mirror1${q}0`);
  m.set(46, 13, 'unlitB');
  // (open treads, so the hall runs on underneath and you hop up through them)
  m.row(12, 38, 39, 'wallShelf').row(10, 36, 37, 'wallShelf').row(8, 34, 35, 'wallShelf');
  // a little shelf on the stairwell wall, a hop up and right off the top of the stairs: a tin heart
  m.row(4, 37, 38, 'wallShelf').set(38, 3, 'tinHeart');
  // upstairs, back to the left: a shelf (a candle), the landing table (a candle), a towel, the
  // linen closet (a candle on top) and its last towel, the bathroom door
  m.row(4, 28, 29, 'wallShelf').set(28, 3, 'unlit');
  m.set(20, 6, 'table').set(20, 5, 'unlit');
  m.mon(MON.flapper, 16, 6);
  m.row(4, 12, 14, 'linen').set(13, 3, 'unlit');
  m.mon(MON.flapper, 8, 6);
  // the bathroom door: six candles burning; through it, the steam of the bathroom, where the
  // walk to the shower gives the funeral bell (the door's 1.6 s toll) time to ring out
  m.set(6, 6, 'bathDoor').set(6, 5, 'bathTop');
  m.fill(1, 1, 5, 6, 'steamAir').row(7, 1, 5, 'showerFloor');
  m.link(1, 6, 'next');
  return { m, start: at(5, 11), size: [W, H] };
}

/** 4. Scrubbus Maximus: the shower at midnight. Rosemary on the caddy's shelves, over the drain,
 * then up the steam to a perch level with the demon sponge, smug on the tub rim across the gap,
 * spitting cursed citrus suds that float slowly over the perch. Brine cleanses it, top and
 * bottom, back into the pink one; along the rim for it, and down to her silver rack. */
export function shower(book: BlockBook): Level {
  const W = 36;
  const H = 12;
  const m = new MapBuilder(book, 'outside');
  m.fill(1, 0, W - 2, 10, 'steamAir')
    .row(10, 0, W - 1, 'showerFloor')
    .row(11, 0, W - 1, 'showerFloor')
    .col(0, 0, 11, 'outside')
    .col(W - 1, 0, 11, 'outside');
  // the caddy's shelves, rosemary on them (the first sprig sings)
  m.row(7, 4, 6, 'caddy').set(5, 6, 'rosemaryFirst');
  m.row(5, 8, 10, 'caddy').set(9, 4, 'rosemaryS');
  // the drain, full of cursed water; a shelf past it
  m.row(10, 11, 12, 'drain0');
  m.row(7, 14, 16, 'caddy').set(15, 6, 'rosemaryS');
  // a pot of rosemary on the floor (a fresh sprig on it now and then)
  m.set(13, 9, 'pot');
  // the steam out of the vent, up to his perch (a sprig on it), level with the sponge
  m.set(18, 10, 'vent').col(18, 3, 9, 'steam0');
  m.row(4, 19, 21, 'caddy').set(20, 3, 'rosemaryS');
  // the gap, cursed water below it; the tub rim, Scrubbus Maximus smug on it, the soap dish at its end
  m.row(10, 22, 23, 'drain0');
  m.row(4, 24, 31, 'caddy');
  m.mon(MON.spongeA0, 26, 2).mon(MON.spongeB0, 26, 3);
  m.set(31, 3, 'soapDishB');
  m.set(13, 3, 'curl0').set(27, 7, 'curl0').set(3, 2, 'curl0');
  // her silver rack, down off the end of the rim
  m.set(33, 9, 'herRack');
  m.link(33, 9, 'won');
  return { m, start: at(2, 9), size: [W, H] };
}
