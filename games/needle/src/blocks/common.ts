// What every level's block set shares: the sky, the poor souls the camel gives the rich man's
// gold to, the eye gates (the narrow ways, one grace each), and the good things along the road.
// Each level has a .BBL of its own (city, desert, tailor, needle); these helpers add the shared
// blocks to it in the same order, under the same names.
//
//   - air falls (gravity down); a thread has no gravity, so the camel can climb it;
//   - a poor soul takes a coin of gold (refused when there is none to give), says thank you
//     and blesses him: one grace, and the coin shows in the bowl from then on;
//   - an eye gate is a solid stone with a needle's eye cut in it: one grace opens it into a
//     gap one block high, so he still has to hump down and crawl through.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import type { Pal } from '../art/pal';
import { GOLD, GRACE } from '../ids';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;
const LIFE = 1;

export interface Kit {
  book: BlockBook;
  pal: Pal;
  c: Pal['c'];
  R: Pal['r'];
  P: () => Pixels;
  /** A patch of sky (shade k, a few speckles). */
  sky: (seed: number, k?: number) => Pixels;
  air: { grav: number };
}

export function kit(pal: Pal): Kit {
  const book = new BlockBook();
  const P = () => new Pixels(20, 20);
  const sky = (seed: number, k = 3) => {
    const p = P().rect(0, 0, 20, 20, pal.c('sky', k));
    const r = rng(seed);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), pal.c('sky', k + (r() < 0.5 ? 1 : -1)));
    return p;
  };
  return { book, pal, c: pal.c, R: pal.r, P, sky, air: { grav: GRAV.down } };
}

type Soul = 'beggar' | 'widow' | 'kids' | 'blind' | 'nomad' | 'seamstress';

/**
 * A poor soul, drawn over `bg`: in need (holding out a hand or a bowl), thankful (hands up,
 * the coin shining) or glad (the coin kept, smiling). One block high: the camel is twice their size.
 */
