// "I Held in a Fart and Killed a Bird": it began at precisely 6:42 p.m. The banquet had just
// started; the salad had wilted; the speeches had not. Then, a tremble in the lower caverns: a
// gaseous uprising, and he its last gatekeeper, its reluctant hero. The epic (kept cartoonish):
// the head table under its chandeliers, the woman beside him asking "Are you cold?", the man
// behind him coughing in sync (a duet of denial), the speeches droning BLAH off the podium, and
// the uprising itself in three stages, a rumble from the depths, an angry balloon desperate for
// release, a stomach noise like a disappointed goose, each one held in with a declamation. He
// tries to distract himself: imagined math, thought about war, remembered his ex (the three
// things of the plot). And at the tall window at the end, a bird on the sill gives one final
// chirp and keels over (stunned, feathers everywhere, stars round its head). They blame nature.
// Fly high, little bird.
//
// Layout (13 rows, the dining room of the restaurant: the wainscot on row 10): the tables' tops
// are ledges on row 9 (the guests sit behind them), the chandeliers ledges on row 6.
import { Pixels } from '../../../../kit/pixels';
import { blob, shadeAt } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, gate, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace, still } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { DUSK, clear, cut, over } from './art';
import { addBubble, wallpaper } from './dining';
import { BANQUET_MON as BM } from './ids';

/** The distractions: imagined math, thoughts of war, the memory of his ex. */
export const DISTRACTIONS = 3;

