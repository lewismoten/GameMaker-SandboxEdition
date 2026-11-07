// The parade's three troublemakers (monster blocks, .MBL, and what each does, .MON):
//   0  goose     waddles back and forth across the street; a goose waddles across the way; run through it and every moment costs a hit point (hop over it, or wait for a gap)
//   1  balloon   a runaway balloon that bobs up and down; touch it and it pops for 20 points
//   2  dog       trots along the curb; touch it and it snatches one thank-you card and runs off with it
// Power under 100 means a monster is gone when touched (Meet the Monsters explains it), which is how the balloon
// pops and the dog goes away with its card.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { CARDS } from './town';

export const MONS = { goose: 0, balloon: 1, dog: 2 } as const;
export const POP_POINTS = 20;
export const PECK = 1;
const T = 255;

function goose(pal: Pal, step: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const ink = c('ink', 0);
  // feet, then the round white body, the neck rising to a small head and an orange bill
  const o = r('orange');
  p.rect(6 + (step ? 1 : 0), 17, 3, 2, o[3]).rect(11 - (step ? 1 : 0), 17, 3, 2, o[3]).rect(5 + (step ? 1 : 0), 18, 4, 1, o[2]).rect(11 - (step ? 1 : 0), 18, 4, 1, o[2]);
  blob(p, 9, 13, 7.4, 4.6, r('white'), 0, 3);
  p.rect(2, 9, 3, 3, c('white', 2)).set(1, 9, c('white', 1)); // the tail
  p.rect(13, 5, 3, 8, c('white', 3)).rect(13, 5, 1, 8, c('white', 2));
  blob(p, 15, 4, 3, 2.6, r('white'), 1, 3);
  p.rect(17, 4, 3, 2, o[3]).rect(17, 5, 3, 1, o[1]);
  p.set(15, 3, ink);
  p.rect(4, 12, 6, 1, c('white', 1)).rect(6, 14, 5, 1, c('white', 1)); // a wing's feathers
  return outline(p, ink, { transparent: T });
}

function balloon(pal: Pal, sway: number): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  blob(p, 10 + sway, 8, 6, 7, r('red'), 0, 4);
  p.set(7 + sway, 5, c('white', 3)).set(7 + sway, 6, c('white', 3)).set(8 + sway, 4, c('white', 3));
  p.rect(9 + sway, 15, 3, 2, c('red', 1));
  p.line(10 + sway, 17, 10 - sway, 19, c('stone', 2));
  return outline(p, c('ink', 0), { transparent: T });
}

function dog(pal: Pal, step: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const ink = c('ink', 0);
  const d = r('wood');
  const leg = (x: number, lift: number) => p.rect(x, 15, 2, 4 - lift, d[2]).rect(x, 18 - lift, 3, 1, d[0]);
  leg(4, step ? 1 : 0);
  leg(7, step ? 0 : 1);
  leg(12, step ? 0 : 1);
  leg(15, step ? 1 : 0);
  blob(p, 9, 12, 7.6, 4.2, d, 0, 4);
  p.line(2, 11, 0, 7, d[3]).line(3, 11, 1, 7, d[3]).set(0, 6, d[4]); // the tail, up
  blob(p, 15, 8, 3.8, 3.6, d, 1, 4);
  p.rect(17, 8, 3, 3, c('skin', 2)).rect(19, 8, 1, 2, ink); // the snout and nose
  p.rect(12, 6, 3, 5, d[0]).rect(12, 6, 1, 5, d[1]); // a floppy ear
  p.set(16, 7, ink);
  p.rect(9, 11, 5, 1, d[4]); // a scarf-like patch of light fur
  p.rect(13, 14, 1, 1, c('red', 3)); // a collar tag
  return outline(p, ink, { transparent: T });
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
