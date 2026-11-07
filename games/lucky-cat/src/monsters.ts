// LUCKY CAT's one monster kind: the crow who keeps knocking on wood. A round, glossy blue-black bird with a big
// white eye and an orange beak, wings up and wings down. It does not chase; it flaps along a path, and bumping it
// is a little bad luck (5 hit points). Slot 0 patrols sideways, slot 1 bobs up and down.
import { SOLBOT, SOLLEF, SOLRIG, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { BAD_LUCK } from './props';

const T = 255;

/** The crow's picture, wings up or down, facing right. */
function crow(pal: Pal, up: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const body = r('stone');
  const wy = up ? 1 : 9;
  blob(p, 7, wy + 3, 3.6, 4.6, body, 0, 2);
  blob(p, 9, 11, 7.4, 5.2, body, 0, 2);
  blob(p, 14, 9, 4.2, 4, body, 0, 3);
  p.rect(17, 9, 3, 2, c('orange', 3)).set(19, 10, c('orange', 2));
  p.disc(15, 8, 1.8, c('white', 3)).set(15, 8, c('ink', 0)).set(16, 8, c('ink', 0));
  p.rect(1, 12, 3, 2, body[1]).rect(0, 14, 3, 1, body[1]);
  p.rect(8, 16, 1, 3, c('orange', 2)).rect(11, 16, 1, 3, c('orange', 2));
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures (.MBL). */
export function monsterPictures(pal: Pal): Book {
  const mb = new Book('mbl');
  const rules = { solid: SOLBOT | SOLLEF | SOLRIG, hp: BAD_LUCK };
  mb.add('crow0', crow(pal, true), rules);
  mb.add('crow1', crow(pal, false), rules);
  return mb;
}

export const finishMonsterPictures = (mb: Book): Block[] => mb.finish();

/** The .MON: slot 0 patrols `run` blocks sideways, slot 1 bobs `bob` blocks. */
export function monsterSet(mb: Book, run = 5, bob = 3): Monster[] {
  const set = newMonsterSet();
  const anim: [number, number][] = [
    [mb.n('crow0'), 3],
    [mb.n('crow1'), 3],
  ];
  set[0] = mon(anim, { power: 150, thru: 0 }, pace(run, 2));
  set[1] = mon(anim, { power: 150, thru: 0 }, [corner(0, 0, 2), corner(0, bob, 2), corner(0, 0, 2)]);
  return set;
}

/** Slots in the .MON. */
export const CROW = { sideways: 0, bobbing: 1 } as const;
