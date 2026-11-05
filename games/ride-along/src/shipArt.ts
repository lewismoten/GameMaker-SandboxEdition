// RIDE ALONG's two vehicles, each 20 wide and 40 tall (two blocks, a top and a bottom, the same size as the
// hero), drawn with the helper inside: a little rocket (a round window with the helper's face in it) and a
// canoe seen from above (the helper paddling). The same pictures, without the helper, are the parked rocket
// of level 1. Right and left are the same, so nothing is mirrored.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { kitRamp } from '../../kit/starter/heroLook';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** Where the rocket's hull is at row `y` (half its width), a rounded nose over straight sides. */
const hull = (y: number): number => (y < 12 ? 6.4 * Math.sqrt(Math.max(0, 1 - ((12 - y) / 11) ** 2)) : 6.4);

/** The helper's face in the round window: skin, a beanie across the top, two eyes and a smile. */
function face(p: Pixels, pal: Pal, cx: number, cy: number): void {
  const skin = kitRamp(pal, 'skin');
  const hat = kitRamp(pal, 'hat');
  p.disc(cx, cy + 0.5, 2.9, skin[2]);
  p.rect(cx - 3, cy - 3, 6, 2, hat[2]).rect(cx - 2, cy - 4, 4, 1, hat[3]).set(cx, cy - 5, pal.c('gold', 4));
  p.set(cx - 1, cy + 0.5, pal.c('ink', 0)).set(cx + 1, cy + 0.5, pal.c('ink', 0));
  p.set(cx - 1, cy + 2, pal.c('red', 1)).set(cx, cy + 2.4, pal.c('red', 1)).set(cx + 1, cy + 2, pal.c('red', 1));
}

/** A short pointed flame under the nozzle: two flickering shapes (`flick` 0 or 1). Short on purpose. */
function flame(p: Pixels, pal: Pal, flick: number): void {
  const len = flick ? 5 : 4;
  for (let i = 0; i < len; i++) {
    const hw = Math.max(0, 2.4 - i * 0.6);
    p.rect(Math.round(9.5 - hw), 35 + i, Math.round(hw * 2) || 1, 1, pal.c('orange', 3 - Math.min(2, i >> 1)));
    if (i < len - 1) p.rect(Math.round(9.5 - hw / 2), 35 + i, Math.round(hw) || 1, 1, pal.c('gold', 4));
  }
}

/**
 * The rocket, 20x40: white hull, red nose and fins, a round window. `crew` puts the helper in the window,
 * `flick` (0 or 1, or -1 for none) draws the little flame, `drop` slides the whole rocket down (the parked one
 * sits on its fins).
 */
export function rocket(pal: Pal, crew: boolean, flick: number, drop = 0): Pixels {
  const white = pal.r('white');
  const red = pal.r('red');
  const stone = pal.r('stone');
  const body = new Pixels(20, 40, T);
  for (let y = 1; y <= 33; y++) {
    const hw = hull(y);
    for (let x = 0; x < 20; x++) {
      const s = (x + 0.5 - 10) / 6.4;
      if (Math.abs(x + 0.5 - 10) > hw) continue;
      const shade = Math.max(0, Math.min(3, Math.round(1.6 - s * 1.6)));
      body.set(x, y, y < 9 ? red[Math.min(4, shade + 1)] : white[shade]);
    }
  }
  body.rect(4, 20, 12, 1, red[3]).rect(4, 21, 12, 1, red[2]); // a stripe below the window
  // the round window
  body.disc(10, 15, 5, stone[1]).disc(10, 15, 4, pal.c('sky', 3)).rect(7, 12, 2, 1, pal.c('sky', 5));
  if (crew) face(body, pal, 10, 15);
  // the fins: wider the lower they go, in red
  for (let y = 24; y <= 34; y++) {
    const k = Math.round((y - 24) * 0.28);
    body.rect(3 - k, y, k + 1, 1, red[y > 30 ? 1 : 2]);
    body.rect(16, y, k + 1, 1, red[y > 30 ? 0 : 1]);
  }
  body.rect(7, 33, 6, 2, stone[0]); // the nozzle
  if (flick >= 0) flame(body, pal, flick);
  const out = outline(body, pal.c('ink', 0), { transparent: T });
  if (!drop) return out;
  const low = new Pixels(20, 40, T);
  return low.blit(out, 0, drop, T);
}

/** The canoe from above, 20x40: a red hull with a cream rim, the helper's round beanie and shoulders, a paddle. `stroke` 0/1 tilts the paddle; `splash` adds white splashes at its blades. */
export function canoe(pal: Pal, stroke: number, splash: boolean): Pixels {
  const red = pal.r('red');
  const wood = pal.r('wood');
  const parch = pal.r('parch');
  const hat = kitRamp(pal, 'hat');
  const hood = kitRamp(pal, 'hood');
  const skin = kitRamp(pal, 'skin');
  const body = new Pixels(20, 40, T);
  const half = (y: number) => (y < 14 ? 7 * Math.sqrt(Math.max(0, 1 - ((14 - y) / 12.5) ** 2)) : y > 34 ? 6 : 7);
  for (let y = 2; y <= 36; y++)
    for (let x = 0; x < 20; x++) {
      const d = Math.abs(x + 0.5 - 10);
      const hw = half(y);
      if (d > hw) continue;
      body.set(x, y, d > hw - 1.2 ? parch[3] : d > hw - 2.4 ? red[x < 10 ? 3 : 2] : wood[3]);
    }
  body.rect(5, 12, 10, 1, wood[1]).rect(5, 29, 10, 1, wood[1]); // the thwarts
  // the helper: shoulders in the hoodie, a round beanie, a pompom
  body.disc(10, 23, 4.6, hood[2]).disc(10, 22, 3.6, hood[3]);
  body.disc(10, 20, 3.4, hat[2]).disc(9.4, 19.4, 2.2, hat[3]).rect(9, 19, 2, 2, pal.c("gold", 4));
  body.set(7, 21, skin[2]).set(13, 21, skin[2]);
  // the paddle: a shaft across the hands with a blade at each end, outside the hull
  const tilt = stroke ? 4 : -4;
  body.line(1, 24 + tilt, 18, 24 - tilt, wood[1]).line(1, 25 + tilt, 18, 25 - tilt, wood[2]);
  body.disc(1, 24 + tilt, 1.9, wood[2]).disc(18.5, 24 - tilt, 1.9, wood[2]);
  if (splash) {
    for (const [x, y] of [[0, 21 + tilt], [2, 27 + tilt], [17, 20 - tilt], [19, 27 - tilt]]) body.set(x, y, pal.c('white', 3));
  }
  const out = outline(body, pal.c('ink', 0), { transparent: T });
  // the bow's wake: two short white ripples
  out.line(5, 6, 3, 10, pal.c('white', 3)).line(15, 6, 17, 10, pal.c('white', 3));
  return out;
}

/** The top or bottom half of a 20x40 picture. */
export const halves = (p: Pixels): { top: Pixels; bottom: Pixels } => ({ top: p.crop(0, 0, 20, 20), bottom: p.crop(0, 20, 20, 20) });

/** A map picture from a sprite: its see-through pixels become `bg`. */
export const onGround = (p: Pixels, bg: number): Pixels => p.map((_x, _y, c) => (c === T ? bg : c));