export function banquetBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const ink = c('ink', 0);
  const wall = () => wallpaper(pal);
  const wainscot = book.pics.get('wainscot')!;
  // the guests behind the tables: the woman beside him (Are you cold?), the man with the eyebrow,
  // the man who coughs in sync
  const guest = (hair: string, top: string, o: { brow?: boolean; lean?: boolean; cough?: boolean; long?: boolean }) =>
    over(wall(), pal, (p) => {
      const hx = o.lean ? 12 : 10;
      p.rect(4, 13, 13, 7, c(top, 2)).rect(4, 13, 13, 1, c(top, 3)).rect(9, 13, 3, 3, c('white', 2));
      blob(p, hx, 8, 4, 4.4, R('skin'), 1, 4);
      p.rect(hx - 4, 3, 9, 3, c(hair, 1))
        .set(hx - 4, 6, c(hair, 1))
        .set(hx + 4, 6, c(hair, 1));
      if (o.long) p.rect(hx - 5, 4, 2, 10, c(hair, 1)).rect(hx + 4, 4, 2, 10, c(hair, 1));
      p.set(hx - 2, 8, ink).set(hx + 2, 8, ink);
      if (o.brow) p.line(hx + 1, 5, hx + 3, 4, c(hair, 0)).line(hx - 3, 6, hx - 1, 6, c(hair, 0));
      if (o.cough) p.rect(hx - 1, 10, 3, 2, ink).rect(hx - 6, 9, 3, 3, c('skin', 2));
      else p.rect(hx - 1, 11, 3, 1, ink);
      if (o.lean) p.set(hx - 5, 7, c('gold', 3));
    });
  book.add('guestLady', guest('yellow', 'teal', { lean: true, long: true }), { ...AIR, birthMon: BM.cold, birthTime: 170 });
  book.add('guestBrow', guest('grey', 'navy', { brow: true }), AIR);
  book.add('guestCough', guest('hair', 'purple', { cough: true }), { ...AIR, birthMon: BM.cough, birthTime: 120 });
  // the dinner: a wilted salad, the overcooked chicken cordon bleu
  const dinner = over(wall(), pal, (p) => {
    p.rect(1, 16, 9, 2, c('china', 2)).rect(2, 18, 7, 1, c('china', 0));
    blob(p, 5, 14, 3.4, 2, R('green'), 0, 1);
    p.set(3, 13, c('green', 0)).set(7, 15, c('yellow', 1));
    p.rect(10, 16, 9, 2, c('china', 2)).rect(11, 18, 7, 1, c('china', 0));
    blob(p, 14.5, 14, 3.4, 2.2, R('coffee'), 1, 3);
    p.set(14, 13, c('yellow', 2)).set(15, 14, c('red', 2));
  });
  book.add('dinner', dinner, AIR);
  // the podium and the speaker whose speech has not wilted (BLAH)
  const podium = clear(20, 40);
  blob(podium, 10, 8, 4, 4.4, R('skin'), 1, 4);
  podium.rect(6, 3, 9, 2, c('grey', 2)).set(8, 8, ink).set(12, 8, ink).rect(9, 11, 3, 1, ink);
  podium.rect(4, 13, 13, 7, c('ink', 1)).rect(9, 13, 3, 4, c('white', 2)).rect(10, 14, 1, 4, c('red', 2));
  podium.line(15, 6, 13, 10, c('metal', 0)).rect(13, 9, 2, 2, c('metal', 1));
  podium.rect(2, 18, 16, 22, c('wood', 2)).rect(1, 17, 18, 3, c('wood', 3)).rect(4, 22, 12, 14, c('wood', 1));
  micro(podium, 5, 25, 'GALA', c('gold', 2));
  outline(podium, ink);
  cut(
    book,
    'podium',
    podium,
    (_col, row) => (row === 1 ? wainscot : wall()),
    (_col, row) => (row === 0 ? { ...AIR, birthMon: BM.blah, birthTime: 100 } : AIR),
  );
  // a chandelier (it holds a man up: a ledge)
  const chandelier = over(wall(), pal, (p) => {
    p.rect(9, 0, 2, 5, c('gold', 0));
    p.rect(3, 5, 14, 2, c('gold', 2)).rect(5, 7, 10, 2, c('gold', 1));
    for (const x of [3, 7, 12, 16]) p.rect(x, 1, 1, 4, c('white', 2)).set(x, 0, c('spot', 2));
    for (const x of [4, 8, 11, 15]) p.line(x, 9, x, 13, c('white', 1)).set(x, 14, c('lcd', 2));
  });
  book.add('chandelier', chandelier, { solid: LEDGE, grav: GRAV.down });
  // the clock: 6:42 p.m. precisely
  const clock = over(wall(), pal, (p) => {
    p.disc(10, 10, 8, c('gold', 1)).disc(10, 10, 7, c('white', 2));
    p.line(10, 10, 10, 15, ink).line(10, 10, 6, 5, ink).set(10, 10, c('red', 2));
  });
  micro(clock, 3, 15, '642', c('red', 1));
  book.add('clock642', clock, AIR);
  // the banner over the head table
  const banner = clear(40, 20);
  banner.rect(1, 3, 38, 12, c('navy', 1)).rect(2, 4, 36, 10, c('navy', 2));
  for (let x = 1; x < 39; x += 4) banner.set(x, 15, c('navy', 1)).set(x + 1, 16, c('navy', 1));
  micro(banner, 6, 6, 'BANQUET', c('gold', 3));
  banner.line(0, 0, 4, 3, c('gold', 1)).line(39, 0, 35, 3, c('gold', 1));
  outline(banner, ink);
  cut(book, 'banner', banner, wall(), () => AIR);
  // the tall window at the end: the dusk outside, the sill and the bird (the gate)
  const win = clear(40, 60);
  win.rect(0, 0, 40, 46, c('wood', 1));
  for (let y = 3; y < 44; y++) for (let x = 3; x < 37; x++) win.set(x, y, shadeAt(R('sky'), 0, 5, (y - 3) / 40, x, y));
  win.disc(26, 38, 6, c('spot', 1)).rect(3, 40, 34, 4, c('wallpaper', 0));
  for (const [x, y] of [
    [8, 8],
    [30, 6],
    [15, 14],
  ])
    win.set(x, y, c('white', 2));
  win.rect(19, 3, 2, 41, c('wood', 1)).rect(3, 22, 34, 2, c('wood', 1));
  win.rect(0, 46, 40, 4, c('white', 2)).rect(0, 50, 40, 1, c('white', 0));
  outline(win, ink);
  cut(
    book,
    'window',
    win,
    (_col, row) => (row === 2 ? wainscot : wall()),
    () => AIR,
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  );
  const sill = wainscot.crop(0, 0, 20, 20).blit(win.crop(0, 40, 20, 20), 0, 0, T);
  const bird = (down: boolean) =>
    over(sill, pal, (p) => {
      if (!down) {
        // a little bluebird on the sill, singing
        blob(p, 10, 3, 4, 3, R('navy'), 1, 2);
        p.rect(8, 4, 4, 2, c('orange', 2)).disc(13, 1, 2, c('navy', 2)).set(16, 1, c('orange', 2)).set(14, 0, ink);
        p.rect(5, 2, 3, 1, c('navy', 1)).set(9, 6, c('orange', 1)).set(11, 6, c('orange', 1));
        p.set(17, -1, c('white', 2));
      } else {
        // keeled over: on its back, feet up, stars round its head, feathers everywhere
        blob(p, 10, 4, 4, 2.4, R('navy'), 1, 2);
        p.rect(8, 3, 4, 1, c('orange', 2)).set(9, 0, c('orange', 1)).set(11, 0, c('orange', 1)).set(9, 1, c('orange', 1)).set(11, 1, c('orange', 1));
        p.disc(14, 4, 2, c('navy', 2));
        p.set(13, 3, ink).set(15, 3, ink).set(14, 4, ink);
        for (const [x, y] of [
          [16, 0],
          [18, 2],
          [12, -1],
        ])
          p.set(x, y, c('gold', 3));
        p.line(2, 1, 4, 0, c('navy', 2)).line(17, 5, 19, 4, c('navy', 2)).line(5, 6, 6, 4, c('navy', 1));
      }
    });
  const singing = bird(false);
  book.add('sillBird', bird(true), { grav: GRAV.none });
  gate(book, 'birdSill', singing, 'sillBird', DISTRACTIONS);
  // the distractions (the plot)
  const thing = (draw: (p: Pixels) => void) => (p: Pixels) => {
    const t = clear();
    draw(t);
    p.blit(outline(t, ink), 0, 0, T);
  };
  plotThing(
    book,
    'wallpaper',
    'math',
    thing((p) => {
      p.rect(2, 5, 16, 12, c('ink', 1)).rect(2, 5, 16, 1, c('wood', 2)).rect(2, 16, 16, 1, c('wood', 2));
      micro(p, 4, 7, '2+2', c('white', 2));
      micro(p, 7, 12, '=5', c('yellow', 2));
    }),
  );
  plotThing(
    book,
    'wallpaper',
    'war',
    thing((p) => {
      // a toy soldier, stiff as he is
      p.rect(8, 15, 2, 4, c('navy', 1)).rect(11, 15, 2, 4, c('navy', 1)).rect(7, 19, 7, 1, c('wood', 2));
      p.rect(7, 8, 7, 7, c('red', 2)).rect(9, 9, 3, 1, c('gold', 3)).rect(9, 11, 3, 1, c('gold', 3));
      p.rect(8, 4, 5, 4, c('skin', 3)).rect(8, 0, 5, 4, ink).set(9, 5, ink).set(11, 5, ink);
      p.line(15, 4, 15, 14, c('metal', 1)).rect(14, 8, 1, 2, c('red', 2));
    }),
  );
  plotThing(
    book,
    'wallpaper',
    'ex',
    thing((p) => {
      // a photo of his ex, torn down the middle
      p.rect(3, 4, 14, 13, c('white', 2)).rect(5, 6, 10, 8, c('teal', 1));
      blob(p, 8, 10, 2, 2.4, R('skin'), 1, 3);
      p.rect(6, 7, 4, 2, c('hair', 1));
      p.line(11, 4, 10, 8, c('wallpaper', 1)).line(10, 8, 12, 12, c('wallpaper', 1)).line(12, 12, 11, 16, c('wallpaper', 1));
      p.disc(13, 9, 1.6, c('red', 2)).disc(15, 9, 1.6, c('red', 2)).rect(13, 10, 3, 2, c('red', 2)).set(14, 12, c('red', 2));
    }),
  );
}

