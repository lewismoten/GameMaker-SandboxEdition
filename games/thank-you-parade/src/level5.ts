// Level 5, Drum-Off: Elm Street, where Gigi has lined the curb with confetti cannons that fire in time with a beat
// meter (four drums along the top; the fourth is red). Type A cannons fire on beat four, type B on beat two; a cannon
// costs hit points only while it fires. Cross a zone while its cannons are quiet, wait on the bare street between
// zones, and take the notes over the cannons for points. The zones tighten as the street goes on: two zones back to
// back with only a block between them, then one of each kind side by side. The Ridgemont band stands in its purple at
// the far end, watching.
import { StarterMap } from '../../kit/starter/map';
import { baseBook } from './base';
import { DRUMOFF_SIGNS } from './text';
import { Level, GROUND, addSigns, bunting, flagpole, onGround, room, run } from './lay';
import { addBeat, addRivals } from './items';
import { addFlags } from './town';
import type { Pal } from './print';

/** Cannon zones: [first x, last x, kind]. Bare street lies between them. */
export const ZONES: [number, number, 'A' | 'B'][] = [
  [20, 22, 'A'],
  [30, 32, 'B'],
  [40, 41, 'A'],
  [43, 44, 'B'],
  [52, 54, 'A'],
  [56, 57, 'A'],
  [64, 66, 'B'],
  [68, 69, 'A'],
  [74, 76, 'B'],
];
export const AT5 = { exit: 85, width: 90, rivals: [79, 80, 81, 82] } as const;

export function level5(pal: Pal): Level {
  const book = baseBook(pal);
  addFlags(book, pal);
  addBeat(book, pal);
  addRivals(book, pal);
  const s = addSigns(book, pal, DRUMOFF_SIGNS);
  const g = room(AT5.width, AT5.exit);
  const m = new StarterMap(book, g.rows());
  for (const x of [17, 71]) flagpole(m, x, GROUND, 5);
  bunting(m, 6, 86, 2);
  // the beat meter: four drums, repeated every twelve blocks (so one set is always on screen)
  for (let x = 1; x + 3 < AT5.width - 1; x += 12) {
    m.set(x, 4, 'lamp0on');
    for (let k = 1; k < 4; k++) m.set(x + k, 4, `lamp${k}start`);
  }
  for (const [a, b, kind] of ZONES) {
    run(m, kind === 'A' ? 'cannonA' : 'cannonB0', a, b, GROUND - 1);
    for (let x = a; x <= b; x++) m.set(x, GROUND - 3 - (x % 2), 'note');
  }
  // the Ridgemont band, in purple, at the end of the street
  AT5.rivals.forEach((x, i) => m.set(x, GROUND - 2, `rival${i % 2}Top`).set(x, GROUND - 1, `rival${i % 2}`));
  m.sign(4, onGround(GROUND, s.start), s.start);
  m.sign(11, onGround(GROUND, s.gigi), s.gigi);
  m.sign(24, onGround(GROUND, s.beat), s.beat);
  m.sign(34, onGround(GROUND, s.second), s.second);
  m.sign(46, onGround(GROUND, s.both), s.both);
  m.sign(58, onGround(GROUND, s.last), s.last);
  m.sign(81, 4, s.exit);
  return { file: 'drumoff', title: 'Drum-Off', hint: 'Elm Street. A drum-off.', map: m, book, pal, song: 'drumoff' };
}
