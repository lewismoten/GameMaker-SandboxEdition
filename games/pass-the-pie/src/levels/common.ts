// What every PASS THE PIE level is made of: the Level record, a Stage (a Grid painted in the kit's letters plus this
// game's own, kits/starter/map.ts says what the kit's mean) and the props a level adds only when it uses them, so
// each street keeps inside its 150 blocks.
//
// This game's own letters, on top of the kit's:
//   P, J the level's dishes $ a gold acorn (a secret's prize)     N a mug of cider (hit points back)
//   h a leaf pile          p a pumpkin           F a picket fence (solid)         Y a hedge you can walk through
//   T a tree trunk (climb it like a ladder)      % leaves of a branch (stand on top, jump up through)
//   R a roof's shingles (a ledge)                A a shop awning (a ledge)        C a crate (solid)
//   w wind blowing right   u warm air rising     U the grate it rises from        ~ the orange cord   ; its plug
//   Z a house's siding     W a window             o a pot               O the bone                       Q a dog (takes the bone)
//   monsters: 1 squirrel  2 short vacuum  3 long vacuum  4 quick vacuum  5 mower  6 drone  7 swooping drone
//             8 kick bag  9 lawn turkey  0 high drone  ! tether stake  @ the blower  & little Mr. Plume
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, LEDGE, PULL, SOLID, type Rules } from '../../../kit/starter/book';
import { KEYS } from '../../../kit/starter/blocks';
import { Grid } from '../../../kit/starter/grid';
import { SILVER_KEYS } from '../../../kit/starter/locks';
import { StarterMap } from '../../../kit/starter/map';
import type { Sign } from '../../../kit/starter/sign';
import * as art from '../art';
import * as art3 from '../art3';
import { addPrintBlocks } from '../blocks';
import { MONS } from '../monsters';
import type { Mood } from '../palette';
import { addBill } from '../sign';

export type Hero = 'rory' | 'plume';

export interface Level {
  file: string;
  title: string;
  /** Who plays it. */
  hero: Hero;
  /** The card's lines under the title. */
  hint: string;
  mood: Mood;
  /** The song file this level plays. */
  song: string;
  book: Book;
  map: StarterMap;
  /** Blocks that turn into another after some ticks. */
  timed: Timed[];
  /** The restart door's bottom block, in world blocks. */
  restart?: [number, number];
  /** A cartoon played before the level's card. */
  before?: string;
  /** Blocks that give birth to a monster every so many ticks while near the screen. */
  births?: { name: string; mon: number; ticks: number }[];
}

export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

export const AIR: Rules = { grav: PULL.down };

/** Hit points a gold acorn is worth in points, and what a mug of cider gives back. */
export const GOLD_POINTS = 250;
export const CIDER_HP = 15;

