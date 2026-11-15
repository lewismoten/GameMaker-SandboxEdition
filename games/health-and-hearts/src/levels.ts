// HEALTH AND HEARTS's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, spikes, hearts and faces.
//
//   1. Hit Points: F2 shows them; one spike takes ten and Lian carries on.
//   2. Hearts Heal: another spike, then two hearts give the hit points back. They go on to the next room.
//   3. Lives: four spikes spread along the ground are more than Lian has, so the third one costs a life and the
//      room starts again with a full 30. The hearts on the ledge up and left, and the second try takes them.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { addHealth } from './health';

export type SignName = 'f2' | 'spike' | 'heal' | 'carry' | 'zero' | 'past' | 'face' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the hazards. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addHealth(book, pal);
  const { blocks, signs } = buildTiledSigns(
    {
      f2: { rows: [['F2 SHOWS YOUR HIT POINTS']] },
      spike: { rows: [['A SPIKE TAKES 10 HIT POINTS']] },
      heal: { rows: [['A HEART GIVES 10 HIT POINTS BACK']] },
      carry: { rows: [['HIT POINTS GO WITH YOU TO THE NEXT ROOM']] },
      zero: { rows: [['AT ZERO HIT POINTS YOU LOSE A LIFE']] },
      past: { rows: [['HEARTS CAN TAKE YOU PAST 30']] },
      face: { rows: [['A FACE ADDS A LIFE']] },
      exit: { rows: [['EXIT →']] },
    },
    {
      colors: {
        background: skyOf(pal),
        paper: pal.c('parch', 3),
        ink: pal.c('ink', 0),
        wood: pal.c('wood', 2),
        highlight: pal.c('wood', 4),
        shadow: pal.c('wood', 0),
      },
      glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' },
      lettersPerBlock: 3,
      maxBlocks: Math.min(100, 150 - book.index.size),
    },
  );
  for (const [name, pic] of blocks) book.add(name, pic, { grav: PULL.down });
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** Keep boards below the top visible row, and extend their centered posts to the ground.
 * Guard every cell so signs cannot cover scenery, pickups, platforms or each other.
 */
function sign(map: StarterMap, x: number, board: Sign): void {
  stampTiledSign({ set: (x, y, block) => map.setOnSky(x, y, block) }, x, 6, board, 3);
}

export const GROUND = 10;

/** The ground, the side walls, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: one spike to walk into. 40 blocks wide. */
function hitPoints(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(40, 36);
  g.row(9, 23, 26, 'c');
  scenery(
    g,
    [
      [6, 2],
      [19, 1],
      [30, 3],
    ],
    [11, 21, 34],
    [8, 28, 32],
  );
  const m = new StarterMap(book, g.rows());
  m.set(17, GROUND - 1, 'spikeUp');
  sign(m, 2, signs.f2);
  sign(m, 14, signs.spike);
  sign(m, 33, signs.exit);
  return m;
}

/** Level 2: a spike, then two hearts that heal it. 40 blocks wide. */
function heartsHeal(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(40, 36);
  g.row(9, 27, 29, 'c');
  scenery(
    g,
    [
      [8, 1],
      [18, 3],
      [30, 2],
    ],
    [10, 31, 34],
    [8, 25, 33],
  );
  const m = new StarterMap(book, g.rows());
  m.set(13, GROUND - 1, 'spikeUp');
  for (const x of [17, 19]) m.set(x, GROUND - 1, 'heart');
  sign(m, 1, signs.heal);
  sign(m, 15, signs.carry);
  sign(m, 33, signs.exit);
  return m;
}

/** Where level 3's hearts sit and where its four spikes stand (spaced out, so each one stings on its own). */
export const LEDGE_HEARTS = [16, 17] as const;
export const SPIKE_ROW = [21, 24, 27, 30] as const;
/** The ledge with the face, and the face. */
export const FACE_X = 39;

/** Level 3: four spikes spread along the ground are more than 30 hit points; the hearts on a ledge make up for it. 50 blocks wide. */
function lives(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(50, 46);
  g.row(8, 14, 19, '=').row(8, 37, 41, '=');
  g.put(15, 7, 'c').put(18, 7, 'c').put(40, 7, 'c').put(41, 7, 'c');
  scenery(
    g,
    [
      [6, 2],
      [19, 1],
      [28, 3],
      [40, 2],
    ],
    [8, 19, 35],
    [32, 42],
  );
  const m = new StarterMap(book, g.rows());
  for (const x of LEDGE_HEARTS) m.set(x, 7, 'heart');
  for (const x of SPIKE_ROW) m.set(x, GROUND - 1, 'spikeUp');
  m.set(FACE_X, 7, 'oneUp');
  sign(m, 1, signs.zero);
  sign(m, 15, signs.past);
  sign(m, 29, signs.face);
  sign(m, 43, signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'health-and-hearts');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Hit Points', hint: 'F2 shows how many you have.', map: hitPoints(book, signs) },
    { file: 'two', title: 'Hearts Heal', hint: 'Walk into a heart to mend.', map: heartsHeal(book, signs) },
    { file: 'three', title: 'Lives', hint: 'Zero hit points costs a life.', map: lives(book, signs) },
  ];
  return { book, pal, levels };
}
