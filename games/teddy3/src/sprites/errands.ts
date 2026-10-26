// The errands on Doc Leo's list, one for each of Teddy's stops (Teddy has no idea they are
// all for his own party), the things the MEANWHILE... heroes carry, and Doc Leo's thought
// bubble showing the one he is waiting for.
import { Pixels } from '../../../kit/pixels';
import { blob, over, sprite } from '../art/draw';
import { P } from '../art/pal';
import { CK } from './klown';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = { ...CK, l: c('lilac', 3), L: c('lilac', 1), f: c('frost', 2), F: c('frost', 1), a: c('orange', 3), A: c('orange', 1) };

export const ERRANDS: Record<string, string[]> = {
  // THE CHEZ's keys on their ring, with a little rubber chicken fob.
  keys: [
    '....mmmm....',
    '...m....m...',
    '...m....m...',
    '....mmmm....',
    '....mo.Mm...',
    '...MMo..Mm..',
    '..MoMM...MM.',
    '..MM.o....Mo',
    '.Mo..oYYo...',
    '.MMM.oYqo...',
    '......oYo...',
    '.......jj...',
  ],
  // A bundle of party streamers off the kite's tail.
  streamers: [
    '.r.....b....',
    '.rr...bb..g.',
    '..r...b..gg.',
    '..rr.bb..g..',
    '...r.b..gg..',
    '...ooooooo..',
    '...oYYYYYo..',
    '...oyyyyyo..',
    '....r.b.g...',
    '...r..b..g..',
    '..r...b...g.',
    '.r....b....g',
  ],
  // A box of birthday candles from the bakery (striped, a whole dozen).
  candles: [
    '..r.y.r.y...',
    '..o.o.o.o...',
    '..R.b.R.b...',
    '..w.w.w.w...',
    '..R.b.R.b...',
    'oooooooooooo',
    'owwwwwwwwwwo',
    'owPPwPPwPPwo',
    'owwwwwwwwwwo',
    'oooooooooooo',
  ],
  // The Clown Club's banner, rolled up and tied with a ribbon.
  banner: [
    '..........oo',
    '........oowo',
    '......oowwo.',
    '....oowwrwo.',
    '..oowwrwwo..',
    'oowwrwwwo...',
    'owwrwwPPPo..',
    '.owwwwoPPPo.',
    '..owwo..oo..',
    '...oo.......',
  ],
  // Party horns, a red one and a blue one.
  horns: [
    'oo..........',
    'oRRoo.......',
    'oRwRRRoo....',
    'oRRRwRRRRoo.',
    '.oooooooooo.',
    '..oo........',
    '..oBBoo.....',
    '..oBwBBBoo..',
    '..oBBBwBBBBo',
    '...ooooooooo',
  ],
  // A paper lantern for the Big Top, glowing.
  lantern: [
    '.....oo.....',
    '....oMMo....',
    '...oaaaao...',
    '..oaAaaAao..',
    '.oaaAaaAaao.',
    '.oaaAaaAaao.',
    '.oaaAaaAaao.',
    '..oaAaaAao..',
    '...oaaaao...',
    '....oMMo....',
    '.....oo.....',
  ],
  // Gwinn's best bone, the one she buried long ago, with a bow on it now.
  bestBone: ['..oo......oo', '.owwo....owo', '.owwwooooowo', '..owwwwwwwwo', '.owwwwwwwwo.', 'owwoooooowwo', 'owo.rr...owo', '.o.rRRr...o.', '....rr......'],
  // An RSVP card: YES!
  rsvp: ['oooooooooooo', 'owwwwwwwwwwo', 'owbwbwbbbwwo', 'owbwbwbwwwwo', 'owwbwwbbwwwo', 'owwbwwbwwwwo', 'owwbwwbbbwwo', 'owwwwwwwwwwo', 'oooooooooooo'],
  // A big bag of party balloons, tied at the neck, three poking out of the top.
  balloons: [
    '..rr.bb.yy..',
    '.rRRbBByYYy.',
    '.rRrbBbyYyy.',
    '..rr.bb.yy..',
    '...o..o.o...',
    '....o.oo....',
    '...oooooo...',
    '..oVVVVVVo..',
    '.oVVvVVVVVo.',
    '.oVVVVVVvVo.',
    '.oVVVVVVVVo.',
    '..oooooooo..',
  ],
  // The plug for the Big Top's lights.
  plug: [
    '....oo.oo...',
    '....mo.om...',
    '...oooooooo.',
    '...oMMMMMMo.',
    '...oMmmmmMo.',
    '....oMMMMo..',
    '.....oooo...',
    '......oo....',
    '......oo....',
    '.....oo.....',
    '....oo......',
    '..ooo.......',
  ],
};

export function errandSprite(name: string, dy?: number): Pixels {
  return sprite(ERRANDS[name], K, undefined, dy);
}

/** An errand lying on a background block. */
export function errandOn(base: Pixels, name: string): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return over(p, errandSprite(name));
}

/** Doc Leo's thought bubble over `base`, showing the errand he is waiting for. */
export function wantBubble(base: Pixels, name: string): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  blob(p, 10, 8, 9, 7, [c('fur', 1), c('fur', 2), c('fur', 2)], 0, 2, 0.4);
  p.set(3, 17, c('fur', 2)).set(2, 19, c('fur', 2)).set(4, 16, c('fur', 2));
  over(p, sprite(ERRANDS[name], K, undefined, undefined, 20, 15), 0, 0);
  return p;
}
