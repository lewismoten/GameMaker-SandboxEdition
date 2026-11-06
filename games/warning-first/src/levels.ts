// WARNING FIRST's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its clocks.
//
//   1. Rumble, Then Puff: three fog vents in the ground take turns. Each rests, rumbles (the
//      warning: the grate shakes side to side, shake marks appear, a few wisps rise), then puffs fog two blocks
//      high that stings a little, and rests again. Wait for the puff to end, then cross.
//   2. Flicker, Then Gone: two plank bridges over a soft pit. A plank is solid, then flickers
//      (still solid, cracked and blinking gold: the warning), then is gone, then is back. Cross while it is solid;
//      fall in and you land on a mat and hop out.
//
// Every clock starts when the scene loads and nothing the player does can change one (the
// manual says so), so the warning is something to watch for, not something she can set off.
// Both rooms end in a visible hedge, so Rima is never stopped by something she can't see.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID as SOLID_ALL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { MOODS, fog, grate, mat, pit, plank, type Mood } from './props';
import { FLICKER_STEPS, GONE, PLANK_FIRST, PUFF, PUFF_HURT, REST, RUMBLE, SHAKE_STEPS, SOLID, VENT_FIRST } from './timing';

/** A block that turns into another after some ticks. */
interface Timed {
  name: string;
  next: string;
  ticks: number;
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  book: Book;
  timed: Timed[];
}

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

const AIR = { grav: PULL.down };
export const GROUND = 10;
export const WIDTH_ONE = 40;
export const WIDTH_TWO = 36;
/** Level 1: the columns of the three vents, and the first sign's and the exit's. */
export const VENT_X = [17, 26, 33];
/** Level 2: the first column of each bridge (four planks wide), and the island between them. */
export const BRIDGE_X = [9, 17];
export const BRIDGE_W = 4;
export const PIT_ROWS = [GROUND + 1, GROUND + 2];

type SignName = 'rumble' | 'puff' | 'flicker' | 'back';
const SIGNS: Record<SignName, string> = {
  rumble: 'RUMBLE FIRST, THEN A PUFF OF FOG',
  puff: 'A PUFF STINGS. WAIT, THEN GO',
  flicker: 'FLICKER MEANS GONE. GET OFF',
  back: 'IT COMES BACK. CROSS WHEN SOLID',
};

function startBook(pal: Pal, names: SignName[]): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  for (const n of names) signs[n] = addSign(book, pal, `${n}.sign`, SIGNS[n], 4, 3);
  return { book, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** The block names of vent `k` and its three cells (g the grate, a the lower fog, b the upper fog) in `mood`. */
export const ventBlock = (k: number, cell: 'g' | 'a' | 'b' | 'h', mood: Mood | 'start') => `v${k}.${cell}.${mood}`;

/** Level 1: three vents. Each cell has a rest, a rumble and a puff block, in a ring; the map holds the "start" one (a rest with its own first length). */
function rumbleThenPuff(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['rumble', 'puff']);
  const timed: Timed[] = [];
  for (let k = 0; k < VENT_X.length; k++) {
    const pics = Object.fromEntries(MOODS.map((m) => [m, fog(pal, m)])) as Record<Mood, ReturnType<typeof fog>>;
    const cells = {
      g: (m: Mood) => grate(pal, m),
      a: (m: Mood) => pics[m][1],
      b: (m: Mood) => pics[m][0],
    };
    for (const cell of ['g', 'a', 'b'] as const) {
      // the lower fog stings once (like Watch Your Step's spike): touched, its cell joins a twin chain with the same clock and no sting
      const rules = (m: Mood) =>
        cell === 'g' ? { solid: SOLID_ALL } : cell === 'a' && m === 'puff' ? { ...AIR, hp: PUFF_HURT, touch: ventBlock(k, 'h', 'start') } : AIR;
      for (const fam of cell === 'a' ? (['a', 'h'] as const) : [cell]) {
        book.add(ventBlock(k, fam, 'start'), cells[cell]('rest'), fam === 'h' ? AIR : rules('rest'));
        for (const m of MOODS) book.add(ventBlock(k, fam, m), cells[cell](m), fam === 'h' ? AIR : rules(m));
        timed.push(
          { name: ventBlock(k, fam, 'start'), next: ventBlock(k, fam, 'rumble'), ticks: VENT_FIRST[k] },
          { name: ventBlock(k, fam, 'puff'), next: ventBlock(k, fam, 'rest'), ticks: PUFF },
          { name: ventBlock(k, fam, 'rest'), next: ventBlock(k, fam, 'rumble'), ticks: REST },
        );
        if (cell !== 'g') timed.push({ name: ventBlock(k, fam, 'rumble'), next: ventBlock(k, fam, 'puff'), ticks: RUMBLE });
        else {
          // the grate shakes: rumble, rumble2, rumble3... side to side, then the puff, on the fog's clock
          const steps = SHAKE_STEPS.map((_, i) => (i ? `${ventBlock(k, 'g', 'rumble')}${i + 1}` : ventBlock(k, 'g', 'rumble')));
          steps.forEach((name, i) => {
            if (i) book.add(name, grate(pal, 'rumble', (i % 2) as 0 | 1), rules('rumble'));
            timed.push({ name, next: steps[i + 1] ?? ventBlock(k, 'g', 'puff'), ticks: SHAKE_STEPS[i] });
          });
        }
      }
    }
  }
  const g = new Grid(WIDTH_ONE, 15);
  g.row(GROUND, 0, WIDTH_ONE - 1, 'G').fill(0, GROUND + 1, WIDTH_ONE, 4, 'D');
  g.col(0, 0, 9, 'X').col(WIDTH_ONE - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S').put(36, 8, 'e').put(36, 9, 'E');
  for (const x of [15, 21, 29, 35]) g.put(x, GROUND - 1, 'c');
  scenery(
    g,
    [
      [7, 2],
      [18, 3],
      [29, 1],
    ],
    [19, 38],
    [23, 30],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.rumble), signs.rumble);
  m.sign(10, onGround(GROUND, signs.puff), signs.puff);
  VENT_X.forEach((x, k) => {
    m.set(x, GROUND, ventBlock(k, 'g', 'start'))
      .set(x, GROUND - 1, ventBlock(k, 'a', 'start'))
      .set(x, GROUND - 2, ventBlock(k, 'b', 'start'));
  });
  return { file: 'one', title: 'Rumble, Then Puff', hint: 'The ground tells you first.', map: m, book, timed };
}

