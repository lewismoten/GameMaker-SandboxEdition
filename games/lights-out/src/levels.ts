// LIGHTS OUT's three levels: a dark cave drawn with five brightness steps of each block, so light is only paint.
//
//   1. The Lantern Cave: three lamps that never move. Every cell near a lamp is laid with a brighter block of its kind
//      (air, rock, floor, stalactites), in rings: shade 4 beside the lamp, 3, 2, 1, then 0, the dark everything else is.
//   2. Light Your Way: a dark tunnel. Each dark air block turns into a lit one when Mia touches it, so light is
//      left where he has been (a touch changes only the block touched, so it is a trail, not a lantern he carries).
//   3. The Lights Come On: the same rings as level 1, but the hall starts as shade 0 everywhere. Every block that should
//      be brighter has a dark twin, drawn as shade 0, that turns into it after the same number of ticks: the engine's
//      one clock for a block changes every cell of it at once, so the whole hall lights in a single tick. Six bulbs
//      fill on the way (one more every 28 ticks) and the lights come on when the sixth does.
import { MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { AIR, air, drip, floor, lantern, post, rock } from './cave';
import { type Timed } from './loops';
import { cavePalette } from './palettes';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  pal: Pal;
  /** The palette's file on the disk. */
  palFile: string;
  book: Book;
  /** The blocks that turn into others by themselves (level 3's dark twins and bulbs). */
  timed: Timed[];
  map: StarterMap;
  /** The lanterns' cells (level coordinates). */
  lamps: [number, number][];
  /** How the level was laid, for the checks: each cell's kind and its shade (rows, then columns). */
  cells: { kind: string; shade: number }[][];
  /** The tick the whole hall lights at (level 3), else 0. */
  lightsAt: number;
  /** Each sign's board corner (level coordinates). */
  signs: Record<string, [number, number]>;
}

const WORDS = {
  shades: 'FIVE SHADES OF ONE BLOCK',
  rings: 'RINGS GET DARKER AWAY FROM A LAMP',
  fixed: 'THE LAMP STAYS PUT. MIA WALKS ON.',
  touch: 'TOUCH A DARK BLOCK AND IT LIGHTS',
  jump: 'A JUMP LIGHTS BLOCKS HIGHER UP',
  trail: 'LIGHT STAYS WHERE YOU WALKED',
  clock: 'WAIT FOR ALL SIX BULBS',
  once: 'A CLOCK LIGHTS EVERY BLOCK AT ONCE',
} as const;
type SignName = keyof typeof WORDS;

/** The floor's top row in every level: signs stand on it. */
export const GROUND = 8;
/** Every level is this many blocks tall: three of ceiling, five of air, the floor and five of deep rock. */
export const HEIGHT = 14;
const onGround = (s: Sign) => GROUND - 1 - s.board.length;

/** Ticks between one bulb glowing and the next (18.2 ticks make a second), and the tick the hall lights at. */
export const BULB_TICKS = 28;
export const BULBS = 6;
export const LIGHTS_AT = BULB_TICKS * BULBS;

/** The shade a cell is drawn in: 4 within a block and a half of the nearest lamp, then 3, 2 and 1, and 0 beyond. */
export function shadeAt(x: number, y: number, lamps: [number, number][]): number {
  let d = Infinity;
  for (const [lx, ly] of lamps) d = Math.min(d, Math.hypot(x - lx, y - ly));
  return d <= 1.5 ? 4 : d <= 2.6 ? 3 : d <= 3.7 ? 2 : d <= 4.8 ? 1 : 0;
}

/** The ceiling and walls past a level's edge are dark rock (the map carries on, and the dark carries on with it). */
class CaveMap extends StarterMap {
  constructor(
    private readonly blocks: Book,
    rows: string[],
  ) {
    super(blocks, rows);
  }

  override done(): GameMap {
    const m = super.done();
    const rock0 = this.blocks.n('rock.0.0');
    const rock1 = this.blocks.n('rock.0.1');
    for (let y = ORIGIN; y < ORIGIN + this.height; y++)
      for (let x = 0; x < MLEN; x++) if (x < ORIGIN || x >= ORIGIN + this.width) m.blocks[y * MLEN + x] = (x + y) % 2 ? rock0 : rock1;
    return m;
  }
}

interface Built {
  book: Book;
  pal: Pal;
  signs: Record<string, Sign>;
}

/** A level's block set: the Starter blocks and its signs; the cave's own blocks are added as the level lays them. */
function start(names: SignName[]): Built {
  const pal = cavePalette();
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  for (const k of names) signs[k] = addSign(book, pal, k, WORDS[k], 4, 3);
  return { book, pal, signs };
}

