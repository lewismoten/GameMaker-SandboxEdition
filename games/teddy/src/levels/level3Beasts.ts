// Level 3's monsters: geese guarding the covered bridge (blockers, 102: only a woof, 106,
// beats them, and they die into geese running off), friendly ducks, the squirrel, kids who
// ask for a sit (125: only the heart that sitting pretty sends up, 130, beats them; they die
// into Doc Leo's falling shoes or a falling treat that lands as a treat to pick up),
// frisbees flying past (projectiles), and Gwinn rolling in the mud.
import { CRITTERS } from '../sprites/critters';
import { FLIP } from '../characters/mons';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { askBubble, frisbee } from '../sprites/folks';
import { propSprite } from '../sprites/klown';

export function parkBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) {
    if (name.startsWith('goose')) b.pic(name, px, name === 'gooseRun' ? {} : { solid: 15 });
    if (name.startsWith('duck') || name.startsWith('squirrel')) b.pic(name, px, name.startsWith('squirrel') ? { hp: -8 } : {});
  }
  const shoes = propSprite('shoes');
  b.pic('askShoes1', askBubble('SIT?', shoes, 0)).pic('askShoes2', askBubble('SIT?', shoes, 1));
  b.pic('askSit1', askBubble('SIT?', undefined, 0)).pic('askSit2', askBubble('SIT?', undefined, 1));
  b.pic('shoes', shoes).pic('shoesGot', shoes, { effect: CTR.props, eamt: 1, score: 100 });
  b.pic('frisbee1', frisbee(0), { hp: -8 }).pic('frisbee2', frisbee(1), { hp: -8 });
  // The geese guarding the covered bridge: barking is the only thing they respect.
  b.add('goose', {
    pics: [
      ['goose1', 20],
      ['goose2', 6],
    ],
    power: POWER.blocker,
    becomes: 'gooseRun',
    upscore: 50,
  });
  b.add('gooseRun', {
    pics: [['gooseRun', 50]],
    power: 0,
    path: [
      [4, -1, 6],
      [9, -8, 6],
    ],
    end: -1,
  });
  b.add('duck', {
    pics: [
      ['duck1', 6],
      ['duck2', 6],
    ],
    power: POWER.friend,
    path: [
      [4, 0, 1, 0],
      [0, 0, 1, FLIP],
    ],
  });
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
    pics: [['squirrel1', 50]],
    power: 0,
    path: [
      [3, -1, 7],
      [6, -6, 7],
    ],
    end: -1,
  });
  // Kids asking for a sit: the shoes, or a treat.
  b.add('askShoes', {
    pics: [
      ['askShoes1', 10],
      ['askShoes2', 10],
    ],
    power: POWER.sitAsk,
    becomes: 'shoesFall',
    upscore: 50,
  });
  b.add('shoesFall', { pics: [['shoes', 50]], power: 2, path: [[0, 2, 3]], end: -1, becomes: 'shoesGot' });
  b.add('shoesGot', { pics: [['shoesGot', 50]], power: 2 });
  b.add('askSit', {
    pics: [
      ['askSit1', 10],
      ['askSit2', 10],
    ],
    power: POWER.sitAsk,
    becomes: 'treatFall2',
    upscore: 25,
  });
  b.add('treatFall2', { pics: [['treat1', 2]], power: POWER.pickup, path: [[0, 2, 3]], end: -1, becomes: 'treat' });
  b.add('frisbee', {
    pics: [
      ['frisbee1', 2],
      ['frisbee2', 2],
    ],
    power: POWER.projectile,
    path: [[-12, 0, 6]],
    end: -1,
  });
  b.add('gwinnMud', {
    pics: [
      ['gwinnRoll', 6],
      ['gwinn1', 4],
      ['gwinn2', 4],
      ['gwinn3', 4],
    ],
    power: 90,
    path: [
      [3, 0, 2, 0],
      [0, 0, 2, FLIP],
    ],
    becomes: 'gwinnGone',
  });
  return b;
}
