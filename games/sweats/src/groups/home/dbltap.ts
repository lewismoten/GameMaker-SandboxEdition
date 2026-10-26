// "Double Tap for Justice": he supports the latest thing; he doesn't know what it is, but he
// supports it. Someone changed their profile picture (a snail? no, a flag with a hamster), he
// double-tapped it twice, and thirty minutes later he was on page six of the forums crying into
// a bowl of cereal about justice for tropical fruit he's never tasted (papayas? pomelos?). The
// epic: up off the couch at night and in through the glowing phone, into the feed: the posts
// to climb, trending tags drifting off the hamster flag, petitions marching, newsletters from
// the artisanal mushroom rights mailing list flapping, the sideways mushrooms (the outliers),
// and at the end the turtles, slow to rise. The bowl of cereal, a like, the papaya, the pomelo
// and the mushroom pin, and the POST button sends the vague graphic in bold sans serif: people
// clap with the care emoji. Tomorrow: turtles.
//
// Layout (12 rows): the living room (x 0..13) and then the feed (x 14..), its floor on row 10;
// the posts are ledges.
import { Pixels } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { NIGHT } from './blanket';
import { baseboard, houseMonsters, wallpaper } from './house';
import { DBLTAP_MON } from './ids';

/** The last two sets' mugs mend less (common/blocks.ts loot()). */
const LATE = { mugHp: 10 };

/** The bowl of cereal, a like, the papaya, the pomelo, the mushroom pin. */
export const CAUSES = 5;

/** A heart (a like) centered at (x, y), radius about r. */
function heart(p: Pixels, x: number, y: number, r: number, col: number): void {
  p.disc(x - r * 0.5, y - r * 0.2, r * 0.6, col).disc(x + r * 0.5, y - r * 0.2, r * 0.6, col);
  for (let k = 0; k <= r; k++) p.rect(Math.round(x - r + k), Math.round(y + k * 0.9 - r * 0.2), Math.max(1, Math.round((r - k) * 2)), 1, col);
}

/** The feed: deep blue glow, a faint grid of light. */
function feedBack(pal: Pal): Pixels {
  const p = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (x === 0 || y === 0) && (x + y) % 2 === 0 ? pal.c('glow', 1) : pal.c('glow', 0));
  p.set(10, 10, pal.c('glow', 1));
  return p;
}

