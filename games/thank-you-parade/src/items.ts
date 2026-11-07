// The parade's other blocks: the gust meter and the card box (level 2), the fire hall crew and the float's parts
// (level 3), the squirting puddles, the beat lamps and the notes (level 4), and the confetti and balloons (level 6).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { PULL, SOLID } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { PBook } from './base';
import { CARDS } from './town';

const air = { grav: PULL.down };
/** The counter the float's parts add to. */
export const PARTS = 24;
/** Cards the card box wants, parts the float wants. */
export const CARDS_WANTED = 4;
export const PARTS_WANTED = 3;
/** Ticks a beat lasts (twelve ticks, about two thirds of a second: a march at 90 beats a minute). */
export const BEAT = 12;

/** The gust meter: GU ST, five segments that each go dark after their own number of ticks, and an end cap. */
export function addGust(book: PBook, pal: Pal, ticksEach: number): void {
  const { c } = pal;
  const S = skyOf(pal);
  const panel = (): Pixels => {
    const p = new Pixels(20, 20, S);
    p.rect(0, 6, 20, 12, c('ink', 0)).rect(0, 6, 20, 1, c('stone', 3)).rect(0, 17, 20, 1, c('stone', 1));
    return p;
  };
  for (const [i, s] of ['GU', 'ST'].entries()) {
    const p = panel();
    text(p, 2, 9, s, c('gold', 5));
    book.add(`gustLabel${i}`, p, air);
  }
  const cap = panel();
  cap.rect(17, 6, 3, 12, c('ink', 0)).rect(19, 6, 1, 12, c('stone', 2));
  book.add('gustCap', cap, air);
  for (let i = 0; i < 5; i++) {
    const p = panel();
    p.rect(1, 8, 18, 8, c('teal', 3)).rect(1, 8, 18, 2, c('teal', 4)).rect(1, 15, 18, 1, c('teal', 1));
    p.rect(3, 11, 6, 1, c('white', 3)).rect(10, 12, 5, 1, c('white', 3)); // a swirl of wind
    book.add(`gust${i}`, p, air);
    book.time(`gust${i}`, 'gustOff', ticksEach * (i + 1));
  }
  const off = panel();
  off.rect(1, 8, 18, 8, c('ink', 1)).rect(1, 8, 18, 1, c('ink', 2));
  book.add('gustOff', off, air);
}

/** The card box: a blue box with a slot and a red flag; it takes four cards at once and then opens. */
export function addCardBox(book: PBook, pal: Pal): void {
  const { c } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  const box = (open: boolean): Pixels => {
    const p = new Pixels(20, 20, S);
    p.rect(8, 15, 4, 5, c('stone', 2)).rect(2, 4, 16, 12, c('blue', 3)).rect(2, 4, 16, 3, c('blue', 4)).rect(2, 13, 16, 3, c('blue', 1));
    p.rect(5, 8, 10, 2, ink).rect(5, 7, 10, 1, c('blue', 0));
    p.rect(17, open ? 7 : 0, 1, open ? 4 : 8, c('stone', 3)).rect(18, open ? 8 : 0, 2, 3, c('red', 3));
    if (open) p.rect(5, 11, 10, 3, c('white', 3)).rect(6, 11, 8, 1, c('red', 3));
    return outline(p, ink, { transparent: S });
  };
  book.add('cardBox', box(false), { solid: SOLID, effect: CARDS, eamt: -CARDS_WANTED, score: 100, touch: 'cardBoxOpen' });
  book.add('cardBoxOpen', box(true), air);
}

