// The parade's other blocks, in the poster inks: the gust meter and the card box (Gust), the fire hall crew, the
// float's parts and the float (The Float), Gigi's confetti cannons, the beat drums and the notes (Drum-Off), the
// confetti and balloons (Step Off), and the Ridgemont band in purple with, at the end, a llama in a parade blanket.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { PULL, SOLID } from '../../kit/starter/book';
import { halftone, inkLine, paperOf, stripes, type Pal } from './print';
import type { PBook } from './base';
import { CARDS } from './town';

const T = 255;
const air = { grav: PULL.down };
/** The counter the float's parts add to. */
export const PARTS = 24;
/** Cards the card box wants, parts the float wants. */
export const CARDS_WANTED = 4;
export const PARTS_WANTED = 3;
/** Ticks a beat lasts (twelve ticks, about two thirds of a second: 91 beats a minute, the drum-off's tempo). */
export const BEAT = 12;

/** `p` (drawn on transparent) inked and laid on the level's paper. */
const printed = (pal: Pal, p: Pixels): Pixels => new Pixels(p.w, p.h, paperOf(pal)).blit(inkLine(p, pal.c('ink', 0)), 0, 0, T);

/** The gust meter: GU ST on a navy plate, five teal segments that each go dark after their own number of ticks, and an end cap. */
export function addGust(book: PBook, pal: Pal, ticksEach: number): void {
  const { c } = pal;
  const panel = (): Pixels => {
    const p = new Pixels(20, 20, paperOf(pal));
    p.rect(0, 5, 20, 13, c('blue', 1)).rect(0, 5, 20, 1, c('ink', 0)).rect(0, 17, 20, 1, c('ink', 0));
    return p;
  };
  for (const [i, s] of ['GU', 'ST'].entries()) {
    const p = panel();
    text(p, 2, 8, s, c('paper', 3), 1, true);
    book.add(`gustLabel${i}`, p, air);
  }
  const cap = panel();
  cap.rect(17, 5, 3, 13, c('ink', 0));
  book.add('gustCap', cap, air);
  for (let i = 0; i < 5; i++) {
    const p = panel();
    p.rect(1, 7, 18, 9, c('teal', 3));
    stripes(p, 1, 7, 18, 9, c('teal', 4), 10, 3);
    book.add(`gust${i}`, p, air);
    book.time(`gust${i}`, 'gustOff', ticksEach * (i + 1));
  }
  const off = panel();
  off.rect(1, 7, 18, 9, c('blue', 0));
  halftone(off, 1, 7, 18, 9, c('blue', 2), 1);
  book.add('gustOff', off, air);
}

/** The card box: a navy mailbox with a slot and a vermilion flag; it takes four cards at once and then opens. */
export function addCardBox(book: PBook, pal: Pal): void {
  const { c } = pal;
  const box = (open: boolean): Pixels => {
    const p = new Pixels(20, 20, T);
    p.rect(8, 15, 4, 5, c('stone', 2)).rect(2, 3, 16, 13, c('blue', 2)).rect(2, 3, 16, 2, c('blue', 4));
    halftone(p, 2, 10, 16, 6, c('blue', 0), 2, [c('blue', 2)]);
    p.rect(5, 7, 10, 2, c('ink', 0));
    p.rect(17, open ? 7 : 0, 1, open ? 4 : 8, c('stone', 3)).rect(18, open ? 8 : 0, 2, 3, c('red', 2));
    if (open) p.rect(5, 10, 10, 4, c('white', 3)).rect(6, 11, 8, 1, c('red', 2));
    return printed(pal, p);
  };
  book.add('cardBox', box(false), { solid: SOLID, effect: CARDS, eamt: -CARDS_WANTED, score: 100, touch: 'cardBoxOpen' });
  book.add('cardBoxOpen', box(true), air);
}