function soul(k: Kit, bg: Pixels, who: Soul, mood: 'need' | 'thanks' | 'glad'): Pixels {
  const { c, R } = k;
  const p = bg;
  const ink = c('ink', 0);
  const face = (x: number, y: number, smile: boolean) => {
    blob(p, x, y, 2.6, 2.6, R('skin'), 1, 3);
    p.set(x - 1, y - 1, ink).set(x + 1, y - 1, ink);
    if (smile)
      p.set(x - 1, y + 1, ink)
        .set(x, y + 2, ink)
        .set(x + 1, y + 1, ink);
    else p.rect(x - 1, y + 1, 3, 1, c('skin', 0));
  };
  const coin = (x: number, y: number) => p.disc(x, y, 1.6, c('gold', 3)).set(x, y - 1, c('gold', 4));
  const happy = mood !== 'need';
  const armsUp = mood === 'thanks';
  if (who === 'beggar') {
    // sitting cross-legged on a mat, a bowl held out
    p.rect(2, 17, 16, 3, c('red', 1)).rect(2, 17, 16, 1, c('red', 2));
    blob(p, 9, 13, 5, 4.6, R('cloth'), 0, 2);
    face(9, 6, happy);
    blob(p, 8, 4, 3.2, 2, R('cloth'), 1, 3);
    if (armsUp) p.line(5, 11, 3, 6, c('skin', 2)).line(13, 11, 15, 6, c('skin', 2));
    blob(p, 15, 14, 3, 1.6, R('wood'), 1, 3);
    if (happy) coin(15, 13);
  } else if (who === 'widow') {
    // in a dark veil, two mites in her hand
    blob(p, 10, 13, 4.4, 6.4, R('blue'), 0, 2);
    blob(p, 10, 5, 3.4, 3.6, R('blue'), 0, 2);
    face(10, 6, happy);
    if (armsUp) p.line(7, 10, 4, 5, c('blue', 1)).line(13, 10, 16, 5, c('blue', 1));
    else p.line(13, 11, 16, 11, c('skin', 2)).set(17, 11, c('skin', 2));
    if (happy) coin(armsUp ? 16 : 17, armsUp ? 4 : 10);
  } else if (who === 'kids') {
    // the three children from the cover, in blue, white and orange
    const cols: [string, number][] = [
      ['blue', 4],
      ['cloth', 10],
      ['gold', 16],
    ];
    cols.forEach(([robe, x], i) => {
      const h = i === 1 ? 1 : 0;
      p.rect(x - 2, 11 + h, 5, 8 - h, c(robe, 2)).rect(x - 2, 11 + h, 1, 8 - h, c(robe, 1));
      blob(p, x, 8 + h, 2.2, 2.2, R('skin'), 1, 3);
      p.rect(x - 2, 5 + h, 5, 2, c('hair', 1));
      p.set(x - 1, 8 + h, ink).set(x + 1, 8 + h, ink);
      if (happy) p.set(x, 10 + h, ink);
      if (armsUp) p.line(x - 2, 12 + h, x - 3, 8 + h, c('skin', 2)).line(x + 2, 12 + h, x + 3, 8 + h, c('skin', 2));
    });
    if (happy) coin(10, 3);
  } else if (who === 'blind') {
    // an old man with a staff and a cloth over his eyes
    blob(p, 9, 13, 4, 6.4, R('cloth'), 0, 2);
    blob(p, 9, 5, 2.8, 2.8, R('skin'), 1, 3);
    p.rect(6, 4, 7, 1, c('white', 2)).rect(7, 7, 4, 2, c('white', 1));
    p.line(15, 3, 15, 19, c('wood', 2));
    if (armsUp) p.line(6, 10, 4, 5, c('skin', 2)).line(12, 10, 14, 6, c('skin', 2));
    else p.line(12, 10, 15, 10, c('skin', 2));
    if (happy) coin(armsUp ? 4 : 12, armsUp ? 4 : 10);
  } else if (who === 'nomad') {
    // a desert traveler, dusty and thirsty, waterskin empty
    blob(p, 9, 13, 4.4, 6.4, R('sand'), 0, 3);
    blob(p, 9, 5, 3, 3, R('skin'), 0, 2);
    p.rect(5, 2, 9, 2, c('white', 1)).rect(5, 4, 2, 4, c('white', 1));
    p.set(8, 5, ink).set(10, 5, ink);
    if (happy) p.set(9, 7, ink).set(8, 6, ink).set(10, 6, ink);
    blob(p, 15, 14, 2, 3, R('wood'), happy ? 2 : 0, happy ? 4 : 1);
    if (armsUp) p.line(6, 10, 3, 5, c('skin', 1)).line(12, 10, 16, 5, c('skin', 1));
    if (happy) coin(armsUp ? 16 : 14, armsUp ? 4 : 10);
  } else {
    // a seamstress at her stool, mending, a thimble on her finger
    p.rect(4, 16, 12, 4, c('wood', 1)).rect(4, 16, 12, 1, c('wood', 3));
    blob(p, 10, 11, 4.4, 5, R('purple'), 0, 2);
    face(10, 5, happy);
    p.rect(7, 2, 7, 2, c('hair', 1));
    if (armsUp) p.line(7, 9, 4, 4, c('skin', 2)).line(13, 9, 16, 4, c('skin', 2));
    else p.rect(12, 11, 5, 3, c('white', 2)).line(16, 9, 16, 13, c('steel', 3));
    if (happy) coin(armsUp ? 16 : 14, armsUp ? 3 : 10);
  }
  if (mood === 'thanks')
    for (const [x, y] of [
      [2, 2],
      [18, 3],
      [17, 9],
    ])
      p.set(x, y, c('grace', 2))
        .set(x - 1, y, c('grace', 0))
        .set(x + 1, y, c('grace', 0))
        .set(x, y - 1, c('grace', 0))
        .set(x, y + 1, c('grace', 0));
  return p;
}

