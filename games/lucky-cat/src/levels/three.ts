// Level 3, TOWN HALL: someone opened every umbrella indoors and spilled the salt.
//   - a column of open umbrellas floats up (they pull upward): step into it and rise to the gallery, then walk off
//     the top along the plank to a lucky acorn and the salt shaker;
//   - a heap of spilled salt blocks the door to the back hall: toss a pinch (the shaker is used up) and it clears;
//   - behind it, a lucky sock, and the exit.
// Two charms: the acorn and the sock.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { GROUND, addSigns, onGround, room, startBook, type Level } from '../level';

export const THREE = {
  lift: 15,
  liftTop: 3,
  gallery: [16, 44],
  acorn: 22,
  shaker: 31,
  wall: 52,
  sock: 56,
  exit: 61,
} as const;

const SIGNS = {
  umb: ['UMBRELLAS OPEN INDOORS. THEY FLOAT UP.', 4, 3],
  ride: ['STEP IN TO RISE. STEP OFF AT THE TOP.', 4, 3],
  salt: ['SPILLED SALT. A PINCH OVER THE SHOULDER FIXES IT. EVERYONE KNOWS.', 4, 4],
  shaker: ['SALT SHAKER: UP HERE.', 4, 2],
} as const;

export function levelThree(pal: Pal): Level {
  const charms = ['acorn', 'sock'] as const;
  const book = startBook(pal, ['brolly', 'salt', 'town'], charms);
  const s = addSigns(book, pal, SIGNS);
  const g = room(66, THREE.exit);
  g.row(4, THREE.gallery[0], THREE.gallery[1], '=');
  const m = new StarterMap(book, g.rows());
  // a brick ceiling, windows between the beams, bunting under it
  for (let x = 1; x < 65; x++) for (const y of [0, 1]) m.set(x, y, y === 0 || x % 4 ? 'brick' : 'window');
  for (let x = 4; x < 62; x += 2) m.set(x, 2, 'bunting');
  // the column of floating umbrellas, three colors in turn, from the floor to the gallery's height
  const colors = ['brollyRed', 'brollyGold', 'brollyTeal'];
  for (let y = THREE.liftTop; y < GROUND; y++) m.set(THREE.lift, y, colors[y % 3]);
  m.set(THREE.acorn, 3, 'charm.acorn').set(THREE.shaker, 3, 'shaker');
  // the gate: a brick wall to the top of the world, the arch and the heap of salt
  for (let y = -10; y < GROUND - 2; y++) m.set(THREE.wall, y, 'brick');
  m.set(THREE.wall, GROUND - 2, 'saltArch').set(THREE.wall, GROUND - 1, 'saltPile');
  m.set(THREE.sock, GROUND - 1, 'charm.sock');
  for (const x of [38, 46, 58]) m.set(x, 8, 'lampHead').set(x, 9, 'lampPost');
  m.sign(5, onGround(GROUND, s.umb), s.umb);
  m.sign(10, onGround(GROUND, s.ride), s.ride);
  m.sign(34, onGround(GROUND, s.shaker), s.shaker);
  m.sign(47, onGround(GROUND, s.salt), s.salt);
  return {
    file: 'three',
    title: 'Town Hall',
    hint: 'Ride the umbrellas. Fix the salt.',
    look: 'hall',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    charms: [...charms],
  };
}
