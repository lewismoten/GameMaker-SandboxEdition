// The four levels, from the song, each laid out by rows and runs of blocks; everything outside a
// level is solid:
//   1. The Course: the night classroom where Doc Leo takes the self-paced course ("two hours of
//      training in how to pin right"), with practice rats on the floor and on the desks.
//   2. The Lab: "Tickle first to drain the stress before the needles start the day": cage racks,
//      benches, Tesla coils, the night janitor's floor buffer and Dean Dour.
//   3. The Sewers: "No rats yet, but I will answer when fate makes its demand": the city's wild
//      rats along the walkways, steam to ride, an alligator in the channel, bats.
//   4. The Empire: up the storm-struck tower to the balcony, where the laughing carpet will bow.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/blocks';
import { MON } from '../ids';

export type Area = 'course' | 'lab' | 'sewer' | 'tower';

/** Each place's wall, filler, floor, ceiling and ledge. */
const PLACE: Record<Area, Record<string, string>> = {
  course: { '.': 'wallC', '#': 'under', '=': 'floorW', '^': 'ceilC', _: 'desk', '-': 'deskMid', '|': 'deskLeg' },
  lab: { '.': 'wallL', '#': 'under', '=': 'floorL', '^': 'ceilL', _: 'bench', '-': 'benchMid', '|': 'benchLeg' },
  sewer: { '.': 'wallS', '#': 'stoneS', '=': 'walkS', '^': 'stoneS', _: 'pipe', '|': 'wallS' },
  tower: { '.': 'wallT', '#': 'blockT', '=': 'blockT', '^': 'blockT', _: 'ledgeT', '|': 'wallT' },
};

