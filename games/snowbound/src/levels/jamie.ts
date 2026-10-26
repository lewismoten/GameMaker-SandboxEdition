// Level 2, Jamie Street at noon: the steep end of Jamie Street is closed for sledding, and it
// is the fast way down from Leon Drive to Bowden Drive. The run slants (slant.ts): it steps a
// column right every three rows and goes round the map's wrap, so the ride comes back in at
// the top of the map a third of the way over, on fresh hill, three times: the firs and gates
// at the top, the birches in the middle, and the lamps and lit firs of lower Jamie Street at
// the bottom, where the finish is. Boards in the tree lines count down from 9 to 1 on the way.
import type { BlockBook } from '../blocks/blocks';
import { BOARDS } from '../blocks/hill';
import { MON } from '../ids';
import { MapBuilder } from './maps';
import { LOOP, WIDTH, cellAt, phaseOf } from './slant';

/** Course letters → block names (banks are put in by column, see `name`). */
const LEGEND: Record<string, string> = {
  T: 'tree',
  ',': 'plain',
  '~': 'slope',
  ':': 'slopeT',
  '!': 'steep',
  o: 'mogul',
  R: 'rock',
  Y: 'slopeTree',
  W: 'birch',
  Z: 'litFir',
  n: 'snowman',
  r: 'flagRed',
  e: 'flagBlue',
  Q: 'slopeBill',
  q: 'slopeCocoa',
  X: 'finish',
  '>': 'driftR',
  '<': 'driftL',
};

