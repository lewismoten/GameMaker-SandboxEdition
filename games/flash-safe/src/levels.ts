// FLASH SAFE's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, its clocks and its burrs.
//
//   1. Hit Without a Flash: three burrs hang in the air. Touch one and Lami gets a beep, an ouch
//      face, a little "-5" that rises and fewer hit points: four cues and not one flash. A still
//      "not this" picture shows the wrong way.
//   2. Slow and Small: a warning lamp that blinks once a second, a lamp that pulses softly, both
//      one block big and amber, with a still "not this" picture of a big red screen blinking. The door fades.
//   3. Storm, Held: a dark sky that lifts a little, in two small steps, stays lifted for a
//      moment and settles back, with a small bolt that is only there while it is held.
//
// Every clock starts when the scene loads and nothing the player does can change one. Every room
// ends in a visible hedge, so Lami is never stopped by something she can't see.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import type { Sign as Panel } from '../../kit/starter/sign';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { BURR } from './monsters';
import { STORM, bolt, lamp, lampPost, nope, onSky } from './props';
import { BLINK_OFF, BLINK_ON, PULSE_STEP, SKY_CALM, SKY_FIRST, SKY_HOLD, SKY_STEP } from './timing';

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
export const WIDTH = 42;
/** Where the burrs hang in level 1 (columns), and the lamps in level 2. */
export const BURR_X = [17, 22, 27];
export const LAMP_X = [10, 18];
/** The columns of the storm's bolt (level 3) and its top row. */
export const BOLT_X = 21;
export const BOLT_TOP = 2;

type SignName = 'cues' | 'hit' | 'nope' | 'slow' | 'soft' | 'noper' | 'fade' | 'storm' | 'bolt';
const SIGNS: Record<SignName, string> = {
  cues: 'A HIT NEEDS NO FLASH',
  hit: 'A HIT IS A BEEP, OUCH, A NUMBER, FEWER HIT POINTS',
  nope: 'NOT THIS: THE WHOLE SCREEN FLASHING',
  slow: 'ONCE A SECOND IS SLOW ENOUGH',
  soft: 'A SOFT PULSE IS EVEN GENTLER',
  noper: 'NOT THIS: A BIG RED SCREEN BLINKING',
  fade: 'THE DOOR FADES. IT DOES NOT FLASH',
  storm: 'THE SKY LIFTS A LITTLE AND STAYS',
  bolt: 'THE BOLT IS SMALL AND IT STAYS',
};

function startBook(pal: Pal, names: SignName[]): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const { blocks, signs } = buildTiledSigns(Object.fromEntries(Object.entries(SIGNS).map(([name, text]) => [name, { rows: [[text]] }])), {
    include: names,
    compact: true,
    maxWidth: 5,
    maxBlocks: Math.min(100, 150 - book.index.size),
    colors: {
      background: skyOf(pal),
      paper: pal.c('parch', 3),
      ink: pal.c('ink', 0),
      wood: pal.c('wood', 2),
      highlight: pal.c('wood', 4),
      shadow: pal.c('wood', 0),
    },
  });
  for (const [name, pic] of blocks) book.add(name, pic, AIR);
  return { book, signs };
}

