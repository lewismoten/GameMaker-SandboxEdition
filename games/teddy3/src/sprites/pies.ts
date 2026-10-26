// Pie Practice's pictures (Level 10): the Clown Club's pie throwers in their poses, facing
// left (holding a pie, winding up high or low, letting fly), the custard pies (one flying at
// head height, one skidding along the floor) and the birthday cake Doc Leo fetches from
// Professor Pratfall's bakery tent.
import { Pixels } from '../../../kit/pixels';
import { blob, over, sprite } from '../art/draw';
import { P } from '../art/pal';
import { CK } from './klown';
import { KLUB } from './klubfolk';
import { juggler } from './folks';

const c = (n: string, k: number) => P.c(n, k);

/** A little custard pie (7x4) with its top-left at x, y. */
function smallPie(p: Pixels, x: number, y: number): void {
  p.rect(x + 1, y, 5, 1, c('cloud', 2)).rect(x, y + 1, 7, 1, c('cloud', 2));
  p.set(x + 3, y, c('red', 2));
  p.rect(x, y + 2, 7, 1, c('wood', 3)).rect(x + 1, y + 3, 5, 1, c('wood', 1));
}

/** An arm (a skin line with a dark edge) from the shoulder to the hand. */
function arm(p: Pixels, x0: number, y0: number, x1: number, y1: number): void {
  p.line(x0, y0 + 1, x1, y1 + 1, c('ink', 0)).line(x0, y0, x1, y1, c('skin', 3));
}

export type Who = 'honker' | 'bubbles' | 'twirly' | 'juggles';
export type Pose = 'ready' | 'up' | 'throw' | 'low' | 'lowThrow';

/**
 * A Clown Club member at pie practice (20x40, facing left): `ready` holds a pie, `up` winds
 * up over the head (a head-high pie is coming), `low` winds up down by the knees (a pie
 * skidding along the floor), and the throws let go with a whoosh.
 */
export function thrower(who: Who, pose: Pose): Pixels {
  const p = (who === 'juggles' ? juggler(0) : KLUB[who]).flipX();
  const shoulder: [number, number] = [9, 25];
  if (pose === 'ready') {
    arm(p, ...shoulder, 4, 27);
    smallPie(p, 0, 24);
  } else if (pose === 'up') {
    arm(p, ...shoulder, 16, 9);
    smallPie(p, 13, 4);
    p.set(19, 3, c('fur', 2)).set(18, 1, c('fur', 2));
  } else if (pose === 'low') {
    arm(p, ...shoulder, 15, 33);
    smallPie(p, 13, 33);
  } else {
    const y = pose === 'throw' ? 21 : 33;
    arm(p, ...shoulder, 1, y);
    for (const dy of [-2, 0, 2]) p.rect(0, y + dy - 6, 4, 1, c('fur', 2));
  }
  return p;
}

/** A custard pie skidding along the floor (it splatters cream behind it, at ankle height). */
export function skidPie(phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  blob(p, 9, 14, 6, 2, P.r('cloud'), 0, 2);
  p.rect(3, 15, 13, 3, c('wood', 3)).rect(4, 18, 11, 1, c('wood', 1));
  p.set(8, 12, c('red', 2)).set(9, 12, c('red', 3));
  for (const [x, y] of phase
    ? [
        [17, 17],
        [19, 15],
      ]
    : [
        [16, 15],
        [18, 18],
      ])
    p.set(x, y, c('cloud', 2));
  return p;
}

/** The birthday cake: two tiers, pink frosting, a cherry on top (no candles yet: those are Teddy's errand). */
const CAKE = [
  '.....rr.....',
  '.....RR.....',
  '...oooooo...',
  '..oPPPPPPo..',
  '..oPwPPwPo..',
  '..owwwwwwo..',
  '.oooooooooo.',
  '.oPPPPPPPPo.',
  '.oPwPPwPPwo.',
  '.owwwwwwwwo.',
  '.owwPwwPwwo.',
  'oMMMMMMMMMMo',
];

/** The cake lying over a background block (the errand to fetch). */
export function cakeOn(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return over(p, sprite(CAKE, CK));
}