export function dbltapBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => wallpaper(pal, seed);
  // the feed and its floor (a glowing bar), the posts (ledges)
  book.add('feed', feedBack(pal), AIR);
  const bar = feedBack(pal);
  bar.rect(0, 0, 20, 20, c('glow', 1)).rect(0, 0, 20, 2, c('glow', 3)).rect(0, 2, 20, 1, c('glow', 2));
  for (let x = 2; x < 20; x += 5) bar.rect(x, 8, 3, 3, c('glow', 0));
  book.add('feedFloor', bar, { solid: SOLID });
  loot(book, pal, 'feed', LATE);
  const post = (kind: 'text' | 'heart') => {
    const p = feedBack(pal);
    p.rect(0, 0, 20, 9, c('white', 2)).rect(0, 0, 20, 1, c('white', 1)).rect(0, 8, 20, 1, c('glow', 0));
    if (kind === 'text')
      for (const [y, w] of [
        [2, 16],
        [4, 12],
        [6, 14],
      ])
        p.rect(2, y, w, 1, c('grey', 1));
    else {
      p.disc(4, 4, 2.4, c('glow', 2)).rect(8, 2, 9, 1, c('grey', 1)).rect(8, 5, 6, 1, c('grey', 1));
      heart(p, 16, 5, 2, c('red', 2));
    }
    return p;
  };
  book.add('post', post('text'), { solid: LEDGE, grav: GRAV.down });
  book.add('postHeart', post('heart'), { solid: LEDGE, grav: GRAV.down });
  // PAGE 6 of the forums
  const page = feedBack(pal);
  page.rect(1, 5, 18, 10, c('glow', 3)).frame(1, 5, 18, 10, c('white', 2));
  micro(page, 3, 7, 'PG 6', c('navy', 0));
  book.add('page6', page, AIR);
  // the profile picture everyone changed: a flag with a hamster on it (trending tags drift off it)
  const flag = feedBack(pal);
  flag.disc(10, 10, 8.5, c('white', 2)).disc(10, 10, 7.5, c('teal', 2));
  flag.rect(6, 4, 1, 13, c('metal', 1)).rect(7, 4, 8, 6, c('yellow', 2));
  blob(flag, 11, 7, 2.6, 2, R('fur'), 1, 3);
  flag.set(12, 6, c('ink', 0)).set(13, 7, c('pink', 2));
  book.add('hamster', flag, { ...AIR, birthMon: DBLTAP_MON.trend, birthTime: 130 });
  // the living room at night: the couch (stand on its seat), the giant glowing phone he falls into
  {
    const pic = new Pixels(40, 40, 255);
    blob(pic, 20, 14, 17, 11, R('couch'), 0, 3);
    pic.rect(4, 20, 32, 13, c('couch', 2)).rect(4, 20, 32, 2, c('couch', 3)).rect(20, 22, 1, 10, c('couch', 1));
    blob(pic, 5, 22, 5, 9, R('couch'), 1, 3);
    blob(pic, 35, 22, 5, 9, R('couch'), 1, 3);
    for (const x of [8, 30]) pic.rect(x, 33, 3, 7, c('wood', 1));
    // a throw blanket over the back
    blob(pic, 26, 12, 6, 5, R('quilt'), 1, 3);
    addPicture(
      book,
      'couch',
      pic,
      (col, row) => (row ? wall(81 + col) : wall(83 + col)),
      (_col, row) => (row ? { solid: SOLID } : AIR),
    );
  }
  {
    // the phone: a slab of glow, the feed scrolling on it, the edges of the screen
    const pic = new Pixels(40, 40, 255);
    pic.rect(2, 0, 36, 40, c('ink', 0)).rect(4, 4, 32, 32, c('glow', 2));
    for (let y = 7; y < 34; y += 9)
      pic
        .rect(7, y, 26, 6, c('white', 2))
        .rect(9, y + 2, 14, 1, c('grey', 1))
        .rect(9, y + 4, 10, 1, c('grey', 1));
    heart(pic, 29, 10, 2, c('red', 2));
    heart(pic, 29, 28, 2, c('red', 2));
    pic.rect(16, 1, 8, 1, c('grey', 1)).disc(20, 38, 1.2, c('grey', 1));
    addPicture(
      book,
      'phone',
      pic,
      (col, row) => (col ? feedBack(pal) : row ? baseboard(pal, 86) : wallpaper(pal, 87)),
      () => AIR,
    );
  }
  // the vague graphic: ENOUGH IS ENOUGH, in bold sans serif
  {
    const pic = new Pixels(40, 20, 255);
    pic.rect(1, 1, 38, 18, c('red', 2)).frame(1, 1, 38, 18, c('white', 2));
    micro(pic, 4, 3, 'ENOUGH', c('white', 2), 1);
    micro(pic, 4, 9, 'IS', c('white', 2));
    micro(pic, 14, 9, 'ENOUGH', c('yellow', 2));
    pic.rect(4, 15, 30, 1, c('white', 1));
    addPicture(book, 'graphic', pic, feedBack(pal), () => AIR);
  }
  // POST: it takes his five causes, and posts
  const button = (sent: boolean) => {
    const p = feedBack(pal);
    p.rect(1, 4, 18, 14, c(sent ? 'green' : 'glow', sent ? 2 : 3))
      .frame(1, 4, 18, 14, c('white', 2))
      .rect(2, 17, 17, 1, c('glow', 0));
    if (sent) {
      // people clapped with the care emoji
      blob(p, 10, 11, 4.5, 4.5, R('yellow'), 1, 2);
      p.set(8, 10, c('ink', 0)).set(12, 10, c('ink', 0)).rect(8, 13, 5, 1, c('ink', 0));
      heart(p, 10, 15, 2, c('red', 2));
    } else micro(p, 3, 8, 'POST', c('navy', 0));
    return p;
  };
  book.add('posted', button(true), { grav: GRAV.none });
  gate(book, 'postButton', button(false), 'posted', CAUSES);
  // the causes
  plotThing(book, 'wallB', 'like1', (p) => {
    // the bowl of cereal he cried into
    p.rect(3, 12, 14, 2, c('white', 2));
    for (let k = 0; k < 5; k++) p.rect(4 + k, 14 + k, 12 - k * 2, 1, c('white', 1));
    for (const [x, y, k] of [
      [5, 11, 'gold'],
      [8, 10, 'red'],
      [11, 11, 'gold'],
      [14, 10, 'teal'],
    ] as const)
      p.disc(x, y, 1.3, c(k, 2));
    p.set(6, 6, c('ice', 2)).set(6, 8, c('ice', 1)).set(13, 5, c('ice', 2)).line(16, 4, 17, 13, c('metal', 2));
  });
  plotThing(book, 'feed', 'like2', (p) => {
    heart(p, 10, 9, 6, c('red', 2));
    heart(p, 9, 8, 3, c('red', 3));
    p.set(7, 6, c('white', 2));
  });
  plotThing(book, 'feed', 'like3', (p) => {
    // a papaya, halved: orange, its seeds
    blob(p, 10, 11, 6, 7.5, R('crust'), 1, 2);
    blob(p, 10, 11, 4.5, 6, R('red'), 2, 3);
    for (const [x, y] of [
      [9, 9],
      [11, 10],
      [9, 12],
      [11, 13],
      [10, 11],
    ])
      p.set(x, y, c('ink', 0));
  });
  plotThing(book, 'feed', 'like4', (p) => {
    // a pomelo: big, pale green-yellow, a leaf
    blob(p, 10, 12, 7, 6.5, R('yellow'), 0, 2);
    p.line(10, 5, 11, 3, c('green', 1)).line(11, 4, 15, 3, c('green', 2)).line(12, 5, 15, 4, c('green', 2));
  });
  plotThing(book, 'feed', 'like5', (p) => {
    // the mushroom rights pin
    p.disc(10, 10, 8, c('gold', 2)).disc(10, 10, 7, c('white', 2));
    blob(p, 10, 9, 5, 3, R('red'), 1, 3);
    p.rect(8, 10, 4, 5, c('white', 1)).set(8, 8, c('white', 2)).set(12, 7, c('white', 2));
  });
}

