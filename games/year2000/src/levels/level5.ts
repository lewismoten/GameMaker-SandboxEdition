// Level 5: THE MOON. One small step for a kid... and then a big hop, because in a moon
// suit Dex floats along in one-sixth gravity and drifts when he stops. The Moon is busy
// in the year 2000: moon buggies, the Crater Cafe, meteor showers every afternoon, and the
// friendliest aliens you ever met. The Moon School airlock wants a Moon Pass, which is
// waiting at the Visitor Center, up in meteor alley.
import { LevelMap, type Legend } from './mapkit';
import type { BlockSet } from '../blocks/book';
import { MON } from '../ids';

const LEGEND: Legend = {
  '~': 'space',
  E: 'earth',
  M: 'meteorgun',
  N: 'meteorgunL',
  '.': 'moon',
  ',': 'moonprint',
  ':': 'metal',
  T: 'baseTop',
  W: 'baseWall',
  A: 'airlock',
  x: { tile: 'metal', mark: 'exit' },
  r: 'moonrock',
  F: 'flag',
  G: 'buggydock',
  '>': 'walk_right',
  v: 'walk_down',
  C: { big: 'crater', w: 2, h: 2 },
  D: { big: 'mdome', w: 4, h: 3 },
  J: { big: 'bbMoon', w: 3, h: 2 },
  K: { big: 'bbWelcome', w: 3, h: 2 },
  p: 'page_moon',
  q: 'quarter_moon',
  '*': 'pill_moon',
  z: 'battery_moon',
  L: 'cola_moon',
  P: 'pass_moon',
  a: { mon: MON.alien },
  b: { mon: MON.alien2 },
  '1': { mon: MON.buggy },
  '2': { mon: MON.buggyV },
  '@': { mark: 'start' },
};

/** Pads a row of moon surface to `n` blocks. */
function pad(s: string, n = 38): string {
  if (s.length > n) throw new Error(`Moon row too long (${s.length}): ${s}`);
  return s.padEnd(n, '.');
}
const row = (s: string) => `~${pad(s)}~`;
const top = (s: string, base: string) => `~${pad(s, 27)}${base}~`;

const SPACE = [...'~'.repeat(40)].map((c, x) => (x === 7 || x === 20 ? 'M' : x === 13 || x === 26 ? 'N' : x === 33 ? 'E' : c)).join('');

const ROWS = [
  SPACE, // 0
  top('.....,.........r......,', 'TTTTTTTTTTT'), // 1
  top('..P....DDDD......p.....', 'T:::::::::T'), // 2
  top('.......DDDD.........r..', 'T::::x::::T'), // 3
  top('...r...DDDD.....a......', 'T:::::::::T'), // 4
  top('.z.....................', 'WWWWWAWWWWW'), // 5
  row('.............r............q.....*'), // 6
  row('..p.....r.........a........CC'), // 7
  row('.....CC............r.......CC....p'), // 8
  row('.....CC.....,'), // 9
  row('........r..........*......r'), // 10
  row(''), // 11
  row('.JJJ.........r.......2.......b'), // 12
  row('.JJJ...q'), // 13
  row('>>>>>>>>>>>>>>>>v.....CC.....r'), // 14
  row('................v.....CC......L'), // 15
  row('..1.......p.....v.........1'), // 16
  row('................>>>>>>>>>>v.r'), // 17
  row('....r.....CC..............v'), // 18
  row('..a.......CC.....q........v....p'), // 19
  row('..........................v'), // 20
  row('.....z......r.............v....r'), // 21
  row('..1..................1'), // 22
  row('.....CC.........r..............KKK'), // 23
  row('.....CC...p..........*.........KKK'), // 24
  row('...F...........r'), // 25
  row('.@........q.......G'), // 26
  row(''), // 27
  '~'.repeat(40), // 28
];

export function level5(set: BlockSet): LevelMap {
  const m = new LevelMap(set, 'space');
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if ((x * 11 + y * 5) % 13 === 0) m.set_(x, y, 'space2');
  m.stamp(0, 0, ROWS, LEGEND, 'moon');
  return m;
}
