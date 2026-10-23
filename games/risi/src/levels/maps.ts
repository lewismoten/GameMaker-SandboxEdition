// The six levels, one a song, each laid out by rows and runs of named blocks; everything outside
// a level is solid:
//   I.   Canis Meus Flatum Dedit: the banquet for the senators in Marcus's dining room, and Rufus
//        asleep under the head table. Throw open five shutters to let the air out.
//   II.  Laudes Ignavi: the battle in Gaul. The horde charges; Marcus runs (fleeing danger, we
//        cherish life), up the siege ladder, over the palisade, past the archers, through the
//        ditch, to the gate, the first to find it.
//   III. Titus Torquet Lingua: over the rooftops of Rome at sunset, touching seven tituli (they
//        twist into tongue twisters), mis-speaking SAXA into SAGA, to Titus's tavern.
//   IV.  Felis Fortissimus: the kitchen the same night, as Felix, the cat. Meow the mice into
//        dropping their cheese, climb the scrolls to the lamp, open the cupboards: six cheeses
//        for the crown of cheese.
//   V.   Canit Piscis Aureus: the baths, where the golden fish sings. Six golden scales for her
//        golden basin.
//   VI.  Silentium Ridentium: the theater. Everyone watches, no one laughs: jokes for five stone
//        faces, then Emperor Gravis himself, and his laurel crown on the altar.
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
  ) {
    this.map.blocks.fill(book.n(filler));
  }

  /** Sets a block (by name) at level coordinates. */
  set(x: number, y: number, name: string): this {
    this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = this.book.n(name);
    return this;
  }

  fill(x: number, y: number, w: number, h: number, name: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, name);
    return this;
  }

  /** A column of `name` from row y0 to y1 (inclusive). */
  col(x: number, y0: number, y1: number, name: string): this {
    return this.fill(x, y0, 1, y1 - y0 + 1, name);
  }

  /** A run of `name` along row y from x0 to x1 (inclusive). */
  row(y: number, x0: number, x1: number, name: string): this {
    return this.fill(x0, y, x1 - x0 + 1, 1, name);
  }

  /** The name of the block at level coordinates. */
  at(x: number, y: number): string {
    const n = this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN];
    for (const [name, i] of this.book.index) if (i === n) return name;
    return '?';
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
  /** Where the hero starts, in world blocks. */
  start: [number, number];
  /** The level's size in blocks (for previews and cards). */
  size: [number, number];
}

const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** I. The banquet: the triclinium, five shutters, the door out. */
export function banquet(book: BlockBook): Level {
  const W = 54;
  const H = 12;
  const m = new MapBuilder(book, 'outside');
  m.row(0, 1, W - 2, 'frieze');
  for (let x = 1; x < W - 1; x++) m.col(x, 1, 8, x % 8 === 3 ? 'wallB' : 'wall');
  m.row(9, 1, W - 2, 'base').row(10, 0, W - 1, 'floor').row(11, 0, W - 1, 'under');
  // columns and hanging lamps
  for (const x of [7, 21, 34, 44]) m.set(x, 0, 'colTop').col(x, 1, 8, 'col').set(x, 9, 'colBase');
  for (const x of [11, 27, 40]) m.set(x, 1, 'hang0');
  // the way in
  m.set(1, 8, 'entryTop').set(1, 9, 'entry');
  // the first shutter; a couch of senators; a table of figs
  m.set(5, 7, 'shutter');
  m.set(9, 9, 'senL0').set(10, 9, 'senR').set(10, 6, 'coin');
  m.set(12, 9, 'table').set(12, 8, 'figs');
  // Teddy, sitting politely on his own mosaic
  m.mon(MON.teddy, 14, 9).set(14, 10, 'caveCanem');
  m.set(16, 7, 'shutter');
  // Lady Flavia; another couch
  m.mon(MON.flavia, 18, 9);
  m.set(19, 9, 'senL1').set(20, 9, 'senR');
  // the head table, Rufus asleep under it: sic venit pestilentia
  m.set(23, 9, 'rufusTable').set(23, 8, 'olives');
  // the laughing bust on its pedestal; the third shutter
  m.set(26, 9, 'pedestal').set(26, 8, 'bust');
  m.set(29, 7, 'shutter');
  // Gwinn; a couch; grapes on a shelf
  m.mon(MON.gwinn, 31, 9);
  m.set(32, 9, 'senL0').set(33, 9, 'senR').set(32, 6, 'shelf').set(32, 5, 'grapes');
  // Lucius and the amphora (lucius vomuit in amphoram)
  m.set(36, 9, 'lucius0').set(37, 9, 'amphora');
  m.set(39, 7, 'shutter');
  // the servus with his figs, pacing; the lararium (a wreath on it); a cup on a table
  m.mon(MON.servus, 41, 9);
  m.set(46, 7, 'lararium').set(46, 6, 'wreath');
  m.set(48, 9, 'table').set(48, 8, 'cup');
  m.set(49, 7, 'shutter');
  // the door out: five shutters open (the way on is a step past it, so its song can finish)
  m.set(50, 9, 'door').set(50, 8, 'doorTop');
  m.link(52, 9, 'next');
  return { m, start: at(3, 9), size: [W, H] };
}

