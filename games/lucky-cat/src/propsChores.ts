// Rascal's roof pulley and morning chore props for Lucky Cat.
import { type Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { art, blank, onSky, type Pal } from './print';

/** Rascal's pulley: a wheel on a beam with a rope over it. */
export function pulley(pal: Pal): Pixels {
  const { c } = pal;
  const s = blank();
  s.rect(0, 1, 20, 3, c('ink', 0));
  s.rect(9, 4, 2, 2, c('ink', 0));
  s.disc(10, 10, 5, c('ink', 0)).ring(10, 10, 3, c('smoke', 2)).disc(10, 10, 1, c('gold', 3));
  s.rect(4, 10, 1, 10, c('paper', 2)).rect(15, 10, 1, 7, c('paper', 2));
  return onSky(pal, s);
}

/** A squat iron bollard: a loose coil of rope beside it (a chore waiting), or the rope wound tight round it. */
export function cleat(pal: Pal, tied: boolean): Pixels {
  const s = blank();
  const ink = pal.c('ink', 0);
  s.rect(7, 10, 6, 10, ink).rect(6, 9, 8, 2, ink).rect(7, 8, 6, 1, ink).rect(5, 18, 10, 2, ink);
  s.rect(8, 11, 1, 6, pal.c('ink', 2));
  const rope = pal.c('gold', 3);
  if (tied) for (const y of [12, 14, 16]) s.rect(6, y, 8, 1, rope).set(13, y + 1, pal.c('gold', 1));
  else {
    s.ring(16, 16, 2.5, rope).ring(16, 16, 1.2, pal.c('gold', 1));
    s.line(13, 16, 13, 12, rope);
  }
  return onSky(pal, s);
}

/** A doorstep: bare (a chore waiting) or with a saucer of cream on it (a trap for a certain cat). */
export function step(pal: Pal, saucer: boolean): Pixels {
  const s = blank();
  s.rect(0, 16, 20, 4, pal.c('ink', 1)).rect(0, 16, 20, 1, pal.c('paper', 2));
  if (saucer) s.rect(4, 13, 12, 3, pal.c('paper', 4)).rect(6, 12, 8, 1, pal.c('paper', 2)).rect(5, 15, 10, 1, pal.c('paper', 2));
  else s.rect(8, 14, 4, 2, pal.c('ink', 2));
  return onSky(pal, s);
}

/** The bins' padlock (solid; the key opens it) and the key on its string. */
export function padlock(pal: Pal): Pixels {
  return art(pal, [
    'kkkkkkkkkkkkkkkkkkkk',
    'knkkkkkkkkkkkkkkknkk',
    'kkkkkkkKKKKKkkkkkkkk',
    'kkkkkkKkkkkkKkkkkkkk',
    'kkkkkKkkkkkkkKkkkkkk',
    'kkkkkKkkkkkkkKkkkkkk',
    'kkkkkKkkkkkkkKkkkkkk',
    'kkkkGGGGGGGGGGGkkkkk',
    'kkkkGGgggggggGGkkkkk',
    'kkkkGgggKKKgggGkkkkk',
    'kkkkGgggKKKgggGkkkkk',
    'kkkkGggggKggggGkkkkk',
    'kkkkGggggKggggGkkkkk',
    'kkkkGgggggggggGkkkkk',
    'kkkkGGGGGGGGGGGkkkkk',
    'kkkkkkkkkkkkkkkkkkkk',
    'pppppppppppppppppppp',
    'kkkkkkkkkkkkkkkkkkkk',
    'knkkkkkkkkkkkkknkkkk',
    'kkkkkkkkkkkkkkkkkkkk',
  ]);
}

export function binKey(pal: Pal): Pixels {
  return onSky(
    pal,
    art(pal, [
      '....................',
      '....................',
      '........GGGG........',
      '.......GgKKgG.......',
      '.......GK..KG.......',
      '.......GgKKgG.......',
      '........GGGG........',
      '.........GG.........',
      '.........GG.........',
      '.........GG.........',
      '.........GGGG.......',
      '.........GG.........',
      '.........GGG........',
      '.........GG.........',
      '....................',
      ...Array(5).fill('....................'),
    ]),
  );
}

/** A trash can, lid on: the Committee chains them shut on Friday the 13th. */
export function bin(pal: Pal, top: boolean): Pixels {
  const s = blank();
  if (top) {
    s.rect(3, 12, 14, 3, pal.c('smoke', 1)).rect(8, 10, 4, 2, pal.c('smoke', 1));
    s.rect(4, 15, 12, 5, pal.c('smoke', 0));
  } else {
    s.rect(4, 0, 12, 20, pal.c('smoke', 0));
    for (const x of [6, 10, 14]) s.rect(x, 2, 1, 16, pal.c('smoke', 1));
    s.rect(3, 6, 14, 2, pal.c('ink', 0)).rect(3, 6, 14, 1, pal.c('gold', 1));
  }
  return onSky(pal, s);
}
