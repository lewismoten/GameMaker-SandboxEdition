// The four levels, from the song, each drawn as rows of characters (one a block; each level
// has its own legend); everything outside a level is solid:
//   1. Where's the Remote?!: the living room, 1995. The couch, the cushions, Teddy asleep in his
//      bed, the cat on the armchair, the laundry, the magazines, the afghan, the Voice-O-Matic.
//      Search six spots and the baby gate to the kitchen opens.
//   2. Who Knows Anymore?: the kitchen. Open the fridge, dodge the toast, find Mom's number (seven
//      fridge magnets the dog knocked all over the floor) and call her on the wall phone.
//   3. The Void Between the Cushions: the couch is a portal, a Bermuda zone. Ten pennies, three
//      pens, a spoon, a sock from Christmas, a tiny raccoon, fake remotes and the pay TV home.
//   4. The Living Room Ride: the living room spins like a carnival ride. Stand up, press PLAY
//      on the VCR, and sit back down.
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

/** The living room's furniture and walls (also the ride's). */
const ROOM: Record<string, string> = {
  '.': 'carpet',
  ',': 'carpet2',
  r: 'rug',
  f: 'rugEdge',
  L: 'toyBlock',
  P: 'paper',
  W: 'panel',
  '#': 'wallTop',
  O: 'window',
  T: 'portrait',
  K: 'clock',
  V: 'tapes',
  '(': 'tvL',
  ')': 'tvR',
  '[': 'tvSnowL',
  ']': 'tvSnowR',
  '{': 'tvCookL',
  '}': 'tvCookR',
  v: 'vcr',
  g: 'couchArmL',
  h: 'couchArmR',
  a: 'couchBackL',
  b: 'couchBack',
  B: 'couchBack2',
  d: 'couchBack3',
  e: 'couchBackR',
  c: 'cushion',
  C: 'cushion2',
  t: 'tableL',
  u: 'tableR',
  A: 'chairCat',
  D: 'dogBed',
  l: 'lamp',
  G: 'gadget',
  k: 'blanket',
  m: 'mags',
  n: 'laundry',
  p: 'plant',
  $: 'penny',
  '*': 'popcorncarpet',
  '"': 'pad',
  Q: 'beanbag',
  '=': 'babyGate',
};

/** 1. The living room: search six spots and the baby gate to the kitchen opens. */
export function livingRoom(book: BlockBook): Level {
  const map = rows([
    '#PPPPOPPPPPPKPPPPTPPPPPOPPPPP#',
    '#WVVWWWWWWW[]vWWWWWWWWWWlGWWW#',
    '#.....,...."......,..........#',
    '#..p.....*.............m.....#',
    '#.....rrrrrrrrr.........,....#',
    '#.....rrrrrrrrr....$.....A...#',
    '#.....fffffffff..............#',
    '#....,gcCch..........L.......#',
    '#.....abBde.....tu...........#',
    '#..........,..............,..#',
    '#..D......L......*......n....=',
    '#...........k................#',
    '#..,................QQ.......#',
    '#.....$......L.........*..p..#',
    '#.p......................$...#',
    '##############################',
  ]);
  const m = new MapBuilder(book, 'wallTop', ROOM);
  m.patch(0, 0, map.lines);
  // dust bunnies under everything, and the cat prowling
  m.mon(MON.bunny, 4, 12).mon(MON.bunny, 20, 3).mon(MON.bunny, 14, 13).mon(MON.cat, 18, 9);
  m.link(29, 10, 'next');
  return { m, start: at(8, 6), size: [map.w, map.h] };
}

/** The kitchen. */
const KITCHEN: Record<string, string> = {
  '#': 'wallTop',
  X: 'tileWall',
  '.': 'lino',
  Q: 'counter',
  S: 'sink',
  Y: 'toaster',
  M: 'microwave',
  Z: 'stove',
  E: 'cereal',
  R: 'drawer',
  F: 'fridgeTop',
  H: 'fridge',
  J: 'ktable',
  j: 'kchair',
  w: 'bowl',
  x: 'trash',
  q: 'milk',
  z: 'pizza',
  '5': 'magnet5',
  '0': 'magnet0',
  '1': 'magnet1',
  '3': 'magnet3',
  '@': 'phone',
};

/** 2. The kitchen: open the fridge, find Mom's number, call her. */
export function kitchen(book: BlockBook): Level {
  const map = rows([
    '#XXXXXXXXXXXXXXXXXXXXXXXXX#',
    '#QQSQYQMMQZQRQEQ.F.x.....Q#',
    '#.....5..........H.....1..@',
    '#.........................#',
    '#...q.....j.j.....w.......#',
    '#........jJJJj............#',
    '#..0.....jJJJj.......5....#',
    '#.........j.j.............#',
    '#...............3.........#',
    '#.....z......q.........1..#',
    '#.............5...........#',
    '###########################',
  ]);
  const m = new MapBuilder(book, 'wallTop', KITCHEN);
  m.patch(0, 0, map.lines);
  // the phone hangs in the doorway to the hall on its long curly cord: once Mom's on the line
  // you walk on down the hall, so "Called my mom..." plays out before you fall into the void
  m.patch(27, 2, ['....']);
  m.mon(MON.teddy, 6, 8).mon(MON.cat, 20, 6).mon(MON.roach, 3, 9).mon(MON.roach, 17, 3).mon(MON.roach, 24, 8);
  m.link(30, 2, 'next');
  return { m, start: at(1, 3), size: [map.w + 4, map.h] };
}

