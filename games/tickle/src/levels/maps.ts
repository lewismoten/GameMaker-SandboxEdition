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
  course: { '.': 'wallC', '#': 'under', '=': 'floorW', '^': 'ceilC', _: 'desk', '|': 'deskLeg' },
  lab: { '.': 'wallL', '#': 'under', '=': 'floorL', '^': 'ceilL', _: 'bench', '|': 'benchLeg' },
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
  door(x: number, y: number, toScene: LinkSpec['toScene']): this {
    this.col(x, 0, y - 2, '#').set(x, y - 1, 'D').set(x, y, 'G');
    this.fill(x + 2, y - 1, 1, 2, 'X');
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

/** 1. The course: the night classroom, the practice rats, the door to the certificate. */
export function course(book: BlockBook): Level {
  const W = 64;
  const H = 12;
  const m = new MapBuilder(book, 'course', 0).room(W, H);
  // the wainscot along the bottom of the wall
  m.fill(1, 8, W - 2, 2, 'w');
  // the lesson: the keys on signs, the chalkboard, the clock and the window
  m.text(3, 4, 'P.K.F');
  m.patch(13, 2, ['1234', 'tttt']).set(10, 2, 'O').set(25, 3, 'W').set(41, 3, 'W').set(53, 3, 'W');
  // practice rat 1, on the floor
  m.mon(MON.labRat, 9, 9);
  // a desk with practice rat 2 on it, drops at its end
  m.row(8, 16, 20, '_').set(16, 9, '|').set(20, 9, '|').set(20, 7, 'o');
  m.mon(MON.labRat, 16, 7);
  // the course on the TV cart
  m.set(23, 9, 'V');
  // practice rat 3 is a tense one
  m.mon(MON.labTense, 26, 9);
  // Loaf #13 on a lunch tray, on a desk; a cup of coffee
  m.row(8, 32, 35, '_').set(32, 9, '|').set(35, 9, '|').set(35, 7, 'c');
  m.mon(MON.loaf, 33, 7);
  // the Bunsen burner on a desk, a rat padding under it
  m.row(8, 39, 42, '_').set(39, 9, '|').set(42, 9, '|').set(41, 7, 'b');
  m.mon(MON.labRat, 38, 9);
  // the last desk: rat 5, and the rubber chicken
  m.row(8, 46, 50, '_').set(46, 9, '|').set(50, 9, '|').set(50, 7, 'k').text(44, 6, 'o.o');
  m.mon(MON.labRat, 46, 7);
  // the door: three rats in the carpet
  m.door(57, 9, 'next');
  return { m, start: at(2, 9), size: [W, H], rats: ratCount(m) };
}

export const LEVEL_MAPS = { course };