/** A fire hall crew member waving (two frames), the float's parts and the float itself. */
export function addHall(book: PBook, pal: Pal): void {
  const { c, r } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  const crew = (coat: string, wave: boolean): Pixels => {
    const p = new Pixels(20, 20, S);
    blob(p, 10, 15, 6, 5.6, r(coat), 0, 4);
    p.rect(6, 17, 3, 3, c('ink', 1)).rect(11, 17, 3, 3, c('ink', 1));
    blob(p, 10, 8, 4.2, 4.4, r('skin'), 0, 3);
    p.rect(5, 2, 10, 4, c('red', 3)).rect(5, 2, 10, 1, c('red', 4)).rect(4, 5, 12, 1, c('red', 1)).rect(8, 0, 4, 2, c('red', 2)); // a work helmet
    p.set(8, 8, ink).set(12, 8, ink).set(8, 10, ink).set(9, 11, ink).set(10, 11, ink).set(11, 11, ink).set(12, 10, ink);
    p.rect(5, 14, 10, 1, c('gold', 4)); // a reflective stripe
    if (wave) p.line(15, 13, 18, 4, r(coat)[2]).line(16, 13, 19, 4, r(coat)[3]).disc(18, 3, 1.8, r('skin')[2]);
    else p.disc(4, 15, 1.7, r('skin')[2]).disc(16, 15, 1.7, r('skin')[2]);
    return outline(p, ink, { transparent: S });
  };
  for (const [i, coat] of (['blue', 'purple'] as const).entries()) {
    book.add(`crew${i}a`, crew(coat, false), air);
    book.add(`crew${i}b`, crew(coat, true), air);
    book.time(`crew${i}a`, `crew${i}b`, 12 + i * 5).time(`crew${i}b`, `crew${i}a`, 12 + i * 5);
  }
  const part = (draw: (p: Pixels) => void): Pixels => {
    const p = new Pixels(20, 20, S);
    draw(p);
    return outline(p, ink, { transparent: S });
  };
  const pickup = { ...air, effect: PARTS, eamt: 1, score: 25, touch: 'sky' };
  book.add(
    'partWheel',
    part((p) => {
      p.disc(10, 10, 7.5, c('stone', 1)).disc(10, 10, 6, c('stone', 4));
      for (let k = 0; k < 6; k++)
        p.line(10, 10, Math.round(10 + 5.5 * Math.cos((k * Math.PI) / 3 + 0.3)), Math.round(10 + 5.5 * Math.sin((k * Math.PI) / 3 + 0.3)), c('stone', 1));
      p.disc(10, 10, 2.2, c('stone', 1)).disc(10, 10, 1, c('gold', 4));
    }),
    pickup,
  );
  book.add(
    'partStreamers',
    part((p) => {
      p.disc(10, 10, 6.5, c('pink', 3)).disc(10, 10, 3, c('white', 3)).disc(10, 10, 1.2, c('pink', 1));
      p.line(15, 14, 18, 19, c('gold', 4)).line(5, 14, 2, 19, c('teal', 3)).line(10, 16, 10, 20, c('red', 3));
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
        [10, 4, 'pink'],
      ] as const)
        p.disc(x, y, 3.2, r(k)[3]).disc(x, y, 1.2, c('white', 3));
    }),
    pickup,
  );
  const float = (done: boolean): Pixels => {
    const p = new Pixels(20, 20, S);
    p.rect(0, 6, 20, 11, c('wood', 3)).rect(0, 6, 20, 2, c('wood', 4)).rect(0, 15, 20, 2, c('wood', 1));
    p.rect(2, 17, 6, 3, ink).rect(12, 17, 6, 3, ink).disc(5, 18, 2.4, c('stone', 4)).disc(15, 18, 2.4, c('stone', 4));
    if (done) {
      for (let x = 2; x < 20; x += 5) p.disc(x + 1, 9, 2.6, r(['red', 'gold', 'pink', 'blue'][(x / 5) | 0])[3]);
      p.rect(0, 2, 20, 4, c('white', 3)).rect(0, 2, 20, 1, c('red', 3)).rect(0, 5, 20, 1, c('blue', 2));
    }
    return outline(p, ink, { transparent: S });
  };
  book.add('floatGate', float(false), { solid: SOLID, effect: PARTS, eamt: -PARTS_WANTED, score: 100, touch: 'floatDone' });
  book.add('floatDone', float(true), air);
}

