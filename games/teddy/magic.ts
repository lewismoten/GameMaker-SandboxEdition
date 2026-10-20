// Doc Leo's other clown work: magic tricks and parades. Presto, the Klown Klub's magician
// (two blocks tall, doves flutter out of his top hat), the doves themselves, and the
// Klown Klub parade marching down Main Street (each marcher two monsters, top and bottom).
import { Pixels } from '../kit/pixels';
import { CLEAR, klubArt, micro, sprite } from './draw';
import { CK } from './klown';
import { P } from './pal';

const K: Record<string, number> = {
  ...CK,
  a: P.c('pink', 1),
  A: P.c('pink', 3),
  l: P.c('purple', 1),
  L: P.c('purple', 3),
  x: P.c('cloud', 2),
};

/** A white-faced clown head with a red nose and a big smile. */
const FACE = ['....owwwwwwo........', '...owwbwwbwwo.......', '...owwwRRwwwo.......', '...owRwwwwRwo.......', '....owRRRRwo........', '.....owwwwo.........'];

/** A 20x40 two-block figure, bottom aligned. */
const tall = (rows: string[]) => sprite(rows, K, 0, 40 - rows.length, 20, 40);

/** Presto the magician: a tall black top hat, a black cape lined in red, a wand with a white tip. */
export function presto(): Pixels {
  return tall([
    '.....oooooo.........',
    '.....oOOOOo.........',
    '.....oOOOOo.........',
    '.....oOOOOo.........',
    '.....orrrro.........',
    '...oooooooooo.......',
    ...FACE,
    '.....ooOOoo.........',
    '...ooOOrOOOoo.......',
    '..oOOOrwrOOOOo......',
    '..oOOOOwOOOOOo...x..',
    '..oOrOOwOOOrOo..o...',
    '..oxoOOwOOOoxoo.o...',
    '..oSo.OOOOO.oSoo....',
    '..oro.OOOOO.oro.....',
    '..oro.OOOOO.oro.....',
    '..ooo.OOOOO.ooo.....',
    '.....obbobbo........',
    '.....obbobbo........',
    '.....obbobbo........',
    '....oooooooooo......',
    '...oRRRRooRRRRo.....',
    '...ooooooooooooo....',
  ]);
}

/** A white dove, wings up or down. */
export function dove(phase: number): Pixels {
  return sprite(
    phase
      ? ['...........', '...........', '....oo.....', '.ooxxwo.oo.', 'oxxxxkxyxxo', 'xw.oxxxo.wx', '...oxxo....', '....oo.....']
      : ['o.........o', 'xo.......ox', 'wxo.oo..oxw', '.wxoxwooxw.', '..oxxkxyo..', '..oxxxxo...', '...oxxo....', '....oo.....'],
    { ...K, k: P.c('ink', 0), y: P.c('yellow', 2) },
    undefined,
    4,
  );
}

const LEGS = [
  ['.....obbobbo........', '.....obbobbo........', '.....obbobbo........', '....oooooooooo......', '...oRRRRooRRRRo.....', '...ooooooooooooo....'],
  ['.....obbo.obbo......', '....obbo...obbo.....', '...obbo.....obbo....', '..oooooo...oooooo...', '.oRRRRRo...oRRRRRo..', '.oooooooo..oooooooo.'],
];

/** The parade: a bass drummer, a banner carrier, a klown with a bunch of balloons. Two steps each. */
export function marcher(kind: 'drum' | 'banner' | 'balloons', step: number): Pixels {
  const legs = LEGS[step % 2];
  if (kind === 'drum')
    return tall([
      '......oooo..........',
      '.....oRRRRo.........',
      '....oooooooo........',
      ...FACE,
      '.....oyyyyo.........',
      '...ooyyyyyyoo.......',
      '..oyyyyyyyyyyo......',
      '..oSoyyyyyyoSo.o....',
      '..oSooooooooSooxo...',
      '...oowwwwwwwoo.o....',
      '...orwwwwwwwro......',
      '...orwwRRwwwro......',
      '...orwwwwwwwro......',
      '...oowwwwwwwoo......',
      '....oooooooooo......',
      ...legs,
    ]);
  if (kind === 'banner') {
    const p = tall([
      '.oooooooooooooooooo.',
      '.oxxxxxxxxxxxxxxxxo.',
      '.oxxxxxxxxxxxxxxxxo.',
      '.oxxxxxxxxxxxxxxxxo.',
      '.oxxxxxxxxxxxxxxxxo.',
      '.oxxxxxxxxxxxxxxxxo.',
      '.oooooooooooooooooo.',
      '..o.............o...',
      '.oGo...........oGo..',
      '..o.....oooo....o...',
      '..o....oVVVVo...o...',
      '..o...oooooooo..o...',
      '..o.owwwwwwo....o...',
      '..oowwbwwbwwo...o...',
      '..oowwwRRwwwo...o...',
      '..oowRwwwwRwo...o...',
      '..o.owRRRRwo....o...',
      '..o..owwwwo.....o...',
      '..o..ovvvvo.....o...',
      '..ooovvvvvvoo...o...',
      '..oSvvvvvvvvvoSoo...',
      '..oSovvvvvvvo.oSo...',
      '..o..ovvvvvvo...o...',
      '.....ovvvvvvo.......',
      ...legs,
    ]);
    micro(p, 3, 40 - 30 + 1, klubArt('KLUB'), P.c('red', 2));
    return p;
  }
  return tall([
    '..oo....oo....oo....',
    '.oRRo..oyyo..obbo...',
    'oRRRRooyyyyoobbbbo..',
    'oRwRRooywyyoobwbbo..',
    '.oRRo..oyyo..obbo...',
    '..oo....oo....oo....',
    '...o....o....o......',
    '....o...o...o.......',
    '.....o..o..o........',
    '......o.o.o.........',
    '.......ooo..........',
    '......oSSo..........',
    '....oooooooo........',
    ...FACE,
    '.....oGGGGo.........',
    '...ooGGgGGGoo.......',
    '..oGGGGgGGGGGo......',
    '..oSoGGgGGGoSo......',
    '..oSoGGgGGGoSo......',
    '.....oGGgGGo........',
    ...legs,
  ]);
}

/** The top and bottom 20x20 halves of a two-block figure. */
export function split(fig: Pixels): [Pixels, Pixels] {
  return [fig.crop(0, 0, 20, 20), fig.crop(0, 20, 20, 20)];
}

export { CLEAR };
