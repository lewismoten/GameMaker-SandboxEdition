// LEAVES IN THE WIND's two rooms, painted on a Grid (games/kit/starter/map.ts has the letters), each 10 blocks tall with
// its own block set. Rima walks along row 8; row 9 is the grass, with fallen leaves on it. Each room starts at a door on
// a little bank two blocks up, and the screen never scrolls up or down: it opens on rows 1 to 10, so all eight rows of
// sky above the grass, where the leaves fall, stay in view.
//   1  The Tumble   three maples in a row, each with a sign. A branch block on each gives birth to a leaf every few
//                   seconds: one picture going straight down (stiff), eight frames going straight down (it spins, but
//                   still drops like a stone), and the frames rocking on a path that swoops from side to side (a leaf).
//   2  The Gust     a maple, an oak and a birch. Each drops leaves of its own kind on its own timers. Every few seconds a
//                   gust bends all three crowns at once and blows three more leaves off each, far to the right. A leaf
//                   that lands lies on the grass a moment and is gone.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { LEAF } from './leaves';
import { autumnPalette, type Kind } from './palette';
import { SIGNS } from './text';
import { addGround, addTree, cell, crownName, crowns } from './trees';

/** The row the hero walks on, the grass row, and the crowns' top row (a crown is three rows, its trunk down to the grass). */
export const BOTTOM = 8;
const GROUND = 9;
const H = 10;
export const CROWN = 2;
/** The bank the entrance stands on: its top row, and its last column (a step down follows it). */
const BANK = { top: 7, to: 4 };

/** A block that turns into another after some ticks, and a block that gives birth to a monster every so many ticks. */
export interface Timed {
  name: string;
  next: string;
  ticks: number;
}
export interface Birth {
  name: string;
  mon: number;
  every: number;
}

export interface Level {
  file: string;
  title: string;
  map: StarterMap;
  book: Book;
  timed: Timed[];
  births: Birth[];
  /** The x of the exit door (level blocks). */
  exit: number;
}

/** Level 1's landmarks: where each tree's crown starts (its left column) and which leaf its branch drops. */
export const TUMBLE = {
  width: 54,
  exit: 51,
  trees: [
    { x: 16, mon: LEAF.stiff, sign: 'stiff' },
    { x: 28, mon: LEAF.spin, sign: 'spin' },
    { x: 40, mon: LEAF.float, sign: 'float' },
  ],
  /** Every branch drops its leaf this often, all at the same tick, so the three can be compared as they fall. */
  every: 100,
} as const;

/** Level 2's landmarks. Each tree: its kind, crown's left column and the ticks between the leaves of its two calm branches. */
export const GUST = {
  width: 60,
  exit: 56,
  trees: [
    { kind: 'maple', x: 11, calm: [83, 117] },
    { kind: 'oak', x: 24, calm: [97, 131] },
    { kind: 'birch', x: 37, calm: [73, 109] },
  ],
} as const satisfies { trees: readonly { kind: Kind; x: number; calm: readonly [number, number] }[] } & Record<string, unknown>;

/**
 * The gust, the same loop on every top-row crown block of every tree (one loop each, all the same times, so all three
 * trees bend together): leaning hard, upright, a little lean, upright, a little lean as the gust arrives (the leaves
 * let go then), and round again. Ticks each; GUST_EVERY is the whole loop.
 */
export const GUST_LOOP = [
  { step: 'hard', pic: 'lean2', ticks: 16 },
  { step: 'calmA', pic: 'rest', ticks: 78 },
  { step: 'breath', pic: 'lean1', ticks: 8 },
  { step: 'calmB', pic: 'rest', ticks: 64 },
  { step: 'onset', pic: 'lean1', ticks: 4 },
] as const;
export const GUST_EVERY = GUST_LOOP.reduce((t, s) => t + s.ticks, 0);

type Words = Record<string, [string, number, number]>;

/** A block set: the Starters' blocks, the room's own (`add`) and its signs. */
function bookFor(pal: Pal, signs: Words, add: (book: Book) => void): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  add(book);
  const out: Record<string, Sign> = {};
  for (const [k, [text, w, h]] of Object.entries(signs)) out[k] = addSign(book, pal, `${k}.sign`, text, w, h);
  return { book, signs: out };
}

/** The ground of a room: hedges at the ends, grass with fallen leaves, the doors. */
function ground(book: Book, width: number, exit: number): StarterMap {
  const g = new Grid(width, H);
  g.col(0, 0, GROUND - 1, 'X').col(width - 1, 0, GROUND - 1, 'X');
  for (let x = 0; x < width; x++) g.put(x, GROUND, 'G');
  // the bank: grass on dirt, the entrance door on top, one step down to the meadow
  for (let x = 1; x <= BANK.to; x++) g.put(x, BANK.top, 'G').put(x, BANK.top + 1, 'D');
  g.put(BANK.to + 1, BANK.top + 1, 'G');
  g.put(3, BANK.top - 2, 's')
    .put(3, BANK.top - 1, 'S')
    .put(exit, BOTTOM - 1, 'e')
    .put(exit, BOTTOM, 'E');
  const m = new StarterMap(book, g.rows());
  // the leaves on the grass: three patterns in an order that does not repeat soon
  for (let x = 1; x < width - 1; x++) m.set(x, GROUND, `leafGrass${(x * 7 + (x >> 2)) % 3}`);
  // (the end columns stay plain grass, so the meadow carries on past the hedges: kit/starter/map.ts carries only grass and dirt)
  for (let x = 1; x <= BANK.to + 1; x++) m.set(x, x > BANK.to ? BANK.top + 1 : BANK.top, `leafGrass${x % 3}`);
  return m;
}