/** The picture of a cave block by name: `air.K`, `rock.K.V`, `floor.K.V`, `drip.K`, `post.K`, `lantern`, `lantern.off`. */
function art(pal: Pal, name: string): { pic: Pixels; solid: number } {
  const [kind, k, v] = name.split('.');
  const n = Number(k);
  switch (kind) {
    case 'air':
      return { pic: air(pal, n), solid: 0 };
    case 'rock':
      return { pic: rock(pal, n, Number(v)), solid: SOLID };
    case 'floor':
      return { pic: floor(pal, n, Number(v)), solid: SOLID };
    case 'drip':
      return { pic: drip(pal, n), solid: SOLID };
    case 'post':
      return { pic: post(pal, n), solid: 0 };
    case 'lantern':
      return { pic: lantern(pal, k !== 'off'), solid: 0 };
  }
  throw new Error(`No cave block ${name}`);
}

/** Adds block `name` to the book once. */
function ensure(book: Book, pal: Pal, name: string): string {
  if (!book.has(name)) {
    const { pic, solid } = art(pal, name);
    book.add(name, pic, solid ? { solid } : AIR);
  }
  return name;
}

/** A block name drawn as shade 0 (a dark twin's picture): `air.3` is `air.0`; the lit lantern is the cold one. */
const asDark = (name: string): string => (name === 'lantern' ? 'lantern.off' : name.replace(/^(\w+)\.\d/, '$1.0'));

interface Laid {
  map: StarterMap;
  timed: Timed[];
  cells: { kind: string; shade: number }[][];
  signAt: (name: string, x: number) => [number, number];
}

/**
 * Lays a cave `W` blocks wide with the floor's top at `h[x]` in column x: rock ceiling, walls and depths, air between, the
 * lamps (a lantern on a post) and the doors. With `dark` every brighter block is a dark twin that lights at LIGHTS_AT;
 * with `tunnel` (columns from, to) the air is dark blocks that turn lit when touched.
 */
function lay(
  built: Built,
  W: number,
  h: number[],
  o: { dark?: boolean; lamps?: [number, number][]; tunnel?: [number, number]; start: number; exit: number },
): Laid {
  const { book, pal } = built;
  const lamps = o.lamps ?? [];
  const timed: Timed[] = [];
  const g = new Grid(W, HEIGHT);
  g.put(o.start, h[o.start] - 2, 's').put(o.start, h[o.start] - 1, 'S');
  g.put(o.exit, h[o.exit] - 2, 'e').put(o.exit, h[o.exit] - 1, 'E');
  const letters = g.rows();
  const m = new CaveMap(book, letters);
  const kind = (x: number, y: number): string => {
    if (x === 0 || x === W - 1 || y < 2) return 'rock';
    if (y === 2) return (x * 7) % 11 < 4 ? 'drip' : 'rock';
    if (y === h[x]) return 'floor';
    if (y > h[x]) return 'rock';
    if (lamps.some(([lx, ly]) => lx === x && ly === y)) return 'lantern';
    if (lamps.some(([lx, ly]) => lx === x && ly + 1 === y)) return 'post';
    if (o.tunnel && x >= o.tunnel[0] && x <= o.tunnel[1] && y >= 3) return 'tunnel';
    return 'air';
  };
  const cells = Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: W }, (_, x) => {
      const k = kind(x, y);
      return { kind: k, shade: k === 'tunnel' ? 0 : shadeAt(x, y, lamps) };
    }),
  );
  /** The block for a cell; in a dark hall a brighter one is its twin, which turns into it at LIGHTS_AT. */
  const lay1 = (name: string, lit: boolean): string => {
    ensure(book, pal, name);
    if (!o.dark || !lit) return name;
    const twin = `${name}.dark`;
    if (!book.has(twin)) {
      const { pic, solid } = art(pal, asDark(name));
      book.add(twin, pic, solid ? { solid } : AIR);
      timed.push({ name: twin, next: name, ticks: LIGHTS_AT });
    }
    return twin;
  };
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < W; x++) {
      if (letters[y][x] !== ' ') continue; // a door
      const { kind: k, shade } = cells[y][x];
      const v = (x + y) % 2;
      if (k === 'tunnel') {
        // dark air that lights when touched: brighter nearer the floor
        const lit = y >= 6 ? 4 : y >= 4 ? 3 : 2;
        if (!book.has(`tdark.${lit}`)) {
          book.add(`tdark.${lit}`, air(pal, 0), { ...AIR, touch: `tlit.${lit}` });
          book.add(`tlit.${lit}`, air(pal, lit), AIR);
        }
        m.set(x, y, `tdark.${lit}`);
        continue;
      }
      const s = k === 'post' ? shadeAt(x, y, lamps) : shade;
      const name =
        k === 'rock'
          ? `rock.${s}.${v}`
          : k === 'floor'
            ? `floor.${s}.${v}`
            : k === 'drip'
              ? `drip.${s}`
              : k === 'lantern'
                ? 'lantern'
                : k === 'post'
                  ? `post.${s}`
                  : `air.${s}`;
      m.set(x, y, lay1(name, s > 0 || k === 'lantern'));
    }
  const signAt = (name: string, x: number): [number, number] => {
    const y = onGround(built.signs[name]);
    m.sign(x, y, built.signs[name]);
    return [x, y];
  };
  return { map: m, timed, cells, signAt };
}

