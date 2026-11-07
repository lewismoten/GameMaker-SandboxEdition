// PASS THE PIE's own block pictures (20x20 unless said): the dishes Rory carries, leaf piles, the picket fence,
// the bone and the dog, the parade balloon, the oven timer's bar and the town hall doors. Everything is drawn on the
// sky color and outlined, so it sits on any level's sky (a level's mood repaints the ramps, not the indexes).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { skyOf, type Pal } from '../../kit/starter/palette';

export const T = 255;
const sky = (pal: Pal) => new Pixels(20, 20, skyOf(pal));
const inked = (pal: Pal, p: Pixels, bg = skyOf(pal)) => outline(p, pal.c('ink', 0), { transparent: bg });

/** A pumpkin pie: a pie tin, a golden crust with a lattice and a little steam. */
export function pie(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = sky(pal);
  p.rect(1, 12, 18, 5, c('stone', 3)).rect(1, 12, 18, 1, c('stone', 4)).rect(2, 17, 16, 1, c('stone', 1));
  blob(p, 10, 12, 9, 5.5, r('orange'), 1, 4);
  p.rect(2, 11, 16, 2, c('gold', 3));
  for (let i = -6; i <= 6; i += 4) p.line(10 + i, 8, 10 + i + 4, 14, c('gold', 4)).line(10 + i + 4, 8, 10 + i, 14, c('gold', 4));
  p.line(6, 5, 7, 3, c('white', 3)).line(7, 3, 6, 1, c('white', 3)).line(12, 5, 13, 3, c('white', 3)).line(13, 3, 12, 1, c('white', 3));
  return inked(pal, p);
}

/** A gravy boat: a cream boat with a spout and a handle. */
export function gravy(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = sky(pal);
  blob(p, 9, 12, 8, 4.5, r('white'), 0, 3);
  p.rect(2, 8, 14, 2, c('white', 2)).line(16, 8, 19, 5, c('white', 2)).line(16, 9, 19, 6, c('white', 1));
  p.rect(3, 8, 12, 1, c('dirt', 3)); // the gravy
  p.rect(5, 16, 8, 2, c('white', 1)).ring(1, 11, 3, c('white', 1));
  p.rect(0, 9, 3, 3, c('white', 2));
  return inked(pal, p);
}

/** A casserole: a round dish with handles and a crisp golden top. */
export function casserole(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = sky(pal);
  p.rect(0, 9, 20, 3, c('blue', 3)).rect(0, 9, 20, 1, c('blue', 4));
  blob(p, 10, 14, 8.5, 4.5, r('blue'), 1, 4);
  blob(p, 10, 9, 8, 3, r('gold'), 2, 5);
  for (const x of [5, 9, 13]) p.set(x, 8, c('green', 3)).set(x + 1, 9, c('green', 2));
  return inked(pal, p);
}

/** Cranberry sauce: a ruby jelly in the shape of its can, with the can's ridges. */
export function cranberry(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = sky(pal);
  blob(p, 10, 10, 6.5, 8, r('red'), 0, 4);
  for (const y of [4, 8, 12, 16]) p.rect(4, y, 13, 1, c('red', 1));
  p.rect(7, 4, 2, 10, c('red', 4));
  p.rect(5, 17, 10, 2, c('stone', 3));
  return inked(pal, p);
}

/** A basket of dinner rolls under a checked cloth. */
export function rolls(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = sky(pal);
  for (const [x, y] of [[5, 7], [10, 6], [14, 8]] as const) blob(p, x, y, 4, 3.5, r('gold'), 0, 4);
  p.rect(1, 11, 18, 7, c('wood', 3)).rect(1, 11, 18, 1, c('wood', 4));
  for (let x = 2; x < 18; x += 4) p.rect(x, 12, 2, 5, c('wood', 2));
  p.rect(1, 17, 18, 1, c('wood', 1));
  return inked(pal, p);
}