/**
 * Adds a poor soul (three blocks: in need, thankful, glad) on `bg`. The first takes a coin, the
 * second gives the grace, the third is only a picture.
 */
export function addSoul(k: Kit, who: Soul, bg: () => Pixels, grav: number = GRAV.down): void {
  k.book.add(who, soul(k, bg(), who, 'need'), { effect: GOLD, eamt: -1, score: 50, grav, touch: `${who}Thanks` });
  k.book.add(`${who}Thanks`, soul(k, bg(), who, 'thanks'), { effect: GRACE, eamt: 1, score: 50, grav, touch: `${who}Glad` });
  k.book.add(`${who}Glad`, soul(k, bg(), who, 'glad'), { grav });
}

/** An eye gate: stone with a needle's eye glowing in it. One grace opens a gap one block high. */
export function addGate(k: Kit, stone: (seed: number) => Pixels, open: () => Pixels, name = 'gate'): void {
  const { c, R } = k;
  const g = stone(201);
  // the needle's eye: a tall glowing slot with a steel rim
  for (let y = 2; y < 18; y++) {
    const w = Math.round(Math.sin(((y - 2) / 16) * Math.PI) * 3.4);
    for (let x = 10 - w; x <= 10 + w; x++)
      g.set(x, y, Math.abs(x - 10) >= w - 0 && w > 0 ? c('steel', 3) : shadeAt(R('grace'), 0, 2, 1 - Math.abs(y - 10) / 9, x, y));
  }
  micro(g, 2, 14, '1', c('grace', 2));
  k.book.add(name, g, { solid: SOLID, effect: GRACE, eamt: -1, score: 100, touch: `${name}Open` });
  // opened: an arch one block high (the stone above it stays)
  const o = open();
  for (let x = 0; x < 20; x++) o.set(x, 0, c('stone', 2)).set(x, 1, c('stone', 1));
  o.set(1, 2, c('grace', 1)).set(18, 2, c('grace', 1));
  k.book.add(`${name}Open`, o, { grav: GRAV.down });
}

/** The good things along the road: dates (points and a bite), a jar of water (health), a golden lamp (an extra life). */
export function addGoodThings(k: Kit, bg: () => Pixels, suffix = ''): void {
  const { c, R } = k;
  // a cluster of dates: points
  const dates = bg();
  dates.line(10, 1, 10, 6, c('leaf', 1));
  for (const [x, y] of [
    [8, 8],
    [12, 8],
    [10, 11],
    [7, 12],
    [13, 12],
    [10, 15],
    [8, 15],
    [12, 15],
  ])
    blob(dates, x, y, 2, 2.4, R('wood'), 2, 4, 1.3);
  k.book.add(`dates${suffix}`, dates, { score: 50, hp: 5, touch: `bg${suffix}`, grav: GRAV.down });
  // a jar of water: health
  const jar = bg();
  blob(jar, 10, 13, 5.4, 5.6, R('red'), 0, 2);
  jar.rect(7, 4, 6, 4, c('red', 1)).rect(6, 3, 8, 2, c('red', 2)).rect(8, 4, 4, 1, c('water', 3));
  jar.line(6, 14, 14, 14, c('red', 0));
  k.book.add(`jar${suffix}`, jar, { hp: 30, score: 10, touch: `bg${suffix}`, grav: GRAV.down });
  // a golden oil lamp: an extra life
  const lamp = bg();
  blob(lamp, 10, 14, 7, 3.4, R('gold'), 1, 4);
  lamp.line(16, 13, 19, 10, c('gold', 2)).line(4, 13, 2, 11, c('gold', 2));
  lamp.disc(18, 7, 1.8, c('star', 2)).set(18, 5, c('white', 2)).set(18, 6, c('star', 1));
  k.book.add(`lamp${suffix}`, lamp, { effect: LIFE, eamt: 1, score: 100, touch: `bg${suffix}`, grav: GRAV.down });
}
