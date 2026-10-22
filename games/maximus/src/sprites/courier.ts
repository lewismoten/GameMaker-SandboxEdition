// Max, the courier, drawn from a little skeleton so every pose (walk cycle, jet hop,
// crouch, firing, waving...) is consistent. A pose is 20x40 pixels facing right and is
// cut into the top and bottom character blocks Game-Maker stacks.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, Mask, fill, outline, shade } from '../art/draw';
import { OUTLINE, S, WHITE, shared } from '../art/palette';

export interface Pose {
  /** Near and far leg: [hip→knee angle, knee→foot angle] in degrees from straight down (+ = forward). */
  near?: [number, number];
  far?: [number, number];
  /** Arm: shoulder→elbow and elbow→hand angles from straight down (+ = forward). */
  arm?: [number, number];
  /** Back arm visible behind the body. */
  backArm?: [number, number];
  /** Body lowered by this many pixels (knees bend to match). */
  drop?: number;
  /** Lean forward in pixels at the head. */
  lean?: number;
  gun?: 'blaster' | 'lance' | 'none';
  /** Muzzle flash at the gun. */
  flash?: number;
  /** Jetpack flame length 0..10. */
  flame?: number;
  /** Visor glint position 0..1 (idle animation). */
  glint?: number;
  /** Tint the whole figure toward white (hurt flash). */
  hurt?: boolean;
  /** Something held in the hand. */
  holding?: 'medkit' | 'item' | 'nova';
  /** A curled ball (crouch) instead of a figure: 0..3 roll frame. */
  ball?: number;
  /** Speed streaks behind (dash). */
  streak?: boolean;
}

const rad = (d: number) => (d * Math.PI) / 180;

function limb(m: Mask, x: number, y: number, a1: number, a2: number, l1: number, l2: number, w: number): [number, number, number, number] {
  const kx = x + Math.sin(rad(a1)) * l1;
  const ky = y + Math.cos(rad(a1)) * l1;
  const fx = kx + Math.sin(rad(a2)) * l2;
  const fy = ky + Math.cos(rad(a2)) * l2;
  m.line(x, y, kx, ky, w).line(kx, ky, fx, fy, w);
  return [kx, ky, fx, fy];
}

