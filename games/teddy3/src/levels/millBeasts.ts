// Level 8's monsters: the water wheels' paddles, and pigeons on the mill's ledges (a bark
// sends them off). A paddle goes round the square its wheel's ring makes. Up the near side it
// is solid (stand on it and it lifts Teddy), slowly for the first block (time to step on) and
// the last (time to step off); over the top, down the far side and back along the bottom it
// is only passing by (not solid), so no paddle ever comes down on Teddy or pushes him along.
import { FLIP } from '../characters/mons';
import type { Bestiary } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { CRITTERS } from '../sprites/critters';
import { paddle, paddleBack } from '../sprites/mill';

/** A wheel's ring of paddles: a square `size` blocks on a side, gone round at `speed`. */
export const WHEEL = { size: 4, speed: 2 };
/** The corners of a ring a paddle can start at, in the order it goes round them. */
export const CORNERS = ['Up', 'Top', 'Down', 'Bottom'] as const;

/**
 * A wheel's paddles, rising on its left side (`rises` 'left'; they go over the top to the
 * right) or its right side: one monster per corner of the ring it starts at, named
 * `${name}${corner}`. Each goes all the way round and starts over. Its pictures take turns
 * in step with its path (a path corner takes one tick more than the move itself), so it
 * shows the solid paddle only while it rises.
 */
export function wheel(b: Bestiary, name: string, rises: 'left' | 'right'): void {
  const { size: n, speed } = WHEEL;
  const along = rises === 'left' ? 1 : -1;
  type Seg = { dx: number; dy: number; speed: number; pic: string };
  const sides: Seg[][] = [
    [
      { dx: 0, dy: -1, speed: 1, pic: 'paddle' },
      { dx: 0, dy: -(n - 2), speed, pic: 'paddle' },
      { dx: 0, dy: -1, speed: 1, pic: 'paddle' },
    ],
    [{ dx: n * along, dy: 0, speed, pic: 'paddleFlat' }],
    [{ dx: 0, dy: n, speed, pic: 'paddleEdge' }],
    [{ dx: -n * along, dy: 0, speed, pic: 'paddleFlat' }],
  ];
  CORNERS.forEach((corner, k) => {
    const segs = [...sides.slice(k), ...sides.slice(0, k)].flat();
    const path: [number, number, number][] = [];
    const pics: [string, number][] = [];
    let x = 0;
    let y = 0;
    for (const sg of segs) {
      x += sg.dx;
      y += sg.dy;
      path.push([x, y, sg.speed]);
      const ticks = ((Math.abs(sg.dx) + Math.abs(sg.dy)) * 20) / sg.speed + 1;
      const last = pics[pics.length - 1];
      if (last?.[0] === sg.pic) last[1] += ticks;
      else pics.push([sg.pic, ticks]);
    }
    b.add(`${name}${corner}`, { pics, power: POWER.friend, path });
  });
}

export function millBeasts() {
  const b = newBestiary();
  b.pic('paddle', paddle(), { solid: 15 }).pic('paddleFlat', paddleBack(false)).pic('paddleEdge', paddleBack(true));
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -5 });
  wheel(b, 'wheel', 'left');
  wheel(b, 'bigWheel', 'right');

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
  return b;
}
