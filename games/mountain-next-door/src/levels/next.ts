// Level 1, NEXT DOOR (a scene you watch, at a foggy dawn): Tess steps out of her house the morning after
// Thanksgiving. Fog fills the empty lot next door, and it lifts in four waves to show a mountain, asleep, with
// garden gates caught all over it. Mr. Hale stops on his morning walk and stares; Mrs. Okoro comes out on her
// step. Then the mountain wakes: it opens its eyes, yawns, and lifts its big toe off the sidewalk so Tess can
// get by. Nothing to collect and nothing that hurts: walk along, read, watch.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { GROUND, addSigns, mountain, onGround, placeFace, room, startBook, type Level } from '../level';
import { NEXT, PROLOGUE } from '../monsters';

/** Where things are (columns; rows count down from the sky). */
export const NEXT_AT = {
  peak: 32,
  top: 0,
  eyes: [28, 36, 5],
  mouth: [32, 8],
  toe: 49,
  hale: 14,
  okoro: 58,
  exit: 67,
  fog: [19, 46, 3],
  signs: { up: 10, fog: 15, not: 22, gates: 41, polite: 53 },
} as const;

const SIGNS = {
  up: ['TRAIL CREW AT 8. TESS IS UP EARLY.', 4, 3],
  fog: ['SO MUCH FOG IN THE LOT NEXT DOOR...', 4, 3],
  not: ['WAIT. THAT IS NOT FOG.', 4, 3],
  gates: ['IT HAS ON HALF THE GARDEN GATES!', 4, 3],
  polite: ['IT SAID EXCUSE ME!', 4, 2],
} as const;

export function levelNext(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['mountain', 'sleepy', 'town'], { wake: PROLOGUE.wake });
  const s = addSigns(book, pal, SIGNS);
  const g = room(70, NEXT_AT.exit);
  const m = new StarterMap(book, g.rows());
  mountain(m, NEXT_AT.peak, NEXT_AT.top);
  // gates caught high on the rock (out of reach today)
  m.set(32, 2, 'gate.green').set(26, 5, 'gate.white').set(39, 5, 'gate.blue').set(29, 3, 'gate.red');
  // the big toe across the sidewalk, four blocks high so nobody hops it
  const t = NEXT_AT.toe;
  m.set(t, GROUND - 4, 'toeL').set(t + 1, GROUND - 4, 'toeM').set(t + 2, GROUND - 4, 'toeR');
  for (let y = GROUND - 3; y < GROUND; y++) for (let x = t; x < t + 3; x++) m.set(x, y, 'toe');
  // Tess's house (she starts in its doorway) and her fence; Mrs. Okoro's house past the toe
  house(m, 1, 7, 'wall', 'windowLit');
  m.set(3, GROUND - 2, 'doorwayTop').set(3, GROUND - 1, 'doorwayBottom');
  for (const x of [8, 9]) m.set(x, GROUND - 1, 'fence');
  house(m, 55, 62, 'wallB', 'windowB');
  // the sleepy face, then the fog over it, in four waves from the left
  const [el, er, ey] = NEXT_AT.eyes;
  placeFace(m, NEXT.face, el, er, ey, NEXT_AT.mouth[0], NEXT_AT.mouth[1]);
  const [f0, f1, fy] = NEXT_AT.fog;
  const cx = (f0 + f1) / 2;
  for (let y = fy; y < GROUND; y++)
    for (let x = f0; x <= f1; x++)
      if (((x - cx) / ((f1 - f0) / 2 + 0.5)) ** 2 + ((y - GROUND) / (GROUND - fy + 0.5)) ** 2 <= 1) m.mon(NEXT.fogWait[Math.min(3, Math.floor(((x - f0) * 4) / (f1 - f0 + 1)))], x, y);
  // the neighbors: Mr. Hale on his walk, Mrs. Okoro on her step (top, bottom, and the cue over where they stop)
  m.mon(NEXT.hale, NEXT_AT.hale, GROUND - 2).mon(NEXT.hale + 1, NEXT_AT.hale, GROUND - 1);
  m.mon(NEXT.hale + 8, NEXT_AT.hale + PROLOGUE.haleWalk, GROUND - 3);
  m.mon(NEXT.okoro, NEXT_AT.okoro, GROUND - 2).mon(NEXT.okoro + 1, NEXT_AT.okoro, GROUND - 1);
  m.mon(NEXT.okoro + 8, NEXT_AT.okoro + PROLOGUE.okoroWalk, GROUND - 3);
  const at = NEXT_AT.signs;
  for (const k of Object.keys(at) as (keyof typeof at)[]) m.sign(at[k], onGround(GROUND, s[k]), s[k]);
  return {
    file: 'next',
    title: 'Next Door',
    hint: 'Watch the fog lift. Read the signs.',
    look: 'dawn',
    map: m,
    book,
    timed,
    mon: 'next',
    song: 'theme',
    watch: true,
  };
}

/** A little house from column x0 to x1: two rows of wall with windows under a roof. */
export function house(m: StarterMap, x0: number, x1: number, wall: string, win: string): void {
  for (let x = x0; x <= x1; x++) {
    for (const y of [GROUND - 3, GROUND - 2, GROUND - 1]) m.set(x, y, (x - x0) % 3 === 2 && y === GROUND - 2 ? win : wall);
    m.set(x, GROUND - 4, x === x0 ? 'roofL' : x === x1 ? 'roofR' : 'roofM');
  }
  for (let x = x0 + 1; x < x1; x++) m.set(x, GROUND - 5, x === x0 + 1 ? 'roofL' : x === x1 - 1 ? 'roofR' : 'roofM');
}
