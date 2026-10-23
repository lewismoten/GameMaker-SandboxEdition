// GOAT.BBL: every background block of Bethlehem's night, drawn in code. Index assignments
// are by name (a block's number is the order it was added); the attributes are the game:
// anything a goat can eat is a solid block that turns into floor when you push into it
// (hay and thistles fill your breath for screaming, cabbages and figs your health, and the
// census scroll opens the alley), wool caught on the thorns counts toward your gift, the
// kneeling camels give birth to spit, the pail costs you points to kick, and the empty
// place in the line at the manger only opens for five wool.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import type { Pal } from '../art/pal';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { lewieCameo } from '../../../kit/cameos';
import { MON, SCREAMSEQ, WOOL, WOOL_NEEDED } from '../ids';

export { BlockBook, SOLID };
const LIFE = 1;
/** Ticks between spits from a kneeling camel. */
export const SPIT_EVERY = 46;

export function buildBlocks(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);

  // ---------- ground ----------
  const grass = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('grass'), 2, 1, seed, 0.3);
    const r = rng(seed + 3);
    for (let k = 0; k < 7; k++) {
      const x = Math.floor(r() * 20);
      const y = 2 + Math.floor(r() * 18);
      p.set(x, y, c('grass', 3)).set(x, y - 1, c('grass', 4));
    }
    return p;
  };
  const path = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('dirt'), 2, 1, seed, 0.25);
    const r = rng(seed);
    for (let k = 0; k < 5; k++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('stone', 2));
    return p;
  };
  const sand = (seed: number, ripple = false) => {
    const p = speckle(P(), 0, 0, 20, 20, R('sand'), 2, 1, seed, 0.2);
    if (ripple) for (let y = 3; y < 20; y += 6) for (let x = 0; x < 20; x++) p.set(x, y + Math.round(Math.sin(x / 3) * 1.2), c('sand', 1));
    return p;
  };
  const cobble = (seed: number) => {
    const p = P().rect(0, 0, 20, 20, c('stone', 0));
    const r = rng(seed);
    for (let row = 0; row < 4; row++)
      for (let k = -1; k < 4; k++) {
        const x = k * 6 + (row % 2) * 3 + 1;
        const y = row * 5 + 1;
        blob(p, x + 2, y + 1.5, 2.6, 2, R('stone'), 1, 3 + (r() < 0.3 ? 1 : 0), 1);
      }
    return p;
  };
  const floor = (seed: number) => speckle(P(), 0, 0, 20, 20, R('dirt'), 1, 1, seed, 0.3);
  // Straw on the stable floor: two quiet tones (earth, and strands of one straw color), so
  // the brown and grey animals on it stand out.
  const straw = (seed: number, base = speckle(P(), 0, 0, 20, 20, R('dirt'), 1, 1, seed, 0.06)) => {
    const r = rng(seed + 50);
    for (let k = 0; k < 10; k++) {
      const x = r() * 18 + 1;
      const y = r() * 18 + 1;
      const dx = r() < 0.5 ? 1 : -1;
      base.line(x, y, x + dx * 3, y + (r() < 0.5 ? 1 : 0), c('hay', 1));
    }
    return base;
  };
  book.add('grassA', grass(11));
  book.add('grassB', grass(23));
  const flowers = grass(31);
  for (const [x, y, k] of [
    [4, 5, 'cloth'],
    [13, 12, 'gold'],
    [8, 15, 'cloth'],
  ] as const)
    flowers
      .set(x, y, c(k, 3))
      .set(x - 1, y, c(k, 2))
      .set(x + 1, y, c(k, 2))
      .set(x, y - 1, c(k, 2))
      .set(x, y + 1, c(k, 2));
  book.add('flowers', flowers);
  book.add('path', path(41));
  book.add('sand', sand(43));
  book.add('ripple', sand(47, true));
  book.add('cobble', cobble(53));
  book.add('floor', floor(59));
  book.add('straw', straw(61));

  // ---------- walls and things in the way ----------
  const stoneWall = () => {
    const p = P().rect(0, 0, 20, 20, c('stone', 0));
    const r = rng(71);
    for (const [x, y, w, h] of [
      [0, 0, 9, 6],
      [10, 0, 10, 7],
      [0, 7, 6, 6],
      [7, 8, 7, 5],
      [15, 8, 5, 6],
      [0, 14, 10, 6],
      [11, 15, 9, 5],
    ])
      blob(p, x + w / 2, y + h / 2, w / 2 + 0.3, h / 2 + 0.3, R('stone'), 1, 4, 1 + r() * 0.2);
    return p;
  };
  book.add('wall', stoneWall(), { solid: SOLID });
  const rock = (bg: Pixels) => {
    blob(bg, 10, 16, 9, 3, R('ink'), 0, 1, 0.5);
    return blob(bg, 10, 11, 9, 8, R('stone'), 0, 4, 1.1);
  };
  book.add('rock', rock(grass(73)), { solid: SOLID });
  book.add('rockSand', rock(sand(74)), { solid: SOLID });
  const olive = () => {
    const p = grass(79);
    p.rect(9, 12, 3, 7, c('wood', 1));
    blob(p, 10, 17, 9, 3, R('ink'), 0, 1, 0.4);
    for (const [x, y, rad] of [
      [7, 8, 6],
      [13, 7, 6],
      [10, 4, 5],
    ])
      blob(p, x, y, rad, rad - 1, R('olive'), 0, 3);
    const r = rng(5);
    for (let k = 0; k < 10; k++) p.set(3 + Math.floor(r() * 14), 1 + Math.floor(r() * 12), c('olive', 3));
    return p;
  };
  book.add('olive', olive(), { solid: SOLID });
  const palm = () => {
    const p = sand(83);
    blob(p, 11, 17, 6, 2, R('ink'), 0, 1, 0.3);
    for (let y = 8; y < 19; y++) p.rect(9 + Math.round((y - 8) / 6), y, 3, 1, c('wood', y % 3 === 0 ? 1 : 2));
    for (let a = 0; a < 7; a++) {
      const ang = (a / 7) * Math.PI * 2;
      for (let t = 0; t < 9; t++) p.set(10 + Math.cos(ang) * t, 7 + Math.sin(ang) * t * 0.7 + (t * t) / 20, c('olive', 1 + (t < 5 ? 2 : 1)));
    }
    blob(p, 10, 7, 2, 2, R('wood'), 1, 3);
    return p;
  };
  book.add('palm', palm(), { solid: SOLID });
  // Thorn bushes scratch (a push costs hit points); the wool caught on them is the gift.
  const thorn = (bg: Pixels, tuft: boolean) => {
    blob(bg, 10, 11, 9, 8, R('thorn'), 0, 2, 1);
    const r = rng(tuft ? 89 : 87);
    for (let k = 0; k < 26; k++) {
      const x = 2 + r() * 16;
      const y = 3 + r() * 15;
      bg.line(x, y, x + (r() - 0.5) * 6, y + (r() - 0.5) * 6, c('thorn', r() < 0.5 ? 0 : 2));
    }
    for (let k = 0; k < 6; k++) bg.set(3 + Math.floor(r() * 14), 3 + Math.floor(r() * 14), c('red', 2));
    if (tuft) blob(bg, 12, 8, 4, 3, R('wool'), 0, 3, 1.2);
    return bg;
  };
  book.add('thorn', thorn(grass(91), false), { solid: SOLID, hp: -4 });

  // ---------- town ----------
  const roof = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('brick'), 3, 1, seed, 0.25);
    p.rect(0, 0, 20, 1, c('brick', 4)).rect(0, 19, 20, 1, c('brick', 1));
    const r = rng(seed);
    for (let k = 0; k < 3; k++) {
      const y = 3 + Math.floor(r() * 14);
      p.rect(Math.floor(r() * 12), y, 8, 1, c('brick', 2));
    }
    return p;
  };
  book.add('roof', roof(101), { solid: SOLID });
  const houseFront = (win: boolean) => {
    const p = speckle(P(), 0, 0, 20, 20, R('brick'), 2, 1, win ? 103 : 104, 0.2);
    p.rect(0, 0, 20, 2, c('brick', 4)).rect(0, 2, 20, 1, c('brick', 0));
    if (win) p.rect(6, 6, 8, 7, c('ink', 0)).rect(7, 7, 6, 5, c('glow', 2)).rect(9, 7, 1, 5, c('wood', 1)).rect(6, 13, 8, 1, c('wood', 2));
    return p;
  };
  book.add('house', houseFront(false), { solid: SOLID });
  book.add('window', houseFront(true), { solid: SOLID });
  const door = (sign: string) => {
    const p = houseFront(false);
    p.rect(5, 5, 10, 15, c('wood', 1)).rect(6, 6, 8, 14, c('wood', 2));
    for (let y = 8; y < 20; y += 4) p.rect(6, y, 8, 1, c('wood', 1));
    p.set(12, 13, c('gold', 2));
    if (sign) {
      p.rect(2, 7, 16, 7, c('cloth', 3)).frame(2, 7, 16, 7, c('wood', 0));
      micro(p, 4, 8, sign.slice(0, 3), c('red', 1));
    }
    return p;
  };
  book.add('door', door(''), { solid: SOLID });
  // "No room": the inn's sign reads NO and the next block ROOM.
  const innSign = (word: string) => {
    const p = houseFront(false);
    p.rect(1, 5, 18, 9, c('cloth', 3)).frame(1, 5, 18, 9, c('wood', 0));
    micro(p, 10 - Math.round((word.length * 4 - 1) / 2), 7, word, c('red', 1));
    return p;
  };
  book.add('innNo', innSign('NO'), { solid: SOLID });
  book.add('innRoom', innSign('ROOM'), { solid: SOLID });
  book.add('innDoor', door(''), { solid: SOLID });
  const awning = (k: string) => {
    const p = P();
    for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 20, c(Math.floor(x / 4) % 2 ? k : 'cloth', Math.floor(x / 4) % 2 ? 2 : 3));
    for (let x = 0; x < 20; x++) p.set(x, 18 + ((x >> 1) % 2), c('ink', 1));
    return p;
  };
  book.add('awning', awning('red'), { solid: SOLID });
  book.add('awningB', awning('blue'), { solid: SOLID });
  const crate = (full: string | null) => {
    const p = cobble(105);
    p.rect(2, 3, 16, 15, c('wood', 1)).frame(2, 3, 16, 15, c('wood', 0)).rect(3, 4, 14, 2, c('wood', 3));
    if (full === 'cabbage')
      for (const [x, y] of [
        [6, 10],
        [13, 10],
        [9, 13],
        [10, 8],
      ])
        blob(p, x, y, 3.5, 3.2, R('olive'), 1, 3, 1.1);
    if (full === 'figs')
      for (const [x, y] of [
        [6, 9],
        [10, 11],
        [14, 9],
        [8, 14],
        [13, 14],
        [11, 7],
      ])
        blob(p, x, y, 2.4, 2.4, R('purple'), 0, 3, 1);
    if (!full) p.rect(4, 7, 12, 9, c('wood', 0));
    return p;
  };
  book.add('crate', crate(null), { solid: SOLID });
  book.add('cabbage', crate('cabbage'), { solid: SOLID, hp: 4, score: 10, touch: 'crate' });
  book.add('figs', crate('figs'), { solid: SOLID, hp: 4, score: 10, touch: 'crate' });
  // A washing line across the alley: the tunics are solid until eaten.
  const laundry = (full: boolean) => {
    const p = cobble(107);
    p.rect(0, 4, 20, 1, c('wood', 3));
    if (full) {
      p.rect(2, 5, 7, 11, c('blue', 2)).rect(2, 5, 7, 2, c('blue', 3)).rect(1, 6, 1, 4, c('blue', 2)).rect(9, 6, 1, 4, c('blue', 2));
      p.rect(11, 5, 7, 12, c('cloth', 2)).rect(11, 5, 7, 2, c('cloth', 3)).rect(14, 8, 1, 7, c('red', 2));
      p.set(4, 4, c('wood', 0)).set(15, 4, c('wood', 0));
    }
    return p;
  };
  book.add('laundry', laundry(true), { solid: SOLID, score: 50, hp: 4, touch: 'lineBare' });
  book.add('lineBare', laundry(false));
  const well = () => {
    const p = cobble(109);
    p.disc(10, 10, 9, c('stone', 1)).disc(10, 10, 7.5, c('stone', 3)).disc(10, 10, 5.5, c('water', 0));
    p.disc(8, 8, 1.5, c('water', 2));
    return p;
  };
  book.add('well', well(), { solid: SOLID });
  // The census: Caesar Augustus wants everyone counted. A goat can fix that.
  const census = (scroll: boolean) => {
    const p = cobble(111);
    p.rect(1, 6, 18, 11, c('wood', 2)).rect(1, 6, 18, 2, c('wood', 3)).rect(1, 16, 18, 1, c('wood', 0));
    p.rect(2, 17, 2, 3, c('wood', 1)).rect(16, 17, 2, 3, c('wood', 1));
    if (scroll) {
      p.rect(4, 8, 12, 7, c('cloth', 3)).rect(3, 8, 2, 7, c('wood', 3)).rect(15, 8, 2, 7, c('wood', 3));
      for (let y = 9; y < 14; y += 2) p.rect(6, y, 7, 1, c('ink', 1));
      p.rect(9, 13, 3, 2, c('red', 2));
    } else
      for (const [x, y] of [
        [5, 10],
        [9, 9],
        [12, 12],
        [7, 13],
      ])
        p.set(x, y, c('cloth', 2));
    return p;
  };
  book.add('census', census(true), { solid: SOLID, score: 100, touch: 'censusEaten' });
  book.add('censusEaten', census(false));
  // The census clerk, asleep at his post.
  const clerk = () => {
    const p = cobble(113);
    p.disc(10, 11, 7, c('red', 1)).disc(10, 10, 6, c('red', 2));
    p.disc(10, 6, 4, c('skin', 1)).rect(6, 3, 8, 3, c('cloth', 3));
    micro(p, 13, 0, 'Z', c('cloth', 3));
    p.set(17, 1, c('cloth', 2));
    return p;
  };
  book.add('clerk', clerk(), { solid: SOLID });
  // Sandals left by the well: chewy.
  const sandal = () => {
    const p = cobble(115);
    for (const dx of [0, 7]) {
      blob(p, 6 + dx, 10, 2.5, 5, R('wood'), 1, 3, 1);
      p.rect(4 + dx, 8, 5, 1, c('wood', 0));
    }
    return p;
  };
  book.add('sandal', sandal(), { score: 25, touch: 'cobble' });

  // ---------- the field ----------
  const hayPile = (bg: Pixels, seed: number) => {
    blob(bg, 10, 16, 9, 3, R('ink'), 0, 1, 0.4);
    blob(bg, 10, 11, 9, 8, R('hay'), 0, 4, 1.1);
    const r = rng(seed);
    for (let k = 0; k < 18; k++) {
      const x = 3 + r() * 14;
      const y = 4 + r() * 13;
      bg.line(x, y, x + 2, y + (r() < 0.5 ? 1 : -1), c('hay', r() < 0.5 ? 1 : 4));
    }
    return bg;
  };
  // Hay: health and breath. Pushing into a pile eats it.
  book.add('hay', hayPile(grass(121), 121), { solid: SOLID, hp: 5, effect: SCREAMSEQ, eamt: 3, score: 10, touch: 'grassA' });
  book.add('hayIn', hayPile(straw(123), 123), { solid: SOLID, hp: 5, effect: SCREAMSEQ, eamt: 3, score: 10, touch: 'straw' });
  const thistle = (bg: Pixels) => {
    for (let k = 0; k < 5; k++) bg.line(10, 18, 4 + k * 3, 9 + (k % 2) * 3, c('olive', 1));
    for (const [x, y] of [
      [5, 8],
      [10, 5],
      [15, 9],
    ]) {
      blob(bg, x, y + 2, 2.5, 2, R('olive'), 1, 2);
      bg.disc(x, y, 2.2, c('purple', 2)).set(x, y - 1, c('purple', 3));
    }
    return bg;
  };
  // a thistle is a munch (the +1 is only so it plays the munch, not wool's bleat of joy)
  book.add('thistle', thistle(grass(125)), { solid: SOLID, hp: 1, effect: SCREAMSEQ, eamt: 2, score: 5, touch: 'grassB' });
  // The sheepfold's gate is tied with rope. Goats eat rope.
  const gate = (tied: boolean) => {
    const p = grass(127);
    for (let x = 1; x < 20; x += 6) p.rect(x, 2, 3, 16, c('wood', 2)).rect(x, 2, 1, 16, c('wood', 3));
    p.rect(0, 6, 20, 2, c('wood', 1)).rect(0, 13, 20, 2, c('wood', 1));
    if (tied) p.rect(8, 5, 4, 11, c('hay', 1)).rect(9, 5, 2, 11, c('hay', 3));
    return p;
  };
  book.add('gate', gate(true), { solid: SOLID, score: 25, touch: 'gateOpen' });
  const gateOpen = grass(129);
  gateOpen.rect(0, 1, 3, 18, c('wood', 2)).rect(17, 1, 3, 18, c('wood', 2));
  book.add('gateOpen', gateOpen);
  // Wool caught on a bush, and lying loose: a gift (and the empty place takes five).
  book.add('woolBush', thorn(grass(131), true), { solid: SOLID, effect: WOOL, eamt: 1, score: 20, touch: 'thorn' });
  const loose = (bg: Pixels) => {
    blob(bg, 10, 11, 5, 4, R('wool'), 0, 3, 1.2);
    blob(bg, 7, 9, 3, 2.5, R('wool'), 1, 3, 1.2);
    return bg;
  };
  book.add('woolGrass', loose(grass(133)), { effect: WOOL, eamt: 1, score: 20, touch: 'grassA' });
  book.add('woolStraw', loose(straw(135)), { effect: WOOL, eamt: 1, score: 20, touch: 'straw' });
  book.add('woolSand', loose(sand(137)), { effect: WOOL, eamt: 1, score: 20, touch: 'sand' });
  // A goat bell on a ribbon: an extra life.
  const bell = (bg: Pixels) => {
    bg.line(6, 3, 10, 7, c('red', 2)).line(14, 3, 10, 7, c('red', 2));
    blob(bg, 10, 12, 5, 6, R('gold'), 0, 3, 1.2);
    bg.rect(5, 16, 10, 2, c('gold', 1)).disc(10, 18, 1.4, c('ink', 0));
    return bg;
  };
  book.add('bell', bell(grass(139)), { effect: LIFE, eamt: 1, score: 50, touch: 'grassA' });
  book.add('bellStraw', bell(straw(140)), { effect: LIFE, eamt: 1, score: 50, touch: 'straw' });
  // Starlight on the ground (score), twinkling.
  const sparkle = (bg: () => Pixels, f: number) => {
    const p = bg();
    const s = f ? 4 : 3;
    p.line(10 - s, 10, 10 + s, 10, c('star', 1)).line(10, 10 - s - 1, 10, 10 + s + 1, c('star', 1));
    p.line(10 - s + 2, 10 - s + 2, 10 + s - 2, 10 + s - 2, c('star', f ? 0 : 1)).line(10 - s + 2, 10 + s - 2, 10 + s - 2, 10 - s + 2, c('star', f ? 0 : 1));
    p.set(10, 10, c('star', 2)).set(9, 10, c('star', 2)).set(11, 10, c('star', 2)).set(10, 9, c('star', 2)).set(10, 11, c('star', 2));
    return p;
  };
  book.add(
    'star0',
    sparkle(() => grass(141), 0),
    { score: 50, touch: 'grassB', next: 'star1', ntime: 6 },
  );
  book.add(
    'star1',
    sparkle(() => grass(141), 1),
    { score: 50, touch: 'grassB', next: 'star0', ntime: 4 },
  );
  book.add(
    'starS0',
    sparkle(() => sand(142), 0),
    { score: 50, touch: 'sand', next: 'starS1', ntime: 6 },
  );
  book.add(
    'starS1',
    sparkle(() => sand(142), 1),
    { score: 50, touch: 'sand', next: 'starS0', ntime: 4 },
  );
  book.add(
    'starC0',
    sparkle(() => cobble(143), 0),
    { score: 50, touch: 'cobble', next: 'starC1', ntime: 6 },
  );
  book.add(
    'starC1',
    sparkle(() => cobble(143), 1),
    { score: 50, touch: 'cobble', next: 'starC0', ntime: 4 },
  );
  const fire = (f: number) => {
    const p = grass(145);
    p.disc(10, 12, 7, c('stone', 1)).disc(10, 12, 5, c('ink', 0));
    for (let k = 0; k < 3; k++) blob(p, 8 + k * 2, 10 - (k === 1 ? 2 + f : f), 2.5, 4, R('gold'), 1, 3);
    blob(p, 10, 11, 1.5, 2, R('glow'), 2, 3);
    return p;
  };
  // The shepherds' fire: warm, but it singes a nosy goat.
  book.add('fire0', fire(0), { solid: SOLID, hp: -6, next: 'fire1', ntime: 3 });
  book.add('fire1', fire(1), { solid: SOLID, hp: -6, next: 'fire0', ntime: 3 });

  // ---------- the caravan ----------
  // A tent is two blocks tall, drawn whole and cut in two: the gold band only along its top,
  // and a doorway that runs from under the band down to the ground.
  const tent = (k: string, doorway: boolean) => {
    const p = new Pixels(20, 40);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R(k), 0, 3, 0.35 + ((x + y) % 10) / 22, x, y));
    for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 40, c(k, 0));
    p.rect(0, 0, 20, 2, c('gold', 1));
    if (doorway) p.rect(6, 6, 8, 34, c('ink', 0)).line(6, 6, 1, 39, c(k, 1)).line(13, 6, 18, 39, c(k, 1)).rect(9, 14, 2, 2, c('glow', 2));
    return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
  };
  const tents = {
    purple: [tent('purple', false), tent('purple', true)],
    blue: [tent('blue', false), tent('blue', true)],
    red: [tent('red', false), tent('red', true)],
  };
  book.add('tentP', tents.purple[0][0], { solid: SOLID });
  book.add('tentB', tents.blue[0][0], { solid: SOLID });
  book.add('tentR', tents.red[0][0], { solid: SOLID });
  book.add('tentDoor', tents.purple[1][0], { solid: SOLID });
  // The gifts: not for eating, even by a goat.
  const gift = (kind: 'gold' | 'frank' | 'myrrh') => {
    const p = sand(151);
    blob(p, 10, 17, 8, 2, R('ink'), 0, 1, 0.4);
    if (kind === 'gold') {
      p.rect(3, 6, 14, 11, c('wood', 2)).rect(3, 6, 14, 3, c('wood', 3)).frame(3, 6, 14, 11, c('gold', 2)).rect(9, 9, 2, 3, c('gold', 3));
      for (let x = 4; x < 16; x += 3) p.set(x, 5, c('gold', 3)).set(x + 1, 4, c('gold', 2));
    } else if (kind === 'frank') {
      blob(p, 10, 12, 5, 6, R('stone'), 2, 4, 1.2);
      p.rect(8, 4, 4, 3, c('gold', 2)).set(10, 2, c('cloth', 2)).set(9, 1, c('cloth', 1)).set(11, 0, c('cloth', 1));
    } else {
      blob(p, 10, 12, 4, 6, R('purple'), 1, 3, 1.2);
      p.rect(8, 4, 4, 2, c('gold', 3)).rect(9, 2, 2, 2, c('gold', 2));
    }
    return p;
  };
  book.add('giftGold', gift('gold'), { solid: SOLID });
  book.add('giftFrank', gift('frank'), { solid: SOLID });
  book.add('giftMyrrh', gift('myrrh'), { solid: SOLID });
  const oasis = () => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('water'), 0, 3, 0.4 + Math.sin((x + y * 2) / 3) * 0.2, x, y));
    return p;
  };
  book.add('water', oasis(), { solid: SOLID });
  // A camel kneeling at rest, spitting at whatever passes; facing left or right.
  const camelKneel = (left: boolean) => {
    const p = sand(155);
    blob(p, 10, 16, 9, 3, R('ink'), 0, 1, 0.4);
    blob(p, 11, 12, 8, 5, R('camel'), 0, 3);
    blob(p, 11, 8, 4, 3, R('camel'), 1, 3);
    p.rect(3, 6, 3, 7, c('camel', 2));
    blob(p, 3, 5, 3, 2, R('camel'), 1, 3);
    p.set(1, 5, c('ink', 0)).set(2, 4, c('ink', 0));
    p.rect(8, 11, 8, 2, c('red', 2)).rect(8, 11, 8, 1, c('gold', 2));
    return left ? p : p.flipX();
  };
  book.add('camelL', camelKneel(true), { solid: SOLID, hp: -3, birthMon: MON.spitL, birthTime: SPIT_EVERY });
  book.add('camelR', camelKneel(false), { solid: SOLID, hp: -3, birthMon: MON.spitR, birthTime: SPIT_EVERY });
  book.add('thornSand', thorn(sand(157), false), { solid: SOLID, hp: -4 });
  book.add('woolBushSand', thorn(sand(159), true), { solid: SOLID, effect: WOOL, eamt: 1, score: 20, touch: 'thornSand' });
  book.add('haySand', hayPile(sand(161), 161), { solid: SOLID, hp: 5, effect: SCREAMSEQ, eamt: 3, score: 10, touch: 'sand' });

  // ---------- the stable ----------
  const planks = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('wood', (x % 5 === 0 ? 0 : 2) + ((Math.floor(x / 5) + seed) % 2)));
    const r = rng(seed);
    for (let k = 0; k < 4; k++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('wood', 0));
    return p;
  };
  book.add('stall', planks(171), { solid: SOLID });
  const beam = () => {
    const p = planks(173);
    p.rect(0, 7, 20, 6, c('wood', 1)).rect(0, 7, 20, 1, c('wood', 3)).rect(0, 12, 20, 1, c('wood', 0));
    return p;
  };
  book.add('beam', beam(), { solid: SOLID });
  const rail = () => {
    const p = straw(175);
    p.rect(0, 8, 20, 3, c('wood', 2)).rect(0, 8, 20, 1, c('wood', 3)).rect(0, 10, 20, 1, c('wood', 0));
    p.rect(2, 4, 3, 12, c('wood', 1)).rect(15, 4, 3, 12, c('wood', 1));
    return p;
  };
  book.add('rail', rail(), { solid: SOLID });
  const lantern = () => {
    const p = planks(177);
    p.disc(10, 10, 8, c('glow', 0)).disc(10, 10, 5.5, c('glow', 1));
    p.rect(7, 6, 6, 9, c('ink', 0)).rect(8, 7, 4, 7, c('glow', 3)).rect(9, 4, 2, 2, c('ink', 0));
    return p;
  };
  book.add('lantern', lantern(), { solid: SOLID });
  // The manger, glowing.
  const manger = (part: 'L' | 'R') => {
    const p = straw(179);
    p.rect(0, 3, 20, 15, c('wood', 1)).rect(0, 3, 20, 2, c('wood', 3)).rect(0, 16, 20, 2, c('wood', 0));
    for (let y = 5; y < 16; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('glow'), 1, 3, 1 - Math.abs(x + (part === 'L' ? 0 : 20) - 20) / 22, x, y));
    for (let k = 0; k < 10; k++) p.line(2 + k * 2, 6, 3 + k * 2, 9, c('hay', 3));
    if (part === 'L') p.rect(0, 3, 2, 15, c('wood', 1));
    else p.rect(18, 3, 2, 15, c('wood', 1));
    return p;
  };
  book.add('mangerL', manger('L'), { solid: SOLID });
  book.add('mangerR', manger('R'), { solid: SOLID });
  const trough = () => {
    const p = straw(181);
    p.rect(1, 5, 18, 11, c('wood', 1)).rect(3, 7, 14, 7, c('water', 1)).rect(4, 8, 5, 1, c('water', 3));
    return p;
  };
  // A drink from the trough: always there, always a little health.
  book.add('trough', trough(), { solid: SOLID, hp: 2 });
  // The pail: kicking it over costs points (and makes a terrible noise).
  const pail = (up: boolean) => {
    const p = straw(183);
    if (up) {
      blob(p, 10, 15, 6, 2, R('ink'), 0, 1, 0.4);
      p.rect(5, 6, 10, 10, c('stone', 2)).rect(5, 6, 10, 2, c('stone', 4)).rect(6, 7, 8, 1, c('water', 2));
      p.rect(4, 9, 1, 4, c('stone', 1)).rect(15, 9, 1, 4, c('stone', 1)).line(5, 6, 10, 2, c('stone', 1)).line(15, 6, 10, 2, c('stone', 1));
    } else {
      blob(p, 11, 12, 8, 5, R('water'), 1, 3, 1);
      p.rect(2, 6, 9, 7, c('stone', 2)).rect(2, 6, 2, 7, c('stone', 4)).disc(3, 9, 2, c('stone', 1));
    }
    return p;
  };
  book.add('pail', pail(true), { solid: SOLID, score: -25, touch: 'pailKicked' });
  book.add('pailKicked', pail(false));
  // Dusty straw: eating it makes a goat sneeze (on Joseph, if he's standing there).
  const dusty = () => {
    const p = hayPile(straw(185), 185);
    const r = rng(9);
    for (let k = 0; k < 30; k++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('cloth', 1));
    return p;
  };
  book.add('dusty', dusty(), { solid: SOLID, score: 15, touch: 'straw' });
  // Joseph and Mary keep watch by the manger (drawn small and still, from above).
  const person = (robe: string, mantle: string, staff: boolean) => {
    const p = straw(187);
    blob(p, 10, 16, 8, 3, R('ink'), 0, 1, 0.3);
    blob(p, 10, 11, 7, 7, R(robe), 0, 3);
    blob(p, 10, 7, 5, 4, R(mantle), 0, 3);
    p.disc(10, 6, 3, c('skin', 1)).rect(7, 3, 7, 3, c(mantle, 2));
    if (staff) p.line(16, 1, 18, 19, c('wood', 2)).line(15, 1, 17, 3, c('wood', 3));
    return p;
  };
  book.add('joseph', person('dirt', 'wood', true), { solid: SOLID });
  book.add('mary', person('blue', 'cloth', false), { solid: SOLID });
  // The empty place in the line: third from the left. Five wool opens it.
  const place = (open: boolean) => {
    const p = straw(189);
    if (!open) {
      for (let k = 0; k < 4; k++) p.frame(1 + k, 1 + k, 18 - k * 2, 18 - k * 2, c('glow', k));
      micro(p, 6, 8, '?', c('ink', 0));
      micro(p, 10, 8, '?', c('ink', 0));
    } else {
      p.disc(10, 10, 8, c('glow', 1)).disc(10, 10, 6, c('glow', 2)).disc(10, 10, 4, c('glow', 3));
      blob(p, 10, 11, 4, 3, R('wool'), 1, 3, 1.2);
    }
    return p;
  };
  book.add('place', place(false), { solid: SOLID, effect: WOOL, eamt: -WOOL_NEEDED, score: 500, touch: 'placeOpen' });
  book.add('placeOpen', place(true));
  // A dark doorway out of each map (the link blocks).
  const exitWay = (bg: Pixels, arrow: string) => {
    const p = bg;
    p.rect(3, 3, 14, 14, c('ink', 1)).rect(5, 5, 10, 10, c('ink', 0));
    micro(p, 9, 8, arrow, c('glow', 3));
    return p;
  };
  book.add('exitE', exitWay(path(191), '>'));
  book.add('exitS', exitWay(cobble(193), 'V'));
  book.add('exitN', exitWay(sand(195), 'A'));
  book.add('stableDoor', exitWay(straw(197), '>'));
  // the caravan tents' lower halves, and the blue and red tents' doorways (added last, so the
  // blocks before keep their numbers)
  for (const [k, n] of [
    ['purple', 'P'],
    ['blue', 'B'],
    ['red', 'R'],
  ] as const) {
    book.add(`tent${n}Low`, tents[k][0][1], { solid: SOLID });
    book.add(`tentDoor${n}Low`, tents[k][1][1], { solid: SOLID });
    if (n !== 'P') book.add(`tentDoor${n}`, tents[k][1][0], { solid: SOLID });
  }
  // The aisle up to the line: rails along it and a rope across its foot, glowing like the
  // empty place, that only drops for five wool. The gift's "Hey..." plays as it drops, while
  // she walks up the aisle into her place, so the line is all ears before the stable fades.
  const railV = () => {
    const p = straw(199);
    p.rect(8, 0, 3, 20, c('wood', 2)).rect(8, 0, 1, 20, c('wood', 3)).rect(10, 0, 1, 20, c('wood', 0));
    p.rect(4, 2, 12, 3, c('wood', 1)).rect(4, 15, 12, 3, c('wood', 1));
    return p;
  };
  book.add('railV', railV(), { solid: SOLID });
  const rope = () => {
    const p = straw(201);
    for (let k = 0; k < 3; k++) p.frame(1 + k, 1 + k, 18 - k * 2, 18 - k * 2, c('glow', k + 1));
    p.rect(0, 8, 20, 3, c('red', 1)).rect(0, 8, 20, 1, c('red', 3));
    p.rect(1, 5, 3, 10, c('wood', 1)).rect(16, 5, 3, 10, c('wood', 1));
    micro(p, 8, 2, '5', c('ink', 0));
    return p;
  };
  book.add('rope', rope(), { solid: SOLID, effect: WOOL, eamt: -WOOL_NEEDED, score: 500, touch: 'straw' });

  // Keepsakes, added last so every block before keeps its number. A tin heart in the grass in
  // the far corner of the shepherds' field (a glint crosses it now and then) and a painted
  // Easter egg half in the sand by the caravan's west rocks: each a few points, gone when
  // touched (the ground under it is its touch block), with no sound of its own.
  const tin = { ink: c('ink', 0), tin: [c('grey', 2), c('grey', 3), c('grey', 4)], white: c('star', 2), dark: c('grey', 1) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(`tinHeart${k || ''}`, drawTinHeart(grass(23), tin, k), {
      next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 50,
      touch: 'grassB',
      score: 100,
    });
  const egg = { ink: c('ink', 0), shell: R('pink'), paint: [c('blue', 1), c('blue', 2)], accent: c('gold', 3), white: c('star', 2) };
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(`easterEgg${k || ''}`, drawEasterEgg(sand(43), egg, 'zigzag', k), {
      next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 60,
      touch: 'sand',
      score: 50,
    });
  // Teenage Lewie (Snowbound: red knit hat, red coat, his snow shovel) helping muck out the
  // stable's back corner. Scenery: he stands where the stall wall was, so he is solid like it.
  // Drawn in the lit ramps only, so the stable's lamplight falls on him as on everyone else.
  const lit = [
    'ink',
    'grass',
    'dirt',
    'sand',
    'stone',
    'brick',
    'wood',
    'hay',
    'goat',
    'horn',
    'wool',
    'camel',
    'donkey',
    'ox',
    'blue',
    'red',
    'purple',
    'skin',
    'olive',
    'thorn',
    'water',
    'cloth',
    'pink',
    'grey',
  ].flatMap((k) => R(k));
  book.add('lewie', straw(203).blit(lewieCameo(pal.pal, 'down0', { use: lit }), 0, 0, 255), { solid: SOLID });
  return book;
}
