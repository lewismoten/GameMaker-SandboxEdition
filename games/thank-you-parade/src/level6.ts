// Level 6, Finale: the plaza. Confetti tumbles through the sky, balloons and flags are everywhere, four neighbors by
// the fountain wait for a card (five more lie at the start), a goose lane and a bobbing balloon and a squirting
// puddle are the last obstacles, and the stage steps lead up to the door that starts the flyover.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { baseBook } from './base';
import { addBeat, addFinale } from './items';
import { Level, GROUND, addSigns, bunting, column, flagpole, onGround, room, run, street } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import { addCard, addFlags, addNeighbors, addStreet } from './town';
import { LEVEL6_SIGNS } from './text';

export const AT6 = {
  cards: [7, 11],
  vets: [
    [30, 0],
    [44, 3],
    [58, 2],
    [72, 1],
  ],
  geese: [22],
  balloon: 52,
  puddle: [64, 66],
  steps: [84, 85, 86],
  stage: [87, 97],
  exit: 94,
  width: 106,
} as const;

export function level6(pal: Pal): Level {
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addCard(book, pal);
  addNeighbors(book, pal);
  addBandArch(book, pal);
  addBeat(book, pal);
  addFinale(book, pal);
  const s = addSigns(book, pal, LEVEL6_SIGNS);
  const g = room(AT6.width, AT6.exit);
  // the exit door stands on the stage, three blocks up
  g.put(AT6.exit, 8, ' ').put(AT6.exit, 9, ' ').put(AT6.exit, 5, 'e').put(AT6.exit, 6, 'E');
  const m = new StarterMap(book, g.rows());
  street(m, 1, AT6.width - 2);
  // the stage: steps one block high, then a platform
  AT6.steps.forEach((x, i) => column(m, 'brick', x, GROUND - 1 - i, GROUND - 1));
  for (let x = AT6.stage[0]; x <= AT6.stage[1]; x++) column(m, 'brick', x, GROUND - 3, GROUND - 1);
  m.set(AT6.exit, 5, 'doorTop').set(AT6.exit, 6, 'doorBottom');
  // confetti, scattered through the sky rows
  for (let i = 0; i < 70; i++) {
    const x = 2 + ((i * 37) % (AT6.width - 4));
    const y = 1 + ((i * 13) % 8);
    if (y < GROUND - 1) m.set(x, y, `conf${i % 3}`);
  }
  for (const x of [16, 38, 62, 78]) m.set(x, GROUND - 1, 'balloons0');
  for (const x of [12, 48, 70, 100]) flagpole(m, x, GROUND, 6);
  bunting(m, 6, 100, 2);
  run(m, 'card', AT6.cards[0], AT6.cards[1], GROUND - 1);
  for (const [x, k] of AT6.vets) m.set(x, GROUND - 1, `vet${k}`);
  for (const x of AT6.geese) m.mon(MONS.goose, x, GROUND - 1);
  m.mon(MONS.balloon, AT6.balloon, GROUND - 4);
  for (let x = AT6.puddle[0]; x <= AT6.puddle[1]; x++) m.set(x, GROUND - 1, 'puddleA');
  m.sign(5, onGround(GROUND, s.start), s.start);
  m.sign(79, onGround(GROUND, s.stage), s.stage);
  return { file: 'six', title: 'Finale', hint: 'Up the steps. The whole town waves.', map: m, book, pal };
}