/** A fire hall crew member in turnout gear, waving (two frames), the float's parts and the float itself. */
export function addHall(book: PBook, pal: Pal): void {
  const { c } = pal;
  const crew = (skin: string, wave: boolean): Pixels => {
    const p = new Pixels(20, 20, T);
    // a tan coat with brass reflective bands, a vermilion helmet with a long back brim
    p.rect(5, 11, 10, 9, c('gold', 2)).rect(5, 11, 2, 9, c('gold', 1));
    p.rect(5, 15, 10, 1, c('paper', 3)).rect(5, 18, 10, 1, c('paper', 3));
    p.rect(7, 5, 7, 6, c(skin, 2)).set(12, 7, c('ink', 0)).rect(11, 9, 2, 1, c(skin, 0));
    p.rect(6, 2, 8, 4, c('red', 2)).rect(4, 5, 12, 1, c('red', 1)).rect(6, 2, 8, 1, c('red', 4)).rect(9, 3, 2, 2, c('gold', 4));
    if (wave) p.rect(15, 4, 3, 8, c('gold', 2)).rect(15, 2, 3, 3, c(skin, 2));
    else p.rect(15, 12, 3, 6, c('gold', 2)).rect(15, 17, 3, 2, c(skin, 2));
    return printed(pal, p);
  };
  for (const [i, skin] of (['skinC', 'skinD'] as const).entries()) {
    book.add(`crew${i}a`, crew(skin, false), air);
    book.add(`crew${i}b`, crew(skin, true), air);
    book.time(`crew${i}a`, `crew${i}b`, 12 + i * 5).time(`crew${i}b`, `crew${i}a`, 12 + i * 5);
  }
  const part = (draw: (p: Pixels) => void): Pixels => {
    const p = new Pixels(20, 20, T);
    draw(p);
    return printed(pal, p);
  };
  const pickup = { ...air, effect: PARTS, eamt: 1, score: 25, touch: 'sky' };
  book.add(
    'partWheel',
    part((p) => {
      p.disc(10, 10, 7.5, c('ink', 1)).disc(10, 10, 5.5, c('red', 2));
      for (let k = 0; k < 4; k++) p.line(10, 10, Math.round(10 + 5 * Math.cos((k * Math.PI) / 2 + 0.4)), Math.round(10 + 5 * Math.sin((k * Math.PI) / 2 + 0.4)), c('paper', 3));
      p.disc(10, 10, 1.6, c('gold', 4));
    }),
    pickup,
  );
  book.add(
    'partStreamers',
    part((p) => {
      p.disc(10, 9, 6.5, c('blue', 2)).disc(10, 9, 4, c('paper', 3)).disc(10, 9, 2, c('red', 2));
      p.rect(6, 14, 3, 6, c('red', 2)).rect(11, 14, 3, 6, c('red', 2));
    }),
    pickup,
  );
  book.add(
    'partFlowers',
    part((p) => {
      p.rect(9, 10, 2, 9, c('green', 2));
      for (const [x, y, k] of [
        [6, 7, 'red'],
        [14, 7, 'gold'],
        [10, 4, 'orange'],
      ] as const)
        p.disc(x, y, 3.2, c(k, 3)).disc(x, y, 1, c('paper', 3));
    }),
    pickup,
  );
  const float = (done: boolean): Pixels => {
    const p = new Pixels(20, 20, T);
    p.rect(0, 7, 20, 10, c('blue', 2)).rect(0, 7, 20, 2, c('gold', 4));
    stripes(p, 0, 9, 20, 8, c('blue', 1), 10, 3);
    p.disc(5, 18, 2.6, c('ink', 1)).disc(15, 18, 2.6, c('ink', 1)).set(5, 18, c('stone', 3)).set(15, 18, c('stone', 3));
    if (done) {
      for (let x = 1; x < 20; x += 5) p.disc(x + 1, 5, 2.4, c(['red', 'gold', 'orange', 'red'][(x / 5) | 0], 3));
      p.rect(2, 10, 16, 4, c('paper', 3));
      text(p, 2, 9, 'TY', c('red', 1), 1, true);
    }
    return printed(pal, p);
  };
  book.add('floatGate', float(false), { solid: SOLID, effect: PARTS, eamt: -PARTS_WANTED, score: 100, touch: 'floatDone' });
  book.add('floatDone', float(true), air);
}

