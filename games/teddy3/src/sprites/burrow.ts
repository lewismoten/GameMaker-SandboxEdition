// Under Doc Leo's backyard: a mole (two steps of its digging paws, and diving back into the
// dirt), a tangle of tree roots across a tunnel (chew it), and hard clay (whole, and cracked
// after one big dig) for Gwinn's Buried Treasure.
import { Pixels } from '../../../kit/pixels';
import { speckle, sprite } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = {
  o: c('ink', 0),
  G: c('ink', 1),
  g: c('stone', 1),
  w: c('stone', 3),
  p: c('pink', 2),
  P: c('pink', 3),
  d: c('dirt', 2),
  D: c('dirt', 3),
};

const BODY = [
  '.....oooooo.....',
  '...ooGGGGGGoo...',
  '..oGGGgGGGGGGo..',
  '.oGGGGGGGGGwGGo.',
  '.oGGGGGGGGGGGGpp',
  'oGGGgGGGGGGGGGpP',
  'oGGGGGGGGGGgGGo.',
  '.oGGGGGGGGGGGo..',
];

/** The mole, facing right; `k` swaps its front and back paws. */
export function mole(k: number): Pixels {
  const paws = k ? '..oPPo....oPPo..' : '...oPPo..oPPo...';
  return sprite([...BODY, paws], K, 2, 11);
}

/** The mole diving back into the dirt (a heap and its tail end). */
export function moleDive(): Pixels {
  return sprite(['......oo........', '.....oGGo.......', '....ooGGoo......', '..oddDDddDdo....', '.odDDdddDDddo...', 'oddddDDddddddo..'], K, 2, 14);
}

/** Tree roots grown across a tunnel, over `base` (a full block, so it is solid edge to edge). */
export function roots(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  const thick = (x0: number, y0: number, x1: number, y1: number) => p.line(x0, y0, x1, y1, c('wood', 1)).line(x0 + 1, y0, x1 + 1, y1, c('wood', 2));
  thick(3, 0, 6, 7);
  thick(6, 7, 4, 13);
  thick(4, 13, 7, 19);
  thick(13, 0, 12, 6);
  thick(12, 6, 15, 12);
  thick(15, 12, 13, 19);
  p.line(6, 7, 12, 6, c('wood', 0)).line(4, 13, 15, 12, c('wood', 0));
  p.line(8, 0, 9, 4, c('wood', 3)).line(17, 3, 19, 8, c('wood', 1)).line(0, 9, 3, 11, c('wood', 1)).line(9, 15, 10, 19, c('wood', 1));
  return p;
}

/** Hard reddish clay, solid; `cracked` after the first big dig. */
export function clay(cracked: boolean): Pixels {
  const p = new Pixels(20, 20);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) p.set(x, y, (x * 7 + y * 13) % 5 === 0 ? c('brick', 0) : (x + y * 3) % 7 === 0 ? c('brick', 2) : c('brick', 1));
  p.rect(0, 0, 20, 1, c('brick', 3));
  if (cracked) {
    const ink = c('ink', 0);
    p.line(10, 0, 8, 6, ink).line(8, 6, 11, 11, ink).line(11, 11, 9, 19, ink).line(8, 6, 2, 9, ink).line(11, 11, 18, 14, ink);
  }
  return p;
}

/** The old well's wooden bucket (its rim is the thing to stand on; the rope is the shaft's). */
export function wellBucket(): Pixels {
  return sprite(
    [
      '...ooooooooooooooo..',
      '...oMMMMMMMMMMMMMo..',
      '...oBBbBBBbBBBbBBo..',
      '...oBBbBBBbBBBbBBo..',
      '....oMMMMMMMMMMMo...',
      '....oBbBBBbBBBbBo...',
      '....oBbBBBbBBBbBo...',
      '.....oMMMMMMMMMo....',
      '.....ooooooooooo....',
    ],
    { o: c('ink', 0), M: c('metal', 2), B: c('wood', 3), b: c('wood', 1) },
    0,
    0,
  );
}

/** The dark of a dug tunnel, with crumbs of earth (the tunnels' background, and behind roots). */
export function cave(): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, P.r('dirt'), 0, 1, 70, 0.15);
  return p;
}
