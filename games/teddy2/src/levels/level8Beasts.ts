// Level 8's monsters, the dog show. The ring's turnstile turns for a spin; a rival show
// poodle (a bark sends her off in a huff); popcorn flying across the ring (play dead); the
// judges' bell (ring it, and its DING drops on the velvet rope, which falls); and Gwinn in
// the Best Behaved ring, wiggling. The judge's "SIT?" hangs over her: sit pretty beside it,
// and the heart wins it over; it drops onto Gwinn (a chain of monsters), and Gwinn SITS.
// She wins a blue ribbon, and the stage's curtain opens for it.
import { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';
import { FLIP } from '../characters/mons';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { scent } from './common';
import { askBubble } from '../sprites/folks';
import { bell, ding } from '../sprites/townfolk';
import { GWINN } from '../sprites/gwinn';
import { gwinnSits } from '../sprites/klubfolk';

const c = (n: string, k: number) => P.c(n, k);

function ribbon(): Pixels {
  const K = { o: c('ink', 0), b: c('blue', 2), B: c('blue', 3), y: c('gold', 2), Y: c('yellow', 3) };
  return sprite(
    [
      '...ooooo...',
      '..obBbBbo..',
      '.obByYyBbo.',
      '.oBbYYYbBo.',
      '.obByYyBbo.',
      '..obBbBbo..',
      '...oooooo..',
      '...obo.obo.',
      '...obo.obo.',
      '..obo...obo',
      '..oo.....oo',
    ],
    K,
    undefined,
    4,
  );
}

function poodle(k: number): Pixels {
  const K = { o: c('ink', 0), w: c('paint', 3), W: c('fur', 1), p: c('pink', 2), k: c('ink', 0) };
  return sprite(
    k
      ? [
          '.........www........',
          '........wwwww.......',
          '.ww.....wwkwwo......',
          'wwww....wwwwwwk.....',
          '.ww.oooowww.p.......',
          '....wwwwwwww........',
          '....wwwwwwww........',
          '....w.w...w.w.......',
          '....w.w...w.w.......',
          '...ww.ww.ww.ww......',
        ]
      : [
          '.........www........',
          '........wwwww.......',
          '.........wwkwwo.....',
          '.ww.....wwwwwwk.....',
          'wwww.oooowww.p......',
          '.ww.wwwwwwww........',
          '....wwwwwwww........',
          '....w.w...w.w.......',
          '...ww.w...w.ww......',
          '......ww.ww.........',
        ],
    K,
    0,
    10,
  );
}

const popcorn = (k: number) => {
  const p = new Pixels(20, 20, 255);
  for (let i = 0; i < 5; i++) p.disc(3 + i * 3 + (k ? 1 : 0), 3 + ((i * 3 + k) % 4), 1, c('paint', 3));
  return p;
};

function turnstile(open: boolean): Pixels {
  const K = { m: c('metal', 2), M: c('metal', 3), o: c('ink', 0) };
  return sprite(
    open
      ? [
          '.........mm.........',
          '.........mm.........',
          '.........mm.........',
          '....MMMMMmmMMMMM....',
          '.........mm.........',
          '.........mm.........',
          '.........mm.........',
          '.........mm.........',
          '........mmmm........',
        ]
      : [
          'MMMMMMMMMMMMMMMMMMMM',
          'M........mm........M',
          'M........mm........M',
          'MMMMMMMMMmmMMMMMMMMM',
          'M........mm........M',
          'M........mm........M',
          'MMMMMMMMMmmMMMMMMMMM',
          'M........mm........M',
          'M........mm........M',
          'MMMMMMMMMmmMMMMMMMMM',
          'M........mm........M',
          'M........mm........M',
          'MMMMMMMMMmmMMMMMMMMM',
          'M........mm........M',
          'M........mm........M',
          'MMMMMMMMMmmMMMMMMMMM',
          'M........mm........M',
          'M........mm........M',
          'M.......mmmm.......M',
          'MMMMMMMMMMMMMMMMMMMM',
        ],
    K,
    0,
    open ? 11 : 0,
  );
}

export function showBeasts() {
  const b = newBestiary();
  b.pic('turnstile', turnstile(false), { solid: 15 }).pic('turnstileOpen', turnstile(true));
  b.pic('poodleRival1', poodle(0), { solid: 15 }).pic('poodleRival2', poodle(1), { solid: 15 });
  b.pic('poodleHuff', poodle(1));
  b.pic('pop1', popcorn(0), { hp: -6 }).pic('pop2', popcorn(1), { hp: -6 });
  for (let k = 0; k < 3; k++) b.pic(`bell${k}`, bell(k));
  b.pic('ding0', ding(0)).pic('ding1', ding(1));
  b.pic(
    'velvet',
    sprite(
      [
        'r..................r',
        'r.rrrrrrrrrrrrrrr.r',
        'rr...............rr',
        'r..................r',
        'g..................g',
        'g..................g',
        'g..................g',
        'ggg..............ggg',
      ],
      { r: c('red', 1), g: c('gold', 2) },
      0,
      12,
    ),
    { solid: 15 },
  );
  b.pic('askSit1', askBubble('SIT?', undefined, 0)).pic('askSit2', askBubble('SIT?', undefined, 1));
  for (const n of ['gwinn1', 'gwinn2', 'gwinn3'] as const) b.pic(n, GWINN[n]);
  b.pic('gwinnSit1', gwinnSits(false, 0)).pic('gwinnSit2', gwinnSits(false, 1));
  b.pic('ribbon', ribbon(), { effect: CTR.clues, eamt: 1, score: 1000 });
  b.pic('ribbonAir', ribbon());

  // the turnstile into the ring: a spin sets it turning for a while
  b.add('turnstile', { pics: [['turnstile', 50]], power: POWER.door, becomes: 'turning', upscore: 25 });
  b.add('turning', {
    pics: [
      ['turnstileOpen', 3],
      ['turnstile', 2],
    ],
    power: POWER.friend,
    end: 70,
    becomes: 'turnstile',
  });
  // the rival: a standard poodle, very groomed, very solid, unimpressed by anything but a bark
  b.add('rival', {
    pics: [
      ['poodleRival1', 12],
      ['poodleRival2', 12],
    ],
    power: POWER.woof - 1,
    becomes: 'rivalHuff',
    upscore: 50,
  });
  b.add('rivalHuff', { pics: [['poodleHuff', 3]], power: 0, path: [[6, 0, 5]], end: -1 });
  // popcorn, flying across the ring at a standing dog's head height
  b.add('popcorn', {
    pics: [
      ['pop1', 2],
      ['pop2', 2],
    ],
    power: POWER.pest,
    path: [[-9, 0, 6, FLIP]],
    end: -1,
  });
  // the judges' bell and the velvet rope it lets down
  b.add('judgeBell', { pics: [['bell0', 50]], power: POWER.paw - 1, becomes: 'judgeRing', upscore: 50 });
  b.add('judgeRing', {
    pics: [
      ['bell1', 2],
      ['bell2', 2],
      ['bell1', 2],
      ['bell2', 2],
    ],
    power: 0,
    end: 8,
    becomes: 'judgeDing',
  });
  b.add('judgeDing', {
    pics: [
      ['ding0', 2],
      ['ding1', 2],
    ],
    power: POWER.door,
    path: [[2, 1, 3]],
    end: -1,
  });
  b.add('velvet', { pics: [['velvet', 50]], power: POWER.door - 1, becomes: 'puff' });
  // Gwinn, wiggling in the Best Behaved ring; the judge's SIT? over the spot beside her
  b.add('gwinnShow', {
    pics: [
      ['gwinn1', 3],
      ['gwinn2', 3],
      ['gwinn3', 3],
      ['gwinn2', 3],
    ],
    power: POWER.door - 2,
    becomes: 'gwinnSat',
    upscore: 1000,
  });
  b.add('askSit', {
    pics: [
      ['askSit1', 8],
      ['askSit2', 8],
    ],
    power: POWER.sitAsk,
    becomes: 'sitDrop',
    upscore: 100,
  });
  b.add('sitDrop', {
    pics: [
      ['askSit1', 2],
      ['askSit2', 2],
    ],
    power: POWER.door,
    path: [[1, 1, 3]],
    end: -1,
    becomes: 'ribbonPop',
  });
  // Gwinn SITS, wagging, and her blue ribbon pops up beside her
  b.add('gwinnSat', {
    pics: [
      ['gwinnSit1', 6],
      ['gwinnSit2', 6],
    ],
    power: POWER.friend,
  });
  b.add('ribbonPop', {
    pics: [['ribbonAir', 2]],
    power: 2,
    path: [
      [-1, -1, 4],
      [-1, 0, 4],
    ],
    end: -1,
    becomes: 'ribbon',
  });
  b.add('ribbon', { pics: [['ribbon', 50]], power: POWER.pickup });
  scent(b, 'scentBone', 'bonePop');
  scent(b, 'scentPoodle', 'poodle');
  return b;
}
