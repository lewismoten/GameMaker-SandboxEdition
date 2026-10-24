// leo.cbl: Doc Leo's character blocks, one block tall: walking four ways (left is right
// mirrored by the frame's orientation), squawking the rubber chicken, the kazoo, tipping
// Ebenezer's tricorn, a hurt flinch and playing dead (his best trick).
import { Pixels } from '../../../kit/pixels';
import { CLEAR, outline } from '../art/draw';
import { docLeo } from '../art/kit';
import { c } from '../art/pal';
import { BlockSet } from '../blocks/sets';

function recolor(src: Pixels, fn: (v: number) => number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.px.set(src.px.map((v) => (v === CLEAR ? CLEAR : fn(v))));
  return p;
}

export function buildLeoBlocks(): BlockSet {
  const b = new BlockSet(50, true);
  const add = (name: string, p: Pixels) => b.add(name, p);
  add('down0', docLeo('down', 0));
  add('down1', docLeo('down', 1));
  add('up0', docLeo('up', 0));
  add('up1', docLeo('up', 1));
  add('side0', docLeo('side', 0));
  add('side1', docLeo('side', 1));
  add('squawkDown', docLeo('down', 0, true));
  add('squawkSide', docLeo('side', 0, true));
  // blink: the eyes shut behind the spectacles
  const blink = docLeo('down', 0);
  blink.rect(8, 8, 1, 1, c('skin', 2)).rect(11, 8, 1, 1, c('skin', 2)).rect(8, 9, 1, 1, c('ink', 0)).rect(11, 9, 1, 1, c('ink', 0));
  add('blink', blink);
  // the kazoo: cheeks puffed, a red kazoo where the white mouth was
  const kaz = docLeo('down', 0);
  kaz.rect(8, 10, 5, 2, c('red', 3)).rect(12, 10, 2, 2, c('red', 2)).set(7, 10, c('pink', 3)).set(13, 10, c('pink', 3));
  add('kazoo', kaz);
  // a salute: the fedora swapped for a tricorn, a hand to the brim
  const sal = docLeo('down', 0);
  sal
    .rect(2, 1, 16, 6, CLEAR)
    .rect(3, 3, 14, 3, c('ink', 1))
    .rect(6, 1, 8, 3, c('ink', 1))
    .set(3, 2, c('ink', 1))
    .set(16, 2, c('ink', 1))
    .rect(3, 5, 14, 1, c('brass', 2));
  sal.rect(14, 4, 3, 7, c('blue', 1)).rect(14, 4, 3, 1, c('skin', 2));
  add('salute', outline(sal, c('ink', 0)));
  // hurt: a flash of red
  add(
    'hurt',
    recolor(docLeo('down', 0), (v) => (v === c('ink', 0) ? v : c('red', 4))),
  );
  // playing dead: flat on his back, chicken on his chest
  const dead = new Pixels(20, 20, CLEAR);
  dead.rect(1, 9, 18, 7, c('ink', 0)).rect(2, 10, 6, 5, c('grey', 2)).rect(8, 10, 5, 5, c('skin', 2)).rect(13, 10, 5, 5, c('blue', 1));
  dead.rect(9, 13, 3, 1, c('paper', 4)).rect(10, 11, 1, 1, c('red', 3)).set(9, 10, c('ink', 0)).set(11, 10, c('ink', 0));
  dead.rect(14, 7, 4, 3, c('yellow', 3)).set(17, 6, c('red', 3));
  dead.rect(17, 16, 2, 2, c('red', 3)).rect(17, 9, 2, 2, c('red', 3));
  add('dead', dead);
  const zzz = new Pixels(20, 20, CLEAR);
  zzz.px.set(dead.px);
  zzz.line(14, 1, 17, 1, c('paper', 4)).line(17, 1, 14, 4, c('paper', 4)).line(14, 4, 17, 4, c('paper', 4));
  add('dead2', zzz);
  return b;
}
