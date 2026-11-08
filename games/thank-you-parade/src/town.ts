// The parade's town blocks, in the poster inks: the street (navy asphalt, a sidewalk with a striped parade curb), shop
// fronts (vermilion brick or teal clapboard, windows with posters in them, striped awnings, brass cornices), pennant
// bunting, flagpoles with a waving flag, the thank-you card, and the veterans on lawn chairs along the curb who hold up
// scorecards like judges (each has three looks: judging, tipping a cap when handed a card, and holding the card up
// beside a fresh 10). Everything you walk in front of is air (it pulls down).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID } from '../../kit/starter/book';
import { halftone, inkLine, paperOf, stripes, type Pal } from './print';
import type { PBook } from './base';

/** Points for a card caught, and for a veteran handed one. */
export const CARD_POINTS = 10;
export const VET_POINTS = 50;
/** The counter that carries thank-you cards (counters 20 to 29 are free for a game; 20 to 22 are the band's three things). */
export const CARDS = 23;

const air = { grav: PULL.down };
const T = 255;
const printed = (pal: Pal, p: Pixels): Pixels => new Pixels(p.w, p.h, paperOf(pal)).blit(inkLine(p, pal.c('ink', 0)), 0, 0, T);

/** The street: road, sidewalk, and the far-off town behind it (rooftops, lit windows, walls). */
export function addStreet(book: PBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  {
    const p = new Pixels(20, 20, c('blue', 1));
    halftone(p, 0, 0, 20, 20, c('blue', 0), 2);
    book.add('road', p, { solid: SOLID });
    const q = new Pixels(20, 20, c('blue', 1));
    halftone(q, 0, 0, 20, 20, c('blue', 0), 2);
    q.rect(2, 9, 10, 3, c('gold', 4));
    book.add('roadLine', q, { solid: SOLID });
  }
  {
    // the sidewalk: pale slabs with a vermilion-and-paper parade curb along the front
    const w = new Pixels(20, 20, c('stone', 4));
    w.rect(0, 0, 20, 1, c('white', 3)).rect(19, 0, 1, 12, c('stone', 2));
    halftone(w, 0, 2, 20, 10, c('stone', 3), 1);
    w.rect(0, 12, 20, 8, c('paper', 3));
    stripes(w, 0, 12, 20, 8, c('red', 2), 10, 5);
    w.rect(0, 12, 20, 1, ink).rect(0, 19, 20, 1, ink);
    book.add('walk', w, { solid: SOLID });
  }
  {
    // the town far off: navy halftone buildings, rows of paper windows, two kinds of roofline
    const wall = new Pixels(20, 20, c('blue', 3));
    halftone(wall, 0, 0, 20, 20, c('paper', 2), 1);
    book.add('cityWall', wall, air);
    const win = wall.crop(0, 0, 20, 20);
    for (const x of [3, 11]) win.rect(x, 5, 5, 8, c('paper', 3)).rect(x, 9, 5, 1, c('blue', 3));
    book.add('cityWin', win, air);
    const top = new Pixels(20, 20, paperOf(pal));
    top.rect(0, 8, 20, 12, c('blue', 3)).rect(0, 6, 20, 2, c('blue', 2));
    halftone(top, 0, 8, 20, 12, c('paper', 2), 1, [c('blue', 3)]);
    book.add('cityTop', top, air);
    const topB = new Pixels(20, 20, paperOf(pal));
    topB.rect(0, 12, 20, 8, c('blue', 3)).rect(4, 4, 12, 8, c('blue', 3)).rect(9, 0, 2, 4, c('blue', 2));
    halftone(topB, 0, 4, 20, 16, c('paper', 2), 1, [c('blue', 3)]);
    book.add('cityTopB', topB, air);
  }
}

/** Pennant bunting (two blocks that alternate), a flagpole with a brass ball, and a flag that waves (two frames). */
export function addFlags(book: PBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const inks = ['red', 'blue', 'gold', 'teal'];
  for (const [name, a, b] of [
    ['bunting0', 0, 1],
    ['bunting1', 2, 3],
  ] as const) {
    const p = new Pixels(20, 20, T);
    p.rect(0, 3, 20, 1, ink);
    for (const [x, k] of [
      [1, a],
      [11, b],
    ] as const) {
      for (let i = 0; i < 9; i++) p.rect(x + Math.floor(i / 2), 4 + i, 8 - i, 1, c(inks[k], 3));
    }
    book.add(name, new Pixels(20, 20, paperOf(pal)).blit(p, 0, 0, T), air);
  }
  const pole = new Pixels(20, 20, paperOf(pal));
  pole.rect(9, 0, 2, 20, c('silver', 2)).rect(9, 0, 1, 20, c('silver', 3)).rect(8, 0, 1, 20, ink).rect(11, 0, 1, 20, ink);
  book.add('pole', pole, air);
  const top = new Pixels(20, 20, T);
  top.rect(9, 4, 2, 16, c('silver', 2)).disc(10, 3, 2.4, c('gold', 4));
  book.add('poleTop', printed(pal, top), air);
  // the flag: a navy field with rows of paper dots for stars, vermilion and paper stripes, two frames of a ripple
  const flag = (frame: number): Pixels => {
    const p = new Pixels(40, 20, T);
    for (let x = 0; x < 38; x++) {
      const dy = Math.round(Math.sin((x / 38) * Math.PI * 2 + frame * Math.PI) * 1.5);
      for (let s = 0; s < 7; s++) p.rect(x, 2 + dy + s * 2, 1, 2, s % 2 ? c('paper', 3) : c('red', 2));
      if (x < 16) {
        p.rect(x, 2 + dy, 1, 8, c('blue', 2));
        for (let y = 0; y < 8; y += 3) if (x % 4 === 1 && (x + y) % 2 === 1) p.set(x, 3 + dy + y, c('paper', 3));
      }
    }
    return printed(pal, p);
  };
  for (const [frame, base] of [
    [0, 'flagA'],
    [1, 'flagB'],
  ] as const) {
    const f = flag(frame);
    book.add(`${base}0`, f.crop(0, 0, 20, 20), air);
    book.add(`${base}1`, f.crop(20, 0, 20, 20), air);
  }
  book.time('flagA0', 'flagB0', 9).time('flagB0', 'flagA0', 9).time('flagA1', 'flagB1', 9).time('flagB1', 'flagA1', 9);
}