/** II. The battle: the horde behind, the ladder and palisade, the archers, the ditch, the gate. */
export function battle(book: BlockBook): Level {
  const W = 56;
  const H = 13;
  const m = new MapBuilder(book, 'outside');
  m.fill(1, 0, W - 2, 2, 'skyHi');
  for (let x = 1; x < W - 1; x++) m.col(x, 2, 7, 'sky');
  for (const [x, y] of [[6, 3], [17, 2], [29, 4], [38, 2], [47, 3]]) m.set(x, y, 'skyCloud');
  m.row(8, 1, W - 2, 'hills').row(9, 1, W - 2, 'field').row(10, 0, W - 1, 'grass').fill(0, 11, W, 2, 'dirt');
  // rocks, the eagle standard, the camp's tents and a cup
  m.set(7, 9, 'rock').set(10, 9, 'aquila').set(12, 9, 'rock');
  m.set(14, 9, 'tentL').set(15, 9, 'tentR').set(17, 9, 'wcup');
  // the palisade and the siege ladder up it; a coin on its top
  m.col(19, 5, 8, 'ladderSky').set(19, 9, 'ladder');
  m.set(20, 6, 'stakeTop').set(21, 6, 'stakeTop').fill(20, 7, 2, 3, 'stakes').set(21, 4, 'wcoinSky');
  // the open field: a rock, a bush, a coin, the archers' tower
  m.set(25, 9, 'rock').set(27, 9, 'bush').set(28, 9, 'wcoin');
  m.set(31, 8, 'towerTop').set(31, 9, 'tower');
  m.set(34, 9, 'wwreath').set(37, 9, 'rock').set(40, 9, 'aquila');
  m.mon(MON.crow, 30, 3);
  // the ditch: in, along, out (melius est hic manere!)
  m.fill(43, 10, 4, 2, 'ditch').set(44, 11, 'ditchSign');
  // THE CHEZ, parked by the gate: QVID EST?
  m.set(48, 9, 'chezL').set(49, 9, 'chezR').set(50, 9, 'quid');
  // the gate
  m.col(51, 5, 7, 'gateTower').set(51, 8, 'gateTop').set(51, 9, 'gateWay').fill(52, 5, 3, 5, 'gateTower');
  m.link(51, 9, 'next');
  // the Gaulish horde, right behind him
  m.mon(MON.gaul, 0, 9).mon(MON.gaul2, -2, 9);
  return { m, start: at(4, 9), size: [W, H] };
}

/** One house: a roof at row `roof` from x0 to x1 (inclusive), the walls down to the street. */
function house(m: MapBuilder, x0: number, x1: number, roof: number, street: number): void {
  m.row(roof, x0, x1, 'roof');
  for (let x = x0; x <= x1; x++) m.col(x, roof + 1, street - 1, (x * 3 + roof) % 5 === 0 ? 'houseWin' : 'house');
}