/** A 4x3 picture board for the still "not this" panels, stamped like a sign (it stands on the sign's posts). */
function addPanel(book: Book, pal: Pal, name: string, kind: 'white' | 'red'): Panel {
  const pic = nope(pal, kind, 80, 60);
  const board: string[][] = [];
  for (let row = 0; row < 3; row++) {
    board.push([]);
    for (let col = 0; col < 4; col++) {
      const id = `panel.${name}.${col}${row}`;
      board[row].push(id);
      book.add(id, pic.crop(col * 20, row * 20, 20, 20), AIR);
    }
  }
  const legs: Panel['legs'] = [`panel.${name}.left`, `panel.${name}.right`];
  for (const [i, x] of [3, 13].entries())
    book.add(
      legs[i],
      new Pixels(20, 20, skyOf(pal))
        .rect(x, 0, 4, 20, pal.c('wood', 2))
        .rect(x, 0, 1, 20, pal.c('wood', 4))
        .rect(x + 3, 0, 1, 20, pal.c('wood', 1)),
      AIR,
    );
  return { board, legs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Pick<Sign, 'board'>) => ground - 1 - s.board.length;

/**
 * A ring of blocks that go round on one clock: each state shows its picture for its ticks, then the
 * next. `name.start` looks like the first state but lasts `first` ticks the first time, so rings of
 * different lengths can start out of step. A cell on the map is `name.start`.
 */
function ring(
  book: Book,
  timed: Timed[],
  name: string,
  states: { key: string; pic: Pixels; rules?: Parameters<Book['add']>[2]; ticks: number }[],
  first: number,
): void {
  const id = (k: string) => `${name}.${k}`;
  book.add(id('start'), states[0].pic, states[0].rules ?? AIR);
  states.forEach((s) => book.add(id(s.key), s.pic, s.rules ?? AIR));
  timed.push({ name: id('start'), next: id(states[1].key), ticks: first });
  states.forEach((s, i) => timed.push({ name: id(s.key), next: id(states[(i + 1) % states.length].key), ticks: s.ticks }));
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** The ground, hedges at both ends, the entrance at x 3 and the exit door at `exitX`. */
function room(exitX: number): Grid {
  const g = new Grid(WIDTH, 15);
  g.row(GROUND, 0, WIDTH - 1, 'G').fill(0, GROUND + 1, WIDTH, 4, 'D');
  g.col(0, 0, 9, 'X').col(WIDTH - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S').put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** Level 1: three burrs. */
function hitWithoutAFlash(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['cues', 'hit', 'nope']);
  const panel = addPanel(book, pal, 'white', 'white');
  const g = room(40);
  for (const x of [15, 20, 25, 29]) g.put(x, GROUND - 1, 'c');
  scenery(
    g,
    [
      [7, 2],
      [20, 3],
      [32, 1],
    ],
    [9, 39],
    [12, 16],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 5, onGround(GROUND, signs.cues), signs.cues);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 11, onGround(GROUND, signs.hit), signs.hit);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 28, onGround(GROUND, signs.nope), signs.nope);
  m.sign(33, onGround(GROUND, panel), panel);
  for (const x of BURR_X) m.mon(BURR, x, GROUND - 1);
  return { file: 'one', title: 'Hit Without a Flash', hint: 'Show a hit some other way.', map: m, book, timed: [] };
}

/** Level 2: two lamps on posts. */
function slowAndSmall(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['slow', 'soft', 'noper', 'fade']);
  const panel = addPanel(book, pal, 'red', 'red');
  const timed: Timed[] = [];
  const [upper, lower] = lampPost(pal);
  book.add('post.upper', upper, AIR);
  book.add('post.lower', lower, AIR);
  // lamp A: dark, lit, once a second (18 ticks)
  ring(
    book,
    timed,
    'lampA',
    [
      { key: 'off', pic: lamp(pal, 0), ticks: BLINK_OFF },
      { key: 'on', pic: lamp(pal, 3), ticks: BLINK_ON },
    ],
    BLINK_OFF,
  );
  // lamp B: a soft pulse in six small steps up and down
  const steps = [0, 1, 2, 3, 2, 1];
  ring(
    book,
    timed,
    'lampB',
    steps.map((level, i) => ({ key: `s${i}`, pic: lamp(pal, level), ticks: PULSE_STEP })),
    PULSE_STEP,
  );
  const g = room(40);
  for (const x of [9, 12, 21, 32]) g.put(x, GROUND - 1, 'c');
  scenery(
    g,
    [
      [8, 2],
      [22, 3],
      [34, 1],
    ],
    [20, 39],
    [7, 22, 26],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 4, onGround(GROUND, signs.slow), signs.slow);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 13, onGround(GROUND, signs.soft), signs.soft);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 23, onGround(GROUND, signs.noper), signs.noper);
  m.sign(28, onGround(GROUND, panel), panel);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 34, onGround(GROUND, signs.fade), signs.fade);
  LAMP_X.forEach((x, k) => {
    m.setOnSky(x, GROUND - 1, 'post.lower')
      .setOnSky(x, GROUND - 2, 'post.upper')
      .setOnSky(x, GROUND - 3, `lamp${k ? 'B' : 'A'}.start`);
  });
  return { file: 'two', title: 'Slow and Small', hint: 'Blink slowly. Keep it small.', map: m, book, timed };
}

