// Level 1's monsters: the squirrel (a pest: beaten by one of Teddy's tricks it becomes a
// squirrel running off up the tree, gone at the end of its path) and Gwinn pacing in her
// garbage-can mess. Her power is 90, under the 100 that Game-Maker lets the character
// beat by touching, so when she bumps into Teddy she "dies" into 'gwinnGone': Gwinn
// running off for 30 ticks (the shared monster in characters/sharedMonsters.ts).
//
// This morning Gwinn also has Teddy's green wobble ball, and she has the zoomies with it
// round her mess. She is adopted and still learning: she ignores SIT, but a WOOF (106)
// beats her 105, and she spits the ball out and is gone in a cloud of dust. The ball pops
// up, lands, and wobbles there giggling: Teddy's favorite toy, worth an extra nap.
import { CRITTERS } from '../sprites/critters';
import { FLIP } from '../characters/mons';
import { CTR, POWER } from '../ids';
import { TOYS } from '../sprites/toys';
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
  for (const [name, px] of Object.entries(TOYS)) {
    if (name.startsWith('wobble')) b.pic(name, px, { effect: CTR.lives, eamt: 1, score: 500 });
    else if (name.startsWith('ballAir') || name.startsWith('zoomBall')) b.pic(name, px);
  }
  // Zoomies: zig-zag laps of the lawn between the garbage cans and the squirrel's patch,
  // flat out (a squirrel in her way gets chased up the oak). She stays on the ground, so
  // the ball she drops lands on the lawn.
  b.add('gwinnBall', {
    pics: [
      ['zoomBall1', 2],
      ['zoomBall2', 2],
    ],
    power: POWER.dig,
    path: [
      [-3, 0, 8, FLIP],
      [-1, 0, 7, 0],
      [-5, 0, 8, FLIP],
      [-3, 0, 7, 0],
      [-4, 0, 7, FLIP],
      [0, 0, 8, 0],
    ],
    becomes: 'ballPop',
    upscore: 50,
  });
  // Ptoo! A puff of dust where Gwinn was, and the ball flies up and lands two steps back
  // (away from the garbage cans).
  b.add('ballPop', {
    pics: [
      ['puff1', 3],
      ['puff2', 3],
      ['ballAir1', 3],
      ['ballAir2', 3],
      ['ballAir1', 3],
      ['ballAir2', 9],
    ],
    power: 2,
    path: [
      [-1, -2, 5],
      [-2, 0, 5],
    ],
    end: -1,
    becomes: 'wobble',
  });
  b.add('wobble', {
    pics: [
      ['wobble1', 4],
      ['wobble2', 3],
      ['wobble3', 4],
      ['wobble4', 3],
    ],
    power: POWER.pickup,
  });
  return b;
}
