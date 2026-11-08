// The two scenes to watch after the reveal. Each is a short list of STOPS the bot (and a player) walks to: read a
// sign, or wait there for something to change on the clock; the way on opens when the scene is done.
//   farside  FROM THE OTHER SIDE (the bakery, at its round window): a logbook by the window, a new star noted
//              "low in the west"; then, across the yards, a small round light blinks on: Nell's own scope lamp
//   moonrise   MOONRISE (the roof, the last night): supper laid again on its cloth; the real moon climbs out of the
//              haze, silver and with no sill at all; next door, the bakery's round window goes dark
import { Pixels, dither } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../../kit/starter/book';
import type { Pal } from '../../../kit/starter/palette';
import { addSign, type Sign } from '../../../kit/starter/sign';
import { roundLight, table } from '../art';
import { addSigns, startBook, type Level, type Timed } from '../level';
import { G, paintRoom, type Place, type Step } from '../place';
import { shutUntil } from './watch';

/** One stop on a watched scene: read the sign at `x`, or stand at `x` until the clock passes `until`. */
export type Stop = { x: number; read: string } | { x: number; until: number; what: string };

export interface WatchAt {
  width: number;
  stops: Stop[];
  /** When the way on opens. */
  open: number;
}

const still = { grav: 4 };

/** A picture `w`x`h` blocks put down as blocks named `name`xy, at (x0, y0); returns the names. */
function stamp(book: Book, m: Place | null, pic: Pixels, name: string, x0: number, y0: number): void {
  for (let y = 0; y < pic.h / 20; y++)
    for (let x = 0; x < pic.w / 20; x++) {
      const n = `${name}${x}${y}`;
      if (!book.pics.has(n)) book.add(n, pic.crop(x * 20, y * 20, 20, 20), still);
      m?.set(x0 + x, y0 + y, n);
    }
}

/** Where the blocks of picture `a` differ from `b`, `a`'s block turns into `b`'s at `ticks`. */
function changeAt(book: Book, timed: Timed[], a: Pixels, b: Pixels, nameA: string, nameB: string, ticks: number): void {
  for (let y = 0; y < a.h / 20; y++)
    for (let x = 0; x < a.w / 20; x++) {
      const ca = a.crop(x * 20, y * 20, 20, 20);
      const cb = b.crop(x * 20, y * 20, 20, 20);
      if (ca.px.every((v, i) => v === cb.px[i])) continue;
      book.add(`${nameB}${x}${y}`, cb, still);
      timed.push({ name: `${nameA}${x}${y}`, next: `${nameB}${x}${y}`, ticks });
    }
}

/** A sign that reads ". . ." until `ticks`, then its words. */
function laterSign(book: Book, pal: Pal, timed: Timed[], key: string, text: string, w: number, h: number, ticks: number): Sign {
  const words = addSign(book, pal, key, text, w, h);
  const blank = addSign(book, pal, `${key}0`, '. . .', w, h);
  words.board.flat().forEach((n, i) => timed.push({ name: blank.board.flat()[i], next: n, ticks }));
  return blank;
}

const plan = (signs: Record<string, number>): Step[] => Object.entries(signs).map(([key, x]) => ({ t: 'sign', x, key }));

/** The bakery scene's clock and places. */
export const OTHERSIDE = { blink: 420, open: 900 } as const;
export const OTHERSIDE_AT: WatchAt & { signs: Record<string, number>; window: [number, number] } = {
  width: 40,
  window: [17, 2],
  signs: { book: 3, log: 8, mine: 26 },
  stops: [
    { x: 4, read: 'the logbook sign' },
    { x: 9, read: 'the log entry' },
    { x: 19, until: OTHERSIDE.blink + 80, what: 'the light across the yards' },
    { x: 27, read: 'the lamp sign' },
  ],
  open: OTHERSIDE.open,
};

