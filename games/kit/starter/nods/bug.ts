// The bug arrival lesson: its course, block art and placement.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf } from '../palette';
import { smallText } from '../graduationArriveArt';
import { add } from './blocks';
import { ink, lined } from './pictures';
import type { Nod } from './types';

export const bug: Nod = {
  id: 'bug',
  course: 'boss-hits',
  say: 'BIG BUG NAPS',
  note: 'A big friendly bug asleep by the path (it takes five hits to wake a boss; this one is just napping).',
  how: 'How do I draw something bigger than one block?',
  made: 'The bug is four blocks (<b>bugTL</b>, <b>bugTR</b>, <b>bugBL</b>, <b>bugBR</b>), each a quarter of one 40 by 40 drawing, laid side by side. None of them is solid, so you walk in front of it.',
  width: 10,
  blocks(c) {
    const g = c.pal.r('green');
    const big = new Pixels(40, 40, skyOf(c.pal));
    big.disc(20, 26, 15, g[3]).disc(17, 21, 8, g[4]).rect(5, 36, 30, 3, g[1]);
    big
      .disc(12, 14, 5, g[2])
      .disc(28, 14, 5, g[2])
      .line(12, 10, 8, 3, ink(c))
      .line(28, 10, 32, 3, ink(c))
      .disc(8, 3, 1.5, c.pal.c('gold', 4))
      .disc(32, 3, 1.5, c.pal.c('gold', 4));
    for (const x of [14, 26]) big.rect(x - 3, 26, 7, 2, ink(c)).rect(x - 2, 28, 5, 1, ink(c));
    big.disc(10, 31, 3, c.pal.c('pink', 2)).disc(30, 31, 3, c.pal.c('pink', 2));
    big.rect(16, 33, 8, 1, ink(c));
    const body = lined(c, big);
    add(c, 'bugTL', body.crop(0, 0, 20, 20));
    add(c, 'bugTR', body.crop(20, 0, 20, 20));
    add(c, 'bugBL', body.crop(0, 20, 20, 20));
    add(c, 'bugBR', body.crop(20, 20, 20, 20));
    add(c, 'zzz', smallText(20, 'Z', skyOf(c.pal), ink(c)));
  },
  place(m, x) {
    const f = x + 5;
    m.set(f + 1, 8, 'bugTL')
      .set(f + 2, 8, 'bugTR')
      .set(f + 1, 9, 'bugBL')
      .set(f + 2, 9, 'bugBR')
      .set(f + 3, 7, 'zzz');
  },
};
