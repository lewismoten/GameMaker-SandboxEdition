// Level 3's monsters, for Gwinn's tricks: rope knots holding gates shut (only a chew, 118,
// beats a rope, 116), a raccoon in the trash (a BOOF sends it off), an owl in the park's
// big tree that swoops low now and then (flop, and it goes over), fireflies to catch for
// points, a pile of cardboard boxes (ZOOMIES knock it flat), hard clay at the foot of the
// playground fence (only her big dig gets through it), and a skunk. Bump into it or BOOF
// at it and it sprays: a cloud that hangs around and drifts off. Better to hop it.
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { NIGHT } from '../sprites/night';

export function nightBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(NIGHT)) {
    const hurt =
      name.startsWith('raccoon1') || name.startsWith('raccoon2')
        ? -5
        : name.startsWith('skunk')
          ? -3
          : name.startsWith('owl')
            ? -8
            : name.startsWith('stink')
              ? -1
              : 0;
    const solid = name === 'boxes' || name === 'ropeKnot' || name === 'clay' ? { solid: 15 } : {};
    const score = name.startsWith('firefly') ? { score: 50 } : {};
    b.pic(name, px, { ...(hurt ? { hp: hurt } : {}), ...solid, ...score });
  }
  b.add('rope', { pics: [['ropeKnot', 50]], power: POWER.rope, becomes: 'ropeChewed', upscore: 25 });
  b.add('ropeChewed', { pics: [['ropeChewed', 30]], power: 0, end: 30 });
  pacer(
    b,
    'raccoon',
    [
      ['raccoon1', 3],
      ['raccoon2', 3],
    ],
    POWER.pest,
    3,
    'raccoonRun',
    2,
  );
  b.add('raccoonRun', { pics: [['raccoonRun', 2]], power: 0, path: [[-8, 0, 9, FLIP]], end: -1 });
  // The owl sits in its tree; every so often the tree sends one swooping low across the path.
  b.add('swoop', {
    pics: [
      ['owl2', 2],
      ['owl1', 2],
    ],
    power: POWER.projectile + 90,
    path: [
      [-2, 4, 5, FLIP],
      [-7, 4, 7, FLIP],
      [-9, 1, 6, FLIP],
    ],
    end: -1,
  });
  b.add('firefly', {
    pics: [
      ['firefly1', 4],
      ['firefly2', 6],
    ],
    power: POWER.pickup,
    towards: 64 + 1,
  });
  b.add('boxes', { pics: [['boxes', 50]], power: POWER.zoom - 1, becomes: 'boxesDown', upscore: 50 });
  b.add('boxesDown', { pics: [['boxesDown', 50]], power: 0, end: 60 });
  b.add('clay', { pics: [['clay', 50]], power: POWER.hay + 1, becomes: 'puff', upscore: 25 });
  // The skunk waddles back and forth across the path; BOOF at it and it sprays.
  pacer(
    b,
    'skunk',
    [
      ['skunk1', 4],
      ['skunk2', 4],
    ],
    POWER.blocker - 3,
    4,
    'stink',
    1,
  );
  // the cloud drifts up and away, slowly
  b.add('stink', {
    pics: [
      ['stink1', 5],
      ['stink2', 5],
    ],
    power: POWER.friend,
    path: [[0, -4, 1]],
    end: -1,
  });
  return b;
}
