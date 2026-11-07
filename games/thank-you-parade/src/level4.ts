// Level 4, In Step: the band practices on the school field and Penny leads it across. Squirting puddles go off in time
// with a beat meter (four drums along the top; the fourth is red): type A puddles squirt on beat four, type B on beat
// two. Cross a zone while its puddles are calm, wait on the dry ground between zones, and pick up the notes.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { baseBook } from './base';
import { addBeat } from './items';
import { Level, GROUND, addSigns, bunting, flagpole, onGround, room, run } from './lay';
import { addPark } from './park';
import { addFlags } from './town';
import { LEVEL4_SIGNS } from './text';

/** Puddle zones: [first x, last x, kind]. Dry ground lies between them. */
export const ZONES: [number, number, 'A' | 'B'][] = [
  [30, 32, 'A'],
  [46, 48, 'B'],
  [64, 65, 'A'],
  [68, 69, 'B'],
  [86, 89, 'A'],
  [104, 107, 'B'],
];
export const AT4 = { exit: 122, width: 130 } as const;

export function level4(pal: Pal): Level {
  const book = baseBook(pal);
  addFlags(book, pal);
  addPark(book, pal); // the band members, happy again, stand at the start
  addBeat(book, pal);
  const s = addSigns(book, pal, LEVEL4_SIGNS);
  const g = room(AT4.width, AT4.exit);
  const m = new StarterMap(book, g.rows());
  for (const [x, y] of [[9, 2], [38, 4], [60, 1], [80, 3], [112, 2]]) m.set(x, y, 'cloudL').set(x + 1, y, 'cloudR');
  for (const x of [20, 40, 56, 76, 98, 116]) m.set(x, GROUND - 1, 'flower');
  for (const x of [24, 52, 94]) m.set(x, GROUND - 1, 'bush');
  m.set(9, GROUND - 1, 'kid.tuba.happy').set(11, GROUND - 1, 'kid.drum.happy').set(13, GROUND - 1, 'kid.flute.happy');
  for (const x of [18, 58, 100, 118]) flagpole(m, x, GROUND, 5);
  bunting(m, 6, 124, 2);
  // the beat meter: four drums, repeated every twelve blocks (so one set is always on screen)
  for (let x = 1; x + 3 < AT4.width - 1; x += 12) {
    m.set(x, 4, 'lamp0on');
    for (let k = 1; k < 4; k++) m.set(x + k, 4, `lamp${k}start`);
  }
  for (const [a, b, kind] of ZONES) {
    run(m, kind === 'A' ? 'puddleA' : 'puddleB0', a, b, GROUND - 1);
    for (let x = a; x <= b; x++) m.set(x, GROUND - 3 - (x % 2), 'note');
  }
  m.sign(6, onGround(GROUND, s.start), s.start);
  m.sign(25, onGround(GROUND, s.beat), s.beat);
  m.sign(41, onGround(GROUND, s.second), s.second);
  m.sign(76, onGround(GROUND, s.both), s.both);
  m.sign(117, onGround(GROUND, s.exit), s.exit);
  return { file: 'four', title: 'In Step', hint: 'Keep in step. Watch the drums.', map: m, book, pal };
}
