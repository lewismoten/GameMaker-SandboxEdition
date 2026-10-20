// The monsters every stage shares, always first in its .mon/.mbl so their numbers never
// change: the ship's shots and Nova bolts, sparks and explosions, the wreck that a dead
// turret leaves behind, and the virus's bullets.
import { Pixels } from '../kit/pixels';
import { CLEAR, blob } from './art';
import { POWER } from './ids';
import type { Bestiary } from './mons';
import type { Pal } from './pal';
import { SHOT_MON } from './ship';

const pic = () => new Pixels(20, 20, CLEAR);

function shotPic(p: Pal): Pixels {
  const s = pic();
  for (const x of [5, 13]) {
    s.rect(x, 5, 2, 10, p.c('cyan', 3));
    s.rect(x, 4, 2, 1, p.c('cyan', 5));
    s.rect(x, 7, 2, 5, p.c('cyan', 5));
    s.rect(x - 1, 8, 1, 3, p.c('cyan', 1));
    s.rect(x + 2, 8, 1, 3, p.c('cyan', 1));
  }
  return s;
}

function orb(p: Pal, r: number, ramp: string, lo = 0): Pixels {
  const s = pic();
  blob(s, 10, 10, r + 1, r + 1, p.r(ramp), lo, Math.min(p.r(ramp).length - 1, lo + 2), 0.6);
  blob(s, 10, 10, r, r, p.r(ramp), lo + 1, p.r(ramp).length - 1);
  return s;
}

function burst(p: Pal, k: number, big: boolean): Pixels {
  const s = pic();
  const R = big ? [5, 8, 9, 9] : [3, 5, 6, 6];
  const r = R[k];
  if (k < 3) blob(s, 10, 10, r, r, p.r('fire'), k === 0 ? 4 : 2 - Math.min(2, k - 1), 7 - k);
  else {
    // smoke
    blob(s, 10, 10, r - 1, r - 1, p.r('grey'), 1, 3);
    for (let i = 0; i < 6; i++) s.set(10 + Math.cos(i * 1.1) * r, 10 + Math.sin(i * 1.1) * r, p.c('fire', 3));
  }
  if (k === 1 || k === 2)
    for (let i = 0; i < 8; i++) s.set(10 + Math.cos((i * Math.PI) / 4) * (r + 2), 10 + Math.sin((i * Math.PI) / 4) * (r + 2), p.c('fire', 6));
  return s;
}

function wreckPic(p: Pal, k: number): Pixels {
  const s = pic();
  blob(s, 10, 11, 8, 6, p.r('grey'), 0, 3);
  for (let i = 0; i < 9; i++) {
    const a = i * 0.7 + k;
    s.rect(10 + Math.cos(a) * 5, 11 + Math.sin(a) * 3, 2, 1, p.c('steel', 1 + (i % 3)));
  }
  s.rect(8, 10, 4, 2, p.c('fire', k ? 3 : 2));
  s.set(6 + k * 3, 9, p.c('fire', 5));
  // a curl of smoke
  blob(s, 11 - k, 4 - k, 2 + k, 2, p.r('grey'), 2, 4);
  return s;
}

/** A turret's armored collar (its barrel, drawn on the mount block, shows through the middle). */
function ringPic(p: Pal, hp: number): Pixels {
  const s = pic();
  const ramp = hp === 3 ? 'steel' : hp === 2 ? 'gold' : 'red';
  const r = p.r(ramp);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const d = Math.hypot(x - 9.5, y - 9.5);
      if (d > 9.3 || d < 5.2) continue;
      const lit = (9.5 - x + (9.5 - y)) / 19;
      s.set(x, y, r[Math.max(0, Math.min(r.length - 1, Math.round((r.length - 1) * (0.45 + lit * 0.5) - (d > 8.4 ? 1 : 0))))]);
    }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    s.set(9.5 + Math.cos(a) * 7.2, 9.5 + Math.sin(a) * 7.2, p.c('ink', 0));
  }
  if (hp < 3) for (let i = 0; i < 4 - hp; i++) s.rect(4 + i * 5, 3 + ((i * 7) % 12), 2, 1, p.c('ink', 0));
  return s;
}

function sparkPic(p: Pal): Pixels {
  const s = pic();
  s.rect(9, 6, 2, 8, p.c('cyan', 5)).rect(6, 9, 8, 2, p.c('cyan', 5));
  s.set(7, 7, p.c('cyan', 3)).set(12, 7, p.c('cyan', 3)).set(7, 12, p.c('cyan', 3)).set(12, 12, p.c('cyan', 3));
  return s;
}

function flakPic(p: Pal, k: number): Pixels {
  const s = orb(p, 3, 'virus', 1);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + k * 0.8;
    s.set(10 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, p.c('pink', 4));
  }
  return s;
}

function burstPic(p: Pal, k: number): Pixels {
  const s = pic();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const r = 4 + k * 4;
    s.rect(10 + Math.cos(a) * r, 10 + Math.sin(a) * r, 2, 2, p.c('pink', 3 + k));
  }
  blob(s, 10, 10, 3 - k, 3 - k, p.r('pink'), 2, 4);
  return s;
}

