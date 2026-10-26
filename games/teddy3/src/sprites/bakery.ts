// People and things in the downtown bakery: the baker (a tall white hat, a floury apron and a
// rolling pin), and a tray of cookies riding the belts out of the oven (catch it for a treat).
import type { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';
import { CK } from './klown';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = {
  ...CK,
  f: c('fur', 1),
  F: c('fur', 2),
  l: c('paint', 2),
  L: c('paint', 3),
  c: c('wood', 3),
  C: c('wood', 4),
  d: c('wood', 1),
  x: c('frost', 2),
};

/** The baker, facing left: a tall white hat, a floury apron, a rolling pin in hand (20x40). */
export function baker(): Pixels {
  const rows = [
    '......ooooo.........',
    '.....oLLLLLo........',
    '....oLLLLLLLo.......',
    '....oLLlLLLLo.......',
    '....oLLLLlLLo.......',
    '.....oLLLLLo........',
    '.....ooooooo........',
    '.....osSSSSo........',
    '....oskSSkSo........',
    '....osSSSSSso.......',
    '.....osrrSSo........',
    '......osSSo.........',
    '....ooLLLLLoo.......',
    '..oooLLLLLLLLo......',
    '.ocCcoLLLLLLLLo.....',
    '.ocCcSoLLLLLLLo.....',
    '..ooo.oLLxxLLLo.....',
    '......oLLxxLLLo.....',
    '......oLLLLLLLo.....',
    '.......oLLLLLo......',
    '.......onnonno......',
    '.......onno.onno....',
    '......ooooo.ooooo...',
  ];
  return sprite(rows, K, 0, 40 - rows.length, 20, 40);
}

/** A baking tray of cookies, riding a belt (clear background). */
export function cookieTray(phase: number): Pixels {
  const top = phase ? '..oCco.oCco.oCco....' : '...oCco.oCco.oCco...';
  return sprite([top, '.ocdcCocdcCocdcCo...'.slice(0, 20), 'oMMMMMMMMMMMMMMMMMo.', '.ommmmmmmmmmmmmmmo..'], K, 0, undefined, 20, 20);
}
