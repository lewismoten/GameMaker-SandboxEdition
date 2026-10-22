// Level 2's monsters. Pigeons on the sidewalk and the awnings (a bark sends them flying).
// Bells: a high five rings one, and a rung bell sends its DING down onto whatever it
// hangs over, a chain of monsters each beating the next: the Town Crier's bell wakes him
// ("HEAR YE!") and he hands out a proclamation (worth treats); the bucket truck's
// "RING FOR SERVICE" bell starts its bucket going up and down, the ride up to the gazebo
// roof. Scents for the sniff, and Gwinn's soft dirt behind the hedge.
import { CRITTERS } from '../sprites/critters';
import { FLIP } from '../characters/mons';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { scent } from './common';
import { bell, bubble, bucket, ding, scroll } from '../sprites/townfolk';

export function mainBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -6 });
  for (let k = 0; k < 3; k++) b.pic(`bell${k}`, bell(k));
  b.pic('ding0', ding(0)).pic('ding1', ding(1));
  b.pic('hearYe', bubble(['HEAR', 'YE!']));
  b.pic('thatWay', bubble(['DOG', 'WENT>']));
  b.pic('scroll', scroll(), { effect: CTR.treats, eamt: 5, score: 100 });
  b.pic('scrollAir', scroll());
  b.pic('bucket', bucket(), { solid: 15 });

  // Pigeons strut back and forth; a bark sends them off over the rooftops.
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
    path: [[5, -8, 8]],
    end: -1,
  });

  // A bell: a high five (110) beats it (109); it rings, and its DING drops onto what is under it.
  const ringing = (name: string, then: string) =>
    b.add(name, {
      pics: [
        ['bell1', 2],
        ['bell2', 2],
        ['bell1', 2],
        ['bell2', 2],
      ],
      power: 0,
      end: 8,
      becomes: then,
    });
  // The Crier's bell, held up beside his head: rung, it wakes him; the DING lands on nothing,
  // he calls out and drops a proclamation.
  b.add('crierBell', { pics: [['bell0', 50]], power: POWER.paw - 1, becomes: 'crierRing', upscore: 50 });
  ringing('crierRing', 'hearYe');
  b.add('hearYe', {
    pics: [
      ['hearYe', 24],
      ['thatWay', 24],
    ],
    power: 0,
    end: 48,
    becomes: 'scrollPop',
  });
  b.add('scrollPop', { pics: [['scrollAir', 2]], power: 2, path: [[0, 1, 4]], end: -1, becomes: 'scroll' });
  b.add('scroll', { pics: [['scroll', 50]], power: POWER.pickup });
  // The bucket truck's bell rings a DING that drops into the bucket, and the bucket starts up.
  b.add('truckBell', { pics: [['bell0', 50]], power: POWER.paw - 1, becomes: 'truckRing', upscore: 50 });
  ringing('truckRing', 'truckDing');
  b.add('truckDing', {
    pics: [
      ['ding0', 2],
      ['ding1', 2],
    ],
    power: POWER.door,
    path: [[-1, 1, 3]],
    end: -1,
  });
  b.add('bucketIdle', { pics: [['bucket', 50]], power: POWER.door - 1, becomes: 'bucket' });
  b.add('bucket', {
    pics: [['bucket', 50]],
    power: POWER.friend,
    // up, a slow bob at the top (time to step off), down again, and a bob at the bottom
    path: [
      [0, -6, 2],
      [0, -5, 1],
      [0, -6, 1],
      [0, 0, 2],
      [0, -1, 1],
      [0, 0, 1],
    ],
  });

  // What the sniff finds: a balloon dog in the Dog House's rock cubby, a bone in the flowers.
  scent(b, 'scentPoodle', 'poodle');
  scent(b, 'scentBone', 'bonePop');
  scent(b, 'scentTreat', 'treatFall');
  return b;
}