/** Bullet damage, enemy contact damage. */
export const HURT = { bullet: -10, enemy: -10, core: -20, hazard: -6 } as const;

export function addCommon(b: Bestiary, p: Pal): void {
  const mb = b.mb;
  mb.add('shot', shotPic(p));
  mb.add('nova', orb(p, 3, 'gold', 1));
  mb.add('novaBig', orb(p, 4, 'gold', 2));
  mb.add('spark', sparkPic(p));
  for (let k = 0; k < 4; k++) mb.add(`boom${k}`, burst(p, k, false));
  for (let k = 0; k < 4; k++) mb.add(`big${k}`, burst(p, k, true));
  mb.add('wreck0', wreckPic(p, 0));
  mb.add('wreck1', wreckPic(p, 1));
  mb.add('pellet0', orb(p, 2, 'pink', 1), { chHitPt: HURT.bullet });
  mb.add('pellet1', orb(p, 3, 'pink', 0), { chHitPt: HURT.bullet });
  mb.add('seeker0', orb(p, 3, 'virus', 1), { chHitPt: HURT.bullet });
  mb.add('seeker1', orb(p, 2, 'slime', 2), { chHitPt: HURT.bullet });
  mb.add('flak0', flakPic(p, 0), { chHitPt: HURT.bullet });
  mb.add('flak1', flakPic(p, 1), { chHitPt: HURT.bullet });
  mb.add('burst0', burstPic(p, 0), { chHitPt: HURT.bullet });
  mb.add('burst1', burstPic(p, 1), { chHitPt: HURT.bullet });

  const shot = { power: POWER.shot, thru: true, end: -1, becomes: 'spark' } as const;
  const ids = [
    b.add('shot', { ...shot, pics: [['shot', 50]], path: [[0, -10, 12]] }),
    b.add('novaL2', { ...shot, pics: [['nova', 50]], path: [[-7, -8, 9]] }),
    b.add('novaL1', { ...shot, pics: [['nova', 50]], path: [[-3, -10, 10]] }),
    b.add('novaC', { ...shot, pics: [['novaBig', 50]], path: [[0, -11, 11]] }),
    b.add('novaR1', { ...shot, pics: [['nova', 50]], path: [[3, -10, 10]] }),
    b.add('novaR2', { ...shot, pics: [['nova', 50]], path: [[7, -8, 9]] }),
  ];
  if (ids.join() !== Object.values(SHOT_MON).join()) throw new Error('Shot monsters out of place');
  b.add('spark', { power: POWER.spark, end: 3, pics: [['spark', 50]] });
  b.add('boom', { power: POWER.boom, end: 9, pics: [0, 1, 2, 3].map((k) => [`boom${k}`, k < 3 ? 2 : 4]) });
  b.add('bigBoom', { power: POWER.bigBoom, end: 12, pics: [0, 1, 2, 3].map((k) => [`big${k}`, 3]) });
  b.add('wreck', {
    power: POWER.wreck,
    pics: [
      ['wreck0', 6],
      ['wreck1', 6],
    ],
  });
  // the dying flash of a turret, then its wreck (which smothers the bullets its mount keeps making)
  for (let hp = 3; hp >= 1; hp--) mb.add(`ring${hp}`, ringPic(p, hp), { chHitPt: HURT.enemy });
  b.add('ring3', { power: POWER.enemy, becomes: 'ring2', score: 10, pics: [['ring3', 50]] });
  b.add('ring2', { power: POWER.enemy, becomes: 'ring1', score: 10, pics: [['ring2', 50]] });
  b.add('ring1', { power: POWER.enemy, becomes: 'turretBoom', score: 250, pics: [['ring1', 50]] });
  b.add('turretBoom', { power: POWER.boom, end: 9, becomes: 'wreck', pics: [0, 1, 2, 3].map((k) => [`big${k}`, 2]) });
  const bullet = {
    power: POWER.bullet,
    end: -1,
    pics: [
      ['pellet0', 2],
      ['pellet1', 2],
    ] as [string, number][],
  };
  b.add('pellet', { ...bullet, path: [[0, 14, 4]] });
  b.add('pelletL', { ...bullet, path: [[-7, 12, 4]] });
  b.add('pelletR', { ...bullet, path: [[7, 12, 4]] });
  b.add('pelletFast', { ...bullet, path: [[0, 14, 6]] });
  b.add('seeker', {
    power: POWER.bullet,
    end: 45,
    towards: 3,
    pics: [
      ['seeker0', 3],
      ['seeker1', 3],
    ],
  });
  b.add('burst', {
    power: POWER.bullet,
    end: 6,
    pics: [
      ['burst0', 3],
      ['burst1', 3],
    ],
  });
  b.add('flak', {
    power: POWER.bullet,
    end: -1,
    becomes: 'burst',
    path: [[0, 5, 4]],
    pics: [
      ['flak0', 2],
      ['flak1', 2],
    ],
  });
}
