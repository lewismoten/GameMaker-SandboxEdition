// PASS THE PIE's own block set, cut for this game in the block-print look (print.ts): it has the names and rules
// kit/starter/map.ts lays out (sky, grass, dirt, brick, ladder, doors, keys and gates), but every picture is drawn
// here. The ground is a band of leaves over black carved earth; the paper is the sky; acorns are the coins.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Book, LEDGE, PULL, SOLID } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { SILVER_KEYS } from '../../kit/starter/locks';
import { gouges, hatch, oval, paperBlock, press, stamp, T } from './print';

const AIR = { grav: PULL.down };

/** A sprite on a fresh 20x20 see-through sheet. */
const sheet = (w = 20, h = 20) => new Pixels(w, h, T);

/** An acorn: the coin of every street. */
export function acorn(pal: Pal): Pixels {
  const b = pal.r('tBrown');
  const p = sheet();
  oval(p, 10, 12, 5, 6, b[2]);
  p.rect(7, 9, 2, 6, b[3]);
  p.rect(4, 6, 12, 4, b[0]).rect(5, 5, 10, 1, b[0]);
  for (let x = 5; x < 15; x += 2) p.set(x, 7, b[1]);
  p.rect(10, 2, 1, 3, b[0]);
  return stamp(pal, p, true);
}

/** A key on a tag: gold (`gold`) or a steel garden key. */
function key(pal: Pal, gold: boolean): Pixels {
  const m = pal.r(gold ? 'tGold' : 'steel');
  const { acc } = press(pal);
  const p = sheet();
  p.ring(6, 10, 3, m[0]).ring(6, 10, 2, m[m.length - 1]);
  p.rect(9, 9, 8, 3, m[gold ? 1 : 1]).rect(9, 9, 8, 1, m[m.length - 1]);
  p.rect(13, 12, 2, 3, m[0]).rect(16, 12, 1, 3, m[0]);
  p.rect(3, 3, 4, 3, acc[2]).line(5, 6, 6, 8, acc[0]);
  return stamp(pal, p, true);
}