/** The round window from inside, 4x4 blocks: the night, the snowy roofs across the yards, a far lamp off or on. */
function insideWindow(pal: Pal, bg: Pixels, lamp: boolean): Pixels {
  const p = new Pixels(80, 80);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) p.blit(bg, x * 20, y * 20);
  const sky = pal.r('sky');
  const glass = new Pixels(80, 80);
  gradient(glass, 0, 0, 80, 80, sky, 0, 3);
  // the roofs across the yards: dark, snow along their edges, one chimney
  for (let x = 0; x < 80; x++) {
    const top = 52 + Math.round(Math.abs(((x % 40) - 20) / 3));
    for (let y = top; y < 80; y++) glass.set(x, y, y === top || y === top + 1 ? pal.c('white', 2) : pal.c('ink', 0));
  }
  glass.rect(52, 40, 6, 14, pal.c('ink', 0)).rect(51, 40, 8, 2, pal.c('white', 2));
  // the little round window over there, and the lamp in it
  glass.disc(30, 62, 4, pal.c('ink', 1));
  if (lamp) glass.disc(30, 62, 3.4, pal.c('warm', 2)).disc(29, 61, 1.8, pal.c('warm', 3));
  for (const [x, y] of [
    [14, 12],
    [44, 8],
    [62, 22],
    [26, 30],
  ])
    glass.set(x, y, pal.c('white', 3));
  const wood = pal.r('cab');
  for (let y = 0; y < 80; y++)
    for (let x = 0; x < 80; x++) {
      const d = Math.hypot(x - 39.5, y - 39.5);
      if (d < 33) p.set(x, y, glass.get(x, y));
      else if (d < 38) p.set(x, y, d < 34.5 ? wood[0] : dither(x, y, (d - 34) / 4) ? wood[1] : wood[2]);
    }
  // the mullion: one upright bar, as the window looked from the roof
  p.rect(38, 6, 4, 68, wood[1]).rect(38, 6, 1, 68, wood[2]);
  return p;
}

export function levelOtherside(pal: Pal): Level {
  const A = OTHERSIDE_AT;
  const { book, timed } = startBook(pal, 'bakery', { lean: true });
  const bg = book.pics.get('bg')!;
  shutUntil(pal, book, timed, A.open);
  const off = insideWindow(pal, bg, false);
  stamp(book, null, off, 'ow', 0, 0);
  changeAt(book, timed, off, insideWindow(pal, bg, true), 'ow', 'on', OTHERSIDE.blink);
  const s = addSigns(book, pal, {
    book: ["A LOGBOOK BY THE WINDOW. NOT NELL'S.", 4, 3],
    log: ['NEW STAR, LOW IN THE WEST. BLINKS WHEN SOMEONE WALKS PAST IT.', 4, 4],
  });
  s.mine = laterSign(book, pal, timed, 'mine', "THAT IS NELL'S LAMP. SHE HAS BEEN SOMEONE'S STAR ALL NIGHT.", 4, 4, OTHERSIDE.blink + 40);
  addSigns(book, pal, {});
  const m = paintRoom(book, A.width, [], {}, false, s);
  stamp(book, m, off, 'ow', A.window[0], A.window[1]);
  for (const [k, x] of Object.entries(A.signs)) m.sign(x, G - 1 - s[k].board.length, s[k]);
  m.set(A.width - 3, G - 2, 'shutTop').set(A.width - 3, G - 1, 'shutBot');
  return {
    file: 'farside',
    title: 'From the Other Side',
    hint: 'The view back.',
    look: 'bakery',
    map: m,
    book,
    timed,
    mon: 'kitchen',
    song: 'oven',
    hero: 'nell',
    plan: plan(A.signs),
    watch: true,
  };
}

/** The last scene's clock and places. */
export const MOONRISE = { rise: 380, dark: 700, open: 1100 } as const;
export const MOONRISE_AT: WatchAt & { signs: Record<string, number>; table: [number, number]; moon: [number, number]; bakery: [number, number] } = {
  width: 46,
  table: [12, 17],
  moon: [27, 2],
  bakery: [6, 3],
  signs: { clouds: 3, real: 20, night: 33 },
  stops: [
    { x: 4, read: 'the clouds sign' },
    { x: 18, until: MOONRISE.rise + 80, what: 'the moon coming up' },
    { x: 21, read: 'the real-moon sign' },
    { x: 30, until: MOONRISE.dark + 60, what: "the bakery's window going dark" },
    { x: 34, read: 'the good-night sign' },
  ],
  open: MOONRISE.open,
};