/** A tree on the map: the crown's nine blocks at (x, CROWN), the trunk below it down to the grass. */
function plant(
  m: StarterMap,
  kind: Kind,
  tree: number,
  x: number,
  at: (col: number, row: number) => string = (col, row) => crownName(kind, tree, col, row),
): void {
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) m.set(x + col, CROWN + row, at(col, row));
  for (let y = CROWN + 3; y < BOTTOM; y++) m.set(x + 1, y, `${kind}.trunk`);
  m.set(x + 1, BOTTOM, `${kind}.foot`);
}

/** A sign standing on the grass with its left edge at x. */
const stand = (m: StarterMap, s: Sign, x: number) => m.sign(x, BOTTOM - s.board.length, s);

/** Level 1: three maples, each with a branch that drops one kind of leaf. */
export function tumble(pal: Pal): Level {
  const timed: Timed[] = [];
  const births: Birth[] = [];
  const { book, signs } = bookFor(pal, SIGNS.tumble, (b) => {
    // each tree's branch is its crown's middle-right block, which gives birth to the tree's leaf
    TUMBLE.trees.forEach((t, i) => {
      const crown = crowns(pal, 'maple', 11 + i * 4).rest;
      addTree(b, pal, 'maple', i, crown, ['2,1']);
      b.add(`branch${i}`, cell(crown, 2, 1), { grav: PULL.down });
      births.push({ name: `branch${i}`, mon: t.mon, every: TUMBLE.every });
    });
    addGround(b, pal, ['maple']);
  });
  const m = ground(book, TUMBLE.width, TUMBLE.exit);
  stand(m, signs.start, 7);
  TUMBLE.trees.forEach((t, i) => {
    plant(m, 'maple', i, t.x, (col, row) => (col === 2 && row === 1 ? `branch${i}` : crownName('maple', i, col, row)));
    stand(m, signs[t.sign], t.x - 5);
  });
  stand(m, signs.next, TUMBLE.exit - 5);
  m.set(8, 1, 'cloudL').set(9, 1, 'cloudR').set(33, 1, 'cloudL').set(34, 1, 'cloudR');
  return { file: 'tumble', title: 'The Tumble', map: m, book, timed, births, exit: TUMBLE.exit };
}

/** Level 2: a maple, an oak and a birch in a wind that gusts. */
export function gust(pal: Pal): Level {
  const timed: Timed[] = [];
  const births: Birth[] = [];
  const { book, signs } = bookFor(pal, SIGNS.gust, (b) => {
    GUST.trees.forEach((t, i) => {
      const crown = crowns(pal, t.kind, 23 + i * 5);
      addTree(b, pal, t.kind, i, crown.rest, ['0,0', '1,0', '2,0', '0,2', '2,2']);
      // the top row's gust loop: one block for each step (a step that shows the same picture twice is two blocks)
      for (let col = 0; col < 3; col++) {
        const at = (step: string) => `${crownName(t.kind, i, col, 0)}.${step}`;
        GUST_LOOP.forEach((s, k) => {
          b.add(at(s.step), cell(crown[s.pic], col, 0), { grav: PULL.down });
          timed.push({ name: at(s.step), next: at(GUST_LOOP[(k + 1) % GUST_LOOP.length].step), ticks: s.ticks });
        });
        // the leaves let go at the onset: the block shown just before the hard lean, when the loop comes round
        births.push({ name: at('onset'), mon: LEAF.gust[t.kind][col], every: GUST_EVERY });
      }
      // the two calm branches: the crown's bottom corners, each dropping a leaf on its own time
      ([0, 2] as const).forEach((col, k) => {
        const name = `${t.kind}.calm${k}`;
        b.add(name, cell(crown.rest, col, 2), { grav: PULL.down });
        births.push({ name, mon: LEAF.calm[t.kind][k], every: t.calm[k] });
      });
    });
    addGround(
      b,
      pal,
      GUST.trees.map((t) => t.kind),
    );
  });
  const m = ground(book, GUST.width, GUST.exit);
  stand(m, signs.start, 7);
  GUST.trees.forEach((t, i) => {
    // the map holds the hard lean, so the loop starts there and the onset comes just before it each time round
    plant(m, t.kind, i, t.x, (col, row) =>
      row === 0 ? `${crownName(t.kind, i, col, 0)}.hard` : row === 2 && col !== 1 ? `${t.kind}.calm${col / 2}` : crownName(t.kind, i, col, row),
    );
  });
  // the signs stand where the calm leaves seldom fall (the gust leaves fly over everything)
  stand(m, signs.gust, 19);
  stand(m, signs.land, 32);
  stand(m, signs.model, 46);
  stand(m, signs.next, GUST.exit - 5);
  m.set(19, 1, 'cloudL').set(20, 1, 'cloudR').set(46, 1, 'cloudL').set(47, 1, 'cloudR');
  return { file: 'gust', title: 'The Gust', map: m, book, timed, births, exit: GUST.exit };
}

/** A level's finished blocks: the book's, with each timed block given its next block and ticks, each branch its birth. */
export function finishBlocks(l: Level) {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  for (const s of l.births) {
    const b = blocks[l.book.n(s.name)];
    b.birthMon = s.mon;
    b.birthTime = s.every;
  }
  return blocks;
}

/** The whole game's rooms. */
export function buildLevels(): { pal: Pal; tumble: Level; gust: Level } {
  const pal = autumnPalette();
  return { pal, tumble: tumble(pal), gust: gust(pal) };
}