export function dbltapSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // a trending tag: a hash sign in a bubble, drifting
  const trend = (f: number) => {
    const p = P();
    p.disc(10, 10 + f, 8, c('glow', 3)).disc(10, 10 + f, 7, c('white', 2));
    for (const d of [-2, 2]) p.line(10 + d, 5 + f, 9 + d, 15 + f, c('glow', 0)).line(5, 8 + d + 2 + f, 15, 8 + d + 2 + f, c('glow', 0));
    return outline(p, ink);
  };
  book.add('trend0', trend(0), hurts(-3));
  book.add('trend1', trend(1), hurts(-3));
  // a petition on its clipboard, marching
  const petition = (f: number) => {
    const p = P();
    p.rect(4, 2, 12, 15, c('wood', 3)).rect(5, 4, 10, 12, c('white', 2)).rect(8, 1, 4, 3, c('metal', 2));
    for (let y = 9; y < 15; y += 2) p.rect(6, y, 8, 1, c('grey', 1));
    face(p, pal, 10, 6, { angry: true });
    p.rect(5 + f * 2, 17, 2, 3, c('ink', 1)).rect(13 - f * 2, 17, 2, 3, c('ink', 1));
    return outline(p, ink);
  };
  book.add('petition0', petition(0), hurts(-5));
  book.add('petition1', petition(1), hurts(-5));
  // a newsletter from the artisanal mushroom rights mailing list, flapping
  const mail = (f: number) => {
    const p = P();
    p.rect(3, 7, 14, 10, c('white', 2)).line(3, 7, 10, 12, c('grey', 1)).line(16, 7, 10, 12, c('grey', 1));
    if (f) p.line(3, 7, 0, 3, c('white', 1)).line(16, 7, 19, 3, c('white', 1));
    else p.line(3, 8, 0, 11, c('white', 1)).line(16, 8, 19, 11, c('white', 1));
    blob(p, 10, 14, 2.4, 1.5, pal.r('red'), 1, 3);
    return outline(p, ink);
  };
  book.add('mail0', mail(0), hurts(-4));
  book.add('mail1', mail(1), hurts(-4));
  // a mushroom that grows sideways: an outlier, shuffling
  const shroom = (f: number) => {
    const p = P();
    p.rect(4, 11 - f, 8, 4, c('white', 1)).rect(4, 11 - f, 8, 1, c('white', 2));
    blob(p, 14, 12 - f, 4, 6.5, pal.r('purple'), 0, 2);
    p.set(14, 9 - f, c('white', 2)).set(15, 14 - f, c('white', 2));
    face(p, pal, 7, 12 - f, { grin: true });
    p.rect(3, 15, 2, 4, c('white', 0)).rect(9, 15, 2, 4, c('white', 0));
    return outline(p, ink);
  };
  book.add('shroom0', shroom(0), hurts(-5));
  book.add('shroom1', shroom(1), hurts(-5));
  // a turtle: slow to rise, but its time has come (hop over it)
  const turtle = (f: number) => {
    const p = P();
    blob(p, 9, 13, 7, 5, pal.r('green'), 0, 3);
    for (const [x, y] of [
      [6, 11],
      [10, 10],
      [12, 13],
      [7, 14],
    ])
      p.set(x, y, c('green', 0));
    blob(p, 17, 13 - f, 2.6, 2.2, pal.r('green'), 2, 3);
    p.set(18, 12 - f, ink)
      .rect(3 + f, 17, 2, 2, c('green', 2))
      .rect(13 - f, 17, 2, 2, c('green', 2));
    return outline(p, ink);
  };
  book.add('turtle0', turtle(0), hurts(0));
  book.add('turtle1', turtle(1), hurts(0));
}

