// Level 1's blocks: a leaf pile with the tuba player's mouthpiece in it, a tree with the drummer's sticks on a branch,
// a duck pond with the flute on a lily pad, and the three band members who each wait, sitting in the street, for their
// own thing back (a one-block gate that spends counter 20, 21 or 22; it hands the thing over and picks up its instrument).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob, speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { LEDGE, PULL, SOLID } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { PBook } from './base';

/** The counters the three band things add to (and the band members spend). */
export const MOUTHPIECE = 20;
export const STICKS = 21;
export const FLUTE = 22;
const air = { grav: PULL.down };

export type Member = 'tuba' | 'drum' | 'flute';
export const MEMBERS: Member[] = ['tuba', 'drum', 'flute'];
const COUNTER: Record<Member, number> = { tuba: MOUTHPIECE, drum: STICKS, flute: FLUTE };
const JACKET: Record<Member, string> = { tuba: 'gold', drum: 'blue', flute: 'pink' };

/** A band member sitting in the street, 20x20: waiting with empty hands, or happy with the instrument. */
function kid(pal: Pal, who: Member, happy: boolean): Pixels {
  const { c, r } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  const p = new Pixels(20, 20, S);
  const coat = r(JACKET[who]);
  const skin = r(who === 'drum' ? 'dirt' : 'skin');
  blob(p, 10, 14, 7, 5.4, coat, 0, 4);
  p.rect(3, 17, 14, 3, c('white', 2)).rect(3, 17, 14, 1, c('white', 3));
  blob(p, 10, 7, 4.4, 4.6, skin, 0, 3);
  // a small band cap with a feather
  p.rect(5, 1, 10, 3, c('blue', 1)).rect(5, 1, 10, 1, c('blue', 3)).rect(4, 4, 12, 1, c('ink', 1));
  p.rect(9, 0, 2, 1, c('red', 3)).set(11, 0, c('red', 4));
  p.set(8, 7, ink).set(12, 7, ink);
  if (happy) {
    p.set(7, 9, ink).set(8, 10, ink).set(9, 10, ink).set(10, 10, ink).set(11, 10, ink).set(12, 9, ink);
    p.set(6, 8, c('pink', 2)).set(14, 8, c('pink', 2));
    if (who === 'tuba') {
      p.disc(10, 14, 5.6, ink).disc(10, 14, 4.4, r('gold')[4]).disc(10, 14, 2.4, ink).disc(10, 14, 1.4, S);
      p.disc(16, 9, 3.4, ink).disc(16, 9, 2.4, r('gold')[5]).rect(14, 11, 2, 4, r('gold')[3]);
    } else if (who === 'drum') {
      p.rect(3, 12, 14, 7, ink).rect(4, 13, 12, 5, c('blue', 3)).rect(4, 13, 12, 1, c('white', 3)).rect(4, 17, 12, 1, c('blue', 1));
      p.line(3, 10, 7, 12, c('wood', 4)).line(17, 10, 13, 12, c('wood', 4));
    } else {
      p.line(1, 13, 19, 11, ink).line(1, 12, 19, 10, c('stone', 4));
      for (const x of [6, 9, 12]) p.set(x, 11, c('ink', 1));
    }
  } else {
    p.set(9, 10, ink).set(10, 10, ink).set(11, 10, ink);
    p.set(14, 3, c('sky', 4)).rect(15, 4, 1, 2, c('sky', 4)); // a worried drop of sweat
    p.disc(4, 14, 1.8, skin[2]).disc(16, 14, 1.8, skin[2]); // empty hands
  }
  return outline(p, ink, { transparent: S });
}

