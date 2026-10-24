// Firefly Meadow's monster art: a sleepy firefly dozing on a grass stem (two breaths, with a
// little "z"), a woken firefly glowing bright with its friends around it (two flickers), and
// a patch of the deep dark that Teddy won't walk into (a slow swirl with a few faint specks).
import type { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = {
  o: c('ink', 0),
  g: c('green', 1),
  G: c('green', 2),
  y: c('glow', 1),
  Y: c('glow', 3),
  w: c('glow', 2),
  z: c('paint', 2),
  d: c('purple', 0),
  D: c('purple', 1),
  b: c('blue', 0),
  s: c('blue', 2),
};
const S = (rows: string[], dx?: number, dy?: number) => sprite(rows, K, dx, dy);

/** A sleepy firefly on a grass stem, its tail glowing in a soft halo; `breath` 1 dims it and lifts the "z". */
export function sleepy(breath: number): Pixels {
  const p = S(
    [
      breath ? '..........zz' : '............',
      breath ? '...........z' : '..........zz',
      breath ? '..........zz' : '...........z',
      breath ? '............' : '..........zz',
      '....oooo....',
      '...oYYYYo...',
      '..oYYwwYYo..',
      '..oYwwwwYo..',
      '...oYYYYo...',
      '....oGGo....',
      '.....oo.....',
      '.....G......',
      '....gG......',
      '....gG..g...',
      '...g.Gg.g...',
      '...g.G.g....',
      '..g..G.g....',
    ],
    4,
  );
  // the halo: a ring of soft dots round the tail (fainter on the out-breath)
  const ring = breath ? 7 : 6;
  for (let a = 0; a < 24; a++) {
    const x = Math.round(10 + Math.cos((a / 24) * Math.PI * 2) * ring);
    const y = Math.round(10 + Math.sin((a / 24) * Math.PI * 2) * ring * 0.8);
    if (a % 2 === 0 && p.get(x, y) === 255) p.set(x, y, c('glow', breath ? 0 : 1));
  }
  return p;
}

/** A woken firefly, glowing, with friends flickering round it (two pictures). */
export function fireflyLight(k: number): Pixels {
  const rows = k
    ? [
        '.......Y.......',
        '...Y.......w...',
        '......www......',
        '.....wYYYw.....',
        'w...wYYYYYw....',
        '.....wYYYw...Y.',
        '......www......',
        '..Y........w...',
        '........w......',
      ]
    : [
        '...w...........',
        '.........Y.....',
        '......www....w.',
        '.....wYYYw.....',
        '....wYYYYYw..w.',
        '.Y...wYYYw.....',
        '......www......',
        '...........Y...',
        '....Y..........',
      ];
  return S(rows, 3, 6);
}

/** A patch of the deep dark: a soft swirl that fills its block (`k` turns it slowly). */
export function deepDark(k: number): Pixels {
  const rows: string[] = [];
  for (let y = 0; y < 20; y++) {
    let row = '';
    for (let x = 0; x < 20; x++) {
      const dx = x - 9.5;
      const dy = y - 9.5;
      const r = Math.hypot(dx, dy);
      const edge = r > 9.5 + Math.sin(Math.atan2(dy, dx) * 3 + k) * 1.2;
      const swirl = Math.floor(r / 2 + Math.atan2(dy, dx) * 1.3 + k) % 3 === 0;
      const speck = (x * 7 + y * 13 + k * 5) % 41 === 0;
      row += edge ? '.' : speck ? 's' : swirl ? 'D' : r < 6 ? 'b' : 'd';
    }
    rows.push(row);
  }
  return S(rows, 0, 0);
}
