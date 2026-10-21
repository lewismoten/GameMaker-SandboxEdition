// Level 2's monsters, and how Teddy's tricks beat them. Every trick sends out a monster of
// its own (a woof, a paw...) and the power ladder in ids.ts decides who wins a touch:
// - the cat is a blocker (102): Teddy can't get past, but a woof (106) beats it and it dies
//   into 'catRun', which runs off along its path and ends;
// - kids' hands and the yard-sale balloons are 108: only a paw (110, the high five) beats
//   them, and they die into a falling treat, a falling crate (that lands as a crate that
//   never dies: something to stand on) or Doc Leo's bow tie;
// - the mail truck is two monsters side by side driving around the wrapping map;
// - Gwin splashes in the sprinkler (90: bumping into Teddy sends her off as 'gwinGone').
import { CRITTERS } from '../sprites/critters';
import { FLIP } from '../characters/mons';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { balloonBox, balloonProp, crate, hand, mailTruck } from '../sprites/folks';
import { propSprite } from '../sprites/klown';

export function streetBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('cat')) b.pic(name, px, name === 'catRun' ? {} : { solid: 15 });
  b.pic('hand', hand());
  b.pic('balloon1', balloonBox(0));
  b.pic('balloon2', balloonBox(1));
  b.pic('crate', crate(), { solid: 15 });
  b.pic('tieB1', balloonProp(propSprite('tie'), 0)).pic('tieB2', balloonProp(propSprite('tie'), 1));
  b.pic('tie', propSprite('tie'));
  b.pic('tieGot', propSprite('tie'), { effect: CTR.props, eamt: 1, score: 100 });
  const [t0, t1] = mailTruck(0);
  const [u0, u1] = mailTruck(1);
  b.pic('truckB0', t0).pic('truckF0', t1).pic('truckB1', u0).pic('truckF1', u1);
  // A cat loafing on the sidewalk: not moving for anybody... except a dog who barks.
  b.add('cat', {
    pics: [
      ['cat1', 30],
      ['cat2', 4],
    ],
    power: POWER.blocker,
    becomes: 'catRun',
    upscore: 50,
  });
  b.add('catRun', {
    pics: [['catRun', 50]],
    power: 0,
    path: [
      [3, 0, 7],
      [5, -4, 7],
    ],
    end: -1,
  });
  b.add('hand', { pics: [['hand', 50]], power: POWER.balloon, becomes: 'treatFall', upscore: 25 });
  b.add('balloonBox', {
    pics: [
      ['balloon1', 9],
      ['balloon2', 9],
    ],
    power: POWER.balloon,
    becomes: 'crateFall',
    upscore: 25,
  });
  b.add('crateFall', { pics: [['crate', 50]], power: POWER.friend, path: [[0, 1, 4]], end: -1, becomes: 'crate' });
  b.add('crate', { pics: [['crate', 50]], power: POWER.friend, end: -2 });
  // Doc Leo's bow tie, caught on yard-sale balloons under a porch roof: high five them.
  b.add('tieBalloon', {
    pics: [
      ['tieB1', 9],
      ['tieB2', 9],
    ],
    power: POWER.balloon,
    becomes: 'tieFall',
    upscore: 50,
  });
  b.add('tieFall', { pics: [['tie', 50]], power: POWER.pickup + 1, path: [[0, 1, 3]], end: -1, becomes: 'tieGot' });
  b.add('tieGot', { pics: [['tieGot', 50]], power: POWER.pickup + 1 });
  // The mail truck drives right all the way around town (the map wraps).
  b.add('truckBack', {
    pics: [
      ['truckB0', 2],
      ['truckB1', 2],
    ],
    power: POWER.friend + 50,
    path: [[100, 0, 3]],
    end: -2,
  });
  b.add('truckFront', {
    pics: [
      ['truckF0', 2],
      ['truckF1', 2],
    ],
    power: POWER.friend + 50,
    path: [[100, 0, 3]],
    end: -2,
  });
  b.add('gwinSplash', {
    pics: [
      ['gwin1', 3],
      ['gwin2', 3],
      ['gwin3', 3],
      ['gwin2', 3],
    ],
    power: 90,
    path: [
      [4, 0, 4, 0],
      [0, 0, 4, FLIP],
    ],
    becomes: 'gwinGone',
  });
  return b;
}
