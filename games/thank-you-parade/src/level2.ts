// Level 2, Gust: someone has aimed six leaf blowers down Main Street, and the class's thank-you cards are airborne. A gust
// meter (GU ST and five bars, repeated along the street so one is always on screen) drains by itself; each card is blown
// off the street after its own number of ticks. Four cards open the card box at the end of the street (the rest go in
// Penny's pocket for the route). Out of time? A door at the start of the street begins the level again. A runaway
// balloon bobs over the sidewalk. Past the last card, a fire escape climbs to Gigi's second playbook page.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from './print';
import { PULL } from '../../kit/starter/book';
import { addPage, baseBook, type PBook } from './base';
import { addCardBox, addGust } from './items';
import { Level, GROUND, addSigns, bunting, column, flagpole, onGround, room, run, skyline, street } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import { addCard, addFlags, addStreet, CARD_POINTS, CARDS } from './town';
import { GUST_SIGNS } from './text';

/** Where the cards lie, the row each lies on and the tick each is blown away (tuned to the bot's pace, with a human's slack). */
export const CARDS_AT = [
  { x: 15, y: 9, until: 220 },
  { x: 20, y: 9, until: 300 },
  { x: 29, y: 7, until: 390 },
  { x: 38, y: 9, until: 480 },
  { x: 47, y: 7, until: 580 },
  { x: 57, y: 9, until: 690 },
  { x: 68, y: 9, until: 800 },
] as const;
export const AT2 = {
  start: 6,
  retry: 2,
  box: 76,
  exit: 83,
  width: 88,
  balloon: 62,
  segments: 5,
  perSegment: 160,
  plankRuns: [
    [28, 30],
    [46, 48],
  ],
  /** The fire escape: [first x, last x, row] steps up, and the page at the top. */
  escape: [
    [72, 73, 8],
    [74, 75, 6],
  ] as [number, number, number][],
  page: [75, 5] as [number, number],
} as const;

function timedCards(book: PBook): void {
  CARDS_AT.forEach((c, k) => {
    book.add(`cardT${k}`, book.pics.get('card')!, { grav: PULL.down, score: CARD_POINTS, effect: CARDS, eamt: 1, touch: 'sky' });
    book.time(`cardT${k}`, 'sky', c.until);
  });
}

export function level2(pal: Pal): Level {
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addCard(book, pal);
  addBandArch(book, pal);
  addGust(book, pal, AT2.perSegment);
  addCardBox(book, pal);
  timedCards(book);
  addPage(book, pal);
  const s = addSigns(book, pal, GUST_SIGNS);
  const g = room(AT2.width, AT2.exit, AT2.start);
  const m = new StarterMap(book, g.rows());
  street(m, 1, AT2.width - 2);
  m.set(AT2.retry, GROUND - 2, 'doorTop').set(AT2.retry, GROUND - 1, 'doorBottom'); // the door that starts the level over
  // shop fronts along the street, with alleys between
  skyline(m, 9, 65, [34, 35, 36]);
  bunting(m, 8, 84, 2);
  flagpole(m, 34, GROUND, 6);
  // the gust meter, along the top, with a copy every nine blocks
  for (let x = 1; x + 8 <= AT2.width - 1; x += 9) {
    if (x <= AT2.box && AT2.box <= x + 7) continue;
    m.set(x, 1, 'gustLabel0').set(x + 1, 1, 'gustLabel1');
    for (let i = 0; i < AT2.segments; i++) m.set(x + 2 + i, 1, `gust${i}`);
    m.set(x + 2 + AT2.segments, 1, 'gustCap');
  }
  // two planks to hop up to, and the cards
  for (const [a, b] of AT2.plankRuns) for (let x = a; x <= b; x++) m.set(x, GROUND - 2, 'plank');
  CARDS_AT.forEach((c, k) => m.set(c.x, c.y, `cardT${k}`));
  // a runaway balloon
  m.mon(MONS.balloon, AT2.balloon, GROUND - 4);
  // the card box: a gate that takes four cards
  column(m, 'brick', AT2.box, 0, GROUND - 3);
  m.set(AT2.box, GROUND - 2, 'bandArch').set(AT2.box, GROUND - 1, 'cardBox');
  m.wallToSky(AT2.box);
  // the fire escape and the page
  for (const [a, b, y] of AT2.escape) run(m, 'plank', a, b, y);
  m.set(AT2.page[0], AT2.page[1], 'page');
  // placards
  m.sign(AT2.start + 3, onGround(GROUND, s.start), s.start);
  m.sign(22, onGround(GROUND, s.meter), s.meter);
  m.sign(66, onGround(GROUND, s.retry), s.retry);
  m.sign(69, 3, s.secret);
  m.sign(79, onGround(GROUND, s.exit), s.exit);
  return { file: 'gust', title: 'Gust', hint: 'Main Street. Leaf blowers.', map: m, book, pal, retry: [AT2.retry, GROUND - 1] };
}