/** Adds the whole set to an empty book, every name the map and the locks expect. */
export function addPrintBlocks(book: Book, pal: Pal): void {
  const { paper, ink, acc, acc2, leaf } = press(pal);
  const bg = () => paperBlock(pal);

  book.add('sky', bg(), AIR);
  {
    // a clipped hedge that ends a street: plainly a wall, carved leaf shapes in it
    const p = new Pixels(20, 20, leaf[1]);
    for (let y = 0; y < 20; y += 5)
      for (let x = (y / 5) % 2 ? 0 : 3; x < 20; x += 6) {
        oval(p, x + 2, y + 2, 2, 2, leaf[2]);
        p.set(x + 2, y + 1, leaf[3]);
      }
    p.rect(0, 0, 2, 20, ink[0]).rect(18, 0, 2, 20, ink[0]);
    book.add('edge', p, { ...AIR, solid: SOLID });
  }
  {
    // a carved cloud: a paper-white shape with a spiral cut in it, two blocks wide
    const p = paperBlock(pal, 40, 20, 9);
    const c = new Pixels(40, 20, T);
    oval(c, 12, 12, 9, 6, paper[3]);
    oval(c, 22, 9, 9, 7, paper[3]);
    oval(c, 30, 13, 7, 5, paper[3]);
    const out = stamp(pal, c);
    out.ring(21, 10, 3, ink[1]).rect(21, 10, 2, 1, ink[1]);
    out.line(6, 16, 14, 16, ink[1]);
    p.blit(out, 0, 0, T);
    book.add('cloudL', p.crop(0, 0, 20, 20), AIR);
    book.add('cloudR', p.crop(20, 0, 20, 20), AIR);
  }
  {
    // the ground's top: an ink line, a band of leaf with V cuts, then carved black earth
    const p = new Pixels(20, 20, ink[0]);
    p.rect(0, 2, 20, 6, leaf[2]);
    for (let x = 0; x < 20; x += 5) p.set(x + 1, 4, leaf[3]).set(x + 2, 5, leaf[3]).set(x + 3, 4, leaf[3]);
    p.rect(0, 7, 20, 1, leaf[0]);
    gouges(p, 0, 10, 20, 10, ink[2], 5, 11, 4);
    book.add('grass', p, { solid: SOLID });
  }
  {
    const p = new Pixels(20, 20, ink[0]);
    gouges(p, 0, 0, 20, 20, ink[2], 7, 12, 4);
    gouges(p, 0, 0, 20, 20, ink[1], 4, 13, 2);
    book.add('dirt', p, { solid: SOLID });
  }
  {
    // brick: accent faces cut out of the ink, the mortar left standing
    const p = new Pixels(20, 20, ink[0]);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 5 : 0;
      for (let x = -10 + off; x < 20; x += 10) {
        const x0 = Math.max(0, x + 1);
        const x1 = Math.min(20, x + 10);
        if (x1 > x0) p.rect(x0, row * 5 + 1, x1 - x0, 4, acc[1]).rect(x0, row * 5 + 1, x1 - x0, 1, acc[2]);
      }
    }
    book.add('brick', p, { solid: SOLID });
  }
  {
    // a shelf board: stand on it, jump up through it
    const p = bg();
    p.rect(0, 0, 20, 6, acc2[1]).rect(0, 0, 20, 1, ink[0]).rect(0, 5, 20, 1, ink[0]);
    p.line(2, 2, 9, 2, acc2[2]).line(11, 3, 18, 3, acc2[0]);
    book.add('plank', p, { solid: LEDGE, grav: PULL.down });
  }
  {
    // a sheaf of wheat, tied
    const s = sheet();
    for (let i = -3; i <= 3; i++) s.line( 10 + i * 2, 4 + Math.abs(i), 10, 19, acc2[1]);
    for (let i = -3; i <= 3; i++) s.rect(9 + i * 2, 2 + Math.abs(i), 2, 3, acc2[2]);
    s.rect(7, 13, 7, 2, acc[0]);
    const p = bg().blit(stamp(pal, s), 0, 0, T);
    book.add('bush', p, AIR);
  }
  {
    // a garden mum
    const s = sheet();
    s.rect(9, 11, 2, 9, leaf[1]).rect(5, 15, 4, 2, leaf[2]).rect(11, 13, 4, 2, leaf[2]);
    for (let a = 0; a < 8; a++) oval(s, 10 + Math.cos((a * Math.PI) / 4) * 4, 8 + Math.sin((a * Math.PI) / 4) * 4, 2, 2, acc[2]);
    oval(s, 10, 8, 2, 2, acc2[2]);
    book.add('flower', bg().blit(stamp(pal, s), 0, 0, T), AIR);
  }
  {
    const p = bg();
    p.rect(3, 0, 3, 20, ink[0]).rect(14, 0, 3, 20, ink[0]);
    for (let y = 2; y < 20; y += 6) p.rect(6, y, 8, 2, acc2[1]).rect(6, y + 2, 8, 1, ink[0]);
    book.add('ladder', p, { grav: PULL.none });
  }
  {
    // the way on: a door with a round window and a plain arrow over it
    const d = new Pixels(20, 40, T);
    d.rect(2, 6, 16, 34, acc[1]).rect(4, 8, 12, 30, acc[2]);
    oval(d, 10, 15, 4, 4, paper[3]);
    d.rect(10, 11, 1, 9, ink[0]).rect(6, 15, 9, 1, ink[0]);
    d.rect(5, 24, 10, 6, acc[1]).rect(5, 31, 10, 6, acc[1]);
    d.disc(14, 28, 1, acc2[2]);
    d.rect(5, 0, 10, 4, ink[0]).rect(10, 1, 3, 2, paper[3]).set(13, 2, paper[3]).set(12, 0, paper[3]).set(12, 3, paper[3]);
    const out = bgTall(pal).blit(stamp(pal, d), 0, 0, T);
    book.add('doorTop', out.crop(0, 0, 20, 20), AIR);
    book.add('doorBottom', out.crop(0, 20, 20, 20), AIR);
  }
  {
    // where a street starts: an open archway
    const d = new Pixels(20, 40, T);
    d.rect(1, 6, 18, 34, ink[0]);
    oval(d, 10, 8, 9, 6, ink[0]);
    d.rect(4, 8, 12, 32, paper[1]);
    oval(d, 10, 9, 6, 4, paper[1]);
    hatch(d, 4, 22, 12, 18, paper[0], 4);
    const out = bgTall(pal).blit(d, 0, 0, T);
    book.add('doorwayTop', out.crop(0, 0, 20, 20), AIR);
    book.add('doorwayBottom', out.crop(0, 20, 20, 20), AIR);
  }
  book.add('coin', acorn(pal), { ...AIR, score: 10, touch: 'sky' });
  book.add('key', key(pal, true), { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  {
    // thistles: prickly, a bump
    const s = sheet();
    for (const x of [4, 10, 16]) {
      s.rect(x, 10, 1, 10, leaf[1]);
      oval(s, x, 8, 3, 3, leaf[2]);
      for (let k = -3; k <= 3; k += 2) s.set(x + k, 4, acc[2]).set(x + k / 2, 3, acc[2]);
    }
    book.add('spikes', bg().blit(stamp(pal, s), 0, 0, T), { solid: SOLID, hp: -10 });
  }
  // the locks: the neighbor's front door opens for the dish (the gold counter); the garden gate for a steel key
  book.add('keySilver', key(pal, false), { grav: PULL.down, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
  {
    const p = bg();
    p.rect(0, 12, 20, 8, ink[0]);
    p.ring(10, 12, 6, leaf[1]).ring(10, 12, 5, leaf[2]);
    for (let a = 0; a < 6; a++) p.set(10 + Math.round(Math.cos(a) * 5), 12 + Math.round(Math.sin(a) * 5), acc[2]);
    p.rect(0, 17, 20, 3, acc[1]);
    book.add('gateTop', p, AIR);
  }
  {
    // the front door: on its plate, a pie dish (it opens for a dish and keeps it)
    const p = new Pixels(20, 20, acc[1]);
    p.rect(0, 0, 2, 20, ink[0]).rect(18, 0, 2, 20, ink[0]).rect(2, 0, 16, 2, ink[0]);
    p.rect(4, 4, 12, 9, paper[3]).frame(4, 4, 12, 9, ink[0]);
    oval(p, 10, 9, 4, 2, pal.c('crust', 2));
    p.rect(6, 10, 9, 1, ink[0]);
    p.rect(4, 15, 12, 4, acc[0]);
    book.add('gate', p, { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
  }
  {
    const p = bg();
    p.rect(0, 14, 20, 6, ink[0]).rect(0, 16, 20, 2, pal.c('steel', 1));
    book.add('gateTopSilver', p, AIR);
  }
  {
    // the garden gate: pickets and a padlock
    const st = pal.r('steel');
    const p = bg();
    for (let x = 1; x < 20; x += 5) p.rect(x, 1, 4, 19, paper[3]).rect(x, 1, 4, 1, ink[0]).rect(x, 1, 1, 19, ink[0]).rect(x + 3, 1, 1, 19, ink[0]);
    p.rect(0, 6, 20, 2, ink[0]).rect(0, 14, 20, 2, ink[0]);
    p.ring(10, 8, 2, st[0]).rect(7, 9, 7, 6, st[1]).frame(7, 9, 7, 6, ink[0]).set(10, 11, ink[0]);
    book.add('gateSilver', p, { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'sky' });
  }
}

/** Paper two blocks tall. */
const bgTall = (pal: Pal) => paperBlock(pal, 20, 40, 5);