/** Gigi's confetti cannons (a squat purple barrel; firing, a burst of paper flecks), the four beat drums and a note to collect. */
export function addBeat(book: PBook, pal: Pal): void {
  const { c } = pal;
  const cannon = (fire: boolean): Pixels => {
    const p = new Pixels(20, 20, T);
    // the barrel points up, on a little brass base
    p.rect(5, 17, 10, 3, c('gold', 3)).rect(5, 17, 10, 1, c('gold', 5));
    p.rect(6, 9, 8, 8, c('purple', 2)).rect(6, 9, 2, 8, c('purple', 1)).rect(5, 8, 10, 2, c('purple', 3));
    p.rect(6, 12, 8, 1, c('silver', 3));
    if (fire) {
      // the burst: flecks of every ink thrown up and out, and a white puff at the mouth
      p.rect(7, 5, 6, 3, c('white', 3)).rect(8, 4, 4, 1, c('white', 3));
      for (const [x, y, k] of [
        [3, 3, 'red'],
        [8, 1, 'gold'],
        [13, 0, 'teal'],
        [17, 3, 'red'],
        [1, 7, 'gold'],
        [18, 7, 'teal'],
        [11, 2, 'orange'],
        [5, 0, 'teal'],
      ] as const)
        p.rect(x, y, 2, 2, c(k, 3));
    }
    return printed(pal, p);
  };
  // A: fires on the fourth beat. B: fires on the second.
  book.add('cannonA', cannon(false), air);
  book.add('cannonA!', cannon(true), { ...air, hp: -10, touch: 'cannonA' });
  book.time('cannonA', 'cannonA!', BEAT * 3).time('cannonA!', 'cannonA', BEAT);
  book.add('cannonB0', cannon(false), air);
  book.add('cannonB!', cannon(true), { ...air, hp: -10, touch: 'cannonB' });
  book.add('cannonB', cannon(false), air);
  book
    .time('cannonB0', 'cannonB!', BEAT)
    .time('cannonB!', 'cannonB', BEAT)
    .time('cannonB', 'cannonB!', BEAT * 3);
  // the beat meter: four snare drums, each lit on its own beat of four (the fourth in vermilion)
  const lamp = (on: boolean, k: number): Pixels => {
    const p = new Pixels(20, 20, T);
    const head = k === 3 ? 'red' : 'gold';
    p.rect(2, 6, 16, 10, on ? c(head, 3) : c('blue', 1));
    if (on) stripes(p, 2, 9, 16, 7, c(head, 1), 6, 2);
    else halftone(p, 2, 6, 16, 10, c('blue', 2), 2);
    p.rect(1, 4, 18, 3, on ? c('white', 3) : c('stone', 2)).rect(1, 15, 18, 2, on ? c('white', 3) : c('stone', 1));
    if (on) p.rect(4, 1, 1, 3, c('ink', 0)).rect(15, 1, 1, 3, c('ink', 0));
    return printed(pal, p);
  };
  for (let k = 0; k < 4; k++) {
    book.add(`lamp${k}on`, lamp(true, k), air);
    book.add(`lamp${k}`, lamp(false, k), air);
  }
  // drum k is lit during beat k: drum 0 starts lit; the others start dark for k beats
  book.time('lamp0on', 'lamp0', BEAT).time('lamp0', 'lamp0on', BEAT * 3);
  for (let k = 1; k < 4; k++) {
    book.add(`lamp${k}start`, lamp(false, k), air);
    book
      .time(`lamp${k}start`, `lamp${k}on`, BEAT * k)
      .time(`lamp${k}on`, `lamp${k}`, BEAT)
      .time(`lamp${k}`, `lamp${k}on`, BEAT * 3);
  }
  const note = new Pixels(20, 20, T);
  note.disc(7, 14, 3, c('gold', 3)).rect(9, 3, 2, 12, c('gold', 3)).rect(9, 3, 7, 3, c('gold', 3)).rect(14, 6, 2, 2, c('gold', 3)).set(6, 13, c('gold', 5));
  book.add('note', printed(pal, note), { ...air, score: 10, touch: 'sky' });
}

