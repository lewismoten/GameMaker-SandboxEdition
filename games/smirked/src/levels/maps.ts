// The four levels, from the song, each drawn as rows of characters (one a block; each level
// has its own legend); everything outside a level is solid:
//   1. Mild Scares for All Ages: the fog hall. Fog machines hiss under the runner, rubber bats
//      bob, a bedsheet ghost slides on its wire, and Lily strolls up the middle eating her apple.
//      Four flashlight batteries open the door to the dark hallway.
//   2. GET DOWN!: the zombie parade in the crypt. Animatronic zombies shuffle, papier-mache
//      witches stand very still. Tackle them (SPACE), then say sorry to five; the STAFF ONLY
//      door lets you out.
//   3. Strategic Repositioning: the fake woods. The guy in the werewolf mask growls after you,
//      walls of fake spiderwebs make you sneeze, fog lights and fake demon feet trip you, and
//      Lily pats you. Twelve dollars buy the souvenir sword at the gift shop's register.
//   4. The Emergency Exit Sign: the last hall. An 11-year-old in a clown wig; your $12 foam
//      sword knocks the wig off, and the emergency exit opens for it.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/blocks';
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
    filler: string,
    private legend: Record<string, string>,
  ) {
    this.map.blocks.fill(book.n(filler));
  }

  /** Sets a block at level coordinates (a char from the legend, or a block name). */
  set(x: number, y: number, what: string): this {
    const name = what.length === 1 ? this.legend[what] : what;
    if (!name) throw new Error(`Unknown map char "${what}"`);
    this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = this.book.n(name);
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
  /** Where you start, in world blocks. */
  start: [number, number];
  /** The level's size in blocks (for previews and cards). */
  size: [number, number];
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** A map from rows of characters: checks they are all one width. */
function rows(lines: string[]): { w: number; h: number; lines: string[] } {
  const w = lines[0].length;
  lines.forEach((l, i) => {
    if (l.length !== w) throw new Error(`Map row ${i} is ${l.length} wide, not ${w}: "${l}"`);
  });
  return { w, h: lines.length, lines };
}


/** 1. The fog hall. */
const FOYER: Record<string, string> = {
  '#': 'wallTop',
  P: 'paper',
  p: 'paper2',
  O: 'window',
  T: 'portrait',
  C: 'candles',
  '1': 'mild0',
  '2': 'mild1',
  '3': 'mild2',
  '.': 'boards',
  ',': 'boards2',
  '=': 'runner',
  v: 'vent',
  b: 'batteryB',
  $: 'dollarB',
  '*': 'candyB',
  j: 'juiceB',
  g: 'glowstickB',
  a: 'appleB',
  J: 'pumpkin',
  k: 'hay',
  x: 'coffin',
  D: 'darkDoor',
};

export function fogHall(book: BlockBook): Level {
  const map = rows([
    '#PPOPPCPPTPpP123PPCPPOPpTPPCP#',
    '#J.....,......=.......,.....J#',
    '#..b....v.....=..v....$......D',
    '#.....xx......=.......kk..v..#',
    '#..*..........v..........*...#',
    '#vv..k..g.....=.....v..x.....#',
    '#.....$.......=..b.......j...#',
    '#..J.....v....=........v.....#',
    '#......kk.....v...xx......b..#',
    '#.v...........=.........J....#',
    '#...*....j....=..v...*.....v.#',
    '#.b......v....=.....,....$...#',
    '#.....J.b.....v........kk....#',
    '#..$......,...=...a.....v....#',
    '#.............=..............#',
    '##############################',
  ]);
  const m = new MapBuilder(book, 'wallTop', FOYER);
  m.patch(0, 0, map.lines);
  m.mon(MON.lily, 15, 13).mon(MON.bat, 5, 7).mon(MON.bat, 20, 3).mon(MON.bat, 11, 11).mon(MON.ghost, 18, 9).mon(MON.ghost, 3, 4);
  m.link(29, 2, 'next');
  return { m, start: at(14, 14), size: [map.w, map.h] };
}

/** 2. The zombie parade. */
const CRYPT: Record<string, string> = {
  '#': 'wallTop',
  W: 'crypt',
  L: 'lights',
  '.': 'flags',
  ',': 'flags2',
  t: 'tombRip',
  u: 'tombBoo',
  l: 'tombLol',
  c: 'cauldron',
  f: 'fence',
  x: 'coffinS',
  $: 'dollarS',
  '*': 'candyS',
  j: 'juiceS',
  g: 'glowstickS',
  S: 'staffDoor',
};

/** Where the papier-mache witches stand. */
export const WITCHES: [number, number][] = [
  [6, 4],
  [13, 7],
  [19, 2],
  [9, 12],
  [21, 12],
  [27, 7],
];

export function zombieParade(book: BlockBook): Level {
  const map = rows([
    '#WWLWWWWLWWWWWLWWWWLWWWWWLWWWWW#',
    '#.....t.u.t.......,.....c....$.#',
    '#..$..........*........l.u....,#',
    '#..fff....,......c.........x...#',
    '#.........t.l.u.......*........#',
    '#.,..j.............,.......fff.#',
    '#........c....x......t.u.t.....#',
    '#....................g.........#',
    '#....,.....*.........,.........S',
    '#..t.u.t.......c.........$.....#',
    '#.........,.........fff........#',
    '#..$...x.....t.l.u.......j.....#',
    '#.....,...............*....,...#',
    '#.c......$.......,......t.u.t..#',
    '#..............................#',
    '################################',
  ]);
  const m = new MapBuilder(book, 'wallTop', CRYPT);
  m.patch(0, 0, map.lines);
  for (const [x, y] of WITCHES) m.mon(MON.witch, x, y);
  m.mon(MON.zombie, 3, 7).mon(MON.zombie, 15, 5).mon(MON.zombie, 24, 4).mon(MON.zombie, 11, 14).mon(MON.zombie, 25, 10);
  m.mon(MON.lily, 2, 14).mon(MON.goat, 17, 8).mon(MON.seed, 29, 12).mon(MON.bat, 8, 9);
  m.link(31, 8, 'next');
  return { m, start: at(1, 8), size: [map.w, map.h] };
}

/** 3. The fake woods, and the gift shop. */
const WOODS: Record<string, string> = {
  '#': 'wallTop',
  H: 'woods',
  h: 'woods2',
  '.': 'dirt',
  ',': 'leaves',
  T: 'tree',
  t: 'tree2',
  B: 'bush',
  J: 'pumpkinD',
  k: 'hayD',
  w: 'web',
  l: 'fogLight',
  e: 'feet',
  $: 'dollarD',
  '*': 'candyD',
  j: 'juiceD',
  a: 'appleD',
  s: 'swords',
  p: 'plush',
  m: 'mugs',
  R: 'register',
};

export function fakeWoods(book: BlockBook): Level {
  const map = rows([
    '#HHhHHHhHHHHhHHHhHHHHhHHHhHHHHhHH#',
    '#..,..T....,.w...B.....T..,..t...#',
    '#.$...t..l..,w..$..T....w..*..,..#',
    '#.,..wwww..T.w....l..k..w..B..j..#',
    '#..T...........e.....,..w....t$..#',
    '#...,..B..$..t...wwwww.....l..,..#',
    '#.J..l....,......T....,..$..T....#',
    '#....T...e....,......B.....,.....#',
    '#.,.....wwwww....t...l.....wwww..#',
    '#..$.T.......B....,....$.....T...#',
    '#.....,..l.....j....t.....e....,.#',
    '#.t..k.....T.....,.....,.ssppmm..#',
    '#..,..$.*....,.....l...........$.#',
    '#.J...T....,...e......*...,......R',
    '#.....,.........$....T......a....#',
    '##################################',
  ]);
  const m = new MapBuilder(book, 'wallTop', WOODS);
  m.patch(0, 0, map.lines);
  m.mon(MON.lily, 2, 1).mon(MON.werewolf, 20, 9).mon(MON.spider, 9, 1).mon(MON.spider, 24, 9).mon(MON.carl, 15, 11).mon(MON.bill, 7, 9).mon(MON.bill, 19, 13).mon(MON.bill, 27, 3);
  m.link(33, 13, 'next');
  return { m, start: at(1, 2), size: [map.w, map.h] };
}

/** 4. The last hall. */
const HALL: Record<string, string> = {
  '#': 'wallTop',
  V: 'curtain',
  '.': 'carpet',
  ',': 'carpet2',
  s: 'swords',
  p: 'plush',
  m: 'mugs',
  d: 'desk0',
  D: 'desk1',
  E: 'exitSign',
  X: 'exitDoor',
  $: 'dollarC',
  '*': 'candyC',
  j: 'juiceC',
  L: 'loafC',
  r: 'remoteC',
};

export function lastHall(book: BlockBook): Level {
  const map = rows([
    '#VVVVVVVVVVVVVEVVVVVVVVVVVVVV#',
    '#sspmmVVVVVVVVXVVVVVVVVVsspmm#',
    '#.....,......................#',
    '#..L....*.........*......r...#',
    '#.....pp.....,......mm.......#',
    '#..j..........$..........,...#',
    '#.......,.........*..........#',
    '#..ss.......dD........ss..$..#',
    '#.....$.................,....#',
    '#..*.......,.............*...#',
    '#...........................j#',
    '##############################',
  ]);
  const m = new MapBuilder(book, 'wallTop', HALL);
  m.patch(0, 0, map.lines);
  m.mon(MON.clown, 22, 3).mon(MON.lilyNear, 16, 10).mon(MON.bat, 4, 5).mon(MON.bat, 25, 6);
  m.link(14, 1, 'won');
  return { m, start: at(14, 10), size: [map.w, map.h] };
}
