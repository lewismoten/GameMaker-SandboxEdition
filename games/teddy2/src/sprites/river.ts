// People and things by the river: a fisherman casting from the bank (his hook bobs up and
// down: a monster), the miller in a floury apron, flour sacks, Doc Leo's rubber chicken
// bobbing on the water, and a fish that jumps.
import { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';
import { CK, propSprite } from './klown';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = {
  ...CK,
  l: c('paint', 2),
  L: c('paint', 3),
  f: c('fur', 1),
  a: c('green', 0),
  A: c('green', 1),
  u: c('stone', 2),
  x: c('wood', 3),
  X: c('wood', 4),
  c: c('water', 3),
};

/** A fisherman in a bucket hat and waders, rod out over the water (20x40, facing right). */
export function fisher(): Pixels {
  const rows = [
    '..................m.',
    '.................m..',
    '................m...',
    '...ooooooo.....m....',
    '..oAAAAAAAo...m.....',
    '.oooooooooooom......',
    '...osSSSSso.m.......',
    '...osSoSSsom........',
    '...osSSSSsm.........',
    '....osSsSom.........',
    '.....ossoSo.........',
    '...oobbbbbSo........',
    '..obbbbbbboo........',
    '..obbBbbbbo.........',
    '..obbbbBbbo.........',
    '..obbbbbbbo.........',
    '...oaaaaaao.........',
    '...oaaaaaao.........',
    '...oaaoaaao.........',
    '...oaao.oaao........',
    '...oaao..oaa........',
    '...oaao..oaao.......',
    '..ooooo..ooooo......',
  ];
  return sprite(rows, K, 0, 40 - rows.length, 20, 40);
}

/** The miller: a flat cap, a floury apron, arms folded. */
export function miller(): Pixels {
  const rows = [
    '....oooooo..........',
    '...ouuuuuuoo........',
    '...ooooooooo........',
    '...osSSSSSo.........',
    '...osokSokso........',
    '...osSSSSSso........',
    '....osSrrSo.........',
    '.....osSSo..........',
    '...ooLLLLLoo........',
    '..oLLLLLLLLLo.......',
    '..oLLSSSSSLLo.......',
    '..oLLLLLLLLLo.......',
    '..oLLLLLLLLLo.......',
    '...oLLLLLLLo........',
    '...oLLLLLLLo........',
    '...obbbobbbo........',
    '...obbo.obbo........',
    '...obbo.obbo........',
    '..ooooo.ooooo.......',
  ];
  return sprite(rows, K, 0, 40 - rows.length, 20, 40);
}

/** The fisherman's hook on its line (the line runs up off the top of the block). */
export function hook(): Pixels {
  return sprite(['.m.', '.m.', '.m.', '.m.', '.m.', '.m.', '.m.', '.m.', '.m.', '.m.', '.mm', 'm.m', 'm..', '.mm', '.rr', 'rrr'], K, 9, 0);
}

/** A flour sack, slumped. */
export function sack(): Pixels {
  return sprite(['....oooo....', '...oLLLLo...', '..oLLLLLLo..', '.oLLluLLLLo.', '.oLLLLLLLLo.', 'oLLLLLLLLLLo', 'oLLLLLLlLLLo', '.oooooooooo.'], K, undefined, 12);
}

/** Doc Leo's rubber chicken, bobbing on the water in its red harness. */
export function chickenFloat(bob: number): Pixels {
  const p = new Pixels(20, 20, 255);
  p.blit(propSprite('chicken'), 0, -3 + bob, 255);
  for (let x = 2; x < 18; x += 3) p.set(x, 17, c('water', 3));
  return p;
}

/** A fish leaping (the arc is its path). */
export function fish(k: number): Pixels {
  return sprite(k ? ['..oo....', '.oxxoo.o', 'oxXxxxoo', '.oxxoo.o', '..oo....'] : ['....oo..', 'o.ooxxo.', 'ooxxxXxo', 'o.ooxxo.', '....oo..'], { ...K, x: c('stone', 3), X: c('fur', 2) }, 6, 8);
}