/** Confetti (three frames that tumble through the sky) and a bunch of balloons tied to a post. */
export function addFinale(book: PBook, pal: Pal): void {
  const { c } = pal;
  const cols = ['red', 'gold', 'teal', 'blue', 'orange', 'red'] as const;
  for (let f = 0; f < 3; f++) {
    const p = new Pixels(20, 20, paperOf(pal));
    for (let i = 0; i < 6; i++) {
      const x = (i * 7 + f * 5) % 18;
      const y = (i * 11 + f * 6) % 17;
      p.rect(x, y, (i + f) % 2 ? 3 : 2, (i + f) % 2 ? 2 : 3, c(cols[(i + f) % 6], 3));
    }
    book.add(`conf${f}`, p, air);
    book.time(`conf${f}`, `conf${(f + 1) % 3}`, 5);
  }
  const bal = (sway: number): Pixels => {
    const p = new Pixels(20, 20, T);
    for (const [x, y, k] of [
      [5, 6, 'red'],
      [10, 4, 'gold'],
      [15, 6, 'teal'],
    ] as const) {
      p.line(x + sway, y + 5, 10, 16, c('ink', 1));
      p.disc(x + sway, y, 3.6, c(k, 3)).set(x - 1 + sway, y - 2, c('white', 3));
    }
    p.rect(9, 16, 2, 4, c('wood', 2));
    return printed(pal, p);
  };
  book.add('balloons0', bal(0), air);
  book.add('balloons1', bal(1), air);
  book.time('balloons0', 'balloons1', 14).time('balloons1', 'balloons0', 14);
}

/** The Ridgemont Precision Brass in their purple (two members, top and bottom blocks) and, for the last level, a llama. */
export function addRivals(book: PBook, pal: Pal, llama = false): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const member = (horn: boolean): Pixels => {
    const p = new Pixels(20, 40, T);
    const skin = horn ? 'skinD' : 'skinC';
    // a white-plumed purple shako, a purple coat with silver frogging, gray trousers
    p.rect(6, 4, 8, 7, c('purple', 2)).rect(6, 4, 2, 7, c('purple', 1)).rect(6, 9, 8, 1, c('silver', 3)).rect(9, 0, 3, 4, c('white', 3));
    p.rect(7, 11, 6, 7, c(skin, 2)).set(11, 13, ink).rect(10, 16, 2, 1, c(skin, 0));
    p.rect(5, 18, 10, 11, c('purple', 2)).rect(5, 18, 2, 11, c('purple', 1));
    for (const y of [20, 23, 26]) p.rect(8, y, 5, 1, c('silver', 3));
    p.rect(6, 29, 3, 8, c('stone', 2)).rect(11, 29, 3, 8, c('stone', 3)).rect(5, 37, 4, 3, c('ink', 1)).rect(11, 37, 4, 3, c('ink', 1));
    if (horn) p.rect(12, 20, 6, 2, c('silver', 3)).rect(17, 18, 3, 6, c('silver', 3)).rect(13, 22, 3, 2, c(skin, 2));
    else p.rect(14, 2, 1, 21, c('silver', 2)).rect(13, 21, 3, 3, c(skin, 2)); // holding a pole up
    return p;
  };
  [member(false), member(true)].forEach((p, i) => {
    const out = printed(pal, p);
    book.add(`rival${i}Top`, out.crop(0, 0, 20, 20), air);
    book.add(`rival${i}`, out.crop(0, 20, 20, 20), air);
  });
  if (llama) {
    // a llama in a parade blanket: cream wool, a long neck, tall ears, a vermilion blanket with brass trim
    const p = new Pixels(20, 40, T);
    p.rect(2, 20, 15, 9, c('paper', 3)).rect(2, 27, 15, 2, c('paper', 2));
    p.rect(13, 6, 5, 16, c('paper', 3)).rect(14, 4, 5, 5, c('paper', 3)).rect(19, 6, 1, 3, c('paper', 2));
    p.rect(14, 1, 1, 4, c('paper', 3)).rect(17, 1, 1, 4, c('paper', 3));
    p.set(17, 6, ink);
    p.rect(5, 20, 8, 7, c('red', 2)).rect(5, 20, 8, 1, c('gold', 4)).rect(5, 26, 8, 1, c('gold', 4));
    halftone(p, 5, 21, 8, 5, c('red', 1), 2, [c('red', 2)]);
    for (const x of [3, 6, 12, 15]) p.rect(x, 29, 2, 10, c('paper', 2)).rect(x, 39, 2, 1, c('wood', 1));
    const out = printed(pal, p);
    book.add('llamaTop', out.crop(0, 0, 20, 20), air);
    book.add('llama', out.crop(0, 20, 20, 20), air);
  }
}