/** Draws a pose into a 20x40 canvas. */
export function drawCourier(p: Pose): Pixels {
  const c = new Pixels(20, 40, CLEAR);
  const suit = shared.get('suit')!;
  const trim = shared.get('trim')!;
  const metal = shared.get('metal')!;
  const visor = shared.get('visor')!;
  const flame = shared.get('flame')!;
  if (p.ball !== undefined) return drawBall(p.ball, p.hurt);
  const d = p.drop ?? 0;
  const lean = p.lean ?? 0;
  const hipY = 25 + d;
  const leanAt = (y: number) => (lean * (hipY - y)) / 20;

  // far leg (darker), behind the body
  const far = new Mask(20, 40);
  const [, , ffx, ffy] = limb(far, 9, hipY, ...(p.far ?? [0, 0]), 7, 7.5, 3.4);
  shade(c, far, suit.slice(0, 3));
  const farBoot = new Mask(20, 40).ellipse(ffx + 1.2, ffy - 0.5, 2.6, 1.8);
  shade(c, farBoot, metal.slice(1, 4));

  // back arm
  if (p.backArm) {
    const ba = new Mask(20, 40);
    limb(ba, 9 + leanAt(16), 16 + d, ...p.backArm, 5, 5, 2.6);
    shade(c, ba, suit.slice(0, 3));
  }

  // jetpack
  const pack = new Mask(20, 40).rect(Math.round(2 + leanAt(18)), 14 + d, 5, 10).ellipse(4.5 + leanAt(14), 14.5 + d, 2.5, 1.5);
  shade(c, pack, metal.slice(1, 6));
  c.rect(Math.round(3 + leanAt(18)), 17 + d, 3, 1, trim[3]);
  const nozzleX = Math.round(3 + leanAt(24));
  c.rect(nozzleX, 24 + d, 3, 2, metal[1]);
  if (p.flame) {
    const fm = new Mask(20, 40).poly([
      [nozzleX - 0.5, 26 + d],
      [nozzleX + 3.5, 26 + d],
      [nozzleX + 1.5, 26 + d + p.flame],
    ]);
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 20; x++) if (fm.get(x, y)) c.set(x, y, flame[Math.max(0, 5 - Math.floor(((y - 26 - d) / Math.max(1, p.flame)) * 5))]);
  }

  // torso
  const torso = new Mask(20, 40);
  for (let y = 14; y <= 25; y++) {
    const off = Math.round(leanAt(y));
    torso.rect(6 + off, y + d, 8, 1);
  }
  torso.ellipse(10 + leanAt(14), 15 + d, 4, 2);
  shade(c, torso, suit.slice(1, 6));
  // belt and chest light
  c.rect(Math.round(6 + leanAt(24)), 23 + d, 8, 2, trim[2]);
  c.rect(Math.round(7 + leanAt(24)), 23 + d, 1, 1, trim[4]);
  c.set(Math.round(12 + leanAt(18)), 18 + d, visor[3]);

  // near leg
  const near = new Mask(20, 40);
  const [, , nfx, nfy] = limb(near, 11, hipY, ...(p.near ?? [0, 0]), 7, 7.5, 3.6);
  shade(c, near, suit.slice(2, 6));
  const boot = new Mask(20, 40).ellipse(nfx + 1.4, nfy - 0.5, 2.8, 1.9);
  shade(c, boot, metal.slice(2, 7));
  c.set(Math.round(nfx + 2), Math.round(nfy - 1), trim[3]);

  // helmet
  const hx = 10 + lean;
  const hy = 8 + d;
  const helmet = new Mask(20, 40).ellipse(hx, hy, 5.6, 5.6);
  shade(c, helmet, [...metal.slice(3, 7), WHITE]);
  // stripe
  for (let x = Math.round(hx - 4); x <= hx + 1; x++) if (helmet.get(x, Math.round(hy - 4))) c.set(x, Math.round(hy - 4), trim[3]);
  const vis = new Mask(20, 40).ellipse(hx + 3.2, hy + 0.6, 3.4, 2.7);
  for (let i = 0; i < vis.m.length; i++) if (!helmet.m[i]) vis.m[i] = 0;
  shade(c, vis, [OUTLINE, visor[0], visor[0], visor[1], visor[2]], { light: [1, -1] });
  const g = p.glint ?? 0.3;
  c.set(Math.round(hx + 1.5 + g * 3), Math.round(hy - 1), WHITE);
  if (g > 0.5) c.set(Math.round(hx + 1.5 + g * 3), Math.round(hy), visor[3]);
  // collar
  c.rect(Math.round(7 + leanAt(13)), 13 + d, 6, 1, trim[1]);

  // near arm (+ gun)
  if (p.arm) {
    const arm = new Mask(20, 40);
    const [, , hx2, hy2] = limb(arm, 11 + leanAt(16), 16 + d, ...p.arm, 5, 5, 2.8);
    shade(c, arm, suit.slice(2, 6));
    c.set(Math.round(hx2), Math.round(hy2), trim[2]);
    if (p.gun === 'blaster' || p.gun === 'lance') {
      const long = p.gun === 'lance' ? 7 : 4;
      const gy = Math.round(hy2) - 1;
      const gx = Math.round(hx2);
      c.rect(gx - 1, gy, long + 1, 2, metal[2]);
      c.rect(gx - 1, gy, long + 1, 1, metal[4]);
      c.rect(gx, gy + 2, 2, 2, metal[1]);
      if (p.gun === 'lance') c.rect(gx + 2, gy - 1, 3, 1, shared.get('plasma')![2]);
      if (p.flash) {
        const fx = Math.min(19, gx + long + 1);
        const fl = new Mask(20, 40).ellipse(fx, gy + 0.5, p.flash, p.flash * 0.7);
        fill(c, fl, p.gun === 'lance' ? shared.get('plasma')![3] : shared.get('laser')![3]);
        c.set(fx, gy, WHITE);
      }
    }
    if (p.holding) {
      const hx3 = Math.round(hx2) + 1;
      const hy3 = Math.round(hy2) - 2;
      if (p.holding === 'medkit') {
        c.rect(hx3 - 1, hy3, 5, 4, WHITE);
        c.rect(hx3 + 1, hy3, 1, 4, S('heart', 2));
        c.rect(hx3 - 1, hy3 + 1, 5, 1, S('heart', 2));
      } else if (p.holding === 'nova') {
        const o = new Mask(20, 40).ellipse(hx3 + 1, hy3 + 1, 2.6, 2.6);
        shade(c, o, shared.get('nova')!);
      } else {
        c.rect(hx3 - 1, hy3, 4, 4, S('gold', 3));
        c.set(hx3, hy3 + 1, WHITE);
      }
    }
  }

  if (p.streak) {
    for (const y of [12, 18, 24, 31]) {
      const yy = y + d;
      for (let x = 0; x < 4; x++) if (c.get(x, yy) === CLEAR) c.set(x, yy, visor[x % 2 ? 1 : 2]);
    }
  }
  outline(c, OUTLINE);
  if (p.hurt) c.map((_x, _y, v) => (v === CLEAR || v === OUTLINE ? v : (S('heart', 3) as number)));
  return c;
}

/** The courier curled up (1 block tall, used for crouch/roll), in a 20x40 canvas bottom. */
function drawBall(frame: number, hurt?: boolean): Pixels {
  const c = new Pixels(20, 40, CLEAR);
  const suit = shared.get('suit')!;
  const ball = new Mask(20, 40).ellipse(10, 30.5, 7.5, 7.5);
  shade(c, ball, suit.slice(1, 6));
  // helmet + visor peeking, rotating with the roll
  const a = (frame * Math.PI) / 2;
  const vx = 10 + Math.cos(a) * 3.5;
  const vy = 30.5 + Math.sin(a) * 3.5;
  const vis = new Mask(20, 40).ellipse(vx, vy, 2.6, 2.2);
  shade(c, vis, shared.get('visor')!.slice(0, 4), { light: [1, -1] });
  const bx = 10 - Math.cos(a) * 4;
  const by = 30.5 - Math.sin(a) * 4;
  const pack = new Mask(20, 40).ellipse(bx, by, 2.4, 2.4);
  shade(c, pack, shared.get('metal')!.slice(2, 6));
  c.set(Math.round(10 + Math.cos(a + 1.5) * 5), Math.round(30.5 + Math.sin(a + 1.5) * 5), S('trim', 3));
  outline(c, OUTLINE);
  if (hurt) c.map((_x, _y, v) => (v === CLEAR || v === OUTLINE ? v : (S('heart', 3) as number)));
  return c;
}

/** Splits a 20x40 pose into [top, bottom] 20x20 blocks. */
export function split(p: Pixels): [Pixels, Pixels] {
  return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
}
