// Level 7, Step Off: 9:58 at the reviewing stand. Confetti tumbles through the sky, four more veterans wait for a card
// (five more lie at the start), the Ridgemont band stands behind the llama rescue holding up Gigi's placard, a goose,
// a bobbing balloon and a confetti cannon are the last obstacles, and the stage steps lead up to the door that starts
// the flyover.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from './print';
import { baseBook } from './base';
import { addBeat, addFinale, addRivals } from './items';
import { Level, GROUND, addSigns, bunting, column, flagpole, onGround, room, run, street } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import { addCard, addFlags, addNeighbors, addStreet } from './town';
import { STEPOFF_SIGNS } from './text';

export const AT7 = {
  cards: [11, 15],
  vets: [
    [20, 0],
    [29, 3],
    [38, 2],
    [47, 1],
  ],
  geese: [17],
  balloon: 53,
  cannon: [57, 59],
  llamas: [50, 51],
  rivals: [52, 53, 55, 56],
  steps: [66, 67, 68],
  stage: [69, 79],
  exit: 76,
  width: 88,
} as const;

export function level7(pal: Pal): Level {
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addCard(book, pal);
  addNeighbors(book, pal);
  addBandArch(book, pal);
  addBeat(book, pal);
  addFinale(book, pal);
  addRivals(book, pal, true);
  const s = addSigns(book, pal, STEPOFF_SIGNS);
  const g = room(AT7.width, AT7.exit);
  // the exit door stands on the stage, three blocks up
  g.put(AT7.exit, 8, ' ').put(AT7.exit, 9, ' ').put(AT7.exit, 5, 'e').put(AT7.exit, 6, 'E');
  const m = new StarterMap(book, g.rows());
  street(m, 1, AT7.width - 2);
  // the stage: steps one block high, then a platform
  AT7.steps.forEach((x, i) => column(m, 'brick', x, GROUND - 1 - i, GROUND - 1));
  for (let x = AT7.stage[0]; x <= AT7.stage[1]; x++) column(m, 'brick', x, GROUND - 3, GROUND - 1);
  m.set(AT7.exit, 5, 'doorTop').set(AT7.exit, 6, 'doorBottom');
  // confetti, scattered through the sky rows
  for (let i = 0; i < 70; i++) {
    const x = 2 + ((i * 37) % (AT7.width - 4));
    const y = 1 + ((i * 13) % 8);
    if (y < GROUND - 1) m.set(x, y, `conf${i % 3}`);
  }
  for (const x of [35, 45]) m.set(x, GROUND - 1, 'balloons0');
  for (const x of [16, 33]) flagpole(m, x, GROUND, 6);
  bunting(m, 6, 84, 2);
  run(m, 'card', AT7.cards[0], AT7.cards[1], GROUND - 1);
  for (const [x, k] of AT7.vets) m.set(x, GROUND - 1, `vet${k}`);
  for (const x of AT7.geese) m.mon(MONS.goose, x, GROUND - 1);
  m.mon(MONS.balloon, AT7.balloon, GROUND - 4);
  for (let x = AT7.cannon[0]; x <= AT7.cannon[1]; x++) m.set(x, GROUND - 1, 'cannonA');
  // the llama rescue, and the Ridgemont band behind it holding up Gigi's placard
  m.set(AT7.llamas[0], GROUND - 2, 'llamaTop').set(AT7.llamas[0], GROUND - 1, 'llama');
  m.set(AT7.llamas[1], GROUND - 2, 'llamaTop').set(AT7.llamas[1], GROUND - 1, 'llama');
  AT7.rivals.forEach((x, i) => m.set(x, GROUND - 2, `rival${i % 2}Top`).set(x, GROUND - 1, `rival${i % 2}`));
  m.sign(4, onGround(GROUND, s.start), s.start);
  m.sign(22, onGround(GROUND, s.llamas), s.llamas);
  m.sign(AT7.rivals[0], GROUND - 5, s.gigi);
  m.sign(61, onGround(GROUND, s.stage), s.stage);
  return { file: 'stepoff', title: 'Step Off', hint: '9:58. The front of the parade.', map: m, book, pal };
}
