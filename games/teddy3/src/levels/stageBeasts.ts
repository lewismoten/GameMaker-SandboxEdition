// Level 14's monsters. The stage spotlights: each sweep of a light is two monsters going the
// same way together, the lamp with its cone (on its trolley) and, one block under it, the
// beam's bright end at a standing dog's head height. Both are born at the light's home in the
// wings (two background blocks there give birth to them on the same tick), sweep out along
// the track and back, and go dark at home, until the next sweep. Their power is just under a
// dog's, so the moment either one finds Gwinn it costs her a little energy (and a yelp) and
// that part of the light goes dark: one catch per sweep, never a drain. Flopped flat on the
// floor she is under the beam's end, and nothing else she does (a BOOF, a chew, zoomies)
// reaches as high as it does. Also: the rope lashing a scenery flat down (chew it), and a
// pigeon on top of the road cases and one after the cake crumbs on the riser (BOOF them).
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { CRITTERS } from '../sprites/critters';
import { spotEnd, spotLamp } from '../sprites/spotlight';
import { ropeKnot } from './common';
import { flatPanel } from './stageTiles';

/** Just under a dog's power: a light vanishes when it touches her (and costs her energy). */
export const LIGHT = POWER.blocker - 3;

/** A spotlight: its beam's end starts at block (x, y), and sweeps the corners of `path` (offsets from there). */
export interface Beam {
  x: number;
  y: number;
  path: [number, number, number][];
  /** Ticks from one sweep's start to the next (a sweep is `sweepTicks` long; the rest it is dark). */
  every: number;
}

/** Ticks a sweep takes: each corner takes its distance over its speed, plus one. */
export const sweepTicks = (path: [number, number, number][]) => {
  let t = 0;
  let [x, y] = [0, 0];
  for (const [cx, cy, speed] of path) {
    t += (Math.max(Math.abs(cx - x), Math.abs(cy - y)) * 20) / speed + 1;
    [x, y] = [cx, cy];
  }
  return t;
};

/** The lights, by name (the map puts their homes and tracks; the route reads their timing). */
export const BEAMS: Record<string, Beam> = {
  // teach: one slow light, coming out of the wings toward her
  A: {
    x: 18,
    y: 39,
    path: [
      [-5, 0, 2],
      [0, 0, 2],
    ],
    every: 126,
  },
  // test: two lights out of step, a slow one and a quick one, over the same stretch
  B: {
    x: 39,
    y: 39,
    path: [
      [-8, 0, 2],
      [0, 0, 2],
    ],
    every: 180,
  },
  C: {
    x: 45,
    y: 39,
    path: [
      [-8, 0, 4],
      [0, 0, 4],
    ],
    every: 110,
  },
  // past the dressing rooms, where a pigeon struts
  G: {
    x: 55,
    y: 39,
    path: [
      [-7, 0, 2],
      [0, 0, 2],
    ],
    every: 160,
  },
  // over the top of the stacked road cases
  E: {
    x: 68,
    y: 35,
    path: [
      [-7, 0, 2],
      [0, 0, 2],
    ],
    every: 160,
  },
  // twist: a light that comes down the crate step from the riser to the floor, and back up
  D: {
    x: 77,
    y: 37,
    path: [
      [-4, 0, 4],
      [-4, 1, 4],
      [-6, 1, 4],
      [-6, 2, 4],
      [-7, 2, 4],
      [-6, 2, 4],
      [-6, 1, 4],
      [-4, 1, 4],
      [-4, 0, 4],
      [0, 0, 4],
    ],
    every: 110,
  },
  // and a quick one over the cake crumbs on the riser
  F: {
    x: 83,
    y: 37,
    path: [
      [-5, 0, 4],
      [0, 0, 4],
    ],
    every: 70,
  },
};

export function stageBeasts() {
  const b = newBestiary();
  b.pic('lampLit', spotLamp(true), { hp: -4 }).pic('lampDark', spotLamp(false));
  b.pic('endLit', spotEnd(true), { hp: -4 }).pic('endDark', spotEnd(false));
  for (const [name, beam] of Object.entries(BEAMS)) {
    if (sweepTicks(beam.path) > beam.every) throw new Error(`stage: light ${name} sweeps longer than its turn`);
    b.add(`lamp${name}`, { pics: [['lampLit', 50]], power: LIGHT, path: beam.path, end: -1, becomes: 'lampOff' });
    b.add(`end${name}`, { pics: [['endLit', 50]], power: LIGHT, path: beam.path, end: -1, becomes: 'endOff' });
  }
  b.add('lampOff', { pics: [['lampDark', 50]], power: 0, end: 6 });
  b.add('endOff', { pics: [['endDark', 50]], power: 0, end: 3 });

  // The scenery flat's foot, lashed to a floor cleat: a chew (118) gets through the rope (117).
  b.pic('knot', ropeKnot(flatPanel()), { solid: 15 });
  b.pic('knotChewed', flatPanel(true));
  b.add('knot', { pics: [['knot', 50]], power: POWER.chomp - 1, becomes: 'knotChewed', upscore: 25 });
  b.add('knotChewed', { pics: [['knotChewed', 50]], power: 0, end: 8 });

  // Pigeons on the road cases and after the cake crumbs; a BOOF sends them up into the rigging.
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -5 });
  for (const name of ['pigeon', 'pigeonLow', 'pigeonHigh'])
    b.add(name, {
      pics: [
        ['pigeon1', 5],
        ['pigeon2', 5],
      ],
      power: POWER.pest,
      path: [
        [1, 0, 1, 0],
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
    path: [[-3, -8, 8]],
    end: -1,
  });
  return b;
}