/** The real moon, 3x3 blocks: silver, soft gray seas, no sill; `low` is still in the haze (dimmer, cut by a cloud). */
function realMoon(pal: Pal, bg: Pixels, low: boolean): Pixels {
  const p = new Pixels(60, 60);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) p.blit(bg, x * 20, y * 20);
  const w = pal.r('white');
  const st = pal.r('stone');
  for (let y = 0; y < 60; y++)
    for (let x = 0; x < 60; x++) {
      const d = Math.hypot(x - 29.5, y - 29.5);
      if (d < 24) p.set(x, y, d < 21 ? w[low ? 2 : 3] : w[1]);
      else if (!low && d < 29 && dither(x, y, (29 - d) / 10)) p.set(x, y, pal.c('sky', 2));
    }
  for (const [x, y, r] of [
    [22, 22, 5],
    [36, 30, 6],
    [26, 38, 3.5],
  ])
    p.disc(x, y, r, st[low ? 1 : 3]);
  // a long thin cloud across the low moon
  if (low) for (let x = 0; x < 60; x++) p.rect(x, 33 + Math.round(Math.sin(x / 9) * 2), 1, 4, pal.c('sky', 1));
  return p;
}

export function levelMoonrise(pal: Pal): Level {
  const A = MOONRISE_AT;
  const { book, timed } = startBook(pal, 'roof', { lean: true });
  const bg = book.pics.get('bg')!;
  shutUntil(pal, book, timed, A.open);
  // the moon: low in the haze, then up clear (the low spot turns back into night as the high one appears)
  const sky = new Pixels(60, 60);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) sky.blit(bg, x * 20, y * 20);
  const low = realMoon(pal, bg, true);
  const high = realMoon(pal, bg, false);
  stamp(book, null, low, 'ml', 0, 0);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) timed.push({ name: `ml${x}${y}`, next: 'bg', ticks: MOONRISE.rise });
  stamp(book, null, sky, 'mh', 0, 0);
  changeAt(book, timed, sky, high, 'mh', 'mu', MOONRISE.rise);
  // the bakery's round window next door, lit, then dark
  for (let q = 0; q < 4; q++) {
    book.add(`bw${q}`, roundLight(pal, bg, q as 0 | 1 | 2 | 3, true), still);
    const dark = new Pixels(20, 20).blit(bg, 0, 0);
    const lit = roundLight(pal, bg, q as 0 | 1 | 2 | 3, true);
    lit.map((x, y, c) => (c === bg.get(x, y) ? c : pal.r('warm').includes(c) ? pal.c('slate', 0) : c));
    book.add(`bd${q}`, dark.blit(lit, 0, 0), still);
    timed.push({ name: `bw${q}`, next: `bd${q}`, ticks: MOONRISE.dark });
  }
  book.add('tbl', table(pal, bg, 'top'), still);
  book.add('tblLeg', table(pal, bg, 'leg'), still);
  const s = addSigns(book, pal, { clouds: ['CLEAR SKY. SUPPER, TAKE TWO.', 4, 2] });
  s.real = laterSign(book, pal, timed, 'real', 'THE REAL ONE. NO SILL.', 4, 2, MOONRISE.rise + 40);
  s.night = laterSign(book, pal, timed, 'night', 'NEXT DOOR, THE LIGHT GOES OUT.', 4, 2, MOONRISE.dark + 30);
  addSigns(book, pal, {});
  const m = paintRoom(book, A.width, [], {}, true, s);
  for (let x = A.table[0]; x <= A.table[1]; x++) m.set(x, G - 2, 'tbl');
  m.set(A.table[0], G - 1, 'tblLeg').set(A.table[1], G - 1, 'tblLeg');
  stamp(book, m, low, 'ml', A.moon[0], A.moon[1] + 3);
  stamp(book, m, sky, 'mh', A.moon[0], A.moon[1]);
  for (let q = 0; q < 4; q++) m.set(A.bakery[0] + (q % 2), A.bakery[1] + (q >> 1), `bw${q}`);
  for (const [k, x] of Object.entries(A.signs)) m.sign(x, G - 1 - s[k].board.length, s[k]);
  m.set(A.width - 3, G - 2, 'shutTop').set(A.width - 3, G - 1, 'shutBot');
  return {
    file: 'moonrise',
    title: 'Moonrise',
    hint: 'The real one.',
    look: 'moonrise',
    map: m,
    book,
    timed,
    mon: 'roof',
    song: 'supper',
    hero: 'nell',
    plan: plan(A.signs),
    watch: true,
  };
}