/** The floor's top row for each of `W` columns: GROUND, except where `hills` raises it. */
const heights = (W: number, hills: Record<number, number> = {}): number[] => Array.from({ length: W }, (_, x) => hills[x] ?? GROUND);

/** Level 1: three lamps and the rings round them, 48 blocks wide. */
function lanternCave(): Level {
  const built = start(['shades', 'rings', 'fixed']);
  const W = 48;
  const lamps: [number, number][] = [
    [13, GROUND - 2],
    [28, GROUND - 2],
    [43, GROUND - 2],
  ];
  const laid = lay(built, W, heights(W, { 30: 7, 31: 7, 32: 7 }), { lamps, start: 2, exit: 45 });
  const signs = { shades: laid.signAt('shades', 5), rings: laid.signAt('rings', 19), fixed: laid.signAt('fixed', 34) };
  return {
    file: 'lanterns',
    title: 'The Lantern Cave',
    hint: 'Light drawn in rings of blocks.',
    pal: built.pal,
    palFile: 'cave.pal',
    book: built.book,
    timed: laid.timed,
    map: laid.map,
    lamps,
    cells: laid.cells,
    lightsAt: 0,
    signs,
  };
}

/** Level 2: a dark tunnel that lights where it is touched, 44 blocks wide. */
function lightYourWay(): Level {
  const built = start(['touch', 'jump', 'trail']);
  const W = 44;
  const laid = lay(built, W, heights(W), { tunnel: [3, 40], start: 2, exit: 41 });
  const signs = { touch: laid.signAt('touch', 6), jump: laid.signAt('jump', 19), trail: laid.signAt('trail', 32) };
  return {
    file: 'tunnel',
    title: 'Light Your Way',
    hint: 'A tunnel that lights where you touch.',
    pal: built.pal,
    palFile: 'cave.pal',
    book: built.book,
    timed: laid.timed,
    map: laid.map,
    lamps: [],
    cells: laid.cells,
    lightsAt: 0,
    signs,
  };
}

/** A bulb on the clock's row: dark glass that fills when its time comes. */
function bulb(pal: Pal, on: boolean): Pixels {
  const { c } = pal;
  const p = air(pal, 0);
  p.rect(8, 13, 4, 3, c('stone', 1)).rect(8, 13, 4, 1, c('stone', 3)).rect(9, 16, 2, 2, c('stone', 0));
  if (on) p.disc(10, 8, 7.4, c('gold', 3)).disc(10, 8, 5.6, c('gold', 4)).disc(10, 8, 3.4, c('gold', 5)).disc(9, 7, 1.6, c('white', 3));
  else p.disc(10, 8, 5.6, c('ink', 2)).disc(10, 8, 4.4, c('ink', 1)).set(7, 5, c('ink', 2)).set(8, 4, c('ink', 2));
  return p;
}

/** Level 3: a dark hall that lights all at once, 40 blocks wide. */
function lightsComeOn(): Level {
  const built = start(['clock', 'once']);
  const W = 40;
  const lamps: [number, number][] = [
    [13, GROUND - 2],
    [29, GROUND - 2],
    [35, GROUND - 2],
  ];
  const laid = lay(built, W, heights(W, { 22: 7, 23: 7, 24: 7, 25: 7 }), { dark: true, lamps, start: 2, exit: 37 });
  for (let k = 0; k < BULBS; k++) {
    built.book.add(`bulb.${k}.off`, bulb(built.pal, false), AIR);
    built.book.add(`bulb.${k}`, bulb(built.pal, true), AIR);
    laid.timed.push({ name: `bulb.${k}.off`, next: `bulb.${k}`, ticks: BULB_TICKS * (k + 1) });
    laid.map.set(5 + k, 3, `bulb.${k}.off`);
  }
  const signs = { clock: laid.signAt('clock', 5), once: laid.signAt('once', 18) };
  return {
    file: 'hall',
    title: 'The Lights Come On',
    hint: 'A clock lights every block at once.',
    pal: built.pal,
    palFile: 'cave.pal',
    book: built.book,
    timed: laid.timed,
    map: laid.map,
    lamps,
    cells: laid.cells,
    lightsAt: LIGHTS_AT,
    signs,
  };
}

/** The levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const levels = [lanternCave(), lightYourWay(), lightsComeOn()];
  return { pal: levels[0].pal, levels };
}