function dbltapMonsters(set: Monster[], mb: SpriteBook): void {
  houseMonsters(set, mb);
  // trending tags drift down off the hamster flag to the floor and away left
  set[DBLTAP_MON.trend] = mon(anim(mb, 'trend0', 'trend1', 6), { power: POWER.foe, thru: 1, end: -1, newmon: DBLTAP_MON.fluff }, [
    corner(0, 0, 1),
    corner(-1, 3, 1),
    corner(-2, 6, 1),
    corner(-8, 6, 1, 4),
  ]);
  set[DBLTAP_MON.petition] = mon(anim(mb, 'petition0', 'petition1', 5), { power: POWER.foe, thru: 1, newmon: DBLTAP_MON.fluff }, pace(3, 1));
  set[DBLTAP_MON.mail] = mon(anim(mb, 'mail0', 'mail1', 3), { power: POWER.foe, thru: 1, newmon: DBLTAP_MON.fluff }, pace(3, 2));
  set[DBLTAP_MON.shroom] = mon(anim(mb, 'shroom0', 'shroom1', 6), { power: POWER.foe, thru: 1, newmon: DBLTAP_MON.fluff }, pace(2, 1));
  set[DBLTAP_MON.turtle] = mon(anim(mb, 'turtle0', 'turtle1', 16), { power: POWER.tough, thru: 1 }, pace(1, 1));
}

export const dbltap: Monologue = {
  file: 'dbltap',
  title: 'Double Tap for Justice',
  desc: 'Double Tap',
  light: NIGHT,
  filler: 'slab',
  legend: {
    '^': 'ceil',
    '*': 'ceilLamp',
    '.': 'wall',
    _: 'wallB',
    '=': 'floor',
    '#': 'slab',
    f: 'feed',
    F: 'feedFloor',
    p: 'post',
    q: 'postHeart',
    g: 'page6',
    h: 'hamster',
    D: 'postButton',
    $: 'coin@wallB',
    '%': 'coin@feed',
    b: 'bill@feed',
    m: 'mug@feed',
    '!': 'spot@wallB',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the feed past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 3;
    const W = 64 + OFF;
    const IN = 12;
    // the living room at night: the couch, the cereal, the phone
    m.row(0, 0, IN - 1, '^').set(4, 0, '*');
    m.fill(0, 1, IN, 8, '.')
      .row(9, 0, IN - 1, '_')
      .row(10, 0, IN - 1, '=')
      .row(11, 0, IN - 1, '#');
    m.fill(IN, 0, W - IN, 10, 'f').fill(IN, 10, W - IN, 2, 'F');
    m.set(2, 9, '!');
    placePicture(m, 'couch', 4, 8, 2, 2);
    placePicture(m, 'win', 4, 3, 2, 2);
    m.set(3, 9, '$').set(7, 9, 'like1');
    m.mon(MON.teddy, 9, 9);
    placePicture(m, 'phone', 11, 8, 2, 2);
    // the feed: the posts up to page six, the hamster flag (trending), the petitions
    m.row(7, 16, 18, 'p').set(17, 6, '%');
    m.row(4, 20, 22, 'q').set(21, 3, 'like2').set(22, 1, 'g');
    m.mon(DBLTAP_MON.petition, 19, 9);
    m.set(25, 9, 'b');
    m.set(28, 3, 'h');
    m.mon(DBLTAP_MON.petition, 29, 9);
    m.set(32, 9, 'like3');
    // the mailing list: newsletters flapping over the posts; the outliers on them
    m.row(7, 35, 38, 'p').set(36, 6, 'like4').set(38, 6, '%');
    m.mon(DBLTAP_MON.shroom, 37, 6);
    m.mon(DBLTAP_MON.mail, 34, 9);
    m.row(5, 41, 43, 'q').set(43, 4, 'm');
    m.mon(MON.leo, 45, 9);
    m.set(47, 9, 'like5');
    m.mon(DBLTAP_MON.shroom, 50, 9);
    m.set(52, 9, '%');
    // the vague graphic over the POST button; the turtles, slow to rise
    m.mon(DBLTAP_MON.turtle, 54, 9);
    placePicture(m, 'graphic', 57, 5, 2, 1);
    m.set(58, 9, 'D');
    m.link(58 + OFF, 9, 'next');
    m.mon(DBLTAP_MON.turtle, 60, 9);
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: dbltapMonsters,
  song: 'triumph',
  clips: { open: 'like_o', line: 'like_l', punch: 'like_p', word: 'like_w' },
  view: [8, 3],
  card: ["I don't know what it is,", 'but I support it.'],
};
