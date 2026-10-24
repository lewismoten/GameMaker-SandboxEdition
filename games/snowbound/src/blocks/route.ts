// The paper route: before the shoveling, the kid subs for the regular carrier of the Mineral
// Daily News-Tribune. A twine-tied bundle waits by the porch at home and puts six papers in
// a counter of their own (one with no sequence behind it, so nothing on screen spends it but
// the porches). Each customer's porch is a door mat that takes one paper and turns into the
// same mat with a rolled paper on it. With no papers the touch is refused, so an empty-handed
// kid walks over the mats like any other bit of walk. Added after every other area so the
// older blocks keep their numbers.
import { blob } from '../art/draw';
import { PAPERS } from '../ids';
import { Ctx } from './book';
import type { addGround } from './ground';

type Painters = ReturnType<typeof addGround>;

/** Papers in the bundle: one for each customer on Gale Street and Leota Street. */
export const BUNDLE = 6;

export function addRoute(k: Ctx, { yardBase, sidewalk }: Painters): void {
  const { book, c, snow } = k;
  // A bundle of folded papers tied with twine, the top one showing its masthead.
  const bundle = yardBase(121);
  blob(bundle, 10, 18, 10, 2.2, snow, 2, 3);
  // five folded papers, the fold edges toward you
  for (let i = 0; i < 5; i++) {
    const y = 16 - i * 2;
    const x = 2 + (i % 2);
    bundle
      .rect(x, y, 16, 2, c('grey', 5))
      .rect(x, y + 1, 16, 1, c('concrete', 2))
      .set(x, y, c('concrete', 2))
      .set(x + 15, y + 1, c('concrete', 1));
  }
  // the top paper: masthead, a headline and two columns of type
  bundle.rect(2, 3, 17, 6, c('grey', 5)).frame(2, 3, 17, 6, c('concrete', 1));
  bundle.rect(3, 4, 15, 1, c('ink', 0));
  bundle.rect(4, 6, 6, 1, c('concrete', 1)).rect(11, 6, 6, 1, c('concrete', 1)).rect(4, 7, 5, 1, c('concrete', 2)).rect(11, 7, 4, 1, c('concrete', 2));
  // the twine, crossed and knotted on top
  bundle.rect(10, 3, 1, 15, c('wood', 4)).rect(2, 6, 17, 1, c('wood', 4)).set(9, 2, c('wood', 4)).set(11, 2, c('wood', 4));
  blob(bundle, 5, 3, 3, 1.2, snow, 4, 6);
  book.add('bundle', bundle, { effect: PAPERS, eamt: BUNDLE, score: 10, touch: 'plain' });

  // A porch: the walk under a customer's door with a door mat on it.
  const mat = () => {
    const p = sidewalk(123);
    p.rect(3, 1, 14, 8, c('wood', 0)).rect(4, 2, 12, 6, c('wood', 1));
    for (let x = 5; x < 15; x += 2) p.rect(x, 2, 1, 6, c('wood', 2));
    p.rect(3, 9, 14, 1, c('concrete', 0));
    return p;
  };
  book.add('stoop', mat(), { effect: PAPERS, eamt: -1, score: 250, touch: 'stoopPaper' });
  // ...and the same mat with the morning paper on it: rolled, with a red rubber band.
  const done = mat();
  done.rect(4, 4, 12, 4, c('grey', 5)).rect(4, 7, 12, 1, c('concrete', 1)).rect(4, 4, 1, 4, c('concrete', 2)).rect(15, 4, 1, 4, c('concrete', 2));
  done.rect(6, 5, 7, 1, c('concrete', 1)).rect(6, 6, 5, 1, c('concrete', 2));
  done.rect(9, 4, 1, 4, c('coat', 3)).rect(10, 4, 1, 4, c('coat', 1));
  book.add('stoopPaper', done);
}
