// Level 4, The Float: the fire hall, where the crew built the float and somebody locked its three parts away behind
// gates. A brass key opens a brass gate, a steel key a steel gate; the second brass key is up a ladder in the loft.
// Three parts (a wheel, a streamer rosette and a flower bunch) are handed to the float, which takes all three. Gigi's
// fourth playbook page is in the loft too, at its far end, the way nobody walks.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from './print';
import { addPage, baseBook } from './base';
import { addHall } from './items';
import { Level, GROUND, addSigns, column, onGround, room, run } from './lay';
import { addBandArch } from './park';
import { addStreet } from './town';
import { FLOAT_SIGNS } from './text';

export const AT4 = {
  planksA: [10, 13],
  key1: 11,
  gate1: 20,
  wheel: 28,
  planksB: [31, 34],
  silver: 32,
  gate2: 41,
  ladder: 48,
  upper: [45, 62],
  streamers: 52,
  key2: 58,
  page: 45,
  gate3: 65,
  flowers: 71,
  float: 78,
  exit: 83,
  width: 88,
} as const;

/** A locked gate of the hall: brick up to the ceiling, an arch, the gate. */
function lock(m: StarterMap, x: number, silver: boolean): void {
  column(m, 'brick', x, 2, GROUND - 3);
  m.set(x, GROUND - 2, silver ? 'gateTopSilver' : 'gateTop').set(x, GROUND - 1, silver ? 'gateSilver' : 'gate');
}

export function level4(pal: Pal): Level {
  const book = baseBook(pal);
  addStreet(book, pal);
  addBandArch(book, pal);
  addHall(book, pal);
  addPage(book, pal);
  const s = addSigns(book, pal, FLOAT_SIGNS);
  const g = room(AT4.width, AT4.exit);
  const m = new StarterMap(book, g.rows());
  // the hall: a brick roof, a back wall, a floor, brick ends
  for (let x = 0; x < AT4.width; x++) {
    m.set(x, 0, 'brick').set(x, 1, 'brick').set(x, GROUND, 'walk');
  }
  column(m, 'brick', 0, 0, GROUND - 1);
  column(m, 'brick', AT4.width - 1, 0, GROUND - 1);
  m.set(3, 8, 'doorwayTop').set(3, 9, 'doorwayBottom').set(AT4.exit, 8, 'doorTop').set(AT4.exit, 9, 'doorBottom');
  // the crew at work
  [
    [7, '0a'],
    [16, '1a'],
    [24, '0b'],
    [37, '1a'],
    [44, '0a'],
    [68, '1b'],
    [75, '0a'],
  ].forEach(([x, k]) => m.set(x as number, GROUND - 1, `crew${k}`));
  // room 1: a gold key on a shelf (planks), then its gate
  run(m, 'plank', AT4.planksA[0], AT4.planksA[1], GROUND - 2);
  m.set(AT4.key1, GROUND - 3, 'key');
  lock(m, AT4.gate1, false);
  // room 2: the wheel, a silver key on a shelf, the silver gate
  m.set(AT4.wheel, GROUND - 1, 'partWheel');
  run(m, 'plank', AT4.planksB[0], AT4.planksB[1], GROUND - 2);
  m.set(AT4.silver, GROUND - 3, 'keySilver');
  lock(m, AT4.gate2, true);
  // room 3: a ladder to an upper floor with the streamers and the second gold key, then the gold gate
  run(m, 'plank', AT4.upper[0], AT4.upper[1], 5);
  column(m, 'ladder', AT4.ladder, 4, GROUND - 1);
  m.set(AT4.streamers, 4, 'partStreamers').set(AT4.key2, 4, 'key');
  lock(m, AT4.gate3, false);
  // room 4: the flowers and the float, which takes three parts
  m.set(AT4.flowers, GROUND - 1, 'partFlowers');
  column(m, 'brick', AT4.float, 2, GROUND - 3);
  m.set(AT4.float, GROUND - 2, 'bandArch').set(AT4.float, GROUND - 1, 'floatGate');
  m.set(AT4.page, 4, 'page');
  // placards
  m.sign(5, onGround(GROUND, s.start), s.start);
  m.sign(14, onGround(GROUND, s.gold), s.gold);
  m.sign(21, onGround(GROUND, s.crew), s.crew);
  m.sign(35, onGround(GROUND, s.silver), s.silver);
  m.sign(42, onGround(GROUND, s.climb), s.climb);
  m.sign(46, 2, s.secret);
  m.sign(72, onGround(GROUND, s.parts), s.parts);
  m.sign(80, onGround(GROUND, s.exit), s.exit);
  return { file: 'float', title: 'The Float', hint: 'The fire hall. A float, no parts.', map: m, book, pal };
}