/** Props a level adds when its map uses them: picture and rules. */
const PROPS: Record<string, (pal: Pal) => [Pixels, Rules]> = {
  goldAcorn: (pal) => [art3.goldAcorn(pal), { ...AIR, score: GOLD_POINTS, touch: 'sky' }],
  cider: (pal) => [art3.cider(pal), { ...AIR, hp: CIDER_HP, touch: 'sky' }],
  leaf: (pal) => [art.leaves(pal, false), { ...AIR, score: 20, touch: 'leafFlat' }],
  leafFlat: (pal) => [art.leaves(pal, true), AIR],
  pumpkin: (pal) => [art.pumpkin(pal), AIR],
  fence: (pal) => [art.fence(pal), { solid: SOLID }],
  secret: (pal) => [art3.hedgeLook(pal), AIR],
  trunk: (pal) => [art3.trunk(pal), { grav: PULL.none }],
  branch: (pal) => [art3.branch(pal), { solid: LEDGE, grav: PULL.down }],
  roof: (pal) => [art3.roof(pal), { solid: LEDGE, grav: PULL.down }],
  awning: (pal) => [art3.awning(pal), { solid: LEDGE, grav: PULL.down }],
  crate: (pal) => [art3.crate(pal), { solid: SOLID }],
  wind0: (pal) => [art3.wind(pal, 0), { grav: PULL.right | PULL.down }],
  wind1: (pal) => [art3.wind(pal, 1), { grav: PULL.right | PULL.down }],
  wind2: (pal) => [art3.wind(pal, 2), { grav: PULL.right | PULL.down }],
  up0: (pal) => [art3.updraft(pal, 0), { grav: PULL.up }],
  up1: (pal) => [art3.updraft(pal, 1), { grav: PULL.up }],
  grate: (pal) => [art3.grate(pal), { solid: SOLID }],
  cord: (pal) => [art3.cord(pal, false), AIR],
  plug: (pal) => [art3.cord(pal, true), AIR],
  window: (pal) => [art.window(pal), AIR],
  siding: (pal) => [art3.siding(pal), AIR],
  pot: (pal) => [art.pot(pal), AIR],
  bone: (pal) => [art.bone(pal), { ...AIR, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' }],
  dog: (pal) => [art.dog(pal, false), { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'dogChew' }],
  dogChew: (pal) => [art.dog(pal, true), AIR],
};

/** Animated props: [first, next, ticks] (wind and warm air loop). */
const LOOPS: Record<string, Timed[]> = {
  wind0: [
    { name: 'wind0', next: 'wind1', ticks: 3 },
    { name: 'wind1', next: 'wind2', ticks: 3 },
    { name: 'wind2', next: 'wind0', ticks: 3 },
  ],
  up0: [
    { name: 'up0', next: 'up1', ticks: 4 },
    { name: 'up1', next: 'up0', ticks: 4 },
  ],
};

const LETTERS: Record<string, string> = {
  $: 'goldAcorn',
  N: 'cider',
  h: 'leaf',
  p: 'pumpkin',
  F: 'fence',
  Y: 'secret',
  T: 'trunk',
  '%': 'branch',
  R: 'roof',
  A: 'awning',
  C: 'crate',
  w: 'wind0',
  u: 'up0',
  U: 'grate',
  '~': 'cord',
  ';': 'plug',
  W: 'window',
  Z: 'siding',
  o: 'pot',
  O: 'bone',
  Q: 'dog',
  P: 'dish',
  J: 'dish2',
};

const MON_LETTERS: Record<string, number> = {
  '1': MONS.squirrel,
  '2': MONS.vacShort,
  '3': MONS.vacLong,
  '4': MONS.vacQuick,
  '5': MONS.mower,
  '6': MONS.drone,
  '7': MONS.droneSwoop,
  '8': MONS.bag,
  '9': MONS.inflatable,
  '0': MONS.droneHigh,
  '!': MONS.stake,
  '@': MONS.blower,
  '&': MONS.little,
};

/** A level's book: this game's blocks, then the level's own. */
export function newBook(pal: Pal): Book {
  const book = new Book('bbl');
  addPrintBlocks(book, pal);
  return book;
}

/** Adds the level's dish (it counts on the gold key counter: a door takes it). */
export function dish(book: Book, pic: Pixels, name = 'dish'): void {
  book.add(name, pic, { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
}

export function signs(book: Book, pal: Pal, list: Record<string, [string, number, number]>): Record<string, Sign> {
  const out: Record<string, Sign> = {};
  for (const [name, [text, w, h]] of Object.entries(list)) out[name] = addBill(book, pal, name, text, w, h);
  return out;
}

/**
 * A level painted as rows of letters. `ground` is the row the street's grass is on; the room is closed by hedges
 * at both ends, with the entrance at column 3 and the exit door at `exit`.
 */
export class Stage {
  readonly g: Grid;
  constructor(
    readonly width: number,
    readonly height: number,
    readonly ground: number,
    exit: number,
  ) {
    this.g = new Grid(width, height);
    this.g.row(ground, 0, width - 1, 'G').fill(0, ground + 1, width, height - ground - 1, 'D');
    this.g.col(0, 0, ground - 1, 'X').col(width - 1, 0, ground - 1, 'X');
    this.g.put(3, ground - 2, 's').put(3, ground - 1, 'S');
    this.g.put(exit, ground - 2, 'e').put(exit, ground - 1, 'E');
  }

  /** Lays a picture of letters with its top-left at (x, y); a '.' leaves what is there. */
  draw(x: number, y: number, lines: string[]): this {
    lines.forEach((line, dy) => [...line].forEach((ch, dx) => ch !== '.' && this.g.put(x + dx, y + dy, ch)));
    return this;
  }

  /** A wall from the top down to a gate standing on `floor`: gold (opens for the dish) or steel (a steel key). */
  gate(x: number, floor: number, steel = false, top = 0, wall = 'B'): this {
    this.g.col(x, top, floor - 3, wall).put(x, floor - 2, steel ? 'm' : 'l').put(x, floor - 1, steel ? 'M' : 'L');
    return this;
  }

  /** The map: the kit's letters as they are, this game's letters as their blocks and monsters. */
  paint(book: Book, pal: Pal, timed: Timed[]): StarterMap {
    const rows = this.g.rows();
    const later: [number, number, string][] = [];
    const plain = rows.map((row, y) =>
      [...row]
        .map((ch, x) => {
          if (ch in LETTERS || ch in MON_LETTERS) {
            later.push([x, y, ch]);
            return ' ';
          }
          return ch;
        })
        .join(''),
    );
    const m = new StarterMap(book, plain);
    for (const [x, y, ch] of later) {
      const mon = MON_LETTERS[ch];
      if (mon !== undefined) {
        m.mon(mon, x, y);
        continue;
      }
      const name = LETTERS[ch];
      need(book, pal, name, timed);
      m.set(x, y, name);
    }
    return m;
  }
}

/** Adds prop `name` (and the rest of its loop) to the book if it is not there yet. */
export function need(book: Book, pal: Pal, name: string, timed: Timed[]): void {
  if (book.has(name)) return;
  const loop = LOOPS[name];
  for (const n of loop ? loop.map((t) => t.name) : [name]) {
    if (book.has(n)) continue;
    const make = PROPS[n];
    if (!make) throw new Error(`No prop ${n}`);
    const [pic, rules] = make(pal);
    book.add(n, pic, rules);
  }
  if (loop) timed.push(...loop);
  if (name === 'dog') need(book, pal, 'dogChew', timed);
  if (name === 'leaf') need(book, pal, 'leafFlat', timed);
}

/** A level's finished block set, with its timed blocks given their next block and ticks. */
export function finishBook(level: Level): Block[] {
  const blocks = level.book.finish();
  for (const t of level.timed) {
    const b = blocks[level.book.n(t.name)];
    b.nextBl = level.book.n(t.next);
    b.ntime = t.ticks;
  }
  for (const b of level.births ?? []) {
    const block = blocks[level.book.n(b.name)];
    block.birthMon = b.mon;
    block.birthTime = b.ticks;
  }
  return blocks;
}
