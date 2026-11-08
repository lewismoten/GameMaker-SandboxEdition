// LIGHTNING BUGS' two levels, painted on a Grid (see games/kit/starter/map.ts for the letters), each with its own block set
// (step.bbl, dusk.bbl), then given a dusk sky, a tree line and fireflies.
//
//   1. In Step: a meadow at dusk. Its first half has six copies of one firefly: they blink at the same moment and fly the same
//      loop side by side, like a marching band, not a meadow. Its second half has six fireflies that are each their own
//      monster, with their own times and their own path.
//   2. Dusk Meadow: a longer meadow with fireflies of ten kinds scattered over it, laid so that no two of a kind are near.
import { rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BUG, KINDS, STEP, reachOf, type Kind } from './bugs';
import { GROUND, HEIGHT, addBands, addTrees, addTuft, addTurf, duskPalette, onSky, skyAt, treeAt } from './dusk';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  book: Book;
  map: StarterMap;
  /** The fireflies laid on the map, for the checks. */
  bugs: Bug[];
}

/** A firefly laid on the map: level block, and which monster (BUG.step or one of the kinds). */
export interface Bug {
  x: number;
  y: number;
  monnum: number;
  kind: Kind;
}

const WORDS = {
  step: 'SIX COPIES OF ONE FIREFLY BLINK AS ONE',
  own: 'NOW EACH ONE IS ITS OWN MONSTER',
  times: 'OWN TIMES, OWN PATH, NONE IN STEP',
  dark: 'A FLASH, THEN A LONG DARK',
  glow: 'THE GLOW IS DOTS, THE SKY SHOWS BETWEEN',
  near: 'NO FIREFLY IS NEXT TO ITS OWN KIND',
} as const;
type SignName = keyof typeof WORDS;

/** The highest and lowest rows a firefly may reach: under the top of the screen, over the grass. */
const TOP = 3;
const LOW = GROUND - 1;

/** What stands behind level block (x, y): a piece of the tree line or the sky's band for that row. */
const behind = (x: number, y: number): string => treeAt(((x % 8) + 8) % 8, y) ?? skyAt(x, y);

/** A StarterMap whose sky is the dusk's bands and trees and whose earth is dark turf, inside the level and past its edges. */
class DuskMap extends StarterMap {
  constructor(
    private readonly blocks: Book,
    private readonly pal: Pal,
    /** Where the signs' pictures are drawn first (only their pieces with the sky behind them go in the level's blocks). */
    private readonly signBook: Book,
    rows: string[],
  ) {
    super(blocks, rows);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) if (this.at(x, y) === blocks.n('sky')) this.set(x, y, behind(x, y));
  }
  private at(x: number, y: number): number {
    return this.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN];
  }
  /** Lays `name` (a picture drawn on the Starters' plain sky) at (x, y) with the right sky or trees behind it. */
  front(x: number, y: number, name: string): this {
    return this.set(x, y, onSky(this.blocks, this.pal, name, behind(x, y), this.blocks.has(name) ? this.blocks : this.signBook));
  }
  /** A sign standing on the grass, its board's left at x. */
  stand(x: number, s: Sign): this {
    const top = GROUND - 1 - s.board.length;
    s.board.forEach((row, dy) => row.forEach((name, dx) => this.front(x + dx, top + dy, name)));
    this.front(x, GROUND - 1, s.legs[0]).front(x + s.board[0].length - 1, GROUND - 1, s.legs[1]);
    return this;
  }
  override done(): GameMap {
    const map = super.done();
    const sky = this.blocks.n('sky');
    const dirt = this.blocks.n('dirt');
    for (let y = 0; y < MLEN; y++)
      for (let x = 0; x < MLEN; x++) {
        const at = y * MLEN + x;
        if (map.blocks[at] === sky) map.blocks[at] = this.blocks.n(behind(x - ORIGIN, y - ORIGIN));
        else if (map.blocks[at] === dirt) map.blocks[at] = this.blocks.n(`turf${Math.min(2, Math.max(0, y - ORIGIN - GROUND - 1))}`);
      }
    return map;
  }
}

/** A level's block set (the Starter blocks and the dusk's), and its signs, drawn in a book of their own until they are laid. */
function blocks(pal: Pal, used: SignName[]): { book: Book; signBook: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addBands(book, pal);
  addTrees(book, pal);
  addTuft(book, pal);
  addTurf(book, pal);
  const signBook = new Book('bbl');
  const signs = {} as Record<SignName, Sign>;
  for (const k of used) signs[k] = addSign(signBook, pal, k, WORDS[k], 4, 3);
  return { book, signBook, signs };
}

/** The meadow: grass, three rows of earth, a hedge at each end, the doorway at 3 and the door at `exit`, tufts of tall grass. */
function meadow(pal: Pal, book: Book, signBook: Book, width: number, exit: number, tufts: number[]): DuskMap {
  const g = new Grid(width, HEIGHT);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, HEIGHT - GROUND - 1, 'D');
  g.col(0, 0, GROUND - 1, 'X').col(width - 1, 0, GROUND - 1, 'X');
  g.put(3, GROUND - 2, 's').put(3, GROUND - 1, 'S');
  g.put(exit, GROUND - 2, 'e').put(exit, GROUND - 1, 'E');
  const m = new DuskMap(book, pal, signBook, g.rows());
  for (const [x, y, name] of [
    [3, GROUND - 2, 'doorwayTop'],
    [3, GROUND - 1, 'doorwayBottom'],
    [exit, GROUND - 2, 'doorTop'],
    [exit, GROUND - 1, 'doorBottom'],
  ] as const)
    m.front(x, y, name);
  for (const x of tufts) m.front(x, GROUND - 1, 'tuft');
  return m;
}