// The run between its tree lines, one string a row (22 blocks, i = 1..22), from the top. The
// sled starts on glide snow (it keeps whatever speed it has), so one push of Down carries it
// to the first steep band.
const TOP = [
  ',,,,,,,,,,,,,,,,,,,,,,', // 1: the corner of Leon Drive and Jamie Street
  '~~~~~n~~~~~~~~~~~~n~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~T~~~~~~~~~~~~~~~~T~~',
];
// The top of the hill: firs, gates and moguls (rows 5-99).
const FIRS = [
  '!!!!!!!!!!!!!!!!!!!!!!',
  '~~~~~~~~~~Q~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~YY',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~R~~~~~~~', // 10
  '~~~~~~Q~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~r~~~~e~~~~~~~~~',
  '~~~~~~~~~Q~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~Y',
  '~~~~~~~~~~~~r~~~~e~~~~',
  '~~~~~~~~~~~~~~Q~~~~~~~',
  '~~~~R~~~~~~~~~~~~~~~~~',
  '~~~~~~~~r~~~~e~~~~~~~~',
  '~~~~~~~~~~Q~~~~~~~~~~~', // 20
  '~~oo~~oo~~~~~oo~~oo~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~YYY~~~~~~~~~~~~~',
  '~~~~~YYYYY~~~~~~RR~~~~',
  '~~Q~~~YYY~~~~~~~~~~~~~',
  '~~~~~~~Y~~~~~~~~~~~~qY',
  '~~~~~~~~~~~~~~YYY~~~~Y',
  '~~~~~~~~~~~~~YYYYY~~~~',
  '~~~~~~~~~~~~~~YYY~~~~~',
  '~~~~~~~~~~~~~~~Y~~~Q~~', // 30
  '>~~~~~~~~~~~~~~~~~~~~<',
  '!!!!!!!!!!!!!!!!!!!!!!',
  '>>~~~~~~~~~~~~~~~~~~<<',
  '>>>~~~~~~~Q~~~~~~~~<<<',
  '>>>>~~~~~~~~~~~~~~~<<<',
  '>>>>~~~~~~~~~~~~~~<<<<',
  '>>>>>~~~~~Q~~~~~~<<<<<',
  '>>>>>~~~~~~~~~~~~<<<<<',
  'YYYY>~~~~~~~~~~~~<YYYY',
  'YYYYY~~~~~~~~~~~~YYYYY', // 40
  'YYYYY~~~~~R~~~~~~YYYYY',
  'YYYYY~~~~~~~~~~~~YYYYY',
  'YYYY~~~~~Q~~~~~~~~YYYY',
  'YYY~~~~~~~~~~~~~~~~YYY',
  'YY~~~~~~~~~~~~~~~~~~YY',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~o~~o~~o~~o~~o~~o~~o~',
  '~o~~o~~o~~Q~~o~~o~~o~~',
  '~~o~~o~~o~~o~~o~~o~~o~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 50
  '~~~~~~~~~~~~~~~~~~~~~~',
  '!!!!!!!!!!!!!!!!!!!!!!',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~YY~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~YY~~~~~~',
  '~~~Q~~~~~YY~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~Q~~',
  'YY~~~~~~~~~~~~YY~~~~~~',
  '~~~~~~~YY~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~YY~~~', // 60
  '~~~~YY~~~~~~Q~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~YY~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~r~~~~e~~~~~~~~~',
  '~~~~~~~~~~Q~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~e~~~~r~~~~~',
  '~~~~~~~~~~~~~Q~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 70
  '~~~~~r~~~~e~~~~~~~~~~~',
  '~~~~~~~Q~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~R~~~~~~~~~R~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~Q~~~~~~~~~',
  '~~~R~~~~~~~~~~~R~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~R~~~~~~~~~~R~', // 80
  '~~~~~Q~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~R~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '!!!!!!!!!!!!!!!!!!!!!!',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~Q~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~oo~~oo~~~~~oo~~oo~~~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 90
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
];
// The middle: a line of flags across the run, then the birches (rows 100-199).
const BIRCHES = [
  '~~~~~~~~~~~~~~~~~~~~~~', // 100
  '~~r~~e~~r~~e~~r~~e~~r~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~Q~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~W~~~~~~~~~~W~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~W~~~~~~~~~~',
  '~~~Q~~~~~~~~~~~~~~~Q~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  'WW~~~~~~W~~~~~~W~~~~~~', // 110
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~WWW~~~~~~~~~WWW~~~',
  '~~~~~W~~~~~Q~~~~~W~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '!!!!!!!!!!!!!!!!!!!!!!',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~WWW~~~~~~~~~',
  '~~~~~~~~~WWWWW~~~~~~~~', // 120
  '~~~Q~~~~~~WWW~~~~~~Q~~',
  '~~~~~~~~~~~W~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~o~~o~~o~~o~~o~~o~~o~~',
  '~~o~~o~~o~~Q~~o~~o~~o~',
  '~o~~o~~o~~o~~o~~o~~o~~',
  '>>~~~~~~~~~~~~~~~~~~<<',
  '>>>~~~~~~~~~~~~~~~~<<<',
  '>>>>~~~~~~~~~~~~~~<<<<', // 130
  'WWW>>~~~~~~~~~~~~<<WWW',
  'WWWWW~~~~~~~~~~~~WWWWW',
  'WWWWW~~~Q~~~~~~~~WWWWW',
  'WWWWW~~~~~~~~~~~WWWWWW',
  'WWWWWW~~~~~~~~~~WWWWWW',
  'WWWWW~~~~~q~~~~~WWWWWW',
  'WWWW~~~~~~~~~~~~~WWWWW',
  'WW~~~~~~~~~~~~~~~~~~WW',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 140
  '!!!!!!!!!!!!!!!!!!!!!!',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~R~~~~~~~W~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~W~~~~~~~Q~~~~~~~R~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~W~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~W~~~~~',
  '~~~~~Q~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~R~~~~~~~~~', // 150
  '~~W~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~W~~~',
  '~~~~~~~W~~~~Q~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~r~~~~e~~~~~~~~',
  '~~~~~~~~~~Q~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~r~~~~e~~~',
  '~~~~~~~~~~~~~~~Q~~~~~~', // 160
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~r~~~~e~~~~~~~~~~~',
  '~~~~~~~Q~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '!!!!!!!!!!!!!!!!!!!!!!',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~WW~~~~WW~~~~WW~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 170
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~WW~~~~WW~~~~WW~~~~WW',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~Q~~~~~~~~~~',
  '~~~~WW~~~~WW~~~~WW~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~o~~o~~o~~o~~o~~o~~o~~',
  '~~o~~o~~o~~o~~o~~o~~o~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 180
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~R~~~~~~~~~R~~~~~',
  '~~~~~~~~~~~Q~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~R~~~~~~~~~~~~~~~R~~',
  '~~~~~~~~~~~W~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 190
  '!!!!!!!!!!!!!!!!!!!!!!',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~Q~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
];
// The bottom: lower Jamie Street, its lamps along the tree lines, firs strung with lights, and
// the checkered finish at the corner of Bowden Drive (rows 200-238).
const LIGHTS = [
  '~~~~~~~~~~~~~~~~~~~~~~', // 200
  '~~e~~r~~e~~r~~e~~r~~e~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~Q~~~~~~~~~~',
  '~~~~~Z~~~~~~~~~~~Z~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~ZZZ~~~~~~~~~~',
  '~~~Q~~~~~~Z~~~~~~~~Q~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 210
  '~~~~~~r~~~~e~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '>~~~~~~~~~~~r~~~~e~~~<',
  '>>~~~~~~~~~~~~Q~~~~~<<',
  '>>>~~~~~~~~~~~~~~~~<<<',
  '>>>>~~~~~~~~~~~~~~<<<<',
  'ZZ>>~~~~~~~~~~~~~~<<ZZ',
  'ZZZ>~~~~~~Q~~~~~~~<ZZZ',
  'ZZZZ~~~~~~~~~~~~~~ZZZZ',
  'ZZZZ~~~~~~~~~~~~~ZZZZZ', // 220
  'ZZZ~~~~~~~~~~~~~~~ZZZZ',
  'ZZ~~~~~~~~~~~~~~~~~ZZZ',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '!!!!!!!!!!!!!!!!!!!!!!',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~Q~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~r~~~~e~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~', // 230
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  'TXXXXXXXXXXXXXXXXXXXXT', // 235: the finish
  ',,,,,,,,,,,,,,,,,,,,,,',
  ',,,,,,,,,,,,,,,,,,,,,,',
  ',,,,,,,,,,,,,,,,,,,,,,',
];
/** Every row of the run, from the top (row 0, the tree line above the start). */
export const COURSE = ['T'.repeat(WIDTH - 2), ...TOP, ...FIRS, ...BIRCHES, ...LIGHTS, 'T'.repeat(WIDTH - 2)];
export const FINISH = COURSE.findIndex((r) => r.includes('X'));
/** Rows from which the run is lower Jamie Street, with lamps along both tree lines. */
const LAMPS_FROM = 200;
/** Rows between distance boards: the first (9) at row 24, the last (1) at row 216. */
const BOARD_EVERY = 24;