/** The thank-you card: a paper envelope with a vermilion stripe and a brass seal. */
export function addCard(book: PBook, pal: Pal): void {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(3, 6, 14, 10, c('white', 3)).rect(3, 6, 14, 2, c('red', 2));
  p.line(3, 8, 10, 12, c('paper', 1)).line(16, 8, 10, 12, c('paper', 1));
  p.disc(10, 12, 1.8, c('gold', 4));
  book.add('card', printed(pal, p), { ...air, score: CARD_POINTS, effect: CARDS, eamt: 1, touch: 'sky' });
}

/** Digits 3 pixels wide and 5 high, for the scorecards (rows top to bottom, # is ink). */
const DIGITS: Record<string, string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
};
function score(p: Pixels, x: number, y: number, n: string, col: number): void {
  [...n].forEach((d, k) => DIGITS[d].forEach((row, v) => [...row].forEach((ch, u) => ch === '#' && p.set(x + k * 4 + u, y + v, col))));
}

/** Four veterans on lawn chairs, each judging with a scorecard (and a different first score), then a cap tip, then a 10. */
export function addNeighbors(book: PBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const looks: { skin: string; hair: string; coat: string; cap: string; score: string }[] = [
    { skin: 'skinB', hair: 'silver', coat: 'green', cap: 'blue', score: '7' },
    { skin: 'skinC', hair: 'silver', coat: 'blue', cap: 'red', score: '9' },
    { skin: 'skin', hair: 'hair', coat: 'leather', cap: 'teal', score: '8' },
    { skin: 'skinD', hair: 'white', coat: 'purple', cap: 'blue', score: '6' },
  ];
  looks.forEach((l, i) => {
    const draw = (state: 'judge' | 'tip' | 'done'): Pixels => {
      const p = new Pixels(20, 20, T);
      // the lawn chair: teal and paper webbing on a silver frame
      p.rect(2, 9, 3, 9, c('teal', 2));
      stripes(p, 2, 9, 3, 9, c('paper', 3), 4, 2);
      p.rect(2, 17, 15, 2, c('silver', 2)).rect(3, 19, 1, 1, c('silver', 1)).rect(15, 19, 1, 1, c('silver', 1));
      // seated: a coat, trousers to the knee, the head and a cap
      p.rect(5, 10, 7, 7, c(l.coat, 2)).rect(5, 10, 2, 7, c(l.coat, 1));
      p.rect(9, 15, 7, 3, c('stone', 2)).rect(15, 15, 2, 5, c('stone', 2)).rect(15, 19, 3, 1, ink);
      p.rect(6, 4, 6, 6, c(l.skin, 2)).rect(11, 5, 1, 4, c(l.skin, 3));
      p.rect(6, 4, 2, 4, c(l.hair, 2));
      p.set(10, 6, ink);
      const cap = () => p.rect(6, 2, 7, 2, c(l.cap, 2)).rect(11, 3, 3, 1, c(l.cap, 1));
      if (state === 'judge') {
        cap();
        p.rect(9, 8, 2, 1, c(l.skin, 0));
        // the scorecard held up: paper with a navy number
        p.rect(14, 6, 2, 5, c(l.coat, 2)).rect(12, 0, 7, 7, c('white', 3));
        score(p, 14, 1, l.score, c('blue', 0));
      } else if (state === 'tip') {
        p.rect(9, 8, 3, 1, ink);
        p.rect(13, 3, 2, 7, c(l.coat, 2)).rect(12, 0, 6, 2, c(l.cap, 2)).rect(15, 2, 3, 1, c(l.cap, 1));
      } else {
        cap();
        p.rect(9, 8, 3, 1, ink).set(12, 7, c('pink', 2));
        p.rect(5, 12, 6, 4, c('white', 3)).rect(5, 12, 6, 1, c('red', 2)); // the card in the lap
        p.rect(12, 0, 8, 7, c('white', 3)).rect(14, 7, 2, 4, c(l.coat, 2));
        score(p, 13, 1, '10', c('red', 1));
      }
      return printed(pal, p);
    };
    const rules = { ...air, score: VET_POINTS, effect: CARDS, eamt: -1 };
    book.add(`vet${i}`, draw('judge'), { ...rules, touch: `vet${i}Tip` });
    book.add(`vet${i}Tip`, draw('tip'), air);
    book.add(`vet${i}Done`, draw('done'), air);
    book.time(`vet${i}Tip`, `vet${i}Done`, 30);
  });
}
