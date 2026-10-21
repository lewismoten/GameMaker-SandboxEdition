// Level 1's monsters: the squirrel (a pest: beaten by one of Teddy's tricks it becomes a
// squirrel running off up the tree, gone at the end of its path) and Gwin pacing in her
// garbage-can mess. Her power is 90, under the 100 that Game-Maker lets the character
// beat by touching, so when she bumps into Teddy she "dies" into 'gwinGone': Gwin
// running off for 30 ticks (the shared monster in characters/sharedMonsters.ts).
import { CRITTERS } from '../sprites/critters';
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';

export function backyardBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('squirrel')) b.pic(name, px, { hp: -8 });
  b.add('squirrel', {
    pics: [
      ['squirrel1', 3],
      ['squirrel2', 3],
    ],
    power: POWER.pest,
    path: [
      [2, 0, 2, 0],
      [0, 0, 2, FLIP],
    ],
    becomes: 'squirrelRun',
    upscore: 25,
  });
  b.add('squirrelRun', {
    pics: [['squirrelRun', 2]],
    power: 0,
    path: [
      [4, -1, 7],
      [7, -6, 7],
    ],
    end: -1,
  });
  b.add('gwinMess', {
    pics: [
      ['gwin1', 3],
      ['gwin2', 3],
      ['gwin3', 3],
      ['gwin2', 3],
    ],
    power: 90,
    path: [
      [5, 0, 4, 0],
      [5, 0, 1, 0],
      [0, 0, 4, FLIP],
      [0, 0, 1, FLIP],
    ],
    becomes: 'gwinGone',
  });
  return b;
}
