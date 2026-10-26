// Level 3's background blocks, Puddlewick Park on a spring morning: the far trees, the lawn,
// the jungle gym, the see-saws' fulcrums (their ends are monsters), the duck pond (water
// that floats Teddy to the surface and drifts him back to the near bank), the stepping rocks,
// the big oak with a kite tangled in it, its branches, Juggles by his super see-saw, a bench,
// a lamppost, and the kid with the flying disc.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { branch, c, cloud, copy, dirt, grassTop, hedge, leaves, r, sky, trunk, tuft } from '../blocks/tiles';
import { bandAt, water, wideSign } from './common';
import { art } from './parts';
import { kid, juggler } from '../sprites/folks';
import { leoOn } from '../sprites/leo';

export const G = 40;

export function parkTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(1, part, 13));
  t.wall('grass', grassTop(41));
  t.wall('dirt', dirt(43));
  t.wall('deep', dirt(44, true));
  const far = (top: boolean, seed: number) => {
    const p = top ? sky(3) : new Pixels(20, 20, c('leaf', 2));
    const R = rng(seed);
    for (let i = 0; i < 6; i++) blob(p, R() * 20, (top ? 13 : 5) + R() * 8, 5 + R() * 3, 5, [c('leaf', 1), c('leaf', 2), c('leaf', 3)], 0, 2, 0.6);
    return p;
  };
  t.air('farTop', far(true, 51));
  t.air('far', far(false, 52));
  const lawn = tuft(new Pixels(20, 20, c('grass', 3)), 53);
  t.air('lawn', lawn);
  t.air('lawnFlower', tuft(new Pixels(20, 20, c('grass', 3)), 54, 'yellow'));
  t.wall('hedgeWall', hedge(false, 56));
  t.wall('hedgeTop', hedge(true, 57, sky(bandAt(35, G))));
  t.wall('edgeHedge', hedge(false, 58));
  t.wall('edgeHedgeTop', hedge(true, 59, sky(bandAt(29, G))));

  // The jungle gym: red bars to stand on (hop up through them).
  const gym = (top: boolean) => {
    const p = copy(top ? t.pic('far') : lawn);
    p.rect(0, 0, 20, 3, c('red', 2)).rect(0, 0, 20, 1, c('red', 3));
    p.rect(2, 3, 2, 17, c('red', 1)).rect(16, 3, 2, 17, c('red', 1));
    if (!top) p.rect(2, 10, 16, 2, c('red', 1));
    return p;
  };
  t.ledge('gym', gym(true));
  t.ledge('gymLow', gym(false));
  // the little step beside each see-saw's riding end (wait on it, walk on when it is level)
  t.ledge(
    'step',
    (() => {
      const p = copy(t.pic('far'));
      p.rect(1, 0, 18, 4, c('red', 2)).rect(1, 0, 18, 1, c('red', 3)).rect(3, 4, 2, 16, c('red', 1)).rect(15, 4, 2, 16, c('red', 1));
      p.rect(3, 11, 14, 2, c('red', 1));
      return p;
    })(),
  );

  // The see-saws' fulcrums (on the lawn, and on a rock in the pond).
  const fulcrum = (base: Pixels) => {
    const p = copy(base);
    for (let y = 6; y < 20; y++) p.rect(10 - Math.floor((y - 6) / 2), y, 1 + Math.floor((y - 6) / 2) * 2, 1, c('metal', y < 8 ? 3 : 1));
    return p;
  };
  t.air('fulcrum', fulcrum(lawn));

  // The duck pond: water that floats Teddy up (he paddles at the surface) and drifts him left,
  // back to the near bank; a rock in the middle.
  const pond = (top: boolean) => (top ? water(true, 1, lawn) : water(false, 2));
  t.air('pondTop', pond(true), { grav: GRAV.up | GRAV.left });
  t.air('pond', pond(false), { grav: GRAV.up | GRAV.left });
  t.wall(
    'pondBed',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('mud'), 0, 2, 61, 0.3);
      return p;
    })(),
  );
  t.air(
    'rock',
    (() => {
      const p = water(true, 3, lawn);
      blob(p, 10, 15, 9, 6, r('stone'), 1, 4);
      return p;
    })(),
  );
  t.air('rockFulcrum', fulcrum(t.pic('rock')));

  // The big oak: leaves, trunk, branches to stand on (hop up through them).
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(90 + k, sky(k)));
  t.air('trunk', trunk(t.pic('farTop')));
  t.air('trunkFar', trunk(t.pic('far')));
  t.air('trunkLawn', trunk(lawn));
  for (let k = 0; k < 4; k++) t.air(`trunkSky${k}`, trunk(sky(k)));
  for (let k = 0; k < 4; k++) t.ledge(`branch${k}`, branch(leaves(96 + k, sky(k))));
  t.ledge('branchBare', branch(sky(bandAt(35, G))));
  // the kite, tangled in the leaves; its tail of streamers is the errand
  const kite = leaves(99, sky(1));
  for (let i = 0; i < 9; i++) kite.rect(4 + i, 1 + i, 9 - i, 1, c(i < 4 ? 'yellow' : 'red', 2));
  kite.line(13, 10, 17, 19, c('ink', 1));
  t.air('kite', kite);
  t.clue('streamers', 'streamers', 'leaf1');

  // Juggles, by his super see-saw (two pictures taking turns).
  for (const ph of [0, 1]) {
    const [a, b] = leoOn(juggler(ph), t.pic('far'), lawn);
    t.air(`juggles${ph}Top`, a, { next: `juggles${1 - ph}Top`, ntime: 7 });
    t.air(`juggles${ph}Bot`, b, { next: `juggles${1 - ph}Bot`, ntime: 7 });
  }
  // The bench and the lamppost.
  art(
    t,
    'bench',
    2,
    1,
    () => lawn,
    (p) => {
      p.rect(2, 6, 36, 3, c('wood', 3)).rect(2, 11, 36, 3, c('wood', 2)).rect(4, 14, 3, 6, c('ink', 1)).rect(33, 14, 3, 6, c('ink', 1));
    },
  );
  art(
    t,
    'lamp',
    1,
    3,
    (_bx, by) => (by === 2 ? lawn : by === 1 ? t.pic('far') : t.pic('farTop')),
    (p) => {
      p.rect(9, 6, 2, 54, c('ink', 1));
      p.rect(5, 0, 10, 8, c('ink', 0)).rect(6, 1, 8, 6, c('glow', 3));
    },
  );
  // The kid with the flying disc (it flies left, head high: play dead under it).
  t.on('discKid', kid('girl'), 'lawn', 'air');

  // Signs.
  const [lowL, lowR] = wideSign(lawn, 'RIDE THE\nLOW END');
  t.air('signLowL', lowL);
  t.air('signLowR', lowR);
  const [superL, superR] = wideSign(lawn, 'SUPER\nSEE-SAW!');
  t.air('signSuperL', superL);
  t.air('signSuperR', superR);
  const [deadL, deadR] = wideSign(lawn, 'DISC!\n4: DUCK');
  t.air('signDeadL', deadL);
  t.air('signDeadR', deadR);

  // The hedge hollow, past THE CHEZ: a corgi-sized gap at the foot of the park's end hedge
  // (walk in and it is a room of its own), and inside, where the park's lost party things
  // blow, the felt egg (park.ts).
  t.air(
    'hollowGap',
    (() => {
      const p = hedge(false, 61);
      blob(p, 10, 13, 8, 9, r('leaf'), 0, 0, 1);
      p.rect(2, 13, 16, 7, c('leaf', 0));
      return p;
    })(),
  );
  const inside = (() => {
    const p = new Pixels(20, 20, c('leaf', 0));
    speckle(p, 0, 0, 20, 20, r('leaf'), 0, 1, 62, 0.3);
    return p;
  })();
  t.air('hollow', inside);
  t.wall(
    'hollowFloor',
    (() => {
      const p = dirt(63, true);
      p.rect(0, 0, 20, 3, c('leaf', 1));
      for (let x = 1; x < 20; x += 4) p.set(x, 3, c('leaf', 2));
      return p;
    })(),
  );
  // the lost party things: a striped party hat and a paper horn; a popped balloon and its ribbon
  t.air(
    'favors1',
    (() => {
      const p = copy(inside);
      for (let k = 0; k < 9; k++) p.rect(4 - Math.floor(k / 3), 10 + k, 1 + 2 * Math.floor(k / 3) + 1, 1, c(k % 3 ? 'blue' : 'yellow', 2));
      p.set(4, 9, c('red', 3));
      p.rect(9, 16, 9, 2, c('red', 2)).rect(17, 15, 2, 4, c('yellow', 3));
      return p;
    })(),
  );
  t.air(
    'favors2',
    (() => {
      const p = copy(inside);
      blob(p, 6, 17, 4, 2, r('purple'), 1, 2);
      p.line(9, 17, 12, 12, c('pink', 3)).line(12, 12, 15, 17, c('pink', 3));
      p.rect(14, 16, 4, 3, c('frost', 2));
      return p;
    })(),
  );
  // the way back out: daylight at the end of the leafy tunnel
  t.air(
    'hollowOut',
    (() => {
      const p = copy(inside);
      p.rect(5, 4, 10, 16, c('grass', 3)).rect(7, 2, 6, 2, c('grass', 4));
      return p;
    })(),
  );
  return t;
}
