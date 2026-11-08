// Marge's airstrip, in the poster inks: the hangar (a corrugated roof, a plank wall, rafters to stand on, a concrete
// apron), hay bales, the eight banner letters, the purple NO someone added, the banner rack (a gate that takes all
// eight letters) and its mast, a windsock, and Marge's crop duster, five blocks by three, its cockpit the way out.
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { LEDGE, PULL, SOLID } from '../../kit/starter/book';
import type { PBook } from './base';
import { onPaper } from './blocks';
import { halftone, paperOf, stripes, type Pal } from './print';

const T = 255;
const air = { grav: PULL.down };
/** The counter the banner letters add to. */
export const LETTERS = 25;
export const BANNER = 'THANKYOU';
export const RACK_POINTS = 200;
/** The plane's size in blocks, and the cockpit's place in it (the exit's top block). */
export const PLANE = { w: 5, h: 3, cockpit: [2, 1] as [number, number] };

/** A letter of the PC font drawn twice its size at (x, y). */
function bigLetter(p: Pixels, ch: string, x: number, y: number, col: number): void {
  const rows = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
  for (let v = 0; v < 8; v++) for (let u = 0; u < 8; u++) if (rows[v] & (1 << u)) p.rect(x + u * 2, y + v * 2, 2, 2, col);
}

export function addAirstrip(book: PBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const paper = paperOf(pal);
  {
    // corrugated roof: teal ridges with halftone shadow
    const p = new Pixels(20, 20, c('teal', 2));
    for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 20, c('teal', 3)).rect(x + 3, 0, 1, 20, c('teal', 1));
    halftone(p, 0, 10, 20, 10, c('teal', 0), 2);
    p.rect(0, 19, 20, 1, ink);
    book.add('roof', p, { solid: SOLID });
  }
  {
    // a hangar post: a teal steel I-beam
    const p = new Pixels(20, 20, paper);
    p.rect(6, 0, 8, 20, c('teal', 2)).rect(8, 0, 4, 20, c('teal', 3));
    halftone(p, 6, 0, 2, 20, c('teal', 0), 3);
    p.rect(5, 0, 1, 20, ink).rect(14, 0, 1, 20, ink);
    book.add('shed', p, air);
  }
  {
    // a rafter: an ink-edged beam with brass bolts, the hangar wall behind it
    const p = new Pixels(20, 20, c('wood', 3));
    for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('wood', 1));
    halftone(p, 0, 0, 20, 20, c('wood', 2), 2, [c('wood', 3)]);
    p.rect(0, 0, 20, 6, c('blue', 2)).rect(0, 0, 20, 1, c('blue', 4)).rect(0, 6, 20, 1, ink);
    p.set(4, 3, c('gold', 4)).set(14, 3, c('gold', 4));
    book.add('rafter', p, { solid: LEDGE, grav: PULL.down });
  }
  {
    const p = new Pixels(20, 20, c('stone', 3));
    halftone(p, 0, 0, 20, 20, c('stone', 2), 2);
    p.rect(0, 0, 20, 2, c('stone', 4)).rect(19, 0, 1, 20, c('stone', 1));
    book.add('apron', p, { solid: SOLID });
  }
  {
    // a hay bale: brass straw, two red twine bands
    const p = new Pixels(20, 20, c('gold', 3));
    for (let y = 1; y < 20; y += 3) p.rect(0, y, 20, 1, c('gold', 4));
    halftone(p, 0, 0, 20, 20, c('gold', 1), 3, [c('gold', 3)]);
    p.rect(4, 0, 2, 20, c('red', 2)).rect(14, 0, 2, 20, c('red', 2));
    p.frame(0, 0, 20, 20, ink);
    book.add('bale', p, { solid: SOLID });
  }
  // the letters: paper panels with grommets, a navy letter
  for (const ch of new Set(BANNER)) {
    const p = new Pixels(20, 20, T);
    p.rect(1, 1, 18, 18, c('white', 3));
    halftone(p, 1, 12, 18, 7, c('paper', 1), 2, [c('white', 3)]);
    bigLetter(p, ch, 2, 2, c('blue', 1));
    p.set(2, 1, c('gold', 4)).set(17, 1, c('gold', 4));
    book.add(`let${ch}`, onPaper(pal, p), { ...air, score: 25, effect: LETTERS, eamt: 1, touch: 'sky' });
  }
  // the NO, on purple cloth, hung from a string
  for (const ch of 'NO') {
    const p = new Pixels(20, 20, T);
    p.rect(1, 3, 18, 16, c('purple', 2));
    halftone(p, 1, 3, 18, 16, c('purple', 1), 2, [c('purple', 2)]);
    bigLetter(p, ch, 2, 3, c('paper', 3));
    const out = onPaper(pal, p);
    out.rect(0, 1, 20, 1, ink);
    book.add(`no${ch}`, out, air);
  }
  {
    // the banner mast (solid to the sky), the rack's top bar and the rack, rolled banner and all
    const mast = new Pixels(20, 20, paper);
    mast.rect(7, 0, 6, 20, c('paper', 3));
    stripes(mast, 7, 0, 6, 20, c('teal', 2), 10, 5);
    mast.rect(6, 0, 1, 20, ink).rect(13, 0, 1, 20, ink);
    book.add('mast', mast, { solid: SOLID });
    const top = new Pixels(20, 20, paper);
    top.rect(0, 14, 20, 4, c('wood', 2)).rect(0, 14, 20, 1, c('wood', 4)).rect(0, 18, 20, 1, ink).rect(0, 13, 20, 1, ink);
    top.rect(7, 0, 6, 13, c('paper', 3));
    stripes(top, 7, 0, 6, 13, c('teal', 2), 10, 5);
    top.rect(6, 0, 1, 13, ink).rect(13, 0, 1, 13, ink);
    book.add('rackTop', top, air);
    const rack = (full: boolean) => {
      const p = new Pixels(20, 20, T);
      p.rect(2, 0, 3, 20, c('wood', 2)).rect(15, 0, 3, 20, c('wood', 2));
      if (full) {
        p.rect(0, 3, 20, 7, c('white', 3)).rect(0, 3, 20, 1, c('white', 2));
        for (let x = 1; x < 20; x += 3) p.rect(x, 5, 2, 3, c('blue', 1));
      } else {
        p.rect(0, 5, 20, 3, c('red', 2));
        p.rect(5, 11, 10, 3, c('teal', 2));
        p.set(9, 12, paper).set(10, 12, paper);
      }
      return onPaper(pal, p);
    };
    book.add('rack', rack(false), { solid: SOLID, effect: LETTERS, eamt: -BANNER.length, score: RACK_POINTS, touch: 'rackDone' });
    book.add('rackDone', rack(true), air);
  }
  {
    // a windsock on a short pole
    const p = new Pixels(20, 40, T);
    p.rect(3, 4, 2, 36, c('stone', 3));
    for (let k = 0; k < 4; k++) p.rect(5 + k * 3, 5 + k, 3, 6 - k * 2 + 2, k % 2 ? c('paper', 3) : c('orange', 3));
    const out = onPaper(pal, p);
    book.add('sockTop', out.crop(0, 0, 20, 20), air);
    book.add('sockPole', out.crop(0, 20, 20, 20), air);
  }
  {
    const out = onPaper(pal, planePicture(pal));
    for (let by = 0; by < PLANE.h; by++) for (let bx = 0; bx < PLANE.w; bx++) book.add(`plane${bx}${by}`, out.crop(bx * 20, by * 20, 20, 20), air);
  }
}

