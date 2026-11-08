// Call Time's park, in the poster inks: leaf piles (Doug's mouthpiece in one), a tree with the drumsticks on a branch,
// the duck pond with the flute on a lily pad, and the three Hornets who each wait in the street for their own thing back
// (a one-block gate that spends counter 20, 21 or 22, hands the thing over and picks up the instrument), under a
// vermilion band arch.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { LEDGE, PULL, SOLID } from '../../kit/starter/book';
import { halftone, inkLine, paperOf, stripes, type Pal } from './print';
import type { PBook } from './base';

/** The counters the three band things add to (and the band members spend). */
export const MOUTHPIECE = 20;
export const STICKS = 21;
export const FLUTE = 22;
const air = { grav: PULL.down };
const T = 255;

export type Member = 'tuba' | 'drum' | 'flute';
export const MEMBERS: Member[] = ['tuba', 'drum', 'flute'];
const COUNTER: Record<Member, number> = { tuba: MOUTHPIECE, drum: STICKS, flute: FLUTE };
const SKIN: Record<Member, string> = { tuba: 'skinD', drum: 'skinC', flute: 'skin' };

const printed = (pal: Pal, p: Pixels): Pixels => new Pixels(p.w, p.h, paperOf(pal)).blit(inkLine(p, pal.c('ink', 0)), 0, 0, T);

/** A Hornet sitting on the curb in the band's red coat, 20x20: waiting with empty hands (and a look), or playing again. */
function kid(pal: Pal, who: Member, happy: boolean): Pixels {
  const { c } = pal;
  const ink = c('ink', 0);
  const skin = SKIN[who];
  const p = new Pixels(20, 20, T);
  // a red band coat, white trousers folded under, a small navy cap with a red tuft
  p.rect(4, 10, 12, 8, c('red', 2)).rect(4, 10, 2, 8, c('red', 1)).rect(9, 11, 1, 6, c('gold', 4));
  p.rect(3, 17, 15, 3, c('white', 3));
  p.rect(6, 3, 8, 7, c(skin, 2)).rect(13, 4, 1, 5, c(skin, 3));
  p.rect(5, 1, 10, 3, c('blue', 2)).rect(5, 3, 11, 1, c('ink', 1)).rect(9, 0, 2, 1, c('red', 3));
  if (happy) {
    p.set(8, 5, ink).set(12, 5, ink).rect(9, 8, 3, 1, ink);
    if (who === 'tuba') {
      // the sousaphone's brass bell over a shoulder
      p.disc(14, 12, 5, c('gold', 3)).disc(14, 12, 3, c('gold', 5)).disc(14, 12, 1.6, c('gold', 1));
    } else if (who === 'drum') {
      p.rect(3, 12, 14, 6, c('paper', 3)).rect(3, 12, 14, 1, c('white', 3));
      stripes(p, 3, 13, 14, 5, c('blue', 2), 6, 2);
      p.line(2, 8, 7, 12, c('wood', 2)).line(18, 8, 13, 12, c('wood', 2));
    } else {
      p.line(1, 9, 19, 7, c('silver', 3)).line(1, 10, 19, 8, c('silver', 2));
    }
  } else {
    p.rect(7, 5, 2, 1, ink).rect(11, 5, 2, 1, ink).rect(9, 8, 3, 1, c(skin, 0));
    p.rect(2, 13, 3, 3, c(skin, 2)).rect(15, 13, 3, 3, c(skin, 2)); // empty hands
  }
  return printed(pal, p);
}