/** A leaf pile: red, orange and gold leaves heaped up; `flat` is what is left once you have scuffed through it. */
export function leaves(pal: Pal, flat: boolean): Pixels {
  const { c } = pal;
  const p = sky(pal);
  const cols = [c('red', 3), c('orange', 3), c('gold', 3), c('orange', 2), c('red', 2)];
  const rows = flat ? 3 : 8;
  for (let y = 0; y < rows; y++) {
    const half = flat ? 9 : Math.round(3 + (y / rows) * 7);
    for (let x = 10 - half; x <= 10 + half; x++) p.set(x, 19 - rows + y, cols[(x * 3 + y * 5) % cols.length]);
  }
  if (!flat) p.set(9, 12, c('gold', 5)).set(12, 14, c('gold', 5));
  return inked(pal, p);
}

/** A pumpkin (scenery). */
export function pumpkin(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = sky(pal);
  blob(p, 6.5, 13, 6, 5.5, r('orange'), 0, 4);
  blob(p, 13.5, 13, 6, 5.5, r('orange'), 0, 4);
  blob(p, 10, 13, 4.5, 6, r('orange'), 1, 4);
  p.rect(9, 5, 3, 3, c('green', 1)).rect(11, 4, 2, 2, c('green', 2));
  return inked(pal, p);
}

/** A white picket fence, to hop (it is solid). */
export function fence(pal: Pal): Pixels {
  const { c } = pal;
  const p = sky(pal);
  p.rect(0, 11, 20, 2, c('white', 2)).rect(0, 16, 20, 2, c('white', 2));
  for (const x of [1, 7, 13]) p.rect(x, 5, 5, 15, c('white', 3)).rect(x, 5, 5, 1, c('white', 4)).rect(x + 4, 5, 1, 15, c('white', 1));
  return inked(pal, p);
}

/** A bone: cream, knobbed at both ends. */
export function bone(pal: Pal): Pixels {
  const { c } = pal;
  const p = sky(pal);
  p.rect(5, 9, 10, 3, c('white', 3)).rect(5, 9, 10, 1, c('white', 4));
  for (const [x, y] of [[4, 8], [4, 12], [15, 8], [15, 12]] as const) p.disc(x, y, 2, c('white', 3));
  return inked(pal, p);
}

/** The dog: sitting on the path and staring at the rolls, or (`chewing`) lying down with the bone. */
export function dog(pal: Pal, chewing: boolean): Pixels {
  const { c, r } = pal;
  const p = sky(pal);
  const fur = r('dirt');
  if (chewing) {
    blob(p, 9, 14, 8, 4, fur, 1, 4);
    blob(p, 16, 13, 3.5, 3.5, fur, 1, 4);
    p.rect(17, 9, 2, 4, fur[1]).set(17, 12, c('ink', 0)).set(19, 14, c('ink', 0));
    p.rect(14, 16, 5, 2, c('white', 3)).disc(13, 16, 1, c('white', 3)).disc(19, 17, 1, c('white', 3));
    p.rect(1, 12, 3, 2, fur[3]);
    return inked(pal, p);
  }
  blob(p, 9, 13, 5, 6.5, fur, 1, 4);
  blob(p, 13, 6, 4.5, 4.5, fur, 1, 4);
  p.rect(10, 1, 3, 5, fur[1]).rect(16, 2, 2, 5, fur[1]);
  p.set(14, 5, c('ink', 0)).set(17, 7, c('ink', 0)).rect(16, 7, 3, 2, fur[3]);
  p.rect(14, 8, 2, 2, c('red', 3)); // a happy tongue
  p.rect(1, 16, 5, 2, fur[3]).rect(8, 17, 3, 3, c('white', 3)).rect(12, 17, 3, 3, c('white', 3));
  return inked(pal, p);
}

