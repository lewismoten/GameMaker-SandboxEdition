// The parade's three troublemakers (monster blocks, .MBL, and what each does, .MON), in the poster inks:
//   0  goose     a gray-and-paper goose in a little purple neckerchief (Gigi's), waddling back and forth; run through it
//                and every moment costs a hit point (hop over it, or wait for a gap)
//   1  balloon   a runaway vermilion balloon that bobs up and down; touch it and it pops for 20 points
//   2  dog       a spotted beagle that trots along the curb; touch it and it snatches one thank-you card and runs off
// Power under 100 means a monster is gone when touched (Meet the Monsters explains it), which is how the balloon
// pops and the dog goes away with its card.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { halftone, inkLine, type Pal } from './print';
import { CARDS } from './town';

export const MONS = { goose: 0, balloon: 1, dog: 2 } as const;
export const POP_POINTS = 20;
export const PECK = 1;
const T = 255;

function goose(pal: Pal, step: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const ink = c('ink', 0);
  // orange feet, a paper body with a gray halftone back, a long neck, an orange bill, Gigi's purple neckerchief
  const s = step ? 1 : 0;
  p.rect(6 + s, 17, 4, 2, c('orange', 3)).rect(11 - s, 17, 4, 2, c('orange', 3));
  p.rect(3, 10, 13, 7, c('white', 3)).rect(1, 9, 4, 3, c('white', 3)).rect(5, 9, 9, 1, c('white', 3));
  halftone(p, 1, 9, 15, 5, c('stone', 2), 3, [c('white', 3)]);
  p.rect(13, 3, 3, 8, c('white', 3)).rect(13, 1, 5, 4, c('white', 3));
  p.rect(18, 2, 2, 2, c('orange', 3)).set(16, 2, ink);
  p.rect(12, 8, 5, 2, c('purple', 2)).set(12, 10, c('purple', 2)).set(11, 11, c('purple', 1));
  p.rect(5, 12, 6, 1, c('stone', 3)); // the wing's edge
  return inkLine(p, ink);
}

function balloon(pal: Pal, sway: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  p.disc(10 + sway, 8, 6.5, c('red', 2));
  halftone(p, 0, 0, 20, 16, c('red', 1), (x, y) => (x - sway + y > 22 ? 3 : 0), [c('red', 2)]);
  p.rect(7 + sway, 4, 2, 2, c('paper', 3)).set(7 + sway, 6, c('paper', 3));
  p.rect(9 + sway, 15, 3, 1, c('red', 1));
  p.line(10 + sway, 16, 10 - sway, 19, c('ink', 1));
  return inkLine(p, c('ink', 0));
}

function dog(pal: Pal, step: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const ink = c('ink', 0);
  // a beagle: paper body with brown patches, a brown head with a long ear, a white-tipped tail held up
  const s = step ? 1 : 0;
  for (const [x, lift] of [
    [4, s],
    [7, 1 - s],
    [12, 1 - s],
    [15, s],
  ])
    p.rect(x, 15, 2, 4 - lift, c('paper', 3));
  p.rect(3, 9, 14, 7, c('paper', 3)).rect(6, 9, 6, 4, c('leather', 2));
  halftone(p, 3, 13, 14, 3, c('paper', 1), 2, [c('paper', 3)]);
  p.rect(1, 5, 2, 5, c('leather', 2)).rect(1, 4, 2, 1, c('white', 3)); // the tail, up, white tip
  p.rect(14, 4, 5, 6, c('leather', 2)).rect(17, 7, 3, 3, c('paper', 3)).set(19, 7, ink).set(16, 5, ink);
  p.rect(13, 5, 2, 6, c('leather', 0)); // the long ear
  p.rect(13, 10, 3, 1, c('red', 2)); // a collar
  return inkLine(p, ink);
}

/** The monster pictures (.MBL). */
export function monsterPictures(pal: Pal): Book {
  const mb = new Book('mbl');
  mb.add('goose0', goose(pal, false), { hp: -PECK });
  mb.add('goose1', goose(pal, true), { hp: -PECK });
  mb.add('balloon0', balloon(pal, 0), { score: POP_POINTS });
  mb.add('balloon1', balloon(pal, 1), { score: POP_POINTS });
  mb.add('dog0', dog(pal, false), { effect: CARDS, eamt: -1 });
  mb.add('dog1', dog(pal, true), { effect: CARDS, eamt: -1 });
  return mb;
}

export const finishMonsterPictures = (mb: Book): Block[] => mb.finish();

/** The .MON file. `run` is how many blocks the goose and the dog go before turning. */
export function monsterSet(mb: Book, o: { goose?: number; dog?: number } = {}): Monster[] {
  const set = newMonsterSet();
  set[MONS.goose] = mon(
    [
      [mb.n('goose0'), 3],
      [mb.n('goose1'), 3],
    ],
    { power: 150, thru: 1 },
    pace(o.goose ?? 4, 1),
  );
  set[MONS.balloon] = mon(
    [
      [mb.n('balloon0'), 6],
      [mb.n('balloon1'), 6],
    ],
    { power: 1, thru: 1 },
    [corner(0, 0, 1), corner(0, 3, 1), corner(0, 0, 1)],
  );
  set[MONS.dog] = mon(
    [
      [mb.n('dog0'), 2],
      [mb.n('dog1'), 2],
    ],
    { power: 1, thru: 1 },
    pace(o.dog ?? 8, 2),
  );
  return set;
}