/** The squirting puddles (a splash of drops, never a stream), the four beat lamps and a note to collect. */
export function addBeat(book: PBook, pal: Pal): void {
  const { c } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  const puddle = (splash: boolean): Pixels => {
    const p = new Pixels(20, 20, S);
    blob(p, 10, 17.5, 9.4, 2.5, pal.r('blue'), 1, 4);
    p.rect(5, 17, 3, 1, c('white', 3));
    if (splash) {
      // a crown of drops thrown up in an arch, no two in a line
      for (const [x, y] of [
        [3, 12],
        [6, 7],
        [10, 4],
        [14, 7],
        [17, 12],
        [8, 12],
        [12, 12],
      ] as const)
        p.disc(x, y, 1.6, c('blue', 4)).set(x, y - 1, c('white', 3));
    }
    return outline(p, ink, { transparent: S });
  };
  // A: squirts on the fourth beat. B: squirts on the second.
  book.add('puddleA', puddle(false), air);
  book.add('puddleA!', puddle(true), { ...air, hp: -10, touch: 'puddleA' });
  book.time('puddleA', 'puddleA!', BEAT * 3).time('puddleA!', 'puddleA', BEAT);
  book.add('puddleB0', puddle(false), air);
  book.add('puddleB!', puddle(true), { ...air, hp: -10, touch: 'puddleB' });
  book.add('puddleB', puddle(false), air);
  book
    .time('puddleB0', 'puddleB!', BEAT)
    .time('puddleB!', 'puddleB', BEAT)
    .time('puddleB', 'puddleB!', BEAT * 3);
  // the beat meter: four drums, each lit on its own beat of four
  const lamp = (on: boolean, k: number): Pixels => {
    const p = new Pixels(20, 20, S);
    p.rect(0, 4, 20, 14, ink).rect(0, 4, 20, 1, c('stone', 3));
    const col = k === 3 ? 'red' : 'gold';
    p.disc(10, 11, 5.4, on ? c(col, 4) : c('ink', 1)).ring(10, 11, 5.4, on ? c('white', 3) : c('ink', 2));
    if (on) p.disc(10, 11, 2.4, c('white', 3));
    return p;
  };
  for (let k = 0; k < 4; k++) {
    book.add(`lamp${k}on`, lamp(true, k), air);
    book.add(`lamp${k}`, lamp(false, k), air);
  }
  // lamp k is lit during beat k: lamp 0 starts lit; the others start dark for k beats
  book.time('lamp0on', 'lamp0', BEAT).time('lamp0', 'lamp0on', BEAT * 3);
  for (let k = 1; k < 4; k++) {
    book.add(`lamp${k}start`, lamp(false, k), air);
    book
      .time(`lamp${k}start`, `lamp${k}on`, BEAT * k)
      .time(`lamp${k}on`, `lamp${k}`, BEAT)
      .time(`lamp${k}`, `lamp${k}on`, BEAT * 3);
  }
  const note = new Pixels(20, 20, S);
  note
    .disc(7, 14, 3.4, ink)
    .disc(7, 14, 2.4, c('gold', 4))
    .rect(9, 3, 2, 12, ink)
    .rect(10, 3, 1, 11, c('gold', 4))
    .rect(10, 3, 6, 3, ink)
    .rect(11, 4, 4, 1, c('gold', 4));
  book.add('note', note, { ...air, score: 10, touch: 'sky' });
}

/** Confetti (three frames that tumble through the sky) and a bunch of balloons tied to a post. */
export function addFinale(book: PBook, pal: Pal): void {
  const { r } = pal;
  const S = skyOf(pal);
  const cols = ['red', 'gold', 'blue', 'pink', 'green', 'orange'] as const;
  for (let f = 0; f < 3; f++) {
    const p = new Pixels(20, 20, S);
    for (let i = 0; i < 7; i++) {
      const x = (i * 7 + f * 5) % 18;
      const y = (i * 11 + f * 6) % 17;
      p.rect(x, y, 3, 2, r(cols[(i + f) % 6])[3]).set(x, y, r(cols[(i + f) % 6])[4]);
    }
    book.add(`conf${f}`, p, air);
    book.time(`conf${f}`, `conf${(f + 1) % 3}`, 5);
  }
  const bal = (sway: number): Pixels => {
    const p = new Pixels(20, 20, S);
    p.line(10, 12, 10 + sway, 19, pal.c('stone', 2));
    for (const [x, y, k] of [
      [5, 6, 'red'],
      [10, 4, 'gold'],
      [15, 6, 'blue'],
    ] as const) {
      blob(p, x + sway / 2, y, 4, 5, r(k), 0, 4);
      p.set(x - 1 + sway / 2, y - 2, pal.c('white', 3));
      p.line(x + sway / 2, y + 5, 10, 12, pal.c('stone', 2));
    }
    return outline(p, pal.c('ink', 0), { transparent: S });
  };
  book.add('balloons0', bal(0), air);
  book.add('balloons1', bal(2), air);
  book.time('balloons0', 'balloons1', 14).time('balloons1', 'balloons0', 14);
}