export function banquetSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  addBubble(book, pal, 'blah', 'BLAH', hurts(-5), { fill: 'paper', tail: 'right' });
  addBubble(book, pal, 'cough', 'COUGH', hurts(-4), { tail: 'right' });
  addBubble(book, pal, 'cold', 'COLD?', hurts(-4), { fill: 'cream', tail: 'right' });
  // the uprising within: a rumble from the depths (quaking), an angry balloon, a disappointed goose
  const rumble = (f: number) => {
    const p = clear();
    blob(p, 10 + (f ? 1 : -1), 12, 7, 6, pal.r('gas'), 0, 2);
    face(p, pal, 10 + (f ? 1 : -1), 11, { angry: true });
    for (const [x, y] of [
      [1, 6],
      [18, 8],
      [2, 16],
      [18, 15],
    ])
      p.line(x, y, x + (x < 10 ? 1 : -1), y + 2, c('gas', 2));
    return outline(p, ink);
  };
  const balloon = (f: number) => {
    const p = clear();
    blob(p, 10, 8 - f, 7, 7, pal.r('gas'), 0, 2);
    p.set(10, 15 - f, c('gas', 0))
      .set(9, 16 - f, c('gas', 0))
      .set(11, 16 - f, c('gas', 0))
      .line(10, 17 - f, 9 + f * 2, 19, c('white', 1));
    face(p, pal, 10, 7 - f, { angry: true, grin: true });
    p.set(4, 3, c('white', 2)).set(5, 2, c('white', 2));
    return outline(p, ink);
  };
  const goose = (f: number) => {
    const p = clear();
    blob(p, 10, 14, 8, 5, pal.r('gas'), 0, 2);
    p.rect(10, 4 + f, 3, 9, c('white', 2));
    blob(p, 11, 4 + f, 3, 2.6, pal.r('white'), 1, 2);
    p.rect(14, 4 + f, 4, 2, c('orange', 2))
      .set(11, 3 + f, ink)
      .set(10, 2 + f, ink)
      .set(12, 2 + f, ink);
    micro(p, 0, 15, f ? 'HNK' : '', ink);
    return outline(p, ink);
  };
  for (const [name, draw] of [
    ['rumble', rumble],
    ['gasBalloon', balloon],
    ['gasGoose', goose],
  ] as const) {
    book.add(`${name}0`, draw(0), hurts(-6));
    book.add(`${name}1`, draw(1), hurts(-6));
  }
}

