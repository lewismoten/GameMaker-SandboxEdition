// Doc Leo, the friendly hobo clown, two blocks tall (Teddy is one). His costume is the
// story: Gwin scattered his hat, bow tie, shoes, horn and nose across town. `wearing`
// says which pieces he has on.
import { Pixels } from '../kit/pixels';
import { CLEAR, over, sprite } from './draw';
import { CK } from './klown';
import { P } from './pal';

const K: Record<string, number> = {
  ...CK,
  // stubble paint, coat, patches
  u: P.c('stone', 2),
  U: P.c('stone', 3),
  c: P.c('gwin', 2),
  C: P.c('gwin', 3),
  d: P.c('gwin', 1),
  x: P.c('blue', 1),
  X: P.c('blue', 2),
  z: P.c('purple', 1),
};

export interface Costume {
  hat?: boolean;
  tie?: boolean;
  shoes?: boolean;
  horn?: boolean;
  nose?: boolean;
}

export const FULL: Costume = { hat: true, tie: true, shoes: true, horn: true, nose: true };

/** Doc Leo as a 20x40 picture (clear background). `wave` raises his hand. */
export function docLeo(wearing: Costume = FULL, wave = false): Pixels {
  const rows = [
    // hat
    wearing.hat ? '.....oooooooo.......' : '....................',
    wearing.hat ? '.....oOOOOOOo.......' : '....................',
    wearing.hat ? '.....oOOOOOOoGYG....' : '....................',
    wearing.hat ? '.....oqqqqqqo.G.....' : '.......oo..oo.......',
    wearing.hat ? '...ooOOOOOOOOoo.....' : '......odoooodo......',
    // face: white eyes and mouth, painted stubble, the nose
    '....osswwsswwsso....',
    '....oswkwswkwsso....',
    '....osswwsswwsso....',
    wearing.nose ? '....ossssRRssss.o...' : '....osssssssssso....',
    wearing.nose ? '....osssRRRRssso....' : '....ossssooosssso...',
    '....ouwwwwwwwwuo....',
    '....ouwrrrrrrwuo....',
    '....ouuwwwwwwuuo....',
    '.....ouuuuuuuuo.....',
    // collar and bow tie
    wearing.tie ? '...ooooRRooRRooo....' : '...oooooooooooo.....',
    wearing.tie ? (wave ? '..ocCCoRwRRwRoCCo.oSo' : '..ocCCoRwRRwRoCCo...') : wave ? '..ocCCCCwwwwCCCCo.oSo' : '..ocCCCCwwwwCCCCo...',
    // the patched coat
    wave ? '.ocCCCCCwwwwCCCCCooo.' : '.ocCCCCCwwwwCCCCCo..',
    wave ? 'ocCCyyCCwwwwCCxxCo...' : 'ocCCyyCCwwwwCCxxCCo.',
    'ocCCyyCCwwwwCCxxCCo.',
    'ocCo.CCCwwwwCCC.oCCo',
    wearing.horn ? 'oCoyYoCCwwwwCCC.oCo.' : 'oCo..oCCwwwwCCC.oCo.',
    wearing.horn ? 'oSoyyoCCCCCCCCC.oSo.' : 'oSo..oCCCCCCCCC.oSo.',
    wearing.horn ? '.ooqqRoCCCCCCCo..o..' : '.o...oCCCCCCCCo..o..',
    '.....oxxxxxxxxxo....',
    '.....oxXxxxxzzxo....',
    '.....oxxxxxxzzxo....',
    '.....oxxxx.xxxxo....',
    '.....oxxxx.xxxxo....',
    '.....oxxxo.oxxxo....',
    '.....oXxxo.oxxXo....',
    '.....oxxxo.oxxxo....',
    ...(wearing.shoes
      ? ['...ooooooo.ooooooo..', '..oRRRRRRo.oRRRRRRo.', '.oRRwRRRRo.oRRRRwRRo', '.ooooooooo.ooooooooo']
      : ['....ooooo...ooooo...', '....oddddo..oddddo..', '....odoodo..odoodo..', '....ooooo...ooooo...']),
  ];
  return sprite(rows, K, 0, 40 - rows.length, 20, 40);
}

/** The two halves of a 20x40 picture over background blocks. */
export function halves(fig: Pixels, top: Pixels, bottom: Pixels): [Pixels, Pixels] {
  const a = new Pixels(20, 20);
  a.px.set(top.px);
  over(a, fig.crop(0, 0, 20, 20));
  const b = new Pixels(20, 20);
  b.px.set(bottom.px);
  over(b, fig.crop(0, 20, 20, 20));
  return [a, b];
}

export { CLEAR };
