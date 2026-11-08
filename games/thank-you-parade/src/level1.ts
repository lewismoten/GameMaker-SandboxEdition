// Level 1, Call Time: 6:40 in the morning, the park by the school. Three Hornets wait in the street, each missing the
// one thing they play with: Doug's tuba mouthpiece is in one of three leaf piles, the drumsticks are up a tree and the
// flute is on a lily pad in the duck pond. A band member is a gate: bring the right thing and walk into them. Geese
// patrol between the tree and the pond. It all looks like wind until the note taped to the last gate.
// Gigi's first playbook page is on a branch on the far side of the tree, halfway up the trunk.
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { CALLTIME_SIGNS } from './text';
import { Level, GROUND, addSigns, column, onGround, room, run } from './lay';
import { addBandArch, addPark } from './park';
import { MONS } from './monsters';
import type { Pal } from './print';

export const AT1 = {
  piles: [12, 15, 18],
  mouthpiece: 15,
  gates: { tuba: 27, drum: 42, flute: 76 },
  trunk: 33,
  branch: [34, 37],
  sticks: 36,
  /** The far branch, halfway up: [first x, last x, row], and the page on it. */
  farBranch: [29, 32, 6],
  page: 29,
  geese: [46, 56],
  pond: [62, 72],
  lilies: [64, 67, 70],
  flute: 67,
  exit: 83,
  width: 88,
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
  addPage(book, pal);
  const s = addSigns(book, pal, CALLTIME_SIGNS);
  const g = room(AT1.width, AT1.exit);
  const m = new StarterMap(book, g.rows());
  for (const [x, y] of [
    [8, 1],
    [21, 3],
    [45, 1],
    [54, 3],
    [69, 1],
    [80, 3],
  ])
    m.set(x, y, 'cloudL').set(x + 1, y, 'cloudR');
  for (const x of [9, 22, 39, 57, 74]) m.set(x, GROUND - 1, 'bush');
  for (const x of [25, 31, 44, 58, 85]) m.set(x, GROUND - 1, 'flower');
  // the leaf piles
  AT1.piles.forEach((x) => m.set(x, GROUND - 1, x === AT1.mouthpiece ? 'leafPile' : 'leafPileB'));
  // the three gates
  gate(m, AT1.gates.tuba, 'tuba');
  gate(m, AT1.gates.drum, 'drum');
  gate(m, AT1.gates.flute, 'flute');
  // the tree: a trunk to climb, a branch to stand on with the sticks, a far branch halfway up, leafy crowns behind
  column(m, 'trunk', AT1.trunk, 2, GROUND - 1);
  run(m, 'branch', AT1.branch[0], AT1.branch[1], 3);
  run(m, 'branch', AT1.farBranch[0], AT1.farBranch[1], AT1.farBranch[2]);
  run(m, 'crown', AT1.trunk - 2, AT1.branch[1] + 1, 0);
  run(m, 'crown', AT1.trunk - 2, AT1.trunk - 1, 1);
  run(m, 'crown', AT1.branch[0] + 1, AT1.branch[1] + 1, 1);
  m.set(AT1.trunk - 2, 2, 'crown')
    .set(AT1.trunk - 1, 2, 'crown')
    .set(AT1.branch[1] + 1, 2, 'crown');
  run(m, 'crown', AT1.farBranch[0] - 1, AT1.farBranch[1] - 1, AT1.farBranch[2] - 2);
  m.set(AT1.sticks, 2, 'sticks');
  m.set(AT1.page, AT1.farBranch[2] - 1, 'page');
  // the pond: water to wade through, a bed under it, three lily pads and the flute on the middle one
  run(m, 'waterTop', AT1.pond[0], AT1.pond[1], GROUND);
  run(m, 'pondBed', AT1.pond[0], AT1.pond[1], GROUND + 1);
  m.set(AT1.lilies[0], 9, 'lily').set(AT1.lilies[1], 8, 'lily').set(AT1.lilies[2], 9, 'lily');
  m.set(AT1.flute, 7, 'flute');
  m.set(AT1.pond[0] - 1, GROUND - 1, 'reeds').set(AT1.pond[1] + 1, GROUND - 1, 'reeds');
  for (const x of AT1.geese) m.mon(MONS.goose, x, GROUND - 1);
  // placards
  m.sign(5, onGround(GROUND, s.start), s.start);
  m.sign(19, onGround(GROUND, s.doug), s.doug);
  m.sign(AT1.farBranch[0] - 1, onGround(GROUND, s.secret), s.secret);
  m.sign(35, onGround(GROUND, s.tree), s.tree);
  m.sign(48, onGround(GROUND, s.geese), s.geese);
  m.sign(55, onGround(GROUND, s.pond), s.pond);
  m.sign(77, onGround(GROUND, s.note), s.note);
  return { file: 'calltime', title: 'Call Time', hint: '6:40 AM. The band is scattered.', map: m, book, pal };
}