/** Marge's crop duster, 100x60 on transparent: a vermilion biplane facing right, cream wings, a brass nose and propeller. */
export function planePicture(pal: Pal): Pixels {
  const { c } = pal;
  const W = PLANE.w * 20;
  const H = PLANE.h * 20;
  const p = new Pixels(W, H, T);
  // the lower wing, the fuselage, the tail, the upper wing on struts
  p.rect(10, 38, 78, 5, c('paper', 3));
  p.rect(8, 26, 76, 13, c('red', 2)).rect(8, 26, 76, 2, c('red', 4));
  halftone(p, 8, 32, 76, 7, c('red', 0), 2, [c('red', 2)]);
  p.rect(0, 14, 12, 14, c('red', 2)).rect(0, 14, 12, 2, c('red', 4)); // the tail fin
  p.rect(0, 22, 6, 3, c('white', 3));
  p.rect(26, 8, 60, 5, c('paper', 3)).rect(26, 8, 60, 1, c('white', 3));
  halftone(p, 26, 10, 60, 3, c('paper', 1), 2, [c('paper', 3)]);
  for (const x of [34, 72]) p.rect(x, 13, 2, 25, c('ink', 1));
  // the cockpit's rim (the open seat, where Marge climbs in) and the stripe along the side
  p.rect(44, 24, 14, 3, c('ink', 1)).rect(46, 22, 10, 2, c('teal', 3));
  p.rect(12, 33, 70, 2, c('paper', 3));
  // the nose and the propeller
  p.rect(84, 24, 8, 16, c('gold', 3)).rect(84, 24, 8, 2, c('gold', 5));
  p.rect(93, 14, 3, 36, c('stone', 2)).rect(92, 30, 4, 4, c('gold', 4));
  // the wheels
  // the landing gear: a sturdy strut down from the lower wing to each wheel, gray tires with paper hubs
  for (const x of [30, 70]) {
    p.rect(x - 1, 43, 3, 6, c('stone', 2));
    p.disc(x, 52, 5, c('stone', 1)).disc(x, 52, 2.5, c('paper', 3)).set(x, 52, c('stone', 2));
  }
  return p;
}
