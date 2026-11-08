// LUCKY CAT's one monster kind: the crow, the town's lookout, who keeps knocking on wood. Cut in the game's woodcut
// (print.ts): an ink bird with a paper cut line, a gold eye and a sharp beak, wings up and wings down. It does not
// chase; it flaps along a path, and bumping it is a little bad luck (5 hit points). Slot 0 patrols sideways, slot 1
// bobs up and down.
import { SOLBOT, SOLLEF, SOLRIG, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { art, cut, type Pal } from './print';
import { BAD_LUCK } from './props';

/** The crow's picture, wings up or down, facing right. */
function crow(pal: Pal, up: boolean): Pixels {
  const wings = up
    ? [
        '....KK..............',
        '....KKK.............',
        '.....KKK............',
        '.....KKKK...........',
        '......KKKK..........',
        '......KKKKK.........',
        '.......KKKKK........',
      ]
    : [
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
      ];
  const low = up
    ? ['....................', '....................', '....................']
    : ['.......KKKKK........', '......KKKKK.........', '.....KKKK...........'];
  return cut(
    pal,
    art(pal, [
      ...wings,
      '............KKK.....',
      '...........KKGKK....',
      '..........KKKKKKYY..',
      '...KK....KKKKKKKKYY.',
      '..KKKKKKKKKKKKKK....',
      '.KKKnKKKKKKKKKK.....',
      'KKKKKnnKKKKKKK......',
      ...low,
      '.........K..K.......',
      '.........Y..Y.......',
      '........YY.YY.......',
    ]),
  );
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
