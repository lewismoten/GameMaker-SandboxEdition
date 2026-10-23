// The six levels, from the song, each laid out block by block; everything outside a level is
// solid. Carl flies: there is no ground to walk, only things in the way.
//   1. The Couch: the living room on a sunny afternoon, the TV snacks (eight of them),
//      a hand in the popcorn, a dish towel snapping, Teddy snapping, to the floor lamp.
//   2. The Walls: the kitchen, the old clap, the towel, a rolled-up magazine; flash a smile from
//      six spots on the walls and the kitchen door opens.
//   3. Joins Me in Bed: the bedroom by moonlight; buzz his ear (and Teddy's) three times and he
//      gets up and opens the window.
//   4. The Open Window: out in the backyard, gusts, wasps, a robin, the clothesline, the pie, to
//      the tall grass where the wild begins.
//   5. Carl Has Seen Things: the nature documentary; twelve hourglasses (twenty-four hours) and
//      the big clock breaks.
//   6. The Aux Cord: back in the living room at dusk, in gloom: sage, oils, the mop, the clap,
//      to the stereo.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from '../blocks/common';
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
  ) {
    this.map.blocks.fill(book.n(filler));
  }

  /**
   * What lies past the level's walls, for the screen to show near the edges (it can't be reached:
   * the walls are solid): `name(x, y)` in level coordinates, for every cell outside the W x H level.
   */
  surround(W: number, H: number, name: (x: number, y: number) => string): this {
    for (let y = 0; y < 100; y++)
      for (let x = 0; x < 100; x++) {
        const lx = x - ORIGIN;
        const ly = y - ORIGIN;
        if (lx >= 0 && lx < W && ly >= 0 && ly < H) continue;
        this.map.blocks[y * 100 + x] = this.book.n(name(lx > 60 ? lx - 100 : lx, ly > 60 ? ly - 100 : ly));
      }
    return this;
  }

  /** Sets a block at level coordinates. */
  set(x: number, y: number, name: string): this {
    this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = this.book.n(name);
    return this;
  }

  fill(x: number, y: number, w: number, h: number, name: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, name);
    return this;
  }

  /** A column from row y0 to y1 (inclusive). */
  col(x: number, y0: number, y1: number, name: string): this {
    return this.fill(x, y0, 1, y1 - y0 + 1, name);
  }

  /** A run along row y from x0 to x1 (inclusive). */
  row(y: number, x0: number, x1: number, name: string): this {
    return this.fill(x0, y, x1 - x0 + 1, 1, name);
  }

  /** The same block at several [x, y] places. */
  each(name: string, at: [number, number][]): this {
    for (const [x, y] of at) this.set(x, y, name);
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
  /** Where Carl starts, in world blocks. */
  start: [number, number];
  /** The level's size in blocks (for previews and cards). */
  size: [number, number];
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** A room: ceiling, wallpaper, the chair rail, wainscot, the floor (shag), and the side walls. */
function room(m: MapBuilder, W: number, H: number): void {
  // the rooms next door: the same wallpaper, wainscot, ceiling and shag
  m.surround(W, H, (_x, y) => (y <= 0 ? 'ceil' : y <= 6 ? 'paper' : y === 7 ? 'rail' : y < H - 1 ? 'panel' : 'shag'));
  m.row(0, 0, W - 1, 'ceil').fill(1, 1, W - 2, 6, 'paper').row(7, 1, W - 2, 'rail').fill(1, 8, W - 2, H - 9, 'panel').row(H - 1, 0, W - 1, 'shag');
  m.col(0, 0, H - 1, 'side').col(W - 1, 0, H - 1, 'side');
}

/** A window at (x, y) (two blocks wide, two tall); `night` for the bedroom's. */
function window(m: MapBuilder, x: number, y: number): void {
  m.set(x, y, 'winTL').set(x + 1, y, 'winTR').set(x, y + 1, 'winBL').set(x + 1, y + 1, 'winBR');
}

/** The couch from x0 (ten blocks), the man on it at x0 + 4 (gloomy or not). */
function couch(m: MapBuilder, x0: number, glum: boolean): void {
  m.row(8, x0 + 1, x0 + 8, 'couchBack').row(9, x0 + 1, x0 + 8, 'seat').row(10, x0, x0 + 9, 'couchBase');
  m.col(x0, 8, 9, 'armL').col(x0 + 9, 8, 9, 'armR');
  const mx = x0 + 4;
  m.set(mx, 7, glum ? 'glumTL' : 'manTL').set(mx + 1, 7, glum ? 'glumTR' : 'manTR');
  m.set(mx, 8, 'manML').set(mx + 1, 8, 'manMR').set(mx, 9, 'manBL').set(mx + 1, 9, 'manBR');
}

/** The floor lamp at x (its shade at row y). */
function lamp(m: MapBuilder, x: number, y: number): void {
  m.set(x, y, 'shade');
  for (let yy = y + 1; yy <= 9; yy++) m.set(x, yy, yy < 7 ? 'pole' : yy === 7 ? 'poleR' : 'poleP');
  m.set(x, 10, 'lampBase');
}

/** 1. The couch: the living room, the TV snacks, to the lamp. */
export function theCouch(book: BlockBook): Level {
  const W = 58;
  const H = 12;
  const m = new MapBuilder(book, 'side');
  room(m, W, H);
  window(m, 2, 2);
  // the bookshelf, candy on top
  m.set(6, 5, 'shelfTop').set(7, 5, 'shelfTop').fill(6, 6, 2, 5, 'shelf').set(6, 4, 'candyP').set(7, 4, 'crumbW');
  m.each('crumbW', [
    [10, 2],
    [21, 4],
    [30, 2],
  ]);
  // the couch and the man on it, watching the goat on TV
  couch(m, 11, false);
  // the coffee table: popcorn (a hand keeps reaching in), Loaf #13, chips, a soda, salsa
  m.row(9, 23, 29, 'tableTop').set(23, 10, 'tableLeg').set(29, 10, 'tableLeg');
  m.set(24, 8, 'popcorn').set(26, 8, 'chips').set(27, 8, 'soda').set(28, 8, 'salsa');
  m.mon(MON.reach, 24, 6).mon(MON.loaf, 25, 8);
  // Teddy on the rug, snapping at flies
  m.mon(MON.teddy, 31, 10);
  // a wall shelf with pizza
  m.set(31, 5, 'shelfTop').set(31, 4, 'pizzaP');
  // the TV on its stand, rabbit ears, pizza on top
  m.set(34, 7, 'tvTL0').set(35, 7, 'tvTR0').set(34, 8, 'tvBL').set(35, 8, 'tvBR').set(34, 9, 'sideTable').set(35, 9, 'sideTable').set(34, 10, 'sideTable').set(35, 10, 'sideTable');
  m.set(34, 6, 'rabbitEars').set(35, 6, 'pizzaP');
  // the dish towel, snapping (Space: a barrel roll makes it miss)
  m.mon(MON.towel, 39, 5).mon(MON.towel, 43, 2);
  m.set(41, 1, 'donutW');
  m.set(44, 5, 'shelfTop').set(44, 4, 'candyP');
  m.set(46, 10, 'sideTable').set(46, 9, 'candy').set(50, 10, 'plant').set(51, 10, 'pizza');
  // a tall bookcase right up to the ceiling but for one gap, where the towel snaps (roll!)
  m.set(48, 2, 'shelfTop').col(48, 3, 10, 'shelf');
  m.mon(MON.towel, 48, 1);
  // the floor lamp in the corner by a bookcase: eight snacks and its shade lights; Carl drops in
  // and down the pole, long enough for "On my lamp" to play before the scene ends
  m.set(55, 4, 'shelfTop').col(55, 5, 10, 'shelf');
  lamp(m, 56, 4);
  m.link(56, 9, 'next');
  return { m, start: at(4, 5), size: [W, H] };
}

/** 2. The walls: the kitchen; six smiles and the door opens. */
export function theWalls(book: BlockBook): Level {
  const W = 52;
  const H = 12;
  const m = new MapBuilder(book, 'side');
  m.surround(W, H, (_x, y) => (y <= 0 ? 'ceil' : y < H - 1 ? 'tiles' : 'shag'));
  m.row(0, 0, W - 1, 'ceil').fill(1, 1, W - 2, 10, 'tiles').row(H - 1, 0, W - 1, 'shag').col(0, 0, H - 1, 'side').col(W - 1, 0, H - 1, 'side');
  m.each('tilesB', [
    [3, 3],
    [17, 4],
    [29, 9],
    [46, 3],
  ]);
  // the counter, the sink and the stove (hot!), cabinets up top
  m.row(8, 2, 19, 'counter').fill(2, 9, 18, 2, 'cabinetLow').set(9, 8, 'sink').set(9, 7, 'faucet').set(15, 8, 'stove');
  m.row(1, 5, 12, 'cabinet');
  m.mon(MON.seed, 4, 7);
  m.set(12, 7, 'breadbox').set(13, 7, 'sodaT');
  m.each('crumbT', [
    [6, 4],
    [18, 2],
    [27, 2],
  ]);
  // smile spots on the walls
  m.set(7, 4, 'recipe').set(14, 4, 'calendar').set(18, 6, 'clock');
  // the dish towel over the counter
  m.mon(MON.towel, 11, 4);
  // a wall of cabinets, the old clap in the gap at the floor (roll!)
  m.col(23, 1, 9, 'cabinet').set(23, 8, 'counter').col(23, 9, 9, 'cabinetLow');
  m.mon(MON.clap, 23, 10);
  m.set(28, 5, 'picture').set(33, 3, 'calendar').set(31, 8, 'recipe');
  m.mon(MON.swatter, 30, 2);
  m.set(35, 10, 'donutT');
  // the fridge, and the swatter over it
  m.fill(38, 3, 2, 8, 'fridge').set(38, 2, 'fridgeTop').set(39, 2, 'fridgeTop').set(38, 6, 'fridgeArt');
  m.mon(MON.swatter, 38, 1).mon(MON.towel, 36, 6);
  m.set(43, 4, 'clock').set(45, 7, 'picture').set(42, 9, 'calendar');
  m.mon(MON.clap, 46, 7);
  // the kitchen door: six smiles
  m.col(50, 1, 7, 'side').set(50, 8, 'doorFrame').set(50, 9, 'door').set(50, 10, 'doorFrame');
  m.link(50, 9, 'next');
  return { m, start: at(2, 5), size: [W, H] };
}

/** 3. Joins me in bed: the bedroom at night; three ears buzzed and the window opens. */
export function theBed(book: BlockBook): Level {
  const W = 50;
  const H = 12;
  const m = new MapBuilder(book, 'side');
  room(m, W, H);
  // the desk and the laptop ("Carl watches me work")
  m.row(9, 2, 6, 'desk').set(4, 8, 'laptop');
  // a tin heart tucked under the desk, an Easter egg on the floor by the nightstand
  m.set(3, 10, 'tinHeart').set(10, 10, 'easterEgg');
  // the nightstand: the alarm clock, a soda
  m.fill(12, 9, 2, 2, 'nightstand').set(12, 8, 'alarm').set(13, 8, 'soda');
  // the bed: his head on the pillow (his ear is up top), the blanket
  m.col(14, 6, 10, 'headboard').set(15, 8, 'sleepL').set(16, 8, 'sleepR').row(8, 17, 25, 'blanket').set(26, 8, 'blanketEnd').row(9, 15, 26, 'blanket').row(10, 15, 26, 'bedFrame');
  m.mon(MON.ear, 16, 7);
  // he swats in his sleep, flings a slipper, and the ceiling fan turns
  m.mon(MON.swatter, 19, 5).mon(MON.fan, 22, 1).mon(MON.slipper, 28, 6);
  m.each('crumbW', [
    [9, 3],
    [24, 3],
    [33, 2],
  ]);
  m.set(30, 4, 'shelfTop').set(30, 3, 'sodaW');
  // Teddy asleep in his dog bed (his big ear counts too)
  m.set(35, 10, 'dogBedL').set(36, 10, 'dogBedR');
  m.mon(MON.dogEar, 36, 9);
  m.mon(MON.towel, 40, 6);
  m.set(41, 10, 'plant');
  // the window in the end wall: three ears and he gets up and opens it, and Carl flies straight
  // out into the night, long enough for "I've opened the window" to play before the scene ends
  m.set(W - 1, 3, 'sashTop').set(W - 1, 4, 'sash');
  const OUT = 7;
  m.fill(W, 0, OUT, H, 'night').row(4, W, W + OUT - 2, 'nightAir').set(W + 4, 1, 'moon');
  m.surround(W + OUT, H, (x, y) => (x >= W || x <= -30 ? 'night' : y <= 0 ? 'ceil' : y <= 6 ? 'paper' : y === 7 ? 'rail' : y < H - 1 ? 'panel' : 'shag'));
  m.link(W + OUT - 2, 4, 'next');
  return { m, start: at(4, 5), size: [W + OUT, H] };
}

/** 4. The open window: the backyard, to the tall grass. */
export function theWindow(book: BlockBook): Level {
  const W = 60;
  const H = 14;
  const m = new MapBuilder(book, 'earth');
  // the rest of the house to the left, more sky over the yard, the ground going on
  m.surround(W, H, (x, y) => (y >= 12 ? (y === 12 ? 'grass' : 'earth') : y < 0 ? 'skyWall' : x < 0 ? (y === 0 ? 'eaveWall' : 'sidingWall') : 'sky'));
  m.row(0, 1, W - 2, 'skyHi').fill(1, 1, W - 2, 11, 'sky').row(12, 0, W - 1, 'grass').col(0, 0, 11, 'sidingWall').set(0, 0, 'eaveWall').col(W - 1, 0, 11, 'tallWall').fill(0, 13, W, 1, 'earth');
  m.each('cloud', [
    [14, 2],
    [27, 1],
    [44, 3],
  ]);
  // the house: siding, the eave, the open window (he's begging), the window box, the wasp nest
  m.fill(1, 1, 9, 11, 'siding').row(0, 0, 10, 'eave');
  m.set(3, 4, 'owTL').set(4, 4, 'owTR').set(3, 5, 'owBL').set(4, 5, 'owBR').set(3, 6, 'flowerBox').set(4, 6, 'flowerBox');
  m.mon(MON.wave, 5, 4);
  m.set(9, 1, 'nest');
  // gusts by the house
  m.fill(13, 2, 3, 9, 'calm');
  // the clothesline: dish towels pegged out, two of them snapping in the wind
  m.set(19, 6, 'postTop').col(19, 7, 11, 'post').set(30, 6, 'postTop').col(30, 7, 11, 'post');
  m.row(6, 20, 29, 'line').set(21, 6, 'towelR').set(25, 6, 'towelB').set(28, 6, 'towelR');
  m.mon(MON.towel, 23, 7).mon(MON.towel, 27, 4);
  // a tree with a robin
  m.col(37, 6, 11, 'trunk').fill(34, 2, 7, 3, 'leaves').row(5, 34, 40, 'branch');
  m.mon(MON.bird, 32, 1);
  // the picnic table: pie and lemonade
  m.row(10, 42, 45, 'picnic').set(42, 11, 'picnicLeg').set(45, 11, 'picnicLeg').set(43, 9, 'pie').set(45, 9, 'lemonade');
  m.set(50, 11, 'birdbath');
  m.mon(MON.wasp, 47, 3).mon(MON.bird, 44, 6);
  // gusts again, and the tall grass: the wild
  m.fill(52, 2, 2, 9, 'calm');
  m.fill(56, 6, 3, 6, 'tall').set(57, 9, 'wild');
  m.link(57, 9, 'next');
  return { m, start: at(6, 5), size: [W, H] };
}

/** 5. Carl has seen things: the documentary; twenty-four hours and the clock breaks. */
export function theWild(book: BlockBook): Level {
  const W = 74;
  const H = 14;
  const m = new MapBuilder(book, 'earth');
  // the wild goes on past the stems and the rocks, under more sky
  m.surround(W, H, (_x, y) => (y >= 12 ? (y === 12 ? 'grass' : 'earth') : y < 0 ? 'skyWall' : 'tall'));
  m.row(0, 1, W - 2, 'skyHi').fill(1, 1, W - 2, 11, 'sky').row(12, 0, W - 1, 'grass').col(0, 0, 11, 'stem').col(W - 1, 0, 11, 'rock');
  // the crew's boom microphones poke in from above
  m.set(20, 0, 'boomPole').set(20, 1, 'boom').set(42, 0, 'boomPole').set(42, 1, 'boomPole').set(42, 2, 'boom');
  // tall grass stems, the third goat grazing
  m.set(6, 6, 'stemTop').col(6, 7, 11, 'stem').set(10, 8, 'stemTop').col(10, 9, 11, 'stem');
  m.mon(MON.goat, 2, 11);
  m.set(12, 11, 'flower');
  // the pond: a frog on a lily pad, its tongue
  m.fill(14, 12, 9, 2, 'pond0').set(17, 12, 'lily').set(20, 12, 'lily');
  m.mon(MON.frog, 17, 11).mon(MON.tongue, 17, 10).mon(MON.frog, 20, 11).mon(MON.tongue, 20, 10);
  // mushrooms, the mustard seed, a dragonfly, melted clocks
  m.set(25, 11, 'shroom').set(26, 11, 'shroom');
  m.mon(MON.seed, 25, 10).mon(MON.dragonfly, 23, 5);
  m.each('melt', [
    [12, 3],
    [30, 2],
    [48, 4],
  ]);
  m.set(29, 11, 'trap0').set(39, 11, 'trap0').set(44, 11, 'trap0');
  // a log, a spider and its web
  m.row(11, 33, 36, 'log');
  m.mon(MON.spider, 34, 2);
  m.set(40, 1, 'web');
  m.set(42, 11, 'flower');
  // the desert: Brother Camel resting, a cactus
  m.row(12, 46, 57, 'dune').row(13, 46, 57, 'sand');
  m.set(50, 11, 'cactus').set(50, 10, 'cactusTop');
  m.mon(MON.camelA, 53, 11).mon(MON.camelB, 54, 11);
  m.mon(MON.dragonfly, 51, 3);
  // hourglasses: two hours each
  m.each('hour0', [
    [4, 3],
    [8, 5],
    [15, 2],
    [17, 7],
    [22, 9],
    [27, 4],
    [31, 7],
    [35, 9],
    [38, 4],
    [43, 7],
    [47, 2],
    [51, 7],
    [55, 9],
    [58, 4],
  ]);
  // the big clock: twenty-four hours and it breaks
  m.col(62, 1, 11, 'stem').set(62, 6, 'clock');
  // past it the wild goes on into tall grass: Carl flies straight on through the broken clock,
  // long enough for "Carl has broken time" to play before the scene ends
  m.fill(68, 5, 5, 7, 'tall');
  m.link(71, 6, 'next');
  return { m, start: at(3, 6), size: [W, H] };
}

/** 6. The aux cord: the living room at dusk, in gloom, to the stereo. */
export function theAux(book: BlockBook): Level {
  const W = 54;
  const H = 12;
  const m = new MapBuilder(book, 'side');
  room(m, W, H);
  window(m, 2, 2);
  couch(m, 7, true);
  m.set(19, 3, 'crumbW').set(26, 2, 'crumbW');
  // the coffee table: burning sage and the oil diffuser
  m.row(9, 20, 26, 'tableTop').set(20, 10, 'tableLeg').set(26, 10, 'tableLeg').set(21, 8, 'smudge').set(24, 8, 'diffuser').set(26, 8, 'crumbP');
  m.set(29, 10, 'sideTable').set(29, 9, 'candle');
  // Teddy's awake and snapping
  m.mon(MON.teddy, 27, 10);
  // the wet floor, the man mopping it, the bucket
  m.row(11, 31, 45, 'wet');
  m.mon(MON.mopperA, 33, 9).mon(MON.mopperB, 33, 10).mon(MON.mop, 34, 10);
  m.set(46, 10, 'bucket');
  m.mon(MON.towel, 32, 4);
  m.set(36, 4, 'shelfTop').set(36, 3, 'donutW');
  // the last stand: a bookcase to the ceiling but for one gap, and the old clap in it (roll!)
  m.set(40, 2, 'shelfTop').col(40, 3, 10, 'shelf');
  m.mon(MON.clap, 40, 1);
  m.mon(MON.swatter, 45, 3);
  // the stereo: tower speakers, the receiver on the floor between them, and the aux cord hanging
  // at the top of the gap; Carl takes it and dives straight down with it to the receiver, long
  // enough for "Carl's got the aux cord now" to play before the scene ends
  m.col(48, 3, 10, 'speaker').col(50, 3, 10, 'speaker').set(49, 10, 'receiver');
  // Watt (Ohm Sweet Ohm) at the left speaker's foot, seeing to its wiring
  m.set(47, 10, 'watt');
  m.set(49, 3, 'aux');
  m.link(49, 9, 'won');
  return { m, start: at(4, 5), size: [W, H] };
}
