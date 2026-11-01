// The monster pictures of the dream's end and the real tune-up, added to CAST.MBL after the
// engine bay's: Sir Reginald swimming the oil pipe; Brake Dance's trick sparkles, the stiff brake
// lamps (a lamp with a stuck, squinting face) and the lamps lit; Hubcaps and Balls' hubcaps,
// shut, lifted on the ball, lifted on nothing ("ta-da?").
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { chicken } from '../art/chicken';
import { P } from '../art/palette';
import { CTR } from '../ids';

const c = P.c;
const ink = c('ink', 0);
type Add = (name: string, pic: Pixels, attrs?: { effect?: number; eamt?: number; scorePts?: number }) => number;

/** Sir Reginald doing the breaststroke: wings out, then back, a trail of bubbles behind. */
function swimmer(f: number): Pixels {
  const p = new Pixels(20, 20, 255);
  p.blit(chicken(1, { flap: f === 0, bob: f }), 0, 0, 255);
  for (const [x, y, r] of f
    ? [
        [2, 6, 1.4],
        [4, 2, 1],
      ]
    : [
        [1, 9, 1],
        [3, 4, 1.4],
      ])
    p.ring(x, y, r, c('paint', 3));
  return p;
}

/** A trick's sparkle: a four-point star in the trick's color, turning. */
function sparkle(f: number, col: string): Pixels {
  const p = new Pixels(20, 20, 255);
  const ramp = P.r(col);
  const k = ramp[ramp.length - 1];
  if (f) p.line(4, 4, 16, 16, k).line(16, 4, 4, 16, k);
  else p.line(10, 2, 10, 18, k).line(2, 10, 18, 10, k);
  p.disc(10, 10, 2.5, c('paint', 3));
  return outline(p, ink);
}

/** A brake lamp: a red lens on a socket; stiff (dark, a squinting face), lit (glowing) or done (lit, content). */
function lamp(state: 'stiff' | 'lit' | 'done', f = 0): Pixels {
  const p = new Pixels(20, 20, 255);
  p.rect(4, 15, 12, 5, c('metal', 2)).rect(4, 15, 12, 1, c('metal', 4));
  const lens = state === 'stiff' ? c('red', 0) : c('red', 3);
  if (state !== 'stiff') p.disc(10, 9, 9, c('red', 1));
  p.rect(3, 3 - (state === 'stiff' ? f : 0), 14, 12, lens).frame(3, 3 - (state === 'stiff' ? f : 0), 14, 12, ink);
  if (state === 'stiff') {
    // squinting, squeaking: a line of eyes and a tight mouth
    p.line(6, 7 - f, 8, 7 - f, ink)
      .line(12, 7 - f, 14, 7 - f, ink)
      .line(8, 11 - f, 12, 11 - f, ink);
    if (f) p.line(17, 0, 19, 2, c('lamp', 4));
  } else {
    p.rect(5, 5, 4, 2, c('paint', 3));
    if (state === 'done' || f) p.set(7, 9, ink).set(13, 9, ink).line(8, 12, 12, 12, ink);
  }
  return outline(p, ink);
}

/** A hubcap, domed, chrome, `lift` pixels up off the ground; under it the ball, nothing, or a "?". */
function hubcap(lift: number, under: 'none' | 'ball' | 'tada'): Pixels {
  const p = new Pixels(20, 20, 255);
  if (under === 'ball') p.disc(10, 16, 3.5, c('yellow', 3)).set(9, 15, c('paint', 3)).ring(10, 16, 3.5, c('yellow', 1));
  if (under === 'tada') {
    p.rect(9, 12, 2, 1, c('paint', 3)).rect(11, 13, 1, 2, c('paint', 3)).rect(10, 15, 1, 1, c('paint', 3)).rect(10, 18, 1, 1, c('paint', 3));
  }
  const y = 19 - lift;
  for (let yy = 0; yy < 9; yy++) {
    const half = Math.round(Math.sqrt(Math.max(0, 81 - (8 - yy) * (8 - yy) * 1.3)));
    p.rect(10 - half, y - 8 + yy, half * 2, 1, c('metal', yy < 2 ? 4 : yy < 6 ? 3 : 2));
  }
  p.rect(1, y, 18, 1, c('metal', 1)).disc(10, y - 4, 1.5, c('metal', 4));
  return outline(p, ink);
}

export function addRealCast(add: Add): void {
  add('swim0', swimmer(0));
  add('swim1', swimmer(1));
  ['orange', 'green', 'blue', 'yellow'].forEach((col, i) => {
    add(`trick${i}a`, sparkle(0, col));
    add(`trick${i}b`, sparkle(1, col));
  });
  add('lamp.stiff0', lamp('stiff', 0));
  add('lamp.stiff1', lamp('stiff', 1));
  // a lit lamp counts when Teddy touches it (and becomes done)
  const lit = { effect: CTR.lamps, eamt: 1, scorePts: 50 };
  add('lamp.lit0', lamp('lit', 0), lit);
  add('lamp.lit1', lamp('lit', 1), lit);
  add('lamp.done', lamp('done'));
  add('cap', hubcap(0, 'none'));
  // the cap over the ball looks the same; reaching up under it finds the ball
  add('cap.ball', hubcap(0, 'none'), { effect: CTR.ball, eamt: 1, scorePts: 200 });
  add('cap.up', hubcap(9, 'none'));
  add('cap.upBall', hubcap(9, 'ball'));
  add('cap.tada', hubcap(9, 'tada'));
}