/** One block of a bar's segment (a warm roll that cools): `on` gold and steaming, `warn` pale, `off` empty. */
export function segment(pal: Pal, state: 'on' | 'warn' | 'off'): Pixels {
  const { c, r } = pal;
  const p = sky(pal);
  p.rect(0, 5, 20, 10, c('ink', 1)).frame(0, 5, 20, 10, c('ink', 0));
  if (state === 'off') return p;
  const ramp = state === 'on' ? r('gold') : r('white');
  blob(p, 10, 10, 8.5, 3.6, ramp, 1, 4);
  if (state === 'on') p.set(6, 3, c('white', 3)).set(7, 2, c('white', 3)).set(13, 3, c('white', 3)).set(12, 2, c('white', 3));
  return p;
}

/** The town hall's double doors, two blocks high (top, bottom): open and warm inside, or shut. */
export function hallDoor(pal: Pal, shut: boolean): [Pixels, Pixels] {
  const { c } = pal;
  const p = new Pixels(20, 40, skyOf(pal));
  p.rect(0, 0, 20, 40, c('brick', 3)).rect(0, 0, 20, 2, c('brick', 4));
  if (shut) {
    p.rect(2, 4, 16, 36, c('wood', 2)).rect(9, 4, 2, 36, c('wood', 0));
    p.disc(7, 24, 1.5, c('gold', 3)).disc(13, 24, 1.5, c('gold', 3));
    p.rect(4, 8, 4, 8, c('wood', 3)).rect(12, 8, 4, 8, c('wood', 3));
  } else {
    p.rect(3, 4, 14, 36, c('gold', 4)).rect(5, 8, 10, 32, c('gold', 5));
    p.rect(0, 4, 3, 36, c('wood', 1)).rect(17, 4, 3, 36, c('wood', 1));
  }
  const o = inked(pal, p);
  return [o.crop(0, 0, 20, 20), o.crop(0, 20, 20, 20)];
}

/** The oven door: touch it to go back for a fresh batch (a level's restart). Two blocks high. */
export function ovenDoor(pal: Pal): [Pixels, Pixels] {
  const { c } = pal;
  const p = new Pixels(20, 40, skyOf(pal));
  p.rect(1, 2, 18, 38, c('stone', 2)).rect(1, 2, 18, 1, c('stone', 4));
  p.rect(3, 6, 2, 2, c('red', 3)).rect(8, 6, 2, 2, c('gold', 3)).rect(13, 6, 2, 2, c('green', 3));
  p.rect(3, 14, 14, 20, c('ink', 1)).rect(4, 15, 12, 18, c('orange', 2)).rect(4, 15, 12, 3, c('orange', 4));
  p.rect(4, 12, 12, 1, c('white', 3));
  const o = inked(pal, p);
  return [o.crop(0, 0, 20, 20), o.crop(0, 20, 20, 20)];
}

/** The parade balloon, 3x3 blocks: a round striped balloon with a smile, and a string down. Returns 9 pictures row by row. */
export function balloon(pal: Pal): Pixels[] {
  const { c, r } = pal;
  const p = new Pixels(60, 60, skyOf(pal));
  blob(p, 30, 26, 27, 24, r('red'), 0, 4);
  for (let x = 6; x < 54; x += 12) p.rect(x, 4, 6, 44, c('gold', 3)).rect(x, 4, 1, 44, c('gold', 4));
  blob(p, 30, 26, 27, 24, r('red'), 0, 4, 0.2);
  p.disc(21, 22, 3, c('white', 4)).disc(39, 22, 3, c('white', 4)).set(21, 22, c('ink', 0)).set(39, 22, c('ink', 0));
  p.ring(30, 30, 9, c('ink', 0)).rect(20, 20, 20, 10, c('red', 3)).rect(20, 30, 20, 1, c('red', 3));
  p.rect(26, 50, 8, 4, c('wood', 3)).line(30, 54, 30, 59, c('ink', 1));
  const out: Pixels[] = [];
  const o = outline(p, c('ink', 0), { transparent: skyOf(pal) });
  for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) out.push(o.crop(bx * 20, by * 20, 20, 20));
  return out;
}