/** III. The rooftops: seven tituli, three heaps of SAXA, the wise man's spells, Titus's tavern. */
export function roofs(book: BlockBook): Level {
  const W = 60;
  const H = 13;
  const street = 12;
  const m = new MapBuilder(book, 'outside');
  m.fill(1, 0, W - 2, 3, 'dusk').fill(1, 3, W - 2, 2, 'dusk2');
  for (let x = 1; x < W - 1; x++) m.col(x, 5, street - 1, x % 2 ? 'duskCity' : 'duskCity2');
  m.row(street, 0, W - 1, 'cobbles');
  // the houses, and the alleys between them (each with a ladder back up from the street)
  const alley = (x: number, top: number) => m.col(x, top, street - 1, 'alley').col(x, top, street - 1, 'alleyLadder');
  house(m, 1, 8, 8, street);
  alley(9, 6);
  house(m, 10, 16, 7, street);
  house(m, 17, 24, 9, street);
  alley(25, 7);
  house(m, 26, 33, 8, street);
  house(m, 34, 40, 6, street);
  alley(41, 7);
  house(m, 42, 50, 8, street);
  house(m, 51, 58, 7, street);
  // A: a titulus, a chimney
  m.set(4, 7, 'titulus0').set(6, 7, 'chimney');
  // B: a titulus, the washing line, a pigeon, a heap of SAXA
  m.set(12, 6, 'titulus1').set(14, 5, 'washing').mon(MON.pigeon, 13, 6).set(16, 6, 'saxa');
  // C: Doc Leo the philosopher, a titulus, herbs, a cup
  m.mon(MON.leo, 19, 8).set(21, 8, 'titulus2').set(23, 8, 'herbs').set(22, 5, 'rcup');
  // D: a titulus, the wise man on his chimney (spells), a coin
  m.set(27, 7, 'titulus3').set(31, 7, 'magusChimney').mon(MON.sagax, 31, 6).set(33, 7, 'rcoin');
  // E: SAXA, a titulus, the wreath up high
  m.set(35, 5, 'saxa').set(37, 5, 'titulus0').set(39, 2, 'rwreath');
  // F: a titulus, a chimney, a pigeon, grapes, a titulus
  m.set(44, 7, 'titulus1').set(46, 7, 'chimney').mon(MON.pigeon, 47, 7).set(48, 5, 'rgrapes').set(50, 7, 'titulus2');
  // G: SAXA on the step up, a titulus, the tavern
  m.set(52, 6, 'titulus3').set(54, 6, 'saxa');
  m.set(56, 5, 'tavernSign').set(56, 6, 'tavern');
  m.link(58, 6, 'next');
  return { m, start: at(2, 7), size: [W, H] };
}

/** IV. The kitchen, as Felix: mice, cupboards, the scrolls and the lamp, the crown of cheese. */
export function kitchen(book: BlockBook): Level {
  const W = 50;
  const H = 12;
  const m = new MapBuilder(book, 'outside');
  m.row(0, 1, W - 2, 'beams').fill(1, 1, W - 2, 8, 'kwall').row(9, 1, W - 2, 'kbase').fill(0, 10, W, 2, 'kfloor');
  for (const x of [8, 19, 33]) m.set(x, 0, 'garlic');
  for (const x of [14, 27, 43]) m.set(x, 0, 'pots');
  // the hearth by the door; the first mouse
  m.set(1, 9, 'hearth0').set(2, 9, 'hearth0');
  m.set(5, 9, 'hole').mon(MON.mouse, 6, 9);
  // the table (a cupboard on it, fish bones), its legs
  m.row(7, 11, 15, 'ktop').set(11, 8, 'klegHi').set(15, 8, 'klegHi').set(11, 9, 'kleg').set(15, 9, 'kleg');
  m.set(14, 6, 'armarium').set(12, 6, 'bones');
  // the scrolls he climbs, the hanging lamp he jumps into (ascendit librum, saltat in lucernam)
  m.set(17, 9, 'scrolls').set(18, 9, 'scrolls').set(18, 8, 'scrollTop');
  m.set(20, 5, 'lucerna0');
  // the shelf beyond it: a cupboard, the will (oops)
  m.row(5, 22, 27, 'kshelf').set(24, 4, 'armarium').set(26, 4, 'will');
  // the second mouse by its hole; a cupboard down low
  m.set(30, 9, 'hole').mon(MON.mouse, 29, 9).set(34, 9, 'armariumLow');
  // a shelf of jars, ants on it, a cupboard at its end; milk underneath
  m.row(7, 36, 39, 'kshelfJars').mon(MON.ant, 36, 6).set(39, 6, 'armarium').set(37, 9, 'milk');
  // the third mouse
  m.set(42, 9, 'hole').mon(MON.mouse, 41, 9);
  // the crown of cheese
  m.set(45, 9, 'corona');
  m.link(47, 9, 'next');
  return { m, start: at(4, 9), size: [W, H] };
}

/** One pool from x0 to x1: the surface on the walk row, the water, the pool's floor. */
function pool(m: MapBuilder, x0: number, x1: number, hot: boolean, walk: number): void {
  m.row(walk, x0, x1, hot ? 'hotTop' : 'poolTop').row(walk + 1, x0, x1, hot ? 'hotPlain' : 'pool').row(walk + 2, x0, x1, 'poolFloor');
}

