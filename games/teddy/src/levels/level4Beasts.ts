// Level 4's monsters: the revolving doors (Level 5 uses them too), Juggles' pins, pigeons
// on the awnings, Presto's doves, the Klown Klub parade marching down Main Street, a kid
// who asks for a sit, and Gwinn (in the store, and chasing pigeons).
import { sprite } from '../art/draw';
import { CRITTERS } from '../sprites/critters';
import { FLIP, type Bestiary } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { askBubble, pin } from '../sprites/folks';
import { dove, marcher, split } from '../sprites/magic';
import { CK } from '../sprites/klown';
import { c } from '../blocks/tiles';

/** Revolving doors: solid until a spin sets one turning for a while; then it stops again. */
export function revolvingDoor(b: Bestiary): void {
  const K: Record<string, number> = { ...CK, g: c('glow', 2), G: c('glow', 3) };
  const doorPic = (phase: number) =>
    sprite(
      phase === 0
        ? [
            'ommmmmmmmmmmmmmmmmmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGgGGGGmmGGGGgGGGmo',
            'omGGgGGGmmGGGGGgGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'ommmmmmmmmmmmmmmmmmo',
            'oooooooooooooooooooo',
          ]
        : phase === 1
          ? [
              '......ommmmmmo......',
              '......omGGGGmo......',
              '......omGgGGmo......',
              '......omGGgGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......ommmmmmo......',
              '......oooooooo......',
            ]
          : [
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
            ],
      K,
    );
  b.pic('door', doorPic(0), { solid: 15 });
  b.pic('door1', doorPic(1));
  b.pic('door2', doorPic(2));
  // Revolving doors: a spin sets one turning for a while, then it stops again.
  b.add('revolve', { pics: [['door', 50]], power: POWER.door, becomes: 'revolving', upscore: 25 });
  b.add('revolving', {
    pics: [
      ['door1', 2],
      ['door2', 2],
      ['door1', 2],
      ['door', 1],
    ],
    power: POWER.friend,
    end: 60,
    becomes: 'revolve',
  });
}

export function cityBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -8 });
  revolvingDoor(b);
  b.pic('pin1', pin(0), { hp: -8 }).pic('pin2', pin(1), { hp: -8 });
  b.pic('dove1', dove(0)).pic('dove2', dove(1));
  // Main Street is closed to traffic: the Klown Klub parade is marching to the Big Show.
  for (const kind of ['drum', 'banner', 'balloons'] as const)
    for (const step of [0, 1]) {
      const [top, bottom] = split(marcher(kind, step));
      b.pic(`${kind}T${step}`, top).pic(`${kind}B${step}`, bottom);
    }
  b.pic('askSit1', askBubble('SIT?', undefined, 0)).pic('askSit2', askBubble('SIT?', undefined, 1));

  b.add('pin', {
    pics: [
      ['pin1', 2],
      ['pin2', 2],
    ],
    power: POWER.projectile,
    path: [[-10, 0, 6]],
    end: -1,
  });
  b.add('pigeon', {
    pics: [
      ['pigeon1', 5],
      ['pigeon2', 5],
    ],
    power: POWER.pest,
    path: [
      [2, 0, 1, 0],
      [0, 0, 1, FLIP],
    ],
    becomes: 'pigeonFly',
    upscore: 25,
  });
  b.add('pigeonFly', {
    pics: [
      ['pigeonFly1', 2],
      ['pigeonFly2', 2],
    ],
    power: 0,
    path: [
      [3, -3, 6],
      [8, -10, 6],
    ],
    end: -1,
  });
  b.add('dove', {
    pics: [
      ['dove1', 2],
      ['dove2', 2],
    ],
    power: 0,
    path: [
      [1, -3, 3],
      [4, -9, 5],
    ],
    end: -1,
  });
  for (const kind of ['drum', 'banner', 'balloons'])
    for (const half of ['T', 'B'])
      b.add(`${kind}${half}`, {
        pics: [
          [`${kind}${half}0`, 4],
          [`${kind}${half}1`, 4],
        ],
        power: POWER.friend + 50,
        path: [[100, 0, 1]],
        end: -2,
      });
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
  b.add('gwinnStore', {
    pics: [
      ['gwinnRun1', 2],
      ['gwinnRun2', 2],
    ],
    power: 90,
    path: [
      [6, 0, 5, 0],
      [0, 0, 5, FLIP],
    ],
    becomes: 'gwinnGone',
  });
  b.add('gwinnPigeons', {
    pics: [
      ['gwinnRun1', 2],
      ['gwinnRun2', 2],
    ],
    power: 90,
    path: [
      [4, 0, 4, 0],
      [0, 0, 4, FLIP],
    ],
    becomes: 'gwinnGone',
  });
  return b;
}