/** A kitchen window with a view of the street (scenery). */
export function window(pal: Pal): Pixels {
  const { c } = pal;
  const p = sky(pal);
  p.rect(2, 2, 16, 16, c('wood', 3)).rect(4, 4, 12, 12, c('sky', 4)).rect(9, 4, 2, 12, c('wood', 3)).rect(4, 9, 12, 2, c('wood', 3));
  p.rect(5, 12, 3, 4, c('green', 2));
  return inked(pal, p);
}

/** A copper pot on the counter (scenery). */
export function pot(pal: Pal): Pixels {
  const { c } = pal;
  const p = sky(pal);
  p.rect(3, 9, 14, 9, c('orange', 2)).rect(3, 9, 14, 2, c('orange', 4)).rect(1, 10, 2, 2, c('stone', 3)).rect(17, 10, 2, 2, c('stone', 3));
  p.rect(4, 7, 12, 2, c('stone', 2));
  p.set(8, 5, c('white', 3)).set(9, 3, c('white', 3)).set(12, 4, c('white', 3));
  return inked(pal, p);
}

/** Monster pictures: a friendly squirrel (frame 0/1, the tail flicks). */
export function squirrel(pal: Pal, flick: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  blob(p, 6, flick ? 8 : 9, 4, 8, r('hair'), 0, 2); // the big tail
  blob(p, 11, 14, 5, 4.5, r('dirt'), 1, 4);
  blob(p, 15, 9, 3.5, 3.5, r('dirt'), 1, 4);
  p.rect(14, 5, 2, 3, c('dirt', 1)).set(16, 8, c('ink', 0)).set(18, 10, c('ink', 0));
  p.rect(9, 17, 3, 2, c('dirt', 2)).rect(14, 17, 3, 2, c('dirt', 2));
  return outline(p, c('ink', 0), { transparent: T });
}

/** A robot vacuum: a flat round disc with a blinking light, rolling along the floor. */
export function vacuum(pal: Pal, blink: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  blob(p, 10, 14, 9.5, 4.5, r('stone'), 0, 4);
  p.rect(2, 12, 16, 1, c('stone', 4));
  p.disc(10, 12, 2, blink ? c('green', 3) : c('red', 3)).rect(4, 17, 12, 2, c('ink', 1));
  return outline(p, c('ink', 0), { transparent: T });
}

/** A football: a brown leather ball with white laces, tumbling (two turns). */
export function football(pal: Pal, turn: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  blob(p, 10, 10, 8, 5, r('dirt'), 0, 4);
  if (turn) p.line(5, 6, 15, 14, c('white', 3)).line(7, 4, 7, 4, c('white', 3));
  else p.rect(6, 9, 8, 1, c('white', 3)).rect(8, 8, 1, 3, c('white', 3)).rect(11, 8, 1, 3, c('white', 3));
  p.rect(2, 9, 2, 2, c('white', 3)).rect(16, 9, 2, 2, c('white', 3));
  return outline(p, c('ink', 0), { transparent: T });
}

/** A cranberry rolling out of the can: a round ruby ball with a shine. */
export function berry(pal: Pal, turn: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  blob(p, 10, 12, 7, 7, r('red'), 0, 4);
  p.disc(turn ? 7 : 8, 9, 1, c('white', 4)).set(turn ? 12 : 11, 16, c('red', 1));
  return outline(p, c('ink', 0), { transparent: T });
}

/** A parade float: a flat little wagon of balloons and bunting, rolling. */
export function floatCar(pal: Pal, wheel: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(1, 11, 18, 5, c('blue', 3)).rect(1, 11, 18, 1, c('blue', 4));
  p.rect(3, 6, 14, 5, c('white', 3)).rect(3, 6, 14, 1, c('gold', 3));
  p.disc(5, 17, 2.5, c('ink', 1)).disc(15, 17, 2.5, c('ink', 1)).set(5, wheel ? 16 : 18, c('white', 3)).set(15, wheel ? 18 : 16, c('white', 3));
  blob(p, 6, 3, 3, 3, r('red'), 0, 3);
  blob(p, 14, 3, 3, 3, r('green'), 0, 3);
  return outline(p, c('ink', 0), { transparent: T });
}
