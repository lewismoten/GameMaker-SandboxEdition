// Level 4's monsters. The miller wants a SIT before he runs the hoist for a dog: sit pretty
// (2) and the heart wins over his "SIT?" bubble, which drops an "OK!" down onto the grain
// hoist and starts it going up and down (a chain of monsters, as with the bells on Main
// Street). Ducks on the pool (WOOF), the fisherman's hook bobbing on its line (it snags),
// a fish that jumps, and Doc Leo's rubber chicken going round and round in the eddy.
import { CRITTERS } from '../sprites/critters';
import { FLIP } from '../characters/mons';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { pacer, scent } from './common';
import { askBubble } from '../sprites/folks';
import { bubble, bucket } from '../sprites/townfolk';
import { chickenFloat, fish, hook } from '../sprites/river';

export function riverBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('duck')) b.pic(name, px, { hp: -4 });
  b.pic('askSit1', askBubble('SIT?', undefined, 0)).pic('askSit2', askBubble('SIT?', undefined, 1));
  b.pic('ok', bubble(['OK!']));
  b.pic('hoist', bucket(), { solid: 15 });
  b.pic('hook', hook(), { hp: -6 });
  b.pic('fish1', fish(0)).pic('fish2', fish(1));
  b.pic('chicken1', chickenFloat(0), { effect: CTR.clues, eamt: 1, score: 500 });
  b.pic('chicken2', chickenFloat(1), { effect: CTR.clues, eamt: 1, score: 500 });

  // The miller's SIT? (125) only gives way to the heart from sitting pretty (130).
  b.add('askSit', {
    pics: [
      ['askSit1', 8],
      ['askSit2', 8],
    ],
    power: POWER.sitAsk,
    becomes: 'okDrop',
    upscore: 100,
  });
  b.add('okDrop', { pics: [['ok', 3]], power: POWER.door, path: [[3, 2, 2]], end: -1 });
  b.add('hoistIdle', { pics: [['hoist', 50]], power: POWER.door - 1, becomes: 'hoist' });
  b.add('hoist', {
    pics: [['hoist', 50]],
    power: POWER.friend,
    path: [
      [0, -6, 2],
      [0, -5, 1],
      [0, -6, 1],
      [0, 0, 2],
      [0, -1, 1],
      [0, 0, 1],
    ],
  });
  pacer(
    b,
    'duck',
    [
      ['duck1', 6],
      ['duck2', 6],
    ],
    POWER.pest,
    3,
    'puff',
    1,
  );
  b.add('hook', {
    pics: [['hook', 50]],
    power: POWER.blocker,
    path: [
      [0, 2, 1],
      [0, 0, 1],
    ],
  });
  b.add('fish', {
    pics: [
      ['fish1', 3],
      ['fish2', 3],
    ],
    power: POWER.friend,
    path: [
      [1, -2, 4],
      [2, 0, 4, FLIP],
      [1, -2, 4, FLIP],
      [0, 0, 4],
    ],
  });
  // The rubber chicken, round and round the eddy.
  b.add('chicken', {
    pics: [
      ['chicken1', 6],
      ['chicken2', 6],
    ],
    power: POWER.pickup,
    path: [
      [2, 0, 1],
      [0, 0, 1, FLIP],
    ],
  });
  scent(b, 'scentPoodle', 'poodle');
  scent(b, 'scentBone', 'bonePop');
  return b;
}