/** Level 2: two plank bridges over a pit. A plank cell is solid, flickers, is gone, and is back. */
function flickerThenGone(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['flicker', 'back']);
  const timed: Timed[] = [];
  book.add('pit', pit(pal), AIR);
  book.add('mat', mat(pal), { solid: SOLID_ALL });
  BRIDGE_X.forEach((_, k) => {
    const plankRules = { solid: SOLID_ALL, grav: PULL.down };
    book.add(`p${k}.start`, plank(pal, 'solid'), plankRules);
    book.add(`p${k}.solid`, plank(pal, 'solid'), plankRules);
    // the flicker: p0.flicker (cracked), p0.flicker2 (cracked and lit gold), p0.flicker3 (cracked)... then gone
    const steps = FLICKER_STEPS.map((_, i) => `p${k}.flicker${i ? i + 1 : ''}`);
    steps.forEach((name, i) => {
      book.add(name, plank(pal, i % 2 ? 'lit' : 'cracked'), plankRules);
      timed.push({ name, next: steps[i + 1] ?? `p${k}.gone`, ticks: FLICKER_STEPS[i] });
    });
    book.add(`p${k}.gone`, pit(pal), AIR);
    timed.push(
      { name: `p${k}.start`, next: steps[0], ticks: PLANK_FIRST[k] },
      { name: `p${k}.solid`, next: steps[0], ticks: SOLID },
      { name: `p${k}.gone`, next: `p${k}.solid`, ticks: GONE },
    );
  });
  const g = new Grid(WIDTH_TWO, 15);
  g.row(GROUND, 0, WIDTH_TWO - 1, 'G').fill(0, GROUND + 1, WIDTH_TWO, 4, 'D');
  g.col(0, 0, 9, 'X').col(WIDTH_TWO - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S').put(32, 8, 'e').put(32, 9, 'E');
  for (const x of [14, 15, 28, 30]) g.put(x, GROUND - 1, 'c');
  scenery(
    g,
    [
      [8, 2],
      [20, 3],
    ],
    [6, 29],
    [13, 16],
  );
  // the pits: open the ground under each bridge
  for (const x0 of BRIDGE_X) g.fill(x0, GROUND, BRIDGE_W, 4, ' ');
  const m = new StarterMap(book, g.rows());
  m.sign(4, onGround(GROUND, signs.flicker), signs.flicker);
  m.sign(23, onGround(GROUND, signs.back), signs.back);
  BRIDGE_X.forEach((x0, k) => {
    for (let x = x0; x < x0 + BRIDGE_W; x++) {
      m.set(x, GROUND, `p${k}.start`).set(x, PIT_ROWS[0], 'pit').set(x, PIT_ROWS[1], 'mat');
      m.set(x, PIT_ROWS[1] + 1, 'dirt');
    }
  });
  return { file: 'two', title: 'Flicker, Then Gone', hint: 'The planks tell you first.', map: m, book, timed };
}

/** The palette and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'warning-first');
  return { pal, levels: [rumbleThenPuff(pal), flickerThenGone(pal)] };
}
