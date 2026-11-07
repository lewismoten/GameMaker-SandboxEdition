// Level 2, Gust: the class's thank-you cards are blowing down Main Street. A gust meter (GU ST and five teal bars,
// repeated along the street so one is always on screen) drains by itself; each card is blown off the street after its
// own number of ticks. Four cards open the card box at the end of the street. Out of time? A door at the start of
// the street begins the level again. A runaway balloon bobs over the sidewalk (touch it and it pops).
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { PULL } from '../../kit/starter/book';
import { baseBook, type PBook } from './base';
import { addCardBox, addGust, CARDS_WANTED } from './items';
import { Level, GROUND, addSigns, bunting, column, flagpole, onGround, room, shop, street } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import { addCard, addFlags, addStreet, CARD_POINTS, CARDS } from './town';
import { LEVEL2_SIGNS } from './text';

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
export const AT2 = { start: 6, retry: 2, box: 76, exit: 83, width: 88, balloon: 62, segments: 5, perSegment: 160, plankRuns: [[28, 30], [46, 48]] } as const;

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
  const s = addSigns(book, pal, LEVEL2_SIGNS);
  const g = room(AT2.width, AT2.exit, AT2.start);
  const m = new StarterMap(book, g.rows());
  street(m, 1, AT2.width - 2);
  m.set(AT2.retry, GROUND - 2, 'doorTop').set(AT2.retry, GROUND - 1, 'doorBottom'); // the door that starts the level over
  // shop fronts along the street, with alleys between
  const shops: [number, number, 'wallA' | 'wallB'][] = [[10, 7, 'wallA'], [19, 8, 'wallB'], [29, 7, 'wallA'], [38, 9, 'wallB'], [49, 8, 'wallA'], [59, 7, 'wallB'], [68, 7, 'wallA']];
  shops.forEach(([x, w, tone], i) => shop(m, x, w, tone, i % 2 ? w - 3 : 2));
  bunting(m, 8, 84, 2);
  flagpole(m, 34, GROUND, 6);
  flagpole(m, 66, GROUND, 6);
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
  // signs
  m.sign(AT2.start + 3, onGround(GROUND, s.start), s.start);
  m.sign(71, onGround(GROUND, s.retry), s.retry);
  m.sign(24, onGround(GROUND, s.meter), s.meter);
  m.sign(79, onGround(GROUND, s.exit), s.exit);
  return { file: 'two', title: 'Gust', hint: 'Cards are blowing down Main Street.', map: m, book, pal, retry: [AT2.retry, GROUND - 1] };
}