export function banquetMonsters(set: Monster[], mb: SpriteBook): void {
  const foe = { power: POWER.foe, thru: 1, newmon: BM.poof };
  set[BM.blah] = mon(anim(mb, 'blah0', 'blah1', 6), { ...foe, thru: 0, end: -1 }, [corner(0, 0, 2), corner(0, 1, 2, 4), corner(-5, 0, 2, 4)]);
  set[BM.cough] = mon(anim(mb, 'cough0', 'cough1', 4), { ...foe, thru: 0, end: -1 }, [corner(0, 0, 2), corner(-3, 0, 2, 4)]);
  set[BM.cold] = mon(anim(mb, 'cold0', 'cold1', 8), { ...foe, thru: 0, end: -1 }, [corner(0, 0, 1), corner(-2, 0, 1, 4)]);
  set[BM.rumble] = mon(anim(mb, 'rumble0', 'rumble1', 2), { ...foe, newmon: BM.balloon }, pace(2, 1));
  set[BM.balloon] = mon(anim(mb, 'gasBalloon0', 'gasBalloon1', 8), { ...foe, newmon: BM.goose }, [corner(0, 0, 1), corner(-1, 0, 1, 4), corner(0, 0, 1, 0)]);
  set[BM.goose] = mon(anim(mb, 'gasGoose0', 'gasGoose1', 10), foe, still);
  set[BM.poof] = mon(anim(mb, 'poof0', 'poof1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const banquet: Monologue = {
  file: 'banquet',
  title: 'I Held in a Fart and Killed a Bird',
  desc: 'The Banquet, 6:42',
  light: DUSK,
  filler: 'cellar',
  legend: {
    '^': 'crown',
    '.': 'wallpaper',
    _: 'wainscot',
    '=': 'parquet',
    '#': 'cellar',
    L: 'tableL',
    M: 'tableM',
    R: 'tableR',
    l: 'tableLegs',
    h: 'chair',
    s: 'sconce',
    p: 'pendant',
    a: 'stillLife',
    y: 'guestLady',
    e: 'guestBrow',
    k: 'guestCough',
    d: 'dinner',
    C: 'chandelier',
    o: 'clock642',
    G: 'birdSill',
    $: 'coin@wainscot',
    '%': 'coin@wallpaper',
    b: 'bill@wallpaper',
    m: 'mug@wainscot',
    '!': 'spot@wainscot',
    '1': 'math',
    '2': 'war',
    '3': 'ex',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the banquet hall past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 4;
    const W = 54 + OFF;
    m.row(0, 0, W - 1, '^')
      .fill(0, 1, W, 9, '.')
      .row(10, 0, W - 1, '_')
      .row(11, 0, W - 1, '=')
      .row(12, 0, W - 1, '#');
    for (const x of [4, 16, 22, 28, 44, 51]) m.set(x, 1, 'p');
    m.set(36, 3, 'banner.0.0').set(37, 3, 'banner.1.0').set(47, 5, 's');
    const table = (x0: number, x1: number) => {
      m.set(x0, 9, 'L').set(x1, 9, 'R');
      for (let x = x0 + 1; x < x1; x++) m.set(x, 9, 'M');
      m.row(10, x0, x1, 'l');
      m.set(x0 - 1, 10, 'h').set(x1 + 1, 10, 'h');
    };
    // 6:42 p.m.: the clock, the banner, the head table and its chandeliers
    m.set(2, 10, '!').set(3, 4, 'o').set(10, 3, 'banner.0.0').set(11, 3, 'banner.1.0');
    table(5, 16);
    m.set(6, 8, 'd').set(7, 8, 'y').set(9, 8, '1').set(10, 8, 'd').set(11, 8, 'e').set(13, 8, '%').set(14, 8, 'k').set(16, 8, 'd');
    m.set(8, 6, 'C').set(13, 6, 'C').set(8, 5, '%').set(13, 5, '3');
    // the podium (the speeches), a coffee, the uprising within
    m.set(20, 9, 'podium.0.0').set(20, 10, 'podium.0.1');
    m.set(18, 10, '$').set(22, 10, 'm').set(29, 10, '$');
    m.mon(BM.rumble, 26, 10);
    m.set(18, 5, 's').set(25, 5, 'a').set(31, 5, 's');
    // the second table: the cougher again, the woman again, thoughts of war; Teddy asleep
    table(33, 41);
    m.set(34, 8, 'y').set(35, 8, 'd').set(36, 8, '%').set(37, 8, '2').set(38, 8, 'k').set(39, 8, 'd').set(41, 8, 'b');
    m.set(37, 6, 'C').set(37, 5, '%');
    m.mon(MON.teddy, 45, 10);
    m.set(43, 10, '$').set(47, 10, '$');
    // the tall window, the sill, the bird
    m.set(49, 8, 'window.0.0').set(50, 8, 'window.1.0').set(49, 9, 'window.0.1').set(50, 9, 'window.1.1');
    m.set(49, 10, 'G').set(50, 10, 'window.1.2');
    m.link(49 + OFF, 10, 'next');
    return { start: [1, 10], size: [W, 13] };
  },
  monsters: banquetMonsters,
  song: 'epic',
  clips: { open: 'bird_o', line: 'bird_l', punch: 'bird_p', word: 'bird_w' },
  view: [4, 4],
  card: ['Are you cold? No,', 'just historically tense.'],
};
