// The endings' pictures. Won: the party in the Big Top, Teddy in a party hat in the middle of
// it, Gwinn sitting (on purpose) by her best bone, and a real snapshot of Teddy taped up on the
// tent wall. Lost: the whole team asleep in THE CHEZ, plugged in at a charger under the stars.
import { Pixels, rng } from '../../../kit/pixels';
import { loadScan, pastePhoto, polaroid, resample, tone } from '../../../kit/photo';
import { blob, centered, gradient, micro, microWidth, outlined, recolor, scaleBlit } from '../art/draw';
import { errandSprite } from '../sprites/errands';
import { gwinnSits } from '../sprites/klubfolk';
import { POSES } from '../sprites/teddy';
import { partyHat } from './birthday';
import { chezWith, leoHead } from './drive';
import { H, W, c, teddyAt } from './reel';
import { SP } from './screens';
import { party } from './surprise';

/** The party picture and its palette (the snapshot brings its own colors). */
export function wonScreen(): [Pixels, Uint8Array] {
  const p = party(3, 84);
  teddyAt(p, 'frontBeg', 120, 132);
  scaleBlit(p, gwinnSits(false, 1), 196, 132, 3);
  scaleBlit(p, errandSprite('bestBone'), 164, 144, 2);
  partyHat(p, 150, 118, 22, 'blue', 'yellow');
  const R = rng(4);
  for (let i = 0; i < 70; i++) p.rect(Math.floor(R() * W), Math.floor(R() * 150), 2, 2, c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
  p.rect(0, 184, W, 16, c('ink', 0));
  centered(p, 186, 'THE LITTLEST DOG. THE BIGGEST DAY.', c('yellow', 3));
  // taped up on the tent wall: a real snapshot of the birthday boy
  const shot = tone(resample(loadScan('teddy'), 72, 0, [0.25, 0, 1, 0.85]), (v) => v.map((x) => (x - 128) * 1.1 + 128) as [number, number, number]);
  const at = polaroid(p, 12, 20, shot.w, shot.h, { paper: c('cream', 3), edge: c('ink', 0), shadow: c('ink', 0), tape: c('yellow', 3) });
  micro(p, Math.round(at.cx - microWidth('BIRTHDAY BOY') / 2), Math.round(at.cy - 2), 'BIRTHDAY BOY', c('red', 1));
  return [p, pastePhoto(p, SP.pal, shot, 12, 20).pal];
}

/** Game over: everybody asleep in THE CHEZ, the car plugged in at a charger, under the stars. */
export function lostScreen(): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 150, [c('ink', 0), c('blue', 0), c('blue', 1)], 0, 2);
  const R = rng(9);
  for (let i = 0; i < 70; i++) p.set(Math.floor(R() * W), Math.floor(R() * 130), c('glow', 3));
  blob(p, 276, 30, 14, 14, SP.r('glow'), 2, 3);
  blob(p, 284, 26, 12, 12, [c('blue', 0)], 0, 0);
  p.rect(0, 150, W, 50, c('asphalt', 0));
  p.rect(0, 150, W, 2, c('asphalt', 2));
  // the charger post, its screen lit
  p.rect(262, 92, 22, 80, c('ink', 1)).rect(264, 96, 18, 24, c('ink', 0)).rect(267, 100, 12, 6, c('green', 2));
  p.rect(260, 170, 26, 4, c('stone', 2));
  const asleep = POSES.sleep;
  const gwinnAsleep = recolor(asleep, (k) => {
    for (let s = 0; s < 5; s++) if (k === c('corgi', s)) return c('gwinn', s);
    return k;
  });
  const ox = 30;
  const oy = 68;
  const port = chezWith(p, ox, oy, 5, 'left', (q) => {
    // through the passenger window: Doc Leo asleep at the wheel, Teddy curled up on the seat
    // and Gwinn curled up on Teddy
    scaleBlit(q, leoHead('sleep'), ox + 74, oy + 16, 2);
    scaleBlit(q, asleep, ox + 100, oy + 4, 2);
    scaleBlit(q, gwinnAsleep, ox + 102, oy - 6, 2);
  });
  // the cable from the post round to the port at the back of the car
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = Math.round(268 + (port.portX - 268) * t);
    const y = Math.round(112 + (port.portY - 112) * t + Math.sin(t * Math.PI) * 30);
    p.rect(x - 1, y - 1, 3, 3, c('ink', 0)).set(x, y, c('green', 1));
  }
  outlined(p, 150, 52, 'Z', c('paint', 3), c('ink', 0), 2);
  outlined(p, 168, 36, 'Z', c('paint', 3), c('ink', 0), 3);
  outlined(p, 194, 16, 'Z', c('paint', 3), c('ink', 0), 4);
  centered(p, 182, 'THE WHOLE TEAM IS TUCKERED OUT', c('paint', 3), 1, c('ink', 0));
  return p;
}
