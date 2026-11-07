// Level 5, The Route: the parade route itself. Eight cards wait at the start; neighbors sit on lawn chairs all along
// the curb, and each one who gets a card tips a cap, smiles and chimes. Geese cross, a dog trots over and takes one card
// (keep a spare), a runaway balloon bobs over the sidewalk and a puddle squirts by the last stretch.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { baseBook } from './base';
import { addBeat } from './items';
import { Level, GROUND, addSigns, bunting, flagpole, onGround, room, shop, street } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import { addCard, addFlags, addNeighbors, addStreet } from './town';
import { LEVEL5_SIGNS } from './text';

export const AT5 = {
  cards: [6, 13],
  vets: [
    [19, 0],
    [32, 1],
    [44, 2],
    [60, 3],
    [72, 0],
    [82, 1],
  ],
  dog: 24,
  geese: [52],
  balloon: 66,
  puddle: [76, 78],
  exit: 87,
  width: 90,
} as const;

export function level5(pal: Pal): Level {
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addCard(book, pal);
  addNeighbors(book, pal);
  addBandArch(book, pal);
  addBeat(book, pal);
  const s = addSigns(book, pal, LEVEL5_SIGNS);
  const g = room(AT5.width, AT5.exit);
  const m = new StarterMap(book, g.rows());
  street(m, 1, AT5.width - 2);
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
  for (const x of [30, 52, 68]) flagpole(m, x, GROUND, 6);
  for (let x = AT5.cards[0]; x <= AT5.cards[1]; x++) m.set(x, GROUND - 1, 'card');
  for (const [x, k] of AT5.vets) m.set(x, GROUND - 1, `vet${k}`);
  m.mon(MONS.dog, AT5.dog, GROUND - 1);
  for (const x of AT5.geese) m.mon(MONS.goose, x, GROUND - 1);
  m.mon(MONS.balloon, AT5.balloon, GROUND - 4);
  for (let x = AT5.puddle[0]; x <= AT5.puddle[1]; x++) m.set(x, GROUND - 1, 'puddleA');
  m.sign(14, onGround(GROUND, s.start), s.start);
  m.sign(21, onGround(GROUND, s.dog), s.dog);
  m.sign(40, onGround(GROUND, s.geese), s.geese);
  m.sign(62, onGround(GROUND, s.wave), s.wave);
  m.sign(83, onGround(GROUND, s.exit), s.exit);
  return { file: 'five', title: 'The Route', hint: 'Hand a card to every neighbor.', map: m, book, pal };
}