/** Level 3's map: every sky block (even the world's edge) is the storm sky's first block. */
class StormMap extends StarterMap {
  constructor(
    private readonly b: Book,
    rows: string[],
  ) {
    super(b, rows);
  }
  override done() {
    const m = super.done();
    const sky = this.b.n('sky');
    const storm = this.b.n('st.sky.start');
    for (let i = 0; i < m.blocks.length; i++) if (m.blocks[i] === sky) m.blocks[i] = storm;
    return m;
  }
}

/** Level 3: the storm sky, one coin ring, the doors and a bolt, all on one clock. */
function stormHeld(pal: Pal): Level {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const timed: Timed[] = [];
  const calm = pal.c(STORM, 0);
  const mid = pal.c(STORM, 1);
  const hold = pal.c(STORM, 2);
  const states = [
    { key: 'calm', sky: calm, lit: false, ticks: SKY_CALM },
    { key: 'lift', sky: mid, lit: false, ticks: SKY_STEP },
    { key: 'hold', sky: hold, lit: true, ticks: SKY_HOLD },
    { key: 'settle', sky: mid, lit: false, ticks: SKY_STEP },
  ];
  const on = (name: string, rules?: Parameters<Book['add']>[2]) =>
    states.map((s) => ({ key: s.key, pic: onSky(book.pics.get(name)!, skyOf(pal), s.sky), rules: rules ?? AIR, ticks: s.ticks }));
  // The side borders and centered posts follow the storm sky on the same clock.
  const { book: signBook, signs } = startBook(pal, ['storm', 'bolt']);
  const skyTiles = new Set<string>();
  for (const [name, pic] of signBook.pics) {
    if (!name.startsWith('tiledSign.')) continue;
    if (pic.px.includes(skyOf(pal))) {
      skyTiles.add(name);
      ring(
        book,
        timed,
        name,
        states.map((s) => ({ key: s.key, pic: onSky(pic, skyOf(pal), s.sky), rules: AIR, ticks: s.ticks })),
        SKY_FIRST,
      );
    } else book.add(name, pic, AIR);
  }
  for (const sign of Object.values(signs)) {
    sign.board = sign.board.map((row) => row.map((name) => (skyTiles.has(name) ? `${name}.start` : name)));
    sign.post!.block += '.start';
  }
  ring(
    book,
    timed,
    'st.sky',
    states.map((s) => ({ key: s.key, pic: new Pixels(20, 20, s.sky), ticks: s.ticks })),
    SKY_FIRST,
  );
  ring(book, timed, 'st.coin', on('coin', { ...AIR, score: 10, touch: 'st.sky.start' }), SKY_FIRST);
  for (const d of ['doorTop', 'doorBottom', 'doorwayTop', 'doorwayBottom']) ring(book, timed, `st.${d}`, on(d), SKY_FIRST);
  for (let row = 0; row < 3; row++)
    ring(
      book,
      timed,
      `st.bolt${row}`,
      states.map((s) => ({ key: s.key, pic: bolt(pal, s.sky, s.lit)[row], ticks: s.ticks })),
      SKY_FIRST,
    );
  const g = room(40);
  for (const x of [15, 24, 28, 31]) g.put(x, GROUND - 1, 'c');
  const m = new StormMap(book, g.rows());
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 5, onGround(GROUND, signs.storm), signs.storm);
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 10, onGround(GROUND, signs.bolt), signs.bolt);
  for (const x of [15, 24, 28, 31]) m.set(x, GROUND - 1, 'st.coin.start');
  m.set(3, 8, 'st.doorwayTop.start').set(3, 9, 'st.doorwayBottom.start').set(40, 8, 'st.doorTop.start').set(40, 9, 'st.doorBottom.start');
  for (let row = 0; row < 3; row++) m.set(BOLT_X, BOLT_TOP + row, `st.bolt${row}.start`);
  return { file: 'three', title: 'Storm, Held', hint: 'Lift the sky. Do not strobe it.', map: m, book, timed };
}

/** The palette (the Starters' ramps and the storm sky's) and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette((b) => b.ramp(STORM, 3, [24, 30, 68], [62, 72, 124]), 'flash-safe');
  return { pal, levels: [hitWithoutAFlash(pal), slowAndSmall(pal), stormHeld(pal)] };
}
