// Level 6, The Route: the parade route itself. Eight cards wait at the start; veterans sit on lawn chairs all along the
// curb holding up scorecards, and each one who gets a card tips a cap, smiles and chimes. Geese cross, a dog trots over
// and takes one card (keep a spare), a runaway balloon bobs over the sidewalk and a confetti cannon fires by the last
// stretch.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from './print';
import { baseBook } from './base';
import { addBeat } from './items';
import { Level, GROUND, addSigns, bunting, flagpole, onGround, room, shop, street } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import { addCard, addFlags, addNeighbors, addStreet } from './town';
import { ROUTE_SIGNS } from './text';

export const AT6 = {
  cards: [12, 19],
  vets: [
    [27, 0],
    [38, 1],
    [46, 2],
    [62, 3],
    [72, 0],
    [82, 1],
  ],
  dog: 30,
  geese: [56],
  balloon: 66,
  cannon: [76, 78],
  exit: 87,
  width: 90,
} as const;

export function level6(pal: Pal): Level {
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addCard(book, pal);
  addNeighbors(book, pal);
  addBandArch(book, pal);
  addBeat(book, pal);
  const s = addSigns(book, pal, ROUTE_SIGNS);
  const g = room(AT6.width, AT6.exit);
  const m = new StarterMap(book, g.rows());
  street(m, 1, AT6.width - 2);
  const shops: [number, number, 'wallA' | 'wallB'][] = [
    [8, 8, 'wallB'],
    [17, 9, 'wallA'],
    [27, 8, 'wallB'],
    [36, 10, 'wallA'],
    [47, 8, 'wallB'],
    [56, 9, 'wallA'],
    [66, 8, 'wallB'],
    [75, 9, 'wallA'],
  ];
  shops.forEach(([x, w, tone], i) => shop(m, x, w, tone, i % 3 === 0 ? 1 : w - 2));
  bunting(m, 6, 84, 2);
  for (const x of [30, 58, 69]) flagpole(m, x, GROUND, 6);
  for (let x = AT6.cards[0]; x <= AT6.cards[1]; x++) m.set(x, GROUND - 1, 'card');
  for (const [x, k] of AT6.vets) m.set(x, GROUND - 1, `vet${k}`);
  m.mon(MONS.dog, AT6.dog, GROUND - 1);
  for (const x of AT6.geese) m.mon(MONS.goose, x, GROUND - 1);
  m.mon(MONS.balloon, AT6.balloon, GROUND - 4);
  for (let x = AT6.cannon[0]; x <= AT6.cannon[1]; x++) m.set(x, GROUND - 1, 'cannonA');
  m.sign(5, onGround(GROUND, s.start), s.start);
  m.sign(21, onGround(GROUND, s.judges), s.judges);
  m.sign(32, onGround(GROUND, s.dog), s.dog);
  m.sign(40, onGround(GROUND, s.delgado), s.delgado);
  m.sign(49, onGround(GROUND, s.geese), s.geese);
  m.sign(64, onGround(GROUND, s.pruitt), s.pruitt);
  m.sign(84, onGround(GROUND, s.exit), s.exit);
  return { file: 'route', title: 'The Route', hint: 'The route. Veterans judging.', map: m, book, pal };
}
