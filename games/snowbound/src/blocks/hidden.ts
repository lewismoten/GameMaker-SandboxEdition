// The Sandbox Software regulars tucked into Fort Ashby (games/kit/TIN-HEARTS.md), added last so no
// other block's number moves: the tin heart and a painted Easter egg, each lying in the yard snow
// off the paper route (a few points, no sound; touched, they leave the falling-snow yard), and
// Will the playwright from Shakespeare in Sweatpants outside Bleeps at LaVale Mall, standing
// against the mall wall (as solid as the wall he stands in front of).
import { Pixels } from '../../../kit/pixels';
import { drawTinHeart } from '../../../kit/tinHeart';
import { drawEasterEgg } from '../../../kit/easterEgg';
import { willCameo } from '../../../kit/cameos';
import { Ctx, SOLID } from './book';
import type { addGround } from './ground';

export function addHidden(k: Ctx, { yardBase }: ReturnType<typeof addGround>, pal: Uint8Array) {
  const { book, R, c } = k;
  // the tin heart: two frames of its shine (the plain heart, then the glint across it)
  const tin = { ink: c('ink', 0), tin: [c('grey', 2), c('grey', 3), c('grey', 4)], white: c('snow', 6), dark: c('ink', 1) };
  book.add('tinHeart', drawTinHeart(yardBase(111), tin, 0), { score: 100, touch: 'yardA0', next: 'tinHeart2', ntime: 50 });
  book.add('tinHeart2', drawTinHeart(yardBase(111), tin, 2), { score: 100, touch: 'yardA0', next: 'tinHeart', ntime: 3 });
  // the Easter egg, dyed Christmas red with gold zigzags
  const egg = {
    ink: c('ink', 0),
    shell: [c('coat', 1), c('coat', 2), c('coat', 3)],
    paint: [c('gold', 2), c('gold', 3)],
    accent: c('snow', 6),
    white: c('snow', 6),
  };
  book.add('easterEgg', drawEasterEgg(yardBase(113), egg, 'zigzag', 0), { score: 25, touch: 'yardA0' });
  // Will, bundled up in his ruff and sweatpants, out front of Bleeps (never the Christmas bulbs)
  const bulbs = new Set(R('bulbs'));
  const use = Array.from({ length: 255 }, (_, i) => i).filter((i) => !bulbs.has(i));
  const will = book.pics.get('mallWall')!;
  const p = new Pixels(20, 20);
  p.px.set(will.px);
  p.blit(willCameo(pal, { face: 'front' }, { use }), 0, 0, 255);
  book.add('will', p, { solid: SOLID });
}