export function addPark(book: PBook, pal: Pal): void {
  const { c, r } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  const sky = () => new Pixels(20, 20, S);

  // ---- leaf piles (passable): one hides the mouthpiece, one only a squirrel's acorn
  const pile = (glint: boolean, seed: number): Pixels => {
    const p = sky();
    const cols = [r('orange')[3], r('red')[3], r('gold')[4], r('brick')[3], r('orange')[2]];
    blob(p, 10, 14, 9.6, 7.6, r('orange'), 0, 3);
    speckle(p, 0, 9, 20, 11, r('orange'), 1, 4, seed, 0.6);
    for (let i = 0; i < 16; i++) p.rect(1 + ((i * 7 + seed) % 17), 9 + ((i * 5 + seed) % 9), 2, 1, cols[i % cols.length]);
    if (glint) p.rect(9, 12, 3, 2, c('gold', 5)).set(10, 11, c('white', 3)).set(8, 13, c('white', 3));
    return outline(p.map((x, y, v) => (y < 8 ? S : v)), ink, { transparent: S });
  };
  book.add('leafPile', pile(true, 3), { ...air, effect: MOUTHPIECE, eamt: 1, score: 25, touch: 'leafFlat' });
  book.add('leafPileB', pile(false, 11), { ...air, score: 5, touch: 'leafFlat' });
  {
    const p = sky();
    for (let i = 0; i < 14; i++) p.rect(1 + ((i * 7) % 17), 16 + (i % 3), 2, 1, [r('orange')[3], r('red')[3], r('gold')[4]][i % 3]);
    book.add('leafFlat', p, air);
  }
  // ---- the tree: a trunk to climb (no pull, like a ladder), a branch to stand on with the drumsticks, leafy crowns behind
  {
    const p = sky();
    const w = r('wood');
    p.rect(5, 0, 10, 20, w[2]).rect(5, 0, 2, 20, w[3]).rect(13, 0, 2, 20, w[1]);
    for (const [x, y] of [[8, 3], [10, 9], [7, 14], [11, 17]] as const) p.rect(x, y, 1, 3, w[0]);
    p.rect(4, 0, 1, 20, ink).rect(15, 0, 1, 20, ink);
    book.add('trunk', p, { grav: PULL.none });
    const e = sky();
    e.rect(0, 2, 20, 4, w[3]).rect(0, 2, 20, 1, w[4]).rect(0, 5, 20, 1, w[1]).rect(0, 1, 20, 1, ink).rect(0, 6, 20, 1, ink);
    for (const x of [3, 9, 15]) e.disc(x, 1, 3.6, r('green')[3]).disc(x - 1, 0, 2, r('green')[4]);
    book.add('branch', e, { solid: LEDGE, grav: PULL.down });
    const crown = sky();
    for (const [x, y, rad] of [[4, 8, 6], [11, 5, 7], [16, 12, 6], [7, 15, 6]] as const) crown.disc(x, y, rad, r('green')[2]);
    for (const [x, y, rad] of [[3, 6, 4], [10, 3, 4], [15, 10, 4]] as const) crown.disc(x, y, rad, r('green')[3]);
    book.add('crown', crown, air);
    const s = sky();
    s.line(2, 15, 14, 5, w[0]).line(3, 16, 15, 6, w[3]).line(5, 17, 17, 8, w[0]).line(6, 18, 18, 9, w[3]);
    s.rect(1, 14, 3, 3, w[4]).rect(4, 16, 3, 3, w[4]); // two drumsticks lying side by side, with round tips
    book.add('sticks', outline(s, ink, { transparent: S }), { ...air, effect: STICKS, eamt: 1, score: 25, touch: 'sky' });
  }
  // ---- the pond: water to wade through, a bed under it, a lily pad to stand on, the flute on it, reeds on the bank
  {
    const top = new Pixels(20, 20, S);
    top.rect(0, 6, 20, 14, c('blue', 3)).rect(0, 6, 20, 2, c('blue', 4)).rect(2, 11, 5, 1, c('white', 3)).rect(11, 15, 6, 1, c('white', 3));
    for (let x = 0; x < 20; x += 5) top.rect(x, 5, 3, 1, c('blue', 4));
    book.add('waterTop', top, air);
    const bed = new Pixels(20, 20, c('dirt', 2));
    speckle(bed, 0, 0, 20, 20, r('dirt'), 0, 3, 17, 0.4);
    book.add('pondBed', bed, { solid: SOLID });
    const lily = sky();
    blob(lily, 10, 16, 9.4, 3.4, r('green'), 1, 4);
    lily.rect(11, 15, 9, 2, S).rect(0, 18, 20, 2, c('blue', 3)).rect(0, 18, 20, 1, c('blue', 4)).rect(5, 13, 3, 2, c('pink', 3)).rect(6, 12, 1, 1, c('pink', 4));
    book.add('lily', outline(lily, ink, { transparent: S }), { solid: LEDGE, grav: PULL.down });
    const f = sky();
    f.line(1, 16, 18, 8, ink).line(1, 15, 18, 7, c('stone', 4)).line(1, 14, 18, 6, ink);
    for (const x of [6, 9, 12]) f.set(x, 12 - Math.round((x - 6) / 1.7), c('ink', 1));
    book.add('flute', f, { ...air, effect: FLUTE, eamt: 1, score: 25, touch: 'sky' });
    const reed = sky();
    for (const x of [4, 9, 14]) reed.rect(x, 4 + (x % 3) * 2, 2, 16, c('green', 2)).rect(x, 2 + (x % 3) * 2, 2, 5, c('wood', 3)).rect(x, 2 + (x % 3) * 2, 2, 1, c('wood', 4));
    book.add('reeds', reed, air);
  }
  // ---- the band members: sitting in the street, each a one-block gate for his or her own thing
  for (const who of MEMBERS) {
    book.add(`kid.${who}`, kid(pal, who, false), { solid: SOLID, effect: COUNTER[who], eamt: -1, score: 50, touch: `kid.${who}.happy` });
    book.add(`kid.${who}.happy`, kid(pal, who, true), air);
  }
}

/** The arch over a gate: a banner strung between two posts, passable. */
export function addBandArch(book: PBook, pal: Pal): void {
  const { c } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  {
    const p = new Pixels(20, 20, S);
    p.rect(0, 0, 20, 8, c('brick', 3)).rect(0, 0, 20, 1, c('brick', 4)).rect(0, 7, 20, 1, c('brick', 1));
    p.rect(2, 8, 3, 12, c('stone', 3)).rect(15, 8, 3, 12, c('stone', 3)).rect(2, 8, 1, 12, c('white', 3)).rect(15, 8, 1, 12, c('white', 3));
    p.rect(3, 2, 14, 3, c('gold', 4)).rect(3, 2, 14, 1, c('gold', 5)); // a gold ribbon
    book.add('bandArch', outline(p, ink, { transparent: S }), air);
  }
}
