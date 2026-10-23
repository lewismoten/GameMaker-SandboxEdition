// The four acts, from the monologue, each laid out by rows and runs of blocks; everything outside
// an act is solid:
//   1. 3:17 A.M.: out of bed without waking her, past the creaky board, the sleeping dogs and the toy
//      blocks in the hall, through the living room (the TV remote, lost down the side of the couch),
//      to the kitchen and the glow of the open fridge.
//   2. The Enemy-Lover: up the counters and the fridge's shelves past the dairy come to life,
//      seven sticks of celery for willpower, to the cheesecake on the top shelf. It takes all
//      seven, and he eats it.
//   3. Oh No: the dash to the bathroom with the Swamp Demon (the gurgle) right behind him, the
//      lights flickering, the dogs awake and wanting to play, three rolls of toilet paper.
//   4. The Reckoning: the lights turn blood red. The Devil in leisure wear, sipping a milkshake.
//      Almond milk, oat milk and lactase pills; his last straw; the porcelain throne.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/blocks';
import { MON } from '../ids';

const LEGEND: Record<string, string> = {
  '.': 'wall',
  '^': 'crown',
  _: 'base',
  K: 'dark',
  '=': 'floor',
  '#': 'under',
  r: 'runner',
  q: 'bedTop',
  Q: 'bedSide',
  H: 'headboard',
  w: 'wife',
  p: 'pillow',
  n: 'stand',
  c: 'clock0',
  O: 'window',
  o: 'windowB',
  D: 'dresser',
  d: 'doorway',
  t: 'doorTop',
  '!': 'creak',
  L: 'toyBlocks',
  z: 'squeak',
  g: 'goatPic',
  m: 'camelPic',
  l: 'leoPic',
  i: 'nightLight',
  U: 'basket',
  $: 'coins',
  '%': 'coinsB',
  v: 'water',
  V: 'waterB',
  C: 'couchBack',
  A: 'couchArm',
  S: 'couch',
  R: 'remote',
  T: 'tv0',
  b: 'table',
  s: 'shelf',
  B: 'books',
  P: 'lamp',
  k: 'kitchen',
  x: 'backsplash',
  '-': 'linoleum',
  X: 'counter',
  Y: 'cabinet',
  u: 'upper',
  j: 'breadbox',
  J: 'sink',
  f: 'cold',
  '*': 'bulb',
  F: 'fridgeWall',
  E: 'fridgeTop',
  G: 'glassShelf',
  h: 'crisper',
  y: 'doorShelf',
  M: 'mustard',
  N: 'ketchup',
  Z: 'freezer',
  '1': 'celery',
  '2': 'celeryK',
  '3': 'note',
  '4': 'cake0',
  '5': 'glow0',
  '6': 'light0',
  '7': 'chair',
  '8': 'towels',
  '9': 'roll',
  '0': 'rollB',
  W: 'bathDoor',
  I: 'bathTop',
  '~': 'void',
  '&': 'flames0',
  '+': 'hellFloor',
  '@': 'hellTile',
  ',': 'smoke0',
  ':': 'fountain',
  a: 'almond',
  e: 'oat',
  ';': 'lactasePills',
  '/': 'throne',
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

/** The house's rooms: the ceiling's molding, the wall, the baseboard row he walks along, the floor. */
function rooms(m: MapBuilder, W: number, floor = '='): void {
  m.row(0, 1, W - 2, '^')
    .fill(1, 1, W - 2, 8, '.')
    .row(9, 1, W - 2, '_')
    .row(10, 0, W - 1, floor)
    .row(11, 0, W - 1, '#')
    .col(0, 0, 11, '#')
    .col(W - 1, 0, 11, '#');
}

/** 1. 3:17 a.m.: the bedroom, the hall, the living room, to the kitchen door. */
export function bedroom(book: BlockBook): Level {
  const W = 70;
  const H = 12;
  const m = new MapBuilder(book, 'under');
  rooms(m, W);
  // the bed: her head on the pillow (her snoring drifts up), the quilt; he's just got up
  m.col(1, 6, 8, 'H').set(2, 8, 'w').row(8, 3, 7, 'q').row(9, 2, 7, 'Q').set(1, 9, 'Q');
  // the night stand and the clock: 3:17
  m.set(8, 9, 'n').set(8, 8, 'c');
  m.set(11, 4, 'O').set(11, 5, 'o').set(12, 4, 'O').set(12, 5, 'o');
  // the creaky board, the dresser (coins on top), the door to the hall
  m.set(10, 9, '!');
  m.col(14, 8, 9, 'D').col(15, 8, 9, 'D').set(14, 7, '$').set(15, 7, '$');
  m.set(18, 9, 'd').set(18, 8, 't');
  // the hall: the runner, the family's pictures, the night light, Teddy asleep, a squeaky toy,
  // the laundry basket, the toy blocks, Gwinn asleep, a glass of water
  m.row(10, 19, 43, 'r');
  m.set(22, 5, 'g').set(27, 5, 'm').set(32, 5, 'l').set(20, 9, 'i');
  // Teenage Lewie's photo with the family's, in his red knit hat
  m.set(35, 5, 'lewiePic');
  m.mon(MON.teddy, 22, 9);
  m.set(28, 9, 'z');
  m.set(31, 9, 'U').set(33, 9, '%');
  m.set(36, 9, 'L');
  m.row(7, 25, 26, 's').set(25, 6, '$').set(26, 6, '$');
  m.mon(MON.gwinn, 40, 9);
  m.set(42, 9, 'V');
  m.set(44, 9, 'd').set(44, 8, 't');
  // the living room: the couch (the remote down its side), the TV, a lamp, the bookshelf
  m.set(47, 9, 'A').row(9, 48, 51, 'S').row(8, 48, 51, 'C').set(52, 9, 'A').set(53, 9, 'R');
  m.set(49, 7, '$').set(55, 9, '!');
  m.set(57, 8, 'T').set(57, 9, 'b').set(59, 9, 'P');
  m.col(61, 4, 8, 'B').col(62, 4, 8, 'B').row(7, 61, 62, 's').row(5, 61, 62, 's').set(61, 4, '$').set(62, 4, 'v');
  m.set(64, 9, 'L');
  // the kitchen door: the fridge's glow spilling out
  m.set(67, 9, 'k').set(67, 8, 'k').set(66, 9, 'P');
  m.link(67, 9, 'next');
  return { m, start: at(5, 7), size: [W, H] };
}

/** 2. The enemy-lover: the counters, the fridge's shelves, the dairy, seven sticks of celery, the cheesecake, the doorway to the hall. */
export function fridge(book: BlockBook): Level {
  const W = 56;
  const H = 16;
  const m = new MapBuilder(book, 'cabinet');
  m.fill(1, 0, W - 2, 14, 'x')
    .row(14, 0, W - 1, '-')
    .row(15, 0, W - 1, 'Y')
    .col(0, 0, 15, 'Y')
    .col(W - 1, 0, 15, 'Y');
  // the counter, its cabinets, the bread box (Loaf #13), the sink, the upper cabinets
  m.row(12, 4, 13, 'X').row(13, 4, 13, 'Y');
  m.set(6, 11, 'j').set(9, 11, 'J').set(12, 11, '2');
  m.row(9, 4, 12, 'u').set(8, 8, '2');
  m.mon(MON.loaf, 6, 11).mon(MON.carl, 15, 5);
  // an Easter egg up in the corner over the end of the counter, a hop left off the counter
  m.set(2, 7, 'easterEgg');
  m.set(17, 13, 'V');
  // the fridge, standing open (its bottom open to walk in): its walls, the cold glowing inside, the freezer, the bulb
  m.row(0, 22, 44, 'E').col(22, 1, 9, 'F').col(44, 7, 13, 'F').set(22, 7, '3');
  m.fill(23, 1, 21, 13, 'f').set(22, 10, 'f').set(22, 11, 'f').set(22, 12, 'f').set(22, 13, 'f').fill(23, 1, 8, 2, 'Z').set(35, 1, '*');
  // the crisper drawers, and the shelves (gaps to drop through)
  m.fill(23, 13, 5, 1, 'h');
  m.row(10, 23, 43, 'G').row(10, 33, 34, 'f');
  m.row(7, 23, 43, 'G').row(7, 40, 41, 'f');
  m.row(4, 23, 44, 'G').row(4, 29, 30, 'f');
  // the dairy, come to life
  // a tin heart at the back of the fridge's bottom, past the milk, in the corner by the door hinge
  m.set(42, 13, 'tinHeart');
  m.mon(MON.milk, 30, 13).mon(MON.yogurt, 36, 9).mon(MON.cheese, 24, 6).mon(MON.butter, 34, 6).mon(MON.cream, 24, 2).mon(MON.milk, 24, 3);
  // willpower: seven sticks of celery
  m.set(25, 12, '1').set(24, 9, '1').set(31, 9, '1').set(39, 6, '1').set(35, 3, '1');
  // the door, swung open: its shelves (the mustard, and the mustard seed by it, the ketchup)
  m.row(11, 45, 46, 'y').row(8, 45, 46, 'y').set(45, 8, 'M').row(5, 45, 46, 'y').set(46, 11, 'N');
  m.mon(MON.seed, 46, 7);
  // the cheesecake on the top shelf, glowing like a cursed artifact
  m.set(41, 3, '4').set(42, 3, '5').set(41, 2, '5').set(42, 2, '5').set(43, 3, '5');
  // the doorway to the dark hall: after the cheesecake, down off the fridge door and out (the
  // walk lets "Why must betrayal taste so good?!" finish before the act ends)
  m.set(53, 13, 'd').set(53, 12, 't');
  m.link(53, 13, 'next');
  return { m, start: at(2, 13), size: [W, H] };
}

/** 3. Oh no: the dash down the dark hall to the bathroom, the gurgle right behind him. */
export function dash(book: BlockBook): Level {
  const W = 96;
  const H = 12;
  const m = new MapBuilder(book, 'under');
  rooms(m, W, 'r');
  for (let x = 4; x < W - 2; x += 7) m.set(x, 0, '6');
  m.row(10, 0, 14, '=');
  // the kitchen chairs, then the hall
  m.set(9, 9, '7').set(13, 9, '7').set(16, 9, 'd').set(16, 8, 't');
  m.set(19, 9, 'L');
  m.mon(MON.teddyUp, 23, 9);
  m.set(30, 9, 'U').set(34, 9, 'z');
  m.set(26, 5, 'g').set(36, 5, 'l');
  // the linen closet: a roll on its top shelf
  m.row(7, 39, 42, '8').set(41, 6, '9');
  m.set(47, 9, '0');
  m.mon(MON.gwinnUp, 50, 9);
  m.set(57, 9, '!').set(61, 9, 'L').set(65, 9, '7').set(67, 9, 'V');
  // a roll on top of the laundry basket
  m.set(72, 9, 'U').set(72, 8, '9');
  m.set(78, 9, 'z').set(82, 9, '!').set(76, 5, 'm');
  // the bathroom door: three rolls; then across the bathroom to the toilet (the walk lets the
  // slam and "IT'S NOT WORTH IT!" finish before the act ends)
  m.set(85, 9, 'W').set(85, 8, 'I');
  m.fill(86, 1, 9, 9, 'bathWall').row(10, 86, 94, '+').set(93, 9, 'toilet');
  m.link(93, 9, 'next');
  // the Swamp Demon, right behind him
  m.mon(MON.gurgle, 1, 8);
  return { m, start: at(4, 9), size: [W, H] };
}

/** 4. The reckoning: the Devil in leisure wear, his milkshakes, almond milk, the porcelain throne, the door home. */
export function reckoning(book: BlockBook): Level {
  const W = 49;
  const H = 12;
  const m = new MapBuilder(book, 'hellFloor');
  m.fill(1, 0, W - 2, 10, '~')
    .row(10, 0, W - 1, '+')
    .row(11, 0, W - 1, '+')
    .col(0, 0, 11, '+')
    .col(W - 1, 0, 11, '+');
  // the pit (flames) in the floor
  m.row(10, 12, 13, '&');
  // floating tiles, the milk on them, lactase pills on the floor
  m.row(7, 4, 6, '@').set(5, 6, 'a');
  m.row(5, 8, 10, '@').set(9, 4, 'e');
  m.set(8, 9, ';');
  m.row(7, 15, 17, '@').set(16, 6, 'a');
  m.row(7, 19, 20, '@').set(20, 6, 'e');
  // the Devil, lounging, sipping; the soda fountain behind him up on its tiles
  m.mon(MON.devilA0, 24, 8).mon(MON.devilB0, 24, 9);
  m.row(7, 26, 28, '@').set(27, 6, ':');
  m.set(20, 3, ',').set(30, 2, ',').set(3, 2, ',');
  // the porcelain throne; past it, the bathroom door home, where the act ends (the walk lets the
  // flush and "...Is there Lactaid in hell?" finish)
  m.set(30, 9, '/');
  m.set(36, 4, ',').set(42, 2, ',');
  m.set(46, 9, 'bathOpen').set(46, 8, 'I');
  m.link(46, 9, 'won');
  return { m, start: at(2, 9), size: [W, H] };
}