/** Level 1's landmarks (level blocks): its signs, the copies of the in-step firefly, and the six of their own kinds [x, y, kind]. */
export const STEP_ROOM = {
  width: 62,
  exit: 58,
  signs: [5, 32, 53] as const,
  copies: [
    [11, 6],
    [14, 5],
    [17, 6],
    [20, 5],
    [23, 6],
    [26, 5],
  ] as const,
  own: [
    [37, 6, 0],
    [43, 5, 1],
    [41, 7, 2],
    [46, 7, 3],
    [48, 5, 4],
    [44, 7, 5],
  ] as const,
};
/** Level 2's landmarks: its signs and its door. */
export const DUSK_ROOM = { width: 66, exit: 62, signs: [6, 29, 47] as const };

/** Lays a firefly of monster `monnum` (of kind `kind`) at (x, y), checking its loop stays between the top of the screen and the grass. */
function lay(m: DuskMap, bugs: Bug[], x: number, y: number, monnum: number, kind: Kind): void {
  const [left, right, up, down] = reachOf(kind);
  if (y + up < TOP || y + down > LOW) throw new Error(`a firefly at ${x},${y} would leave the sky (rows ${y + up} to ${y + down})`);
  if (x + left < 1 || x + right > m.width - 2) throw new Error(`a firefly at ${x},${y} would cross a hedge`);
  if (bugs.some((b) => b.x === x && b.y === y)) throw new Error(`two fireflies would start at ${x},${y}`);
  m.mon(monnum, x, y);
  bugs.push({ x, y, monnum, kind });
}

/** Level 1: 62 blocks wide; six copies of one firefly, then six fireflies each its own. */
function inStep(pal: Pal): Level {
  const { book, signBook, signs } = blocks(pal, ['step', 'own', 'times']);
  const m = meadow(pal, book, signBook, STEP_ROOM.width, STEP_ROOM.exit, [10, 19, 30, 36, 52, 57]);
  m.stand(STEP_ROOM.signs[0], signs.step);
  m.stand(STEP_ROOM.signs[1], signs.own);
  m.stand(STEP_ROOM.signs[2], signs.times);
  const bugs: Bug[] = [];
  // the copies: every one the same monster, on two rows, three blocks apart
  for (const [x, y] of STEP_ROOM.copies) lay(m, bugs, x, y, BUG.step, STEP);
  // each its own: six kinds, each where its loop fits
  for (const [x, y, k] of STEP_ROOM.own) lay(m, bugs, x, y, BUG.kind(k), KINDS[k]);
  return { file: 'step', title: 'In Step', hint: 'One firefly six times, then six.', book, map: m, bugs };
}

/** Level 2: 66 blocks wide; fireflies of all ten kinds over the meadow, two every three blocks, no two of a kind within 8 blocks, none starting on a sign. */
function duskMeadow(pal: Pal): Level {
  const { book, signBook, signs } = blocks(pal, ['dark', 'glow', 'near']);
  const { width, exit } = DUSK_ROOM;
  const m = meadow(pal, book, signBook, width, exit, [10, 13, 24, 35, 41, 53, 57]);
  m.stand(DUSK_ROOM.signs[0], signs.dark);
  m.stand(DUSK_ROOM.signs[1], signs.glow);
  m.stand(DUSK_ROOM.signs[2], signs.near);
  const bugs: Bug[] = [];
  const rand = rng(6);
  /** Whether level block (x, y) is on a sign's board (rows 5 to 7, four wide): a firefly may fly past a sign but not start on one. */
  const onSign = (x: number, y: number) => y >= GROUND - 4 && y < GROUND - 1 && DUSK_ROOM.signs.some((s) => x >= s && x < s + 4);
  for (let x = 5, i = 0; x < width - 6; x += 1 + (i++ % 2)) {
    const near = new Set(bugs.filter((b) => x - b.x <= 8).map((b) => b.monnum));
    const free = KINDS.map((_k, i) => i).filter((i) => !near.has(BUG.kind(i)));
    const k = free[Math.floor(rand() * free.length)];
    const at = x + Math.floor(rand() * 2);
    const [left, right, up, down] = reachOf(KINDS[k]);
    if (at + left < 1 || at + right > width - 2) continue;
    const rows = Array.from({ length: LOW - TOP + 1 }, (_r, i) => TOP + i).filter(
      (y) => y + up >= TOP && y + down <= LOW && !onSign(at, y) && !bugs.some((b) => b.x === at && b.y === y),
    );
    if (!rows.length) continue;
    lay(m, bugs, at, rows[Math.floor(rand() * rows.length)], BUG.kind(k), KINDS[k]);
  }
  return { file: 'dusk', title: 'Dusk Meadow', hint: 'Ten kinds, none in step.', book, map: m, bugs };
}

/** The levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = duskPalette();
  return { pal, levels: [inStep(pal), duskMeadow(pal)] };
}
export type { SignName };
