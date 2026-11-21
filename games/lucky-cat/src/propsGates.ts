// Mirrors, salt and their gates for Lucky Cat.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { T, art, blank, cut, hatch, onSky, skyTile, type Pal } from './print';

/** A mirror wall: an ink frame round a pane printed in the spot ink (silver in the funhouse), with two gleams. */
export function mirrorWall(pal: Pal, variant: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('ink', 0));
  p.frame(1, 1, 18, 18, c('paper', 3));
  p.rect(3, 3, 14, 14, c('gold', 2));
  hatch(p, 3, 3, 14, 14, c('gold', 1), 4, -1);
  const dx = variant ? 3 : 0;
  p.line(5 + dx, 14, 9 + dx, 4, c('gold', 3)).line(7 + dx, 15, 12 + dx, 5, c('paper', 4));
  return p;
}

/** A hand mirror to carry: the mirror gate's key. */
export function mirrorKey(pal: Pal): Pixels {
  return onSky(
    pal,
    art(pal, [
      '....................',
      '.......KKKKKK.......',
      '.....KKGGGGGGKK.....',
      '....KGGgggggGGGK....',
      '....KGgPPgggggGK....',
      '...KGggPPgggggggK...',
      '...KGgggPggggggGK...',
      '...KGggggggggggGK...',
      '....KGgggggggggK....',
      '....KGGgggggggGK....',
      '.....KKGGGGGGKK.....',
      '.......KKKKKK.......',
      '.........KK.........',
      '.........KK.........',
      '.........KK.........',
      '.........KK.........',
      '........KKKK........',
      '........KKKK........',
      '.........KK.........',
      '....................',
    ]),
  );
}

/** The mirror gate: a tall ink door with a spot-ink pane and a keyhole (solid; spends the hand mirror). */
export function mirrorGate(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('ink', 0));
  p.rect(2, 0, 1, 20, c('paper', 3)).rect(17, 0, 1, 20, c('paper', 3));
  p.rect(5, 2, 10, 16, c('gold', 2)).line(6, 15, 11, 3, c('paper', 4));
  p.disc(10, 12, 1.6, c('ink', 0)).rect(10, 12, 1, 4, c('ink', 0));
  return p;
}

/** The arch above a gate: a ink lintel with a cut keystone. */
export function archOf(pal: Pal): Pixels {
  const { c } = pal;
  const p = skyTile(pal);
  p.rect(0, 0, 20, 12, c('ink', 1)).rect(0, 11, 20, 1, c('paper', 3));
  p.rect(8, 0, 4, 12, c('ink', 0)).rect(7, 0, 1, 12, c('paper', 3)).rect(12, 0, 1, 12, c('paper', 3));
  hatch(p, 0, 1, 7, 9, c('ink', 2), 3);
  return p;
}

/** A salt shaker to carry: the key to the spilled salt. */
export function shaker(pal: Pal): Pixels {
  return onSky(
    pal,
    art(pal, [
      '....................',
      '....................',
      '........KKKK........',
      '.......KnKnKK.......',
      '.......KKKKKK.......',
      '.......PPPPPP.......',
      '......PPPPPPqP......',
      '......PPPPPPqP......',
      '......PKKKKPqP......',
      '......PKPPPPqP......',
      '......PKKKKPqP......',
      '......PPPPKPqP......',
      '......PKKKKPqP......',
      '......PPPPPPqP......',
      '......qqqqqqqq......',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
    ]),
  );
}

/** A heap of spilled salt across the doorway (solid; a pinch from the shaker clears it). */
export function saltPile(pal: Pal): Pixels {
  const p = skyTile(pal);
  const s = blank();
  for (let y = 0; y < 20; y++) {
    const half = Math.min(10, 3 + y);
    s.rect(10 - half, y, half * 2, 1, pal.c('paper', 4));
  }
  for (const [x, y] of [
    [7, 6],
    [12, 9],
    [5, 13],
    [14, 15],
    [9, 17],
  ])
    s.set(x, y, pal.c('paper', 2));
  return p.blit(cut(pal, s, 1), 0, 0, T);
}
