// The four levels, from the song: the shepherds' field under the stars, Bethlehem's crowded
// streets (and the census), the wise men's caravan, and the stable, where the line of
// animals at the manger has an empty place, third from the left.
// Each map is laid out with fills and ASCII patches; everything outside it is solid.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/blocks';
import { MON } from '../ids';

const LEGEND: Record<string, string> = {
  ',': 'flowers',
  ':': 'path',
  s: 'sand',
  '~': 'ripple',
  c: 'cobble',
  f: 'floor',
  '`': 'straw',
  '#': 'wall',
  R: 'rock',
  r: 'rockSand',
  O: 'olive',
  P: 'palm',
  X: 'thorn',
  x: 'thornSand',
  H: 'hay',
  h: 'hayIn',
  y: 'haySand',
  t: 'thistle',
  g: 'gate',
  W: 'woolBush',
  V: 'woolBushSand',
  w: 'woolGrass',
  v: 'woolStraw',
  u: 'woolSand',
  b: 'bell',
  B: 'bellStraw',
  '*': 'star0',
  '+': 'starS0',
  '%': 'starC0',
  F: 'fire0',
  Z: 'roof',
  m: 'house',
  n: 'window',
  d: 'door',
  N: 'innNo',
  M: 'innRoom',
  I: 'innDoor',
  a: 'awning',
  A: 'awningB',
  k: 'cabbage',
  K: 'crate',
  j: 'figs',
  l: 'laundry',
  C: 'census',
  z: 'clerk',
  o: 'well',
  q: 'sandal',
  T: 'tentP',
  U: 'tentB',
  Y: 'tentR',
  D: 'tentDoor',
  '1': 'giftGold',
  '2': 'giftFrank',
  '3': 'giftMyrrh',
  '=': 'water',
  '<': 'camelL',
  '>': 'camelR',
  S: 'stall',
  '-': 'beam',
  '|': 'rail',
  L: 'lantern',
  '[': 'mangerL',
  ']': 'mangerR',
  G: 'trough',
  p: 'pail',
  Q: 'dusty',
  J: 'joseph',
  E: 'mary',
  _: 'place',
  e: 'exitE',
  '!': 'exitS',
  '@': 'stableDoor',
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
    const f = book.n(filler);
    this.map.blocks.fill(f);
  }

  private block(ch: string, x: number, y: number): number {
    if (ch === '.') return this.book.n((x * 7 + y * 13) % 3 ? 'grassA' : 'grassB');
    const name = LEGEND[ch];
    if (!name) throw new Error(`Unknown map char "${ch}"`);
    return this.book.n(name);
  }

  /** Sets a block at level coordinates (a char from the legend, or a block name). */
  set(x: number, y: number, what: string): this {
    this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = what.length === 1 ? this.block(what, x, y) : this.book.n(what);
    return this;
  }

  fill(x: number, y: number, w: number, h: number, ch: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch);
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

  /** A two-block camel whose left half is at (x, y). */
  camel(x: number, y: number): this {
    return this.mon(MON.camelAR, x, y).mon(MON.camelBR, x + 1, y);
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
  /** Where the goat starts, in world blocks. */
  start: [number, number];
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** 1. The shepherds' field: out of the fold (eat the rope), past the fainting cousin in the wall. */
export function field(book: BlockBook): Level {
  const m = new MapBuilder(book, 'rock');
  m.patch(
    0,
    0,
    [
      '####################################################',
      '#.,..t.#..O....,....t....#....O....W...##..O.......#',
      '#.w...,#.....H......R....#.........,...##....H.....#',
      '#,....H#.......X.........#..t.......*..##.t.....,..#',
      '#......g...t.......W.....#.....R.......##.....X....#',
      '#..w.,.#.......,.........#.H...........##.W........#',
      '#.*..t.#..R.........O....#.......X.....##...F......#',
      '########......F..........#....,........##........*.#',
      '#,....:::::::::::::::::::::::::::::::::::::::::::::e',
      '#..O..:....t.....H.......#.....W.......##.....H....#',
      '#.....:...R.......X......#.......t.....##..R.......#',
      '#..W..:..........,.......#..O........H.##.......t..#',
      '#.....:....*......O......#.....R.......##.,........#',
      '#..R..:......W...........#..........b..##....O.....#',
      '#.....::::::::...t.......#....X........##.........W#',
      '#..t.....,...:...........#.........,...##..H.......#',
      '#.....H......:....R......#..W..........##......R...#',
      '#..*.........:.......O...#.......*.....##.t........#',
      '#............:...........#.............##..........#',
      '####################################################',
    ],
    52,
  );
  // the lambs in the fold, a cousin in the gap, more cousins grazing beyond
  m.mon(MON.lamb, 3, 3).mon(MON.lamb, 5, 2).mon(MON.lamb, 4, 6);
  m.mon(MON.goat, 25, 8);
  // two more stand nose to tail in the passage through the double wall: two screams
  m.mon(MON.goat, 39, 8).mon(MON.goat, 40, 8);
  m.mon(MON.cousin, 30, 4).mon(MON.cousin, 33, 15);
  m.mon(MON.lamb, 10, 16).mon(MON.lamb, 30, 12);
  m.link(51, 8, 'next');
  return { m, start: at(3, 4) };
}

/** 2. Bethlehem: the crowd, the market, the inn with no room, and the census in the alley. */
export function town(book: BlockBook): Level {
  const m = new MapBuilder(book, 'roof');
  m.patch(
    0,
    0,
    [
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
      'ZmndmnZZmdnmnZZnmdmZZZmnmdnZZZZNMIZnmdZZ',
      'Zcccccccccccccccccccccccccccccccccc%cccZ',
      'Zcq%ccccccccccccccccccccccccccccccccccqZ',
      'ZcccccaaAAaaAAcccccccccccccccccc%cccccZZ',
      'ZcccccjkjkkjjkcccccccccccccccccccccccccZ',
      'Zcccccccccccccccccccocccccccccccccccc%cZ',
      'cccccccccccccccccccccccccccccccccccccccZ',
      'Zccc%cccccccccccccccccccccccccccccccccZZ',
      'ZcccccccAaAaAaccccccccccc%ccccccccccccqZ',
      'ZcccccccjkjkjjcccccccccccccccccccccccccZ',
      'Zccccccccccccccccccccccccccccccccccccc%Z',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZcZZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZcZZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZlZZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZcZZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZlZZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZccZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZCzZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZcZZZZZZ',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ!ZZZZZZ',
    ],
    40,
  );
  // everyone home to be counted: the crowd in the square
  for (const [x, y, k] of [
    [10, 4, 0],
    [16, 8, 1],
    [22, 5, 0],
    [24, 11, 1],
    [28, 7, 0],
    [12, 9, 1],
    [31, 4, 0],
    [19, 10, 1],
  ])
    m.mon(k ? MON.walker2 : MON.walker, x, y);
  m.mon(MON.pigeon, 18, 4).mon(MON.pigeon, 27, 10).mon(MON.pigeon, 35, 6).mon(MON.pigeon, 6, 9);
  // a cousin, in town to be counted, asleep on her feet in the alley
  m.mon(MON.goat, 33, 14);
  m.link(33, 21, 'next');
  return { m, start: at(1, 8) };
}

/** 3. The caravan: camels strut, kneeling camels spit, and a cousin guards the ridge. */
export function caravan(book: BlockBook): Level {
  const m = new MapBuilder(book, 'rockSand');
  m.patch(
    0,
    0,
    [
      'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
      'ss~sssssPsssss~sssssssPssss~sssssPsss+sr',
      'sssss~ssssssssssssu~sssssssssssss~sssssr',
      'Pss+sssssy~sssssssssssssssss~ssVsssssssr',
      'rssssss~ssssssssss~ssssssssssssssss~sssr',
      'rssssssssssssssssssssssssssssssssssssssr',
      'r~sssssssssssss~sssssssss~sssssssss~sssr',
      'rssssssssssssssssssssssssssssssssssssssr',
      'rss~ssssssss~sssssssss~sssssssssssss~ssr',
      'rssTTTDTTsssUUUDUUsssYYYDYYsssss===ssssr',
      'rssTTTTTTsssUUUUUUsssYYYYYYssss=====sssr',
      'rssss+sssss1s2s3sssssssss+sssss===sss~sr',
      'rs~ssssssssssssssss~ssssssssssssPssssssr',
      'rsssssVssss~ssssssssssssssss~ssssssysssr',
      'rssssssssssssssssssssssssssssssssssssssr',
      'rrrrrrrrrrxxxxxxxxxsxxxxxxxxxxrrrrrrrrrr',
      'rss~sssssssssu~ssssssssssss~sssssssssV~r',
      'rssssss+ssssssssssss~sssssssssss+ssssssr',
      'rsssssssssssssssssssssssssssssssssssss<r',
      'rs~sssssss~sssssss~ssssss~ssssssss~ssssr',
      'r>sssssssssssssssssssssssssssssssssssssr',
      'rssss~ssssssssssss~ssssssssssss~sssssss@',
      'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    ],
    40,
  );
  // the tents' lower halves, and each tent's own doorway down to the ground
  for (const [x0, n] of [[3, 'P'], [12, 'B'], [21, 'R']] as const) {
    for (let x = x0; x < x0 + 6; x++) m.set(x, 10, x === x0 + 3 ? `tentDoor${n}Low` : `tent${n}Low`);
    if (n !== 'P') m.set(x0 + 3, 9, `tentDoor${n}`);
  }
  // camels strutting along two lanes, and a wise man pacing before the tents
  // the stable door is in a pocket of rocks, and the only way in is through the spitting camel's line
  for (let y = 16; y <= 21; y++) if (y !== 18) m.set(36, y, 'rockSand');
  m.camel(6, 5);
  m.camel(26, 7);
  m.mon(MON.wiseman, 12, 13);
  m.mon(MON.goat, 19, 15);
  m.mon(MON.cousin, 8, 17).mon(MON.rooster, 30, 3);
  m.link(39, 21, 'next');
  return { m, start: at(0, 1) };
}

/** 4. The stable: the donkey, the ox, the pail, the dusty straw by Joseph, and the line. */
export function stable(book: BlockBook): Level {
  const m = new MapBuilder(book, 'stall');
  m.patch(
    0,
    0,
    [
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'S-----L------------L--------SS',
      'S``h`````J`[]`E`````````h```SS',
      'S````Q`````````````````Q````SS',
      'S````````````````````````````S',
      'S||||`````````````````|||||`SS',
      'S`v``````````````````````h``SS',
      'S``h``p```````````````G`````SS',
      'S||||`````````````````|||||`SS',
      '@````````````````````````````S',
      'S````````h```````````````p``SS',
      'S||||``````B``````````|||||`SS',
      'S````````````````````````v``SS',
      'S``h``````````````h````````SSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
    ],
    30,
  );
  // the line, all facing the manger: goat, goat, (you), goat, lamb, then the donkey and the ox
  m.set(12, 4, 'place').set(9, 3, 'dusty');
  m.mon(MON.lineGoat, 10, 4).mon(MON.lineGoat, 11, 4).mon(MON.lineGoat, 13, 4).mon(MON.lineLamb, 14, 4);
  m.mon(MON.donkey, 15, 4).mon(MON.ox, 16, 4);
  m.mon(MON.lamb, 2, 6).mon(MON.lamb, 25, 12).mon(MON.lamb, 3, 12);
  m.mon(MON.pigeon, 8, 7).mon(MON.pigeon, 20, 11).mon(MON.rooster, 17, 9);
  m.link(12, 4, 'won');
  return { m, start: at(1, 9) };
}