/** The void between the cushions. */
const VOID: Record<string, string> = {
  '~': 'void',
  '-': 'void2',
  i: 'far0',
  I: 'far1',
  U: 'far2',
  o: 'fabric',
  '8': 'fabric2',
  '%': 'swirl0',
  '/': 'pen',
  s: 'spoon',
  '!': 'xmasSock',
  '&': 'pog',
  N: 'guide',
  '^': 'crumb',
  '7': 'calc',
  '6': 'opener',
  '9': 'handheld',
  '+': 'candy',
  $: 'pennyF',
  '<': 'payTv',
  '>': 'sign',
};

/** 3. The void between the cushions: ten pennies and the pay TV. */
export function theVoid(book: BlockBook): Level {
  const map = rows([
    '~~~~~~~~-~~~~~~~~~~i~~~~~~~~~-~~~~~~',
    '~oo8o$o~~~~~~-~~~~~~~~~~~I~~~~~~~~~~',
    '~o~~~~o~~oo8oo$oo~~~~~~o8oo/ooo~~-~~',
    '~o~-~~oo%o~~~~~~o~~~~~~o~~~~~~o~~~~~',
    '~$~~~~~~~o~~-~~~&~~~~oo8~~~~~~$~~~~~',
    '~o~~~U~~~7~~~~~~o~~~~o~~~~~~~~o~~~~~',
    '~oo/o~~~~o~~~~~~oo%oo8oooo$~~~oo~~~~',
    '~~~~o~~~~ooo~~~~~~~~~~~~~~o~~~~o~~-~',
    '~-~~o~~~~~~o~~~-~~~~~i~~~~o~~~~6~~~~',
    '~~~~$~~~~~~oo8o!o~~~~~~~~~o~~~~o~~~~',
    '~~oo%ooooN~~~~~~o~~~~~~~~~s~~~~o~~~~',
    '~~o~~~~~o~~~~~~~ooo$oo8oooo~~~~o~~~~',
    '~~o~-~~~o~~~I~~~~~~~~~~~~~~~~~~^~~~~',
    '~~/~~~~~ooo9oo$oo%o~~~~~~~~~~~~o~~~~',
    '~~o~~~~~~~~~~~~~~~o~~~-~~~oooo8o~~~~',
    '~~$oo+o8~~~~~~U~~~o~~~~~~~o~~~~~~~-~',
    '~~~~~~~o~~~~~~~~~~oo&o$ooo~~~~~~~~~~',
    '~~i~~~~o~~~~-~~~~~~~~~~~~~~~>oo<oo~~',
    '~~~~~~~oooooooooooo$oooooooooo~~~~~~',
    '~~~~-~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ]);
  const m = new MapBuilder(book, 'void', VOID);
  m.patch(0, 0, map.lines);
  m.mon(MON.sock, 12, 2).mon(MON.sock, 20, 11).mon(MON.sock, 26, 2).mon(MON.lint, 9, 10).mon(MON.lint, 22, 18);
  m.mon(MON.penny, 16, 6).mon(MON.penny, 12, 13).mon(MON.penny, 10, 18);
  m.mon(MON.raccoon, 4, 10).mon(MON.seed, 31, 9).mon(MON.goat, 17, 11);
  // the pay TV's picture is the way home: two steps on through it, so its warming up plays out
  m.link(33, 17, 'next');
  return { m, start: at(1, 1), size: [map.w, map.h] };
}

/** The ride: the living room's walls and couch, the spinning rug. */
const RIDE: Record<string, string> = {
  ...ROOM,
  '>': 'spinright',
  V: 'spindown',
  '<': 'spinleft',
  '^': 'spinup',
  H: 'hub',
  o: 'bulbs',
  y: 'vcrPlay',
  s: 'couchSeat',
  c: 'seatCushion',
  Q: 'tapes',
  '=': 'rideExit',
};

/**
 * 4. The living room ride: in at the gap, press PLAY on the VCR, off at the EXIT (the tape must
 * be playing) and along the front of the couch to sit back down: the walk from the EXIT lets
 * "There you are, you sneaky guy." play out before the fade.
 */
export function theRide(book: BlockBook): Level {
  const map = rows([
    '#PPPPOPPPPPPKPPPPTPPPPPOPPPPP#',
    '#WQQWWWWWWWW{}yWWWWWWWWWlWWWW#',
    '#.....,............,.........#',
    '#ooooooooooo...oooooooooooooo#',
    '#o>>>>>>>>>>>>>>>>>>>>>>>>>Vo#',
    '#o^.......................,Vo#',
    '#o^.....,.....H............Vo#',
    '#o^.......................,Vo#',
    '#o^........................Vo#',
    '#o^<<<<<<<<<<<<<.<<<<<<<<<<<o#',
    '#ooooooooooo...o=oooooooooooo#',
    '#..............p......p......#',
    '#..p............tupgcsch..p..#',
    '#..................abBde.....#',
    '#............................#',
    '##############################',
  ]);
  const m = new MapBuilder(book, 'wallTop', RIDE);
  m.patch(0, 0, map.lines);
  m.mon(MON.recliner, 4, 5).mon(MON.ottoman, 24, 8).mon(MON.lampshade, 16, 6).mon(MON.popcorn, 20, 2).mon(MON.popcorn, 7, 11).mon(MON.rider, 6, 6);
  m.link(21, 12, 'won');
  return { m, start: at(13, 14), size: [map.w, map.h] };
}