/** V. The baths: pools, steam, drums, benches of cheering mice, seven golden scales, her basin. */
export function baths(book: BlockBook): Level {
  const W = 62;
  const H = 13;
  const walk = 10;
  const m = new MapBuilder(book, 'outside');
  m.row(0, 1, W - 2, 'vault');
  m.fill(1, 1, W - 2, walk - 1, 'bwall');
  for (const x of [4, 13, 26, 46, 57]) m.set(x, 5, 'bniche');
  m.row(walk, 1, W - 2, 'bbase').row(walk + 1, 0, W - 1, 'bfloor').row(walk + 2, 0, W - 1, 'bfloor2');
  for (const x of [16, 37, 53]) m.set(x, 0, 'bcolTop').col(x, 1, walk - 1, 'bcol').set(x, walk, 'bcolBase');
  m.set(4, 8, 'linteum');
  // the cold pool: a scale on its floor
  pool(m, 6, 10, false, walk);
  m.set(8, walk + 1, 'scalePool');
  // a bench of cheering mice, a scale between them
  m.row(8, 12, 14, 'bench').mon(MON.fan, 12, 7).set(13, 7, 'scale').mon(MON.fan, 14, 7);
  // the steam vent up to a high bench: a scale and a wreath
  m.set(18, walk + 1, 'vent').col(18, 3, walk, 'steam0');
  m.row(4, 19, 21, 'bench').set(20, 3, 'scale').set(21, 3, 'bwreath');
  // a drum that bounces you up to a bench: a scale
  m.set(23, walk, 'drum').col(23, 5, walk - 1, 'boing0');
  m.row(5, 24, 26, 'bench').set(25, 4, 'scale');
  // the hot pool: bubbles, a floating senator, a scale under the water
  pool(m, 28, 35, true, walk);
  m.set(29, walk + 1, 'hot').set(34, walk + 1, 'hot');
  m.mon(MON.bather, 31, walk).set(33, walk + 1, 'scaleHot');
  m.set(38, 8, 'strigil');
  // the second drum: a bench, a scale
  m.set(40, walk, 'drum').col(40, 5, walk - 1, 'boing0');
  m.row(5, 41, 43, 'bench').set(42, 4, 'scale');
  // the second cold pool: a scale
  pool(m, 45, 49, false, walk);
  m.set(47, walk + 1, 'scalePool');
  // another bench of mice, grapes
  m.row(8, 50, 51, 'bench').mon(MON.fan, 50, 7).set(51, 7, 'bgrapes');
  m.set(52, 8, 'bcoin');
  // her golden basin: six scales; the diva sings in it
  m.set(55, walk, 'basinL0').set(56, walk, 'basinR');
  m.link(58, walk, 'next');
  return { m, start: at(2, walk), size: [W, H] };
}

/** VI. The theater: the stands, five laughs, the stage, Emperor Gravis, the altar. */
export function theater(book: BlockBook): Level {
  const W = 44;
  const H = 14;
  const m = new MapBuilder(book, 'outside');
  m.row(0, 1, W - 2, 'awning').fill(1, 1, W - 2, 11, 'tsky');
  m.row(12, 0, W - 1, 'orchestra').row(13, 0, W - 1, 'standsTop');
  // the stands, stepping down to the right: each step's seat (a ledge) on stone
  const steps: [number, number, number][] = [
    [1, 4, 5],
    [5, 8, 7],
    [9, 12, 9],
    [13, 16, 11],
  ];
  for (const [x0, x1, top] of steps) {
    m.row(top, x0, x1, 'seat');
    for (let x = x0; x <= x1; x++) m.col(x, top + 1, 12, 'riser');
  }
  m.set(1, 5, 'cabbageRow');
  // the audience: stone faces on every step, and one in the orchestra
  m.mon(MON.stony, 4, 4).mon(MON.stony, 8, 6).mon(MON.stony, 10, 8).mon(MON.stony, 12, 8).mon(MON.stony, 15, 10).mon(MON.stony, 20, 11);
  m.set(18, 9, 'mask').set(22, 8, 'tgrapes');
  // the stairs up to the stage, shut until five laugh
  m.set(24, 11, 'stairs');
  // the stage and its painted front
  m.fill(25, 9, W - 26, 3, 'stage');
  m.row(1, 25, W - 2, 'fronsTop').fill(25, 2, W - 26, 7, 'frons');
  for (const x of [26, 33, 41]) m.col(x, 2, 8, 'fronsCol');
  m.set(29, 7, 'fronsDoor').set(29, 8, 'fronsDoor');
  // Doc Leo the jester; Emperor Gravis; the box behind him that throws decrees; the altar
  m.mon(MON.jester, 28, 8);
  m.mon(MON.gravisA0, 36, 7).mon(MON.gravisB0, 36, 8);
  m.set(38, 4, 'decreeBox');
  m.set(40, 8, 'altar');
  m.link(42, 8, 'won');
  return { m, start: at(2, 4), size: [W, H] };
}
