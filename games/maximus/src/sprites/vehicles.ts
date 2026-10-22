// The courier's vehicles, one block each: the pod (space), the diving bell (seas) and the
// rover (rough ground). Drawn from masks so their animation frames stay in register.
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, Mask, fill, outline, shade } from '../art/draw';
import { OUTLINE, S, WHITE, shared } from '../art/palette';

export type Dir = 'idle' | 'r' | 'l' | 'u' | 'd' | 'ur' | 'ul' | 'dr' | 'dl';
const VEC: Record<Dir, [number, number]> = {
  idle: [0, 0],
  r: [1, 0],
  l: [-1, 0],
  u: [0, -1],
  d: [0, 1],
  ur: [0.7, -0.7],
  ul: [-0.7, -0.7],
  dr: [0.7, 0.7],
  dl: [-0.7, 0.7],
};

/** The courier pod from above: a round hull, cockpit, and a flame opposite the thrust. */
export function drawPod(dir: Dir, opts: { flicker?: number; hurt?: boolean; shield?: boolean; glow?: number } = {}): Pixels {
  const c = new Pixels(20, 20, CLEAR);
  const [vx, vy] = VEC[dir];
  const flame = shared.get('flame')!;
  if (dir !== 'idle') {
    const len = 4 + (opts.flicker ?? 0) * 2;
    const fm = new Mask();
    const bx = 10 - vx * 6;
    const by = 10 - vy * 6;
    fm.line(bx, by, bx - vx * len, by - vy * len, 3.4);
    fill(c, fm, flame[3]);
    const core = new Mask().line(bx, by, bx - vx * (len - 2), by - vy * (len - 2), 1.6);
    fill(c, core, flame[5]);
  }
  const hull = new Mask().ellipse(10, 10, 6.6, 6.6);
  shade(c, hull, shared.get('metal')!.slice(2, 7));
  // orange ring
  const ring = new Mask().ellipse(10, 10, 6.6, 6.6).minus(new Mask().ellipse(10, 10, 5.4, 5.4));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (ring.get(x, y) && (x + y) % 5 < 2) c.set(x, y, S('trim', 3));
  // cockpit points the way it moves (idle: up)
  const [cx, cy] = dir === 'idle' ? [0, -1] : [vx, vy];
  const cock = new Mask().ellipse(10 + cx * 2.4, 10 + cy * 2.4, 3, 3);
  shade(c, cock, [OUTLINE, ...shared.get('visor')!.slice(0, 3)], { light: [1, -1] });
  c.set(Math.round(10 + cx * 2.4 + 1), Math.round(10 + cy * 2.4 - 1), WHITE);
  // running lights
  const g = opts.glow ?? 0;
  c.set(Math.round(10 - cy * 6), Math.round(10 + cx * 6), g ? S('heart', 3) : S('heart', 1));
  c.set(Math.round(10 + cy * 6), Math.round(10 - cx * 6), g ? S('cash', 3) : S('cash', 1));
  outline(c, OUTLINE);
  if (opts.hurt) c.map((_x, _y, v) => (v === CLEAR || v === OUTLINE ? v : S('heart', 3)));
  return c;
}

/** The diving bell, side view facing right; `prop` 0..2 turns the propeller. */
export function drawDiver(opts: { prop?: number; tilt?: number; lamp?: boolean; hurt?: boolean; bubbles?: number } = {}): Pixels {
  const c = new Pixels(20, 20, CLEAR);
  const t = opts.tilt ?? 0;
  const hull = new Mask().ellipse(10, 10.5, 7.5, 5.6);
  hull.rect(6, 4 + t, 6, 3); // conning tower
  shade(c, hull, shared.get('gold')!.slice(0, 5));
  // window with Max's helmet
  const win = new Mask().ellipse(13, 9.5, 2.8, 2.6);
  shade(c, win, [OUTLINE, ...shared.get('visor')!.slice(0, 2)], { light: [1, -1] });
  c.set(13, 9, WHITE);
  c.set(12, 10, S('suit', 3));
  // rivets & stripe
  for (let x = 5; x <= 15; x += 2) c.set(x, 14, S('trim', 1));
  c.rect(4, 12, 4, 1, S('metal', 2));
  // propeller
  const p = opts.prop ?? 0;
  c.rect(1, 10, 2, 1, S('metal', 3));
  const blades = [
    [0, 7, 0, 13],
    [0, 8, 2, 12],
    [2, 8, 0, 12],
  ][p % 3];
  const pm = new Mask().line(blades[0], blades[1], blades[2], blades[3], 1);
  fill(c, pm, S('metal', 5));
  // lamp beam
  if (opts.lamp) {
    c.set(18, 10, WHITE);
    c.set(19, 10, S('gold', 4));
  } else c.set(18, 10, S('gold', 4));
  const r = rng(5 + (opts.bubbles ?? 0));
  for (let i = 0; i < (opts.bubbles ?? 0); i++) c.set(1 + r() * 4, 2 + r() * 6, S('visor', 3));
  outline(c, OUTLINE);
  if (opts.hurt) c.map((_x, _y, v) => (v === CLEAR || v === OUTLINE ? v : S('heart', 3)));
  return c;
}

/** The rover, side view facing right; `wheel` 0..2 turns the wheels. */
export function drawRover(opts: { wheel?: number; bounce?: number; hurt?: boolean; flash?: boolean; spring?: boolean } = {}): Pixels {
  const c = new Pixels(20, 20, CLEAR);
  const b = opts.bounce ?? 0;
  const body = new Mask().poly([
    [1, 9 + b],
    [16, 9 + b],
    [19, 12 + b],
    [19, 14 + b],
    [1, 14 + b],
  ]);
  shade(c, body, shared.get('trim')!.slice(0, 5));
  c.rect(2, 12 + b, 16, 1, S('metal', 2));
  // canopy with Max
  const can = new Mask().ellipse(9, 8 + b, 4.2, 3.6);
  can.rect(0, 9 + b, 20, 11, false);
  shade(c, can, [OUTLINE, ...shared.get('visor')!.slice(0, 3)], { light: [1, -1] });
  c.set(9, 6 + b, WHITE);
  c.set(8, 7 + b, S('suit', 3));
  // cannon
  c.rect(15, 8 + b, 5, 2, S('metal', 3));
  c.rect(15, 8 + b, 5, 1, S('metal', 5));
  if (opts.flash) c.rect(18, 7 + b, 2, 4, S('laser', 3));
  // antenna
  c.line(3, 9 + b, 2, 3 + b, S('metal', 4));
  c.set(2, 2 + b, S('heart', 3));
  // wheels
  for (const wx of [4.5, 15]) {
    const wm = new Mask().ellipse(wx, 15.5, 3.6, 3.6);
    shade(c, wm, shared.get('metal')!.slice(0, 3));
    const a = ((opts.wheel ?? 0) * Math.PI) / 3 + wx;
    c.set(Math.round(wx + Math.cos(a) * 2), Math.round(15.5 + Math.sin(a) * 2), S('metal', 5));
    c.set(Math.round(wx - Math.cos(a) * 2), Math.round(15.5 - Math.sin(a) * 2), S('metal', 5));
    c.set(Math.round(wx - 0.5), 15, S('trim', 3));
  }
  if (opts.spring) {
    c.line(4, 13, 4, 11, S('cash', 3));
    c.line(15, 13, 15, 11, S('cash', 3));
  }
  outline(c, OUTLINE);
  if (opts.hurt) c.map((_x, _y, v) => (v === CLEAR || v === OUTLINE ? v : S('heart', 3)));
  return c;
}