/** The block at row u, across i (0 and WIDTH - 1 the tree lines). */
function name(u: number, i: number): string {
  if (i === 0 || i === WIDTH - 1) {
    if (u % BOARD_EVERY === 0 && u > 0 && u / BOARD_EVERY <= BOARDS) return `dist${BOARDS + 1 - u / BOARD_EVERY}`;
    if (u >= LAMPS_FROM && u < FINISH && u % 6 === 3) return 'lamp';
    return 'tree';
  }
  const ch = COURSE[u][i - 1];
  const n = LEGEND[ch];
  if (!n) throw new Error(`Jamie Street: unknown course letter "${ch}" at row ${u}`);
  // the banked snow along both sides, where the run is plain glide snow
  if (n === 'slope' || n === 'slopeT') {
    if (i <= 2) return `bankL${i}${phaseOf(u)}`;
    if (i === WIDTH - 2) return `bankR${phaseOf(u)}`;
  }
  return n;
}

export function jamieHill(book: BlockBook) {
  const m = new MapBuilder(book);
  COURSE.forEach((r, u) => {
    if (r.length !== WIDTH - 2) throw new Error(`Jamie Street: row ${u} is ${r.length} wide`);
    // tracks on plain slope rows for texture
    for (let i = 0; i < WIDTH; i++) {
      const [x, y] = cellAt(u, i);
      const n = name(u, i);
      m.set(x, y, n === 'slope' && u % 9 === 4 ? 'slopeT' : n);
    }
  });
  if (COURSE.length >= LOOP) throw new Error('Jamie Street: the run meets itself');
  // the corner signs at the top and the bottom of the run
  const at = (u: number, i: number) => cellAt(u, i);
  m.street(...at(1, 7), 'stLeonJamie');
  m.street(...at(FINISH - 2, 18), 'stJamieBowden');
  for (let i = 2; i < WIDTH - 2; i++) m.link(...at(FINISH, i), 'next', 0, 0);
  // kids on toboggans cutting across (each runs 7 blocks to the right and back)
  for (const [u, i] of [
    [27, 3],
    [33, 12],
    [51, 4],
    [62, 13],
    [70, 2],
    [104, 5],
    [116, 12],
    [128, 3],
    [146, 10],
    [158, 6],
    [186, 12],
    [206, 4],
    [215, 11],
    [230, 6],
  ])
    m.mon(MON.sledder, ...at(u, i));
  return { m, start: at(2, 11) };
}
