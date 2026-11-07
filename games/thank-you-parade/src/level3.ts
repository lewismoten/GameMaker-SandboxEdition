// Level 3, The Float: inside the fire hall the crew is building the parade float, and three parts are lying around
// behind locked gates. A gold key opens a gold gate, a silver key a silver gate; the second gold key is up a ladder.
// Three parts (a wheel, a streamer rosette and a flower bunch) are handed to the float, which takes all three.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { baseBook } from './base';
import { addHall } from './items';
import { Level, GROUND, addSigns, column, onGround, room, run } from './lay';
import { addBandArch } from './park';
import { addStreet } from './town';
import { LEVEL3_SIGNS } from './text';

export const AT3 = {
  planksA: [12, 16],
  key1: 14,
  gate1: 26,
  wheel: 36,
  planksB: [40, 43],
  silver: 41,
  gate2: 52,
  ladder: 60,
  upper: [56, 78],
  streamers: 66,
  key2: 72,
  gate3: 82,
  flowers: 90,
  float: 98,
  exit: 104,
  width: 110,
} as const;

/** A locked gate of the hall: brick up to the ceiling, an arch, the gate. */
function lock(m: StarterMap, x: number, silver: boolean): void {
  column(m, 'brick', x, 2, GROUND - 3);
  m.set(x, GROUND - 2, silver ? 'gateTopSilver' : 'gateTop').set(x, GROUND - 1, silver ? 'gateSilver' : 'gate');
}

export function level3(pal: Pal): Level {
  const book = baseBook(pal);
  addStreet(book, pal);
  addBandArch(book, pal);
  addHall(book, pal);
  const s = addSigns(book, pal, LEVEL3_SIGNS);
  const g = room(AT3.width, AT3.exit);
  const m = new StarterMap(book, g.rows());
  // the hall: a brick roof, a back wall, a floor, brick ends
  for (let x = 0; x < AT3.width; x++) {
    for (let y = 2; y < GROUND; y++) m.set(x, y, y === 4 && x % 8 === 3 ? 'wallBWin' : 'wallB');
    m.set(x, 0, 'brick').set(x, 1, 'brick').set(x, GROUND, 'walk');
  }
  column(m, 'brick', 0, 0, GROUND - 1);
  column(m, 'brick', AT3.width - 1, 0, GROUND - 1);
  m.set(3, 8, 'doorwayTop').set(3, 9, 'doorwayBottom').set(AT3.exit, 8, 'doorTop').set(AT3.exit, 9, 'doorBottom');
  // the crew at work
  [[8, '0a'], [20, '1a'], [31, '0b'], [47, '1a'], [57, '0a'], [87, '1b'], [95, '0a']].forEach(([x, k]) => m.set(x as number, GROUND - 1, `crew${k}`));
  // room 1: a gold key on a shelf (planks), then its gate
  run(m, 'plank', AT3.planksA[0], AT3.planksA[1], GROUND - 2);
  m.set(AT3.key1, GROUND - 3, 'key');
  lock(m, AT3.gate1, false);
  // room 2: the wheel, a silver key on a shelf, the silver gate
  m.set(AT3.wheel, GROUND - 1, 'partWheel');
  run(m, 'plank', AT3.planksB[0], AT3.planksB[1], GROUND - 2);
  m.set(AT3.silver, GROUND - 3, 'keySilver');
  lock(m, AT3.gate2, true);
  // room 3: a ladder to an upper floor with the streamers and the second gold key, then the gold gate
  run(m, 'plank', AT3.upper[0], AT3.upper[1], 5);
  column(m, 'ladder', AT3.ladder, 4, GROUND - 1);
  m.set(AT3.streamers, 4, 'partStreamers').set(AT3.key2, 4, 'key');
  lock(m, AT3.gate3, false);
  // room 4: the flowers and the float, which takes three parts
  m.set(AT3.flowers, GROUND - 1, 'partFlowers');
  column(m, 'brick', AT3.float, 2, GROUND - 3);
  m.set(AT3.float, GROUND - 2, 'bandArch').set(AT3.float, GROUND - 1, 'floatGate');
  // signs
  m.sign(6, onGround(GROUND, s.start), s.start);
  m.sign(17, onGround(GROUND, s.gold), s.gold);
  m.sign(46, onGround(GROUND, s.silver), s.silver);
  m.sign(54, onGround(GROUND, s.climb), s.climb);
  m.sign(92, onGround(GROUND, s.parts), s.parts);
  m.sign(100, onGround(GROUND, s.exit), s.exit);
  return { file: 'three', title: 'The Float', hint: 'The fire hall crew builds a float.', map: m, book, pal };
}
