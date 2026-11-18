// The popups arrival lesson: its course, block art and placement.
import { skyOf } from '../palette';
import { smallText } from '../graduationArriveArt';
import { air } from './rules';
import { add } from './blocks';
import { ink, sky } from './pictures';
import type { Nod } from './types';

export const popups: Nod = {
  id: 'popups',
  course: 'popups',
  say: 'POINTS POP UP',
  note: 'Big coins pay a hundred and a floating 100 rises where they were.',
  how: 'How do I make a score that pops up?',
  made: 'A <b>bigCoin</b> has Score points 100 and becomes <b>pop0</b>, a picture of 100; that turns into <b>pop1</b>, <b>pop2</b> and on, a few ticks apart, each drawn a little higher, and at the last into sky.',
  width: 10,
  blocks(c) {
    const coin = sky(c);
    coin
      .disc(9.5, 9.5, 8, c.pal.c('gold', 0))
      .disc(9.5, 9.5, 7, c.pal.c('gold', 3))
      .disc(9.5, 9.5, 5, c.pal.c('gold', 4))
      .rect(8, 6, 3, 8, c.pal.c('gold', 2))
      .rect(7, 7, 2, 1, c.pal.c('gold', 2));
    coin.rect(5, 5, 2, 3, c.pal.c('gold', 5));
    add(c, 'bigCoin', coin, { ...air, score: 100, touch: 'pop0' });
    for (let k = 0; k < 5; k++) {
      const p = sky(c);
      const t = smallText(20, '100', skyOf(c.pal), c.pal.c('gold', 5), ink(c));
      add(c, `pop${k}`, p.blit(t, 0, 13 - k * 3, skyOf(c.pal)), air);
    }
    for (let k = 0; k < 5; k++) c.timed.push({ name: `pop${k}`, next: k < 4 ? `pop${k + 1}` : 'sky', ticks: 7 });
  },
  place(m, x) {
    const f = x + 5;
    [0, 2, 4].forEach((dx) => m.set(f + dx, 8, 'bigCoin'));
  },
};
