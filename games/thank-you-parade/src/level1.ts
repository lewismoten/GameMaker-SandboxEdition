// Level 1, Scattered: the wind has blown the band apart. Three band members sit in the street each missing one thing:
// the tuba player's mouthpiece is in a leaf pile, the drummer's sticks are up a tree and the flute is on a lily pad in
// the duck pond. A band member is a gate: give him or her the right thing and the street opens. Geese patrol the way
// between the tree and the pond.
import { StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { baseBook } from './base';
import { LEVEL1_SIGNS } from './text';
import { Level, GROUND, addSigns, column, onGround, room, run } from './lay';
import { addBandArch, addPark } from './park';
import { MONS } from './monsters';

export const AT1 = {
  piles: [16, 21, 26],
  mouthpiece: 21,
  gates: { tuba: 34, drum: 60, flute: 112 },
  trunk: 46,
  branch: [47, 50],
  sticks: 49,
  geese: [66, 73],
  pond: [87, 101],
  lilies: [91, 95, 99],
  flute: 95,
  exit: 122,
  width: 130,
} as const;

/** A band member's gate: brick overhead to the sky, a banner arch, the member in the street. */
function gate(m: StarterMap, x: number, who: string): void {
  column(m, 'brick', x, 0, GROUND - 3);
  m.set(x, GROUND - 2, 'bandArch').set(x, GROUND - 1, `kid.${who}`);
  m.wallToSky(x);
}

export function level1(pal: Pal): Level {
  const book = baseBook(pal);
  addPark(book, pal);
  addBandArch(book, pal);
  const s = addSigns(book, pal, LEVEL1_SIGNS);
  const g = room(AT1.width, AT1.exit);
  const m = new StarterMap(book, g.rows());
  // scenery: clouds, bushes, flowers, a flagpole by the start, bunting over the street's end
  for (const [x, y] of [[8, 2], [28, 4], [54, 1], [76, 3], [104, 2], [118, 4]]) m.set(x, y, 'cloudL').set(x + 1, y, 'cloudR');
  for (const x of [11, 14, 30, 38, 52, 56, 82, 108]) m.set(x, GROUND - 1, 'bush');
  for (const x of [9, 24, 40, 58, 80, 106, 116]) m.set(x, GROUND - 1, 'flower');
  // the leaf piles
  AT1.piles.forEach((x) => m.set(x, GROUND - 1, x === AT1.mouthpiece ? 'leafPile' : 'leafPileB'));
  // the three gates
  gate(m, AT1.gates.tuba, 'tuba');
  gate(m, AT1.gates.drum, 'drum');
  gate(m, AT1.gates.flute, 'flute');
  // the tree: a trunk to climb, a branch to stand on, the sticks, leafy crowns behind
  column(m, 'trunk', AT1.trunk, 2, GROUND - 1);
  run(m, 'branch', AT1.branch[0], AT1.branch[1], 3);
  run(m, 'crown', AT1.trunk - 2, AT1.branch[1] + 1, 0);
  run(m, 'crown', AT1.trunk - 2, AT1.trunk - 1, 1);
  run(m, 'crown', AT1.branch[0] + 1, AT1.branch[1] + 1, 1);
  m.set(AT1.trunk - 2, 2, 'crown').set(AT1.trunk - 1, 2, 'crown').set(AT1.branch[1] + 1, 2, 'crown');
  m.set(AT1.sticks, 2, 'sticks');
  // the pond: water to wade through, a bed under it, three lily pads and the flute on the middle one
  run(m, 'waterTop', AT1.pond[0], AT1.pond[1], GROUND);
  run(m, 'pondBed', AT1.pond[0], AT1.pond[1], GROUND + 1);
  m.set(AT1.lilies[0], 9, 'lily').set(AT1.lilies[1], 8, 'lily').set(AT1.lilies[2], 9, 'lily');
  m.set(AT1.flute, 7, 'flute');
  m.set(AT1.pond[0] - 1, GROUND - 1, 'reeds').set(AT1.pond[1] + 1, GROUND - 1, 'reeds');
  // geese: two lanes along the street, a gap between
  for (const x of AT1.geese) m.mon(MONS.goose, x, GROUND - 1);
  // signs
  m.sign(6, onGround(GROUND, s.start), s.start);
  m.sign(12, onGround(GROUND, s.piles), s.piles);
  m.sign(29, onGround(GROUND, s.gates), s.gates);
  m.sign(40, onGround(GROUND, s.tree), s.tree);
  m.sign(80, onGround(GROUND, s.pond), s.pond);
  m.sign(118, onGround(GROUND, s.exit), s.exit);
  return { file: 'one', title: 'Scattered', hint: 'The wind took the band apart.', map: m, book, pal };
}