export function addPark(book: PBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const paper = paperOf(pal);
  // leaf piles: a heap of orange and vermilion leaves; one hides a brass glint
  const pile = (glint: boolean): Pixels => {
    const p = new Pixels(20, 20, T);
    for (let y = 8; y < 20; y++) {
      const w = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 19) / 11) ** 2)) * 9);
      p.rect(10 - w, y, w * 2, 1, c('orange', 3));
    }
    halftone(p, 0, 8, 20, 12, c('red', 2), 3, [c('orange', 3)]);
    for (const [x, y] of [
      [6, 11],
      [12, 10],
      [9, 14],
      [15, 15],
    ])
      p.rect(x, y, 2, 1, c('gold', 4));
    if (glint) p.rect(13, 12, 3, 2, c('gold', 5)).set(14, 11, c('white', 3));
    return printed(pal, p);
  };
  book.add('leafPile', pile(true), { ...air, effect: MOUTHPIECE, eamt: 1, score: 25, touch: 'leafFlat' });
  book.add('leafPileB', pile(false), { ...air, score: 5, touch: 'leafFlat' });
  {
    const p = new Pixels(20, 20, T);
    p.rect(2, 17, 16, 3, c('orange', 3)).rect(5, 16, 4, 1, c('red', 2)).rect(12, 16, 3, 1, c('orange', 2));
    book.add('leafFlat', printed(pal, p), air);
  }
  {
    // the trunk: a brown column with halftone bark and ink grooves (climb it like a ladder)
    const p = new Pixels(20, 20, paper);
    p.rect(5, 0, 10, 20, c('wood', 2));
    halftone(p, 5, 0, 10, 20, c('wood', 1), 3, [c('wood', 2)]);
    p.rect(7, 2, 1, 6, ink).rect(11, 9, 1, 7, ink).rect(5, 0, 1, 20, ink).rect(14, 0, 1, 20, ink);
    book.add('trunk', p, { grav: PULL.none });
  }
  {
    const p = new Pixels(20, 20, paper);
    p.rect(0, 0, 20, 5, c('wood', 2)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 5, 20, 1, ink);
    halftone(p, 0, 1, 20, 4, c('wood', 1), 2, [c('wood', 2)]);
    p.rect(14, 6, 4, 3, c('green', 3)).rect(3, 6, 3, 2, c('green', 2)); // a couple of leaves hanging under
    book.add('branch', p, { solid: LEDGE, grav: PULL.down });
  }
  {
    // the crown: a flat green mass with halftone shade and a scalloped edge
    const p = new Pixels(20, 20, c('green', 3));
    halftone(p, 0, 0, 20, 20, c('green', 1), (x, y) => (y > 12 ? 4 : y > 6 ? 2 : 1));
    for (const [x, y] of [
      [4, 4],
      [13, 9],
      [7, 15],
    ])
      p.rect(x, y, 3, 1, c('green', 4));
    book.add('crown', p, air);
  }
  {
    const p = new Pixels(20, 20, T);
    p.line(2, 14, 17, 5, c('wood', 1)).line(2, 15, 17, 6, c('wood', 3));
    p.line(4, 17, 18, 9, c('wood', 1)).line(4, 18, 18, 10, c('wood', 3));
    p.rect(16, 4, 2, 2, c('white', 3)).rect(17, 8, 2, 2, c('white', 3));
    book.add('sticks', printed(pal, p), { ...air, effect: STICKS, eamt: 1, score: 25, touch: 'sky' });
  }
  {
    // the pond: teal water with paper ripples, a halftone bed under it
    const top = new Pixels(20, 20, c('teal', 2));
    top.rect(0, 0, 20, 3, paper).rect(0, 3, 20, 1, ink).rect(0, 4, 20, 2, c('teal', 3));
    for (const x of [3, 12]) top.rect(x, 8, 5, 1, c('teal', 4));
    halftone(top, 0, 10, 20, 10, c('teal', 1), 2, [c('teal', 2)]);
    book.add('waterTop', top, air);
    const bed = new Pixels(20, 20, c('teal', 1));
    halftone(bed, 0, 0, 20, 20, c('teal', 0), 3);
    book.add('pondBed', bed, { solid: SOLID });
  }
  {
    const p = new Pixels(20, 20, T);
    p.rect(1, 15, 18, 3, c('green', 3)).rect(3, 14, 14, 1, c('green', 4)).rect(9, 15, 2, 2, T);
    p.rect(13, 12, 3, 3, c('pink', 3)).set(14, 11, c('pink', 2));
    book.add('lily', printed(pal, p), { solid: LEDGE, grav: PULL.down });
  }
  {
    const p = new Pixels(20, 20, T);
    p.rect(1, 12, 18, 2, c('silver', 3)).rect(1, 13, 18, 1, c('silver', 1));
    for (const x of [6, 9, 12]) p.set(x, 12, ink);
    p.rect(16, 11, 2, 1, c('silver', 3));
    book.add('flute', printed(pal, p), { ...air, effect: FLUTE, eamt: 1, score: 25, touch: 'sky' });
  }
  {
    const p = new Pixels(20, 20, T);
    for (const [x, h] of [
      [4, 12],
      [9, 15],
      [14, 11],
    ]) {
      p.rect(x, 20 - h, 2, h, c('green', 2));
      p.rect(x, 20 - h - 4, 2, 4, c('wood', 1));
    }
    book.add('reeds', printed(pal, p), air);
  }
  for (const who of MEMBERS) {
    book.add(`kid.${who}`, kid(pal, who, false), { solid: SOLID, effect: COUNTER[who], eamt: -1, score: 50, touch: `kid.${who}.happy` });
    book.add(`kid.${who}.happy`, kid(pal, who, true), air);
  }
}

/** The band arch over a gate: a vermilion-and-paper striped banner on a navy beam. */
export function addBandArch(book: PBook, pal: Pal): void {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(0, 0, 20, 5, c('blue', 2)).rect(0, 0, 20, 1, c('blue', 4));
  p.rect(2, 5, 16, 9, c('paper', 3));
  stripes(p, 2, 5, 16, 9, c('red', 2), 8, 4);
  for (let x = 2; x < 18; x += 4) p.rect(x, 14, 2, 2, c('red', 2));
  book.add('bandArch', printed(pal, p), air);
}