/** Chars every level shares, and the ones only one place has. */
const LEGEND: Record<string, string> = {
  w: 'wainsC',
  '1': 'board1',
  '2': 'board2',
  '3': 'board3',
  '4': 'board4',
  t: 'boardTray',
  W: 'windowC',
  O: 'clockC',
  V: 'tv0',
  P: 'signPin',
  K: 'signTickle',
  F: 'signFirst',
  H: 'signHop',
  b: 'bunsen0',
  g: 'cage',
  h: 'cageTop',
  z: 'coil',
  d: 'detector0',
  f: 'flask0',
  L: 'windowL',
  p: 'posterL',
  '~': 'water0',
  v: 'deep',
  r: 'grate',
  s: 'steam0',
  l: 'ladder',
  m: 'manhole',
  a: 'archS',
  u: 'spout',
  Q: 'cheese',
  n: 'windowT',
  j: 'jacob0',
  B: 'banner',
  y: 'balcony',
  X: 'exit',
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
    readonly area: Area,
    /** The level's number (0..3): its door's blocks. */
    readonly level: number,
  ) {
    this.map.blocks.fill(book.n(PLACE[area]['#']));
  }

  private block(ch: string): number {
    const items: Record<string, string> = { o: `drops.${this.area}`, c: `coffee.${this.area}`, k: `chicken.${this.area}`, D: `doorTop${this.level}`, G: `gate${this.level}` };
    const name = PLACE[this.area][ch] ?? items[ch] ?? LEGEND[ch];
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

  col(x: number, y0: number, y1: number, ch: string): this {
    return this.fill(x, y0, 1, y1 - y0 + 1, ch);
  }

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

  /** The level's room: walls round the edge, a ceiling, the floor at row h - 2. */
  room(w: number, h: number): this {
    this.fill(1, 1, w - 2, h - 3, '.').row(0, 0, w - 1, '^').row(h - 2, 0, w - 1, '=').row(h - 1, 0, w - 1, '#').col(0, 0, h - 1, '#').col(w - 1, 0, h - 1, '#');
    return this;
  }

  /**
   * The level's Dutch door at column x (Doc Leo's bottom row y): solid wall above, the open top
   * half, the bottom half that asks for the carpet; and the exit two blocks on, with its link.
   */
  door(x: number, y: number, toScene: LinkSpec['toScene'], exit = 'X'): this {
    this.col(x, 0, y - 2, '#').set(x, y - 1, 'D').set(x, y, 'G');
    this.fill(x + 2, y - 1, 1, 2, exit);
    return this.link(x + 2, y, toScene);
  }

  build(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}

export interface Level {
  m: MapBuilder;
  /** Where Doc Leo starts (his bottom block), in world blocks. */
  start: [number, number];
  /** The level's size in blocks (for previews and cards). */
  size: [number, number];
  /** How many rats the level holds. */
  rats: number;
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** Counts the rats put in a level. */
function ratCount(m: MapBuilder): number {
  const ids: number[] = [MON.labRat, MON.labTense, MON.wildRat, MON.wildTense];
  return m.map.monsters.filter((s) => s && ids.includes(s.monnum)).length;
}

/** A desk or bench from x0 to x1 on row y: its ends over legs, the tops between them legless. */
const table = (m: MapBuilder, y: number, x0: number, x1: number) => m.row(y, x0, x1, '-').set(x0, y, '_').set(x1, y, '_');

/** 1. The course: the night classroom, the practice rats, the door to the certificate. */
export function course(book: BlockBook): Level {
  const W = 64;
  const H = 12;
  const m = new MapBuilder(book, 'course', 0).room(W, H);
  // the wainscot along the bottom of the wall
  m.fill(1, 8, W - 2, 2, 'w');
  // the lesson: the keys on signs, the chalkboard, the clock and the window
  m.text(3, 4, 'P.K.F');
  m.patch(13, 2, ['1234', 'tttt']).set(10, 2, 'O').set(25, 3, 'W').set(53, 3, 'W');
  // the wide window onto the parking lot, THE CHEZ charging under the lamp
  m.set(40, 3, 'windowLotL').set(41, 3, 'windowLotR');
  // practice rat 1, on the floor
  m.mon(MON.labRat, 9, 9);
  // a desk with practice rat 2 on it, drops at its end
  table(m, 8, 16, 20).set(16, 9, '|').set(20, 9, '|').set(20, 7, 'o');
  m.mon(MON.labRat, 16, 7);
  // the course on the TV cart
  m.set(23, 9, 'V');
  // practice rat 3 is a tense one
  m.mon(MON.labTense, 26, 9);
  // Loaf #13 on a lunch tray, on a desk; a cup of coffee
  table(m, 8, 32, 35).set(32, 9, '|').set(35, 9, '|').set(35, 7, 'c');
  m.mon(MON.loaf, 33, 7);
  // the Bunsen burner on a desk, a rat padding under it
  table(m, 8, 39, 42).set(39, 9, '|').set(42, 9, '|').set(41, 7, 'b');
  m.mon(MON.labRat, 38, 9);
  // the last desk: rat 5, and the rubber chicken
  table(m, 8, 45, 50).set(45, 9, '|').set(50, 9, '|').set(50, 7, 'k').set(46, 6, 'o');
  m.mon(MON.labRat, 47, 7);
  // the door: three rats in the carpet
  m.door(57, 9, 'next');
  return { m, start: at(2, 9), size: [W, H], rats: ratCount(m) };
}

/** 2. The lab: benches, cage racks, Tesla coils, the floor buffer and Dean Dour; out by the window. */
export function lab(book: BlockBook): Level {
  const W = 78;
  const H = 14;
  const m = new MapBuilder(book, 'lab', 1).room(W, H);
  m.set(4, 5, 'p').set(8, 4, 'd').set(30, 4, 'd').set(47, 3, 'p').set(64, 4, 'd');
  // the first bench, flasks bubbling, a rat on the floor and one on the bench
  m.mon(MON.labRat, 7, 11);
  table(m, 10, 11, 18).set(11, 11, '|').set(18, 11, '|').set(12, 9, 'f').set(17, 9, 'o');
  m.mon(MON.labRat, 13, 9);
  // the Tesla coils, and a cage rack over them with a tense rat on top
  m.set(21, 11, 'z').set(25, 11, 'z');
  m.row(8, 20, 27, 'h').fill(20, 9, 8, 1, 'g').set(26, 7, 'c');
  m.mon(MON.labTense, 21, 7);
  // the floor buffer's run, a bench over it and the racks beyond: down off the racks onto the bench
  m.mon(MON.buffer, 31, 11);
  table(m, 10, 28, 31).set(28, 11, '|').set(31, 11, '|');
  m.row(8, 33, 42, 'h').fill(33, 9, 10, 1, 'g').set(40, 7, 'o').set(42, 7, 'o');
  m.mon(MON.labRat, 34, 7).mon(MON.labRat, 38, 7);
  // Dean Dour of the Board of Serious Science, on his rounds
  m.mon(MON.deanA, 45, 10).mon(MON.deanB, 45, 11);
  // the mustard seed in a petri dish on a long bench
  table(m, 10, 52, 59).set(52, 11, '|').set(59, 11, '|').set(55, 9, 'f');
  m.mon(MON.seed, 54, 9);
  // a rack with a rat on top and one under it, the rubber chicken; a rat by the door
  m.row(8, 60, 65, 'h').fill(60, 9, 6, 1, 'g').set(65, 7, 'k');
  m.mon(MON.labRat, 61, 7).mon(MON.labTense, 60, 11).mon(MON.labRat, 66, 11);
  m.set(70, 10, 'o').set(70, 11, 'c');
  // the door: ten rats in the carpet; out the window into the night
  m.door(72, 11, 'next', 'L');
  return { m, start: at(2, 11), size: [W, H], rats: ratCount(m) };
}

/** 3. The sewers: the walkways, the steam, the pipes over the channels, bats and an alligator. */
export function sewer(book: BlockBook): Level {
  const W = 80;
  const H = 14;
  const m = new MapBuilder(book, 'sewer', 2).room(W, H);
  m.set(3, 8, 'u').set(27, 10, 'a').set(28, 10, 'a').set(50, 8, 'u').set(61, 10, 'a');
  // the first walkway: a wild rat, a bat
  m.mon(MON.wildRat, 6, 11).mon(MON.bat, 8, 6);
  // the channel, the alligator lurking in it; the steam up to the pipe over it
  m.fill(15, 11, 9, 1, '~').fill(15, 12, 9, 1, 'v');
  m.mon(MON.gatorB, 18, 11).mon(MON.gatorA, 19, 11);
  m.set(13, 12, 'r').col(13, 3, 11, 's');
  m.row(5, 14, 24, '_').set(22, 4, 'o');
  m.mon(MON.wildRat, 16, 4);
  // the long walkway: rats, cheese, a bat
  m.mon(MON.wildTense, 28, 11).mon(MON.wildRat, 33, 11).mon(MON.bat, 34, 5);
  m.set(31, 10, 'Q').set(38, 9, 'c');
  // a step up to the low pipe over the second channel
  m.set(40, 11, '#').row(9, 41, 49, '_').fill(42, 11, 7, 1, '~').fill(42, 12, 7, 1, 'v');
  m.mon(MON.wildRat, 43, 8);
  // the last walkway
  m.mon(MON.wildRat, 52, 11).mon(MON.wildTense, 58, 11).mon(MON.wildRat, 64, 11).mon(MON.bat, 60, 4);
  m.set(56, 10, 'Q').set(67, 9, 'k').set(68, 11, 'o');
  // the door: eighteen rats in the carpet; up the ladder to the street
  m.door(71, 11, 'next', 'm');
  m.col(73, 1, 9, 'l');
  return { m, start: at(2, 11), size: [W, H], rats: ratCount(m) };
}

/** 4. The empire: up the tower in the storm, ledge by ledge, to the balcony. */
export function tower(book: BlockBook): Level {
  const W = 44;
  const H = 24;
  const m = new MapBuilder(book, 'tower', 3).room(W, H);
  m.set(3, 14, 'B').set(8, 17, 'n').set(16, 2, 'n').set(28, 17, 'n').set(38, 11, 'n').set(26, 3, 'B').set(40, 18, 'B');
  // the floor: rats, a Jacob's ladder
  m.mon(MON.wildRat, 4, 21).mon(MON.labTense, 12, 21).mon(MON.wildRat, 30, 21);
  m.set(9, 21, 'j');
  // the ledges zigzagging up, two blocks apart
  m.row(20, 20, 30, '_').set(29, 19, 'c');
  m.mon(MON.wildRat, 22, 19);
  m.row(18, 32, 41, '_');
  m.mon(MON.labRat, 33, 17).mon(MON.deanA, 38, 16).mon(MON.deanB, 38, 17);
  m.row(16, 22, 30, '_').set(29, 15, 'o');
  m.mon(MON.wildTense, 23, 15).mon(MON.pigeon, 24, 12);
  m.row(14, 10, 20, '_');
  m.mon(MON.wildRat, 12, 13).mon(MON.goat, 18, 13);
  m.row(12, 1, 8, '_').set(1, 11, 'k');
  m.mon(MON.labRat, 3, 11);
  m.row(10, 10, 20, '_').set(19, 9, 'o');
  m.mon(MON.wildRat, 12, 9).set(21, 6, 'j');
  m.row(8, 22, 32, '_');
  m.mon(MON.labTense, 25, 7);
  // the top ledge, and the balcony
  m.row(6, 34, 42, '_');
  m.door(39, 5, 'won', 'y');
  return { m, start: at(2, 21), size: [W, H], rats: ratCount(m) };
}
