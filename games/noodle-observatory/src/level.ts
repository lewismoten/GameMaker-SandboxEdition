// What every level is made of: a place's block set (the backdrop and its props, drawn by art.ts), the parts it
// uses, its signs, the map, its clocks, which monster file and song it plays with, and the hero file (Nell on foot,
// or Nell in the ring). levels/*.ts make the levels; tools/route.ts plays them.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Book, LEDGE, PULL, SOLID } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import {
  backdrop,
  cabinet,
  cushion,
  doorway,
  fitted,
  floor,
  ladder,
  lamp,
  lintel,
  litBy,
  pad,
  shelf,
  socket,
  thing,
  tiltShelf,
  washer,
  windowTile,
  bricks,
  planter,
  rail,
  roundLight,
  shaft,
  shutter,
  type Icon,
  type Place as PlaceName,
} from './art';
import type { LookName } from './palette';
import type { Place, Step } from './place';
import type { SongName } from './song';

export type MonFile = 'kitchen' | 'loft' | 'roof';

export interface Level {
  /** The files' base name (hinges.map, hinges.lst ...): 8.3. */
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  look: LookName;
  map: Place;
  book: Book;
  timed: Timed[];
  mon: MonFile;
  song: SongName;
  /** Nell on foot, or Nell in the pasta ring. */
  hero: 'nell' | 'ring';
  /** The plan the map was painted from (rooms); the bot walks it. */
  plan?: Step[];
  /** A scene you mostly watch. */
  watch?: boolean;
}

/** A block that turns into another after some ticks. */
export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/** Points: a star washer, and a part taken or fitted. */
export const POINTS = { washer: 10, part: 5 } as const;

/** Ticks a wobbly shelf stays level, wobbles (the warning), and hangs tipped. */
export const TILT = { level: 120, wobble: 36, tipped: 44 } as const;

const air = { grav: PULL.down };

/** The finished block set: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: Pick<Level, 'book' | 'timed'>): Block[] {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}

export interface BookOptions {
  /** The air does not pull down (the ring rolls up through it). */
  still?: boolean;
  /** The parts this level carries, each with its counter. */
  parts?: [Icon, number][];
  /** Pads on the floor (the shutter loft), each with its counter. */
  pads?: [Icon, number][];
  /** Shelves that wobble and tip on a clock. */
  tilt?: boolean;
  /** Leave out the lamps, windows and the loft's and roof's props (a scene with many blocks of its own). */
  lean?: boolean;
}

