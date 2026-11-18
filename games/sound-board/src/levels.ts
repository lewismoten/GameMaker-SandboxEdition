// SOUND BOARD's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, pads and pictures.
//
//   1. The Board: six pads, each with a sign (its name and its sound number) and a picture of
//      its sound. One pad is silent on purpose. At the end a long pad and a short pad hang one
//      above the other: jump up through them and the short one cuts the long one off. A door by the entrance
//      loads the room again, so every pad is back.
//   2. Sounds That Tell You: a coin, a key, a gate, a jump, a spike and a wrong gate, so you
//      hear what just happened.
// Every room is closed in by hedges you can see, so Rima is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques, stampTiledSign } from '../../kit/starter/microPlaque';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks } from '../../kit/starter/locks';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { SLOT } from './sounds';
import { PADS, addBoardBlocks } from './pads';

const WORDS = {
  hello: { lines: ['STEP', 'ON'] },
  again: { lines: ['PLAY', 'AGAIN'] },
  chime: { lines: ['CHIME', '#0'], post: false },
  coin: { lines: ['COIN', '#2'], post: false },
  blip: { lines: ['BLIP', '#7'], post: false },
  quiet: { lines: ['SILENT', '#3'], post: false },
  chute: { lines: ['UP 4,', 'THEN 5'] },
  exit: { lines: ['EXIT', '→'], post: false },
  coin2: { lines: ['COIN', '#5'], post: false },
  key: { lines: ['KEY', '#7'], post: false },
  gate: { lines: ['GATE', '#8'], post: false },
  jump: { lines: ['JUMP', '#9'], post: false },
  spike: { lines: ['OUCH', '#10'], post: false },
  wrong: { lines: ['WRONG', '#6'], post: false },
};

/** The level labels use the shared one-row micro plaques. */
export type SignName = keyof typeof WORDS;

/** The levels share the Starter blocks, locks, pads and plaque vocabulary. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  addBoardBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, WORDS) as Record<SignName, Sign>;
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

export const GROUND = 10;
/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The ground and the side walls. */
function base(width: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1 pieces: where each pad, its sign and its picture are. */
export const BOARD = {
  /** The doors: the replay door (x) and the entrance. */
  again: 2,
  start: 6,
  /** Each unit: the sign's left block; the pad is one block in. */
  units: [
    ['chime', 15, 'chime', SLOT.chime],
    ['coin', 20, 'coin', SLOT.coin],
    ['blip', 25, 'blip', SLOT.blip],
    ['quiet', 30, 'quiet', SLOT.quiet],
  ] as const,
  /** The jump: two pads hung one above the other, two blocks wide (a jump from the ground below hits the long one, then the short one). */
  jump: { x: 40, width: 2, long: GROUND - 3, short: GROUND - 4 },
  chuteSign: 36,
  exit: 47,
} as const;

/** Level 1: the board. 50 blocks wide. */
function board(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const { jump } = BOARD;
  const g = base(50);
  // One-way entrance planks let Kit walk back underneath to the replay door.
  g.put(BOARD.start, 8, '=').put(BOARD.start, 9, '=');
  g.put(BOARD.start, 6, 's').put(BOARD.start, 7, 'S');
  g.put(BOARD.again, 8, 'e').put(BOARD.again, 9, 'E');
  g.put(BOARD.exit, 8, 'e').put(BOARD.exit, 9, 'E');
  scenery(
    g,
    [
      [8, 1],
      [20, 2],
      [33, 1],
      [43, 2],
    ],
    [13, 24, 34, 44],
    [10, 18, 28, 35],
  );
  const m = new StarterMap(book, g.rows());
  const sky = { set: m.setOnSky.bind(m) };
  stampTiledSign(sky, BOARD.again + 2, 8, signs.again);
  stampTiledSign(sky, 9, onGround(GROUND, signs.hello), signs.hello);
  for (const [pad, x0, sign, slot] of BOARD.units) {
    stampTiledSign(sky, x0, onGround(GROUND, signs[sign]), signs[sign]);
    m.set(x0 + 1, GROUND - 1, `pad.${pad}`);
    m.set(x0 + 0, GROUND - 4, `wave.${slot}`);
  }
  stampTiledSign(sky, BOARD.chuteSign, onGround(GROUND, signs.chute), signs.chute);
  m.set(BOARD.chuteSign, GROUND - 4, `wave.${SLOT.fanfare}`).set(BOARD.chuteSign + 2, GROUND - 4, `wave.${SLOT.ping}`);
  for (let i = 0; i < jump.width; i++) m.set(jump.x + i, jump.long, `pad.${PADS.long.name}`).set(jump.x + i, jump.short, `pad.${PADS.short.name}`);
  stampTiledSign(sky, 44, 7, signs.exit, 2);
  return m;
}

/** Where level 2's pieces are (x). */
export const FEEDBACK = {
  coins: [15, 16],
  key: 22,
  /** The wall with the gate in it (x), and the gate's row. */
  gate: 28,
  ledge: [33, 36],
  spike: 43,
  wrong: 50,
  exit: 57,
} as const;

/** Level 2: sounds as feedback. 62 blocks wide. */
function feedback(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const f = FEEDBACK;
  const g = base(62);
  // A two-row turf step supports Kit at the raised entrance, clear of the signs.
  g.put(3, 8, 'G').put(3, 9, 'D');
  g.put(3, 6, 's').put(3, 7, 'S');
  g.put(f.exit, 8, 'e').put(f.exit, 9, 'E');
  for (const x of f.coins) g.put(x, 9, 'c');
  g.put(f.key, 9, 'k');
  g.col(f.gate, 0, 7, 'B').put(f.gate, 8, 'l').put(f.gate, 9, 'L');
  g.row(8, f.ledge[0], f.ledge[1], '=');
  g.put(f.ledge[0] + 1, 7, 'c').put(f.ledge[0] + 2, 7, 'c');
  scenery(
    g,
    [
      [8, 1],
      [19, 2],
      [32, 1],
      [46, 2],
      [55, 1],
    ],
    [12, 17, 26, 38, 41, 48],
    [6, 26, 31, 45, 53],
  );
  const m = new StarterMap(book, g.rows());
  const at = (x: number, s: Sign, wave?: number) => {
    stampTiledSign({ set: m.setOnSky.bind(m) }, x, onGround(GROUND, s), s);
    if (wave !== undefined) m.set(x + 1, GROUND - 4, `wave.${wave}`);
  };
  at(12, signs.coin2);
  m.set(12, GROUND - 4, `wave.${SLOT.ping}`);
  at(18, signs.key, SLOT.blip);
  at(23, signs.gate);
  m.set(25, GROUND - 4, `wave.${SLOT.creak}`);
  // Read the jump label on the approach to the ledge.
  at(30, signs.jump);
  m.set(31, GROUND - 4, `wave.${SLOT.jump}`);
  at(42, signs.spike);
  m.set(40, GROUND - 4, `wave.${SLOT.hurt}`);
  at(47, signs.wrong);
  m.set(47, GROUND - 4, `wave.${SLOT.nope}`);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 54, 7, signs.exit, 2);
  m.set(f.spike, GROUND - 1, 'spike');
  m.set(f.wrong, GROUND - 1, 'wrong');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'sound-board');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'The Board', hint: 'Step on each pad and listen.', map: board(book, signs) },
    { file: 'two', title: 'Sounds Tell You', hint: 'Hear what just happened.', map: feedback(book, signs) },
  ];
  return { book, pal, levels };
}