/** A new block set for a place: the Starters' blocks (kept for the shared screens), then the place's own. */
export function startBook(pal: Pal, place: PlaceName, o: BookOptions = {}): { book: Book; timed: Timed[] } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const timed: Timed[] = [];
  const bgRule = o.still ? { grav: PULL.none } : air;
  const bg = backdrop(pal, place, 0);
  book.add('bg', bg, bgRule);
  for (const v of [1, 2, 3]) book.add(`bg${v}`, backdrop(pal, place, v), bgRule);
  const roof = place === 'roof';
  book.add('wall', roof ? bricks(pal, true) : cabinet(pal, 0), { solid: SOLID });
  book.add('ceil', cabinet(pal, 1), { solid: SOLID });
  book.add('floor', floor(pal, place === 'lens' ? 'mat' : place === 'loft' ? 'boards' : roof ? 'slate' : 'counter'), { solid: SOLID });
  book.add('base', roof ? bricks(pal, true) : cabinet(pal, 1), { solid: SOLID });
  book.add('shelf', shelf(pal, bg, place === 'lens' ? 'pad' : 'wood'), { solid: LEDGE, grav: PULL.down });
  book.add('climb', ladder(pal, bg), { grav: PULL.none });
  book.add('inTop', doorway(pal, bg, 0, false), bgRule);
  book.add('inBot', doorway(pal, bg, 1, false), bgRule);
  book.add('outTop', doorway(pal, bg, 0, true), bgRule);
  book.add('outBot', doorway(pal, bg, 1, true), bgRule);
  book.add('washer', washer(pal, bg), { ...bgRule, score: POINTS.washer, touch: 'bg' });
  book.add('lintel', lintel(pal, bg), air);
  book.add('pit', bg, air);
  book.add('cushion', cushion(pal, bg), { solid: SOLID });
  if (!o.lean) {
    for (const q of [0, 1, 2, 3] as const) book.add(`win${q}`, windowTile(pal, bg, q), bgRule);
    book.add('win1moon', windowTile(pal, bg, 1, true), bgRule);
    // a lamp in its pool of light: nine blocks, the lamp in the middle
    const pool = lampPool(pal, bg);
    for (let dy = 0; dy < 3; dy++)
      for (let dx = 0; dx < 3; dx++) book.add(dx === 1 && dy === 1 ? 'lamp' : `glow${dx}${dy}`, pool.crop(dx * 20, dy * 20, 20, 20), bgRule);
    book.add('pillar', floor(pal, 'mat'), { solid: SOLID });
    book.add('planter', planter(pal, bg, true), { solid: SOLID });
    book.add('rail', rail(pal, bg), bgRule);
  }
  book.add('shutO', shutter(pal, true), { solid: SOLID });
  for (const k of [0, 1, 2]) book.add(`shaft${k}`, shaft(pal, bg, k), bgRule);
  for (const q of [0, 1, 2, 3] as const) book.add(`moon${q}`, roundLight(pal, bg, q, false), bgRule);
  if (o.tilt) {
    book.add('tilt0', tiltShelf(pal, bg, 0), { solid: LEDGE, grav: PULL.down });
    book.add('tilt1', tiltShelf(pal, bg, 1), { solid: LEDGE, grav: PULL.down });
    book.add('tilt2', tiltShelf(pal, bg, 2), air);
    timed.push({ name: 'tilt0', next: 'tilt1', ticks: TILT.level }, { name: 'tilt1', next: 'tilt2', ticks: TILT.wobble }, { name: 'tilt2', next: 'tilt0', ticks: TILT.tipped });
  }
  for (const [ic, ch] of o.parts ?? []) {
    book.add(`tok.${ic}`, thing(pal, bg, ic), { ...bgRule, score: POINTS.part, effect: ch, eamt: 1, touch: 'bg' });
    book.add(`socket.${ic}`, socket(pal, ic), { solid: SOLID, score: POINTS.part, effect: ch, eamt: -1, touch: `fit.${ic}` });
    book.add(`fit.${ic}`, fitted(pal, bg, ic), air);
  }
  for (const [ic, ch] of o.pads ?? []) {
    book.add(`pad.${ic}`, pad(pal, bg, ic, false), { ...bgRule, score: POINTS.part, effect: ch, eamt: 1, touch: `stamp.${ic}` });
    book.add(`stamp.${ic}`, pad(pal, bg, ic, true), bgRule);
  }
  return { book, timed };
}

/** The lamp's pool of light: a 60x60 patch of backdrop, lit around the lamp (lights-out's painted rings). */
function lampPool(pal: Pal, bg: Pixels): Pixels {
  const patch = new Pixels(60, 60);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) patch.blit(bg, x * 20, y * 20);
  const ramps = ['butter', 'white', 'stone', 'cab', 'sky', 'glass', 'teal', 'red', 'gold', 'slate'];
  const pool = litBy(pal, patch, 30, 34, 16, 29, ramps);
  return pool.blit(lamp(pal, pool.crop(20, 20, 20, 20)), 20, 20);
}

/** Signs by name: [text, width, height] (the words wrap to the board). */
export type SignDefs = Record<string, readonly [string, number, number]>;

/** Adds the signs, their boards and posts drawn over the backdrop instead of the Starters' sky. */
export function addSigns(book: Book, pal: Pal, defs: SignDefs): Record<string, Sign> {
  const out: Record<string, Sign> = {};
  for (const n of Object.keys(defs)) {
    const [text, w, h] = defs[n];
    out[n] = addSign(book, pal, n, text, w, h);
  }
  const bg = book.pics.get('bg')!;
  const sky = skyOf(pal);
  for (const [name, p] of book.pics)
    if (name.startsWith('sign.') || name.startsWith('signPost')) p.map((x, y, c) => (c === sky ? bg.get(x, y) : c));
  return out;
}
