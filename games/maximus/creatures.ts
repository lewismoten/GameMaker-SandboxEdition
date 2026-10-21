// Creature art: archetypes drawn from masks (slime, beetle, spider, bat, eye, jelly, fish,
// crab, drone, walker, ghost, plant, golem, saucer, asteroid...), each with animation
// frames, in whichever "hide" ramp a monster set gives them. 20x20, transparent.
import { Pixels, rng } from '../kit/pixels';
import { CLEAR, Mask, fill, outline, shade, sprite } from './src/art/draw';
import { OUTLINE, WHITE } from './src/art/palette';

export interface Paint {
  hide: number[];
  accent: number[];
  eye: number[];
  dark?: number;
}

export type Archetype =
  | 'slime'
  | 'beetle'
  | 'spider'
  | 'bat'
  | 'eye'
  | 'jelly'
  | 'fish'
  | 'crab'
  | 'drone'
  | 'walker'
  | 'ghost'
  | 'plant'
  | 'golem'
  | 'saucer'
  | 'asteroid'
  | 'squid'
  | 'frog'
  | 'wisp'
  | 'orb'
  | 'slab'
  | 'critter'
  | 'manta'
  | 'worm'
  | 'bird'
  | 'wasp'
  | 'turret'
  | 'urchin'
  | 'eel'
  | 'skull'
  | 'mimic'
  | 'egg'
  | 'comet'
  | 'plate';

export interface Look {
  arch: Archetype;
  paint: Paint;
  /** 0.6 .. 1.2 scale of the body */
  size?: number;
  spikes?: boolean;
  horns?: boolean;
  seed?: number;
}

const eyes = (p: Pixels, pts: [number, number][], paint: Paint, big = false) => {
  for (const [x, y] of pts) {
    if (big) {
      fill(p, new Mask().ellipse(x + 0.5, y + 0.5, 1.8, 1.8), WHITE);
      p.set(x + 1, y, OUTLINE).set(x + 1, y + 1, OUTLINE);
    } else {
      p.set(x, y, paint.eye[3]).set(x + 1, y, paint.eye[2]);
    }
  }
};

function spikesOn(p: Pixels, m: Mask, paint: Paint, n = 6): void {
  // little triangles along the top edge of a mask
  for (let x = 2; x < 18; x += Math.max(2, Math.floor(16 / n))) {
    let y = 0;
    while (y < 20 && !m.get(x, y)) y++;
    if (y >= 20 || y < 3) continue;
    p.set(x, y - 1, paint.accent[3])
      .set(x, y - 2, paint.accent[4])
      .set(x - 1, y - 1, paint.accent[2]);
  }
}

/** Two (sometimes three) frames for a look. */
export function drawCreature(look: Look): Pixels[] {
  const s = look.size ?? 1;
  const pt = look.paint;
  const seed = look.seed ?? 1;
  const r = rng(seed);
  const frames: Pixels[] = [];
  const F = (fn: (p: Pixels, k: number) => void, n = 2) => {
    for (let k = 0; k < n; k++) {
      const p = sprite();
      fn(p, k);
      outline(p, OUTLINE);
      frames.push(p);
    }
  };
  switch (look.arch) {
    case 'slime':
      F((p, k) => {
        const h = (k ? 6 : 7.5) * s;
        const w = (k ? 8.5 : 7) * s;
        const m = new Mask().ellipse(10, 19.5 - h, w, h).rect(0, 20, 20, 1, false);
        m.rect(0, 19, 20, 1, false);
        shade(p, m, pt.hide);
        if (look.spikes) spikesOn(p, m, pt);
        eyes(
          p,
          [
            [7, Math.round(17 - h)],
            [11, Math.round(17 - h)],
          ],
          pt,
          true,
        );
        p.set(10, Math.round(18 - h / 2), pt.hide[0]).set(9, Math.round(18 - h / 2), pt.hide[0]);
        p.set(6, Math.round(19.5 - h * 1.6), WHITE);
      });
      break;
    case 'beetle':
      F((p, k) => {
        const legs = new Mask();
        for (let i = 0; i < 3; i++) legs.line(5 + i * 4, 14, 3 + i * 4 + (k ? 2 : -1), 19, 1);
        fill(p, legs, pt.hide[0]);
        const m = new Mask().ellipse(10, 11, 7.5 * s, 5 * s);
        shade(p, m, pt.hide);
        p.line(10, 6, 10, 15, pt.hide[1]);
        const head = new Mask().ellipse(17, 12, 2.6, 2.4);
        shade(p, head, pt.accent);
        eyes(p, [[17, 11]], pt);
        if (look.horns) p.line(18, 10, 19, 6, pt.accent[4]);
        if (look.spikes) spikesOn(p, m, pt, 4);
        p.set(7, 8, WHITE);
      });
      break;
    case 'spider':
      F((p, k) => {
        const legs = new Mask();
        for (let i = 0; i < 4; i++) {
          const a = -0.6 + i * 0.4;
          const lift = k && i % 2 ? -2 : 0;
          legs.line(10, 10, 10 - Math.cos(a) * 8, 10 + Math.sin(a) * 6 + 4 + lift, 1).line(10, 10, 10 + Math.cos(a) * 8, 10 + Math.sin(a) * 6 + 4 - lift, 1);
        }
        fill(p, legs, pt.hide[1]);
        p.line(10, 0, 10, 6, pt.accent[3]);
        shade(p, new Mask().ellipse(10, 10, 5 * s, 4.5 * s), pt.hide);
        eyes(
          p,
          [
            [8, 9],
            [11, 9],
            [9, 11],
          ],
          pt,
        );
      });
      break;
    case 'bat':
    case 'bird':
      F((p, k) => {
        const up = k === 0;
        const wing = new Mask();
        const bird = look.arch === 'bird';
        wing.poly(
          up
            ? [
                [10, 10],
                [1, 2],
                [3, 9],
                [0, 12],
              ]
            : [
                [10, 10],
                [1, 16],
                [4, 12],
                [0, 9],
              ],
        );
        wing.or(wing.flipX());
        shade(p, wing, bird ? pt.accent : pt.hide.slice(0, 4), { light: [0, -1] });
        shade(p, new Mask().ellipse(10, 10.5, 3.5 * s, 4 * s), pt.hide);
        if (bird) {
          p.line(13, 10, 16, 11, pt.eye[2]);
          eyes(p, [[11, 9]], pt);
        } else {
          eyes(
            p,
            [
              [8, 9],
              [11, 9],
            ],
            pt,
          );
          p.set(8, 6, pt.hide[4]).set(12, 6, pt.hide[4]);
        }
      });
      break;
    case 'wasp':
      F((p, k) => {
        const wing = new Mask().ellipse(8, k ? 5 : 7, 3, 4).ellipse(12, k ? 5 : 7, 3, 4);
        shade(p, wing, [pt.accent[2], pt.accent[3], WHITE]);
        const body = new Mask().ellipse(7, 12, 4 * s, 3.5 * s).ellipse(13.5, 12, 3, 2.6);
        shade(p, body, pt.hide);
        for (let x = 4; x < 10; x += 2) p.line(x, 9, x, 15, pt.hide[0]);
        p.line(1, 13, 3, 12, pt.hide[1]);
        eyes(p, [[14, 11]], pt);
      });
      break;
    case 'eye':
      F((p, k) => {
        for (let i = 0; i < 4; i++) {
          const x = 6 + i * 2.6;
          new Mask().line(x, 14, x + (k ? (i % 2 ? 1 : -1) : 0), 19, 1).m.forEach((v, j) => v && p.set(j % 20, Math.floor(j / 20), pt.hide[1]));
        }
        shade(p, new Mask().ellipse(10, 9, 7 * s, 7 * s), [pt.hide[2], pt.hide[3], pt.hide[4], WHITE]);
        fill(p, new Mask().ellipse(11 + (k ? -1 : 1), 9, 3.5, 3.5), pt.eye[2]);
        fill(p, new Mask().ellipse(11 + (k ? -1 : 1), 9, 1.6, 2.2), OUTLINE);
        p.set(8, 6, WHITE);
      });
      break;
    case 'jelly':
      F((p, k) => {
        const bell = new Mask().ellipse(10, 8 + k, 7 * s, 5.5 * s).rect(0, 9 + k, 20, 11, false);
        shade(p, bell, [...pt.hide.slice(2), WHITE]);
        for (let i = 0; i < 5; i++) {
          let x = 5 + i * 2.5;
          for (let y = 9 + k; y < 19; y++) {
            x += Math.sin(y * 0.8 + i + k * 2) * 0.5;
            p.set(x, y, pt.accent[(y + i) % 2 ? 3 : 2]);
          }
        }
        p.set(7, 5, WHITE);
      });
      break;
    case 'fish':
    case 'eel':
      F((p, k) => {
        const eel = look.arch === 'eel';
        const body = eel
          ? new Mask()
              .line(2, 10 + (k ? 2 : -2), 8, 10, 4)
              .line(8, 10, 14, 10 + (k ? -1 : 1), 4)
              .ellipse(15, 10, 3.5, 2.6)
          : new Mask().ellipse(10, 10, 7 * s, 4.5 * s);
        shade(p, body, pt.hide);
        const tail = new Mask().poly([
          [eel ? 3 : 4, 10],
          [0, k ? 5 : 7],
          [0, k ? 15 : 13],
        ]);
        shade(p, tail, pt.accent);
        if (!eel)
          shade(
            p,
            new Mask().poly([
              [8, 6],
              [12, 6],
              [10, 2 + k],
            ]),
            pt.accent,
          );
        eyes(p, [[14, 9]], pt, !eel);
        if (look.spikes) for (let x = 5; x < 15; x += 3) p.set(x, 5, pt.accent[4]);
      });
      break;
    case 'crab':
      F((p, k) => {
        const legs = new Mask();
        for (let i = 0; i < 3; i++) legs.line(6 + i * 4, 13, 4 + i * 4 + (k ? 2 : 0), 19, 1);
        fill(p, legs, pt.hide[1]);
        shade(p, new Mask().ellipse(10, 12, 7 * s, 4.5 * s), pt.hide);
        const claw = new Mask().ellipse(3, k ? 6 : 8, 2.6, 2.2).ellipse(17, k ? 8 : 6, 2.6, 2.2);
        shade(p, claw, pt.accent);
        p.set(3, k ? 5 : 7, OUTLINE).set(17, k ? 7 : 5, OUTLINE);
        p.line(8, 8, 8, 6, pt.hide[2]).line(12, 8, 12, 6, pt.hide[2]);
        p.set(8, 5, pt.eye[3]).set(12, 5, pt.eye[3]);
      });
      break;
    case 'drone':
      F((p, k) => {
        p.line(3, 3, 17, 3, pt.accent[k ? 4 : 2]);
        p.line(10, 3, 10, 6, pt.hide[1]);
        shade(p, new Mask().ellipse(10, 11, 6 * s, 5.5 * s), pt.hide);
        fill(p, new Mask().ellipse(10, 11, 2.4, 2.4), pt.eye[k ? 3 : 2]);
        p.set(10, 11, WHITE);
        p.set(4, 14, pt.accent[3]).set(16, 14, pt.accent[3]);
      });
      break;
    case 'walker':
      F((p, k) => {
        const legs = new Mask().line(8, 12, k ? 5 : 7, 19, 2).line(12, 12, k ? 13 : 15, 19, 2);
        shade(p, legs, pt.accent);
        shade(p, new Mask().rect(4, 3, 12, 10).ellipse(10, 3, 6, 2), pt.hide, { light: [-1, 0] });
        fill(p, new Mask().rect(11, 5, 4, 3), pt.eye[2]);
        p.set(13, 6, WHITE);
        p.line(3, 8, 1, 11, pt.hide[2]);
        if (look.horns) p.line(6, 2, 5, 0, pt.accent[4]);
      });
      break;
    case 'ghost':
    case 'skull':
      F((p, k) => {
        if (look.arch === 'skull') {
          shade(p, new Mask().ellipse(10, 9, 6.5 * s, 6 * s).rect(6, 12, 8, 4), [pt.hide[3], pt.hide[4], pt.hide[5] ?? WHITE, WHITE]);
          fill(p, new Mask().ellipse(7.5, 9, 1.8, 2).ellipse(12.5, 9, 1.8, 2), OUTLINE);
          p.set(7, 9, pt.eye[k ? 3 : 1]).set(12, 9, pt.eye[k ? 3 : 1]);
          for (let x = 7; x < 14; x += 2) p.set(x, 15, OUTLINE);
          return;
        }
        const m = new Mask().ellipse(10, 9, 6.5 * s, 6.5 * s).rect(4, 9, 13, 7);
        for (let x = 4; x < 17; x++) if ((x + k * 2) % 4 < 2) m.set(x, 16).set(x, 17);
        shade(p, m, [...pt.hide.slice(3), WHITE]);
        fill(p, new Mask().ellipse(8, 9, 1.4, 2).ellipse(12, 9, 1.4, 2), OUTLINE);
        fill(p, new Mask().ellipse(10, 13, 1.4, 1.2 + k), OUTLINE);
      });
      break;
    case 'plant':
      F((p, k) => {
        p.line(10, 19, 10, 11, pt.accent[1]).line(11, 19, 11, 11, pt.accent[2]);
        shade(p, new Mask().ellipse(5, 16, 4, 2).ellipse(15, 16, 4, 2), pt.accent);
        const open = k ? 4 : 1.5;
        const head = new Mask().ellipse(10.5, 7, 6 * s, 5 * s);
        shade(p, head, pt.hide);
        fill(p, new Mask().ellipse(10.5, 7, 5, open), OUTLINE);
        for (let x = 6; x < 16; x += 2) p.set(x, Math.round(7 - open), WHITE).set(x + 1, Math.round(7 + open), WHITE);
      });
      break;
    case 'golem':
      F((p, k) => {
        const m = new Mask()
          .rect(4, 4, 12, 11)
          .ellipse(10, 4, 6, 3)
          .rect(5 + (k ? 1 : 0), 15, 3, 5)
          .rect(12 - (k ? 1 : 0), 15, 3, 5)
          .rect(1, 6 + k, 3, 8)
          .rect(16, 7 - k, 3, 8);
        shade(p, m, pt.hide, { dither: true, seed });
        fill(p, new Mask().rect(7, 6, 6, 2), pt.eye[k ? 3 : 2]);
        for (let i = 0; i < 4; i++) p.set(5 + r() * 10, 9 + r() * 5, pt.accent[3]);
      });
      break;
    case 'saucer':
      F((p, k) => {
        shade(p, new Mask().ellipse(10, 8, 4, 3.5), [OUTLINE, ...pt.eye.slice(1)], { light: [1, -1] });
        shade(p, new Mask().ellipse(10, 11, 9 * s, 3.2 * s), pt.hide);
        for (let i = 0; i < 4; i++) p.set(3 + i * 4 + (k ? 2 : 0), 11, pt.accent[4]);
        fill(p, new Mask().ellipse(10, 14.5, 4, 1.2), pt.accent[k ? 3 : 2]);
      });
      break;
    case 'asteroid':
    case 'comet':
      F((p, k) => {
        if (look.arch === 'comet') {
          for (let i = 0; i < 8; i++) p.line(10, 10, 0, 4 + i * 1.5 + k, pt.accent[(i % 3) + 1]);
        }
        const m = new Mask();
        const rr = rng(seed + 31);
        for (let i = 0; i < 6; i++) m.ellipse(10 + (rr() - 0.5) * 6 * s, 10 + (rr() - 0.5) * 6 * s, (3.5 + rr() * 3) * s, (3.5 + rr() * 3) * s);
        shade(p, m, pt.hide, { dither: true, seed: seed + k });
        for (let i = 0; i < 4; i++) {
          const cx = 6 + rr() * 8;
          const cy = 6 + rr() * 8;
          if (m.get(Math.round(cx), Math.round(cy))) p.set(cx, cy, pt.hide[0]).set(cx + 1, cy, pt.hide[1]);
        }
      }, 1);
      break;
    case 'squid':
      F((p, k) => {
        shade(
          p,
          new Mask().ellipse(10, 6, 5 * s, 6 * s).poly([
            [10, -2],
            [14, 3],
            [6, 3],
          ]),
          pt.hide,
        );
        for (let i = 0; i < 4; i++) {
          let x = 6.5 + i * 2.3;
          for (let y = 11; y < 20; y++) {
            x += (k ? 0.3 : -0.3) * (i < 2 ? 1 : -1);
            p.set(x, y, pt.accent[2 + (y & 1)]);
          }
        }
        eyes(
          p,
          [
            [7, 8],
            [11, 8],
          ],
          pt,
          true,
        );
      });
      break;
    case 'frog':
      F((p, k) => {
        const crouch = k === 0;
        const legs = crouch ? new Mask().ellipse(5, 17, 3, 2.5).ellipse(15, 17, 3, 2.5) : new Mask().line(5, 13, 2, 19, 2).line(15, 13, 18, 19, 2);
        shade(p, legs, pt.hide.slice(0, 4));
        shade(p, new Mask().ellipse(10, crouch ? 13 : 10, 6.5 * s, 4.5 * s), pt.hide);
        shade(p, new Mask().ellipse(10, crouch ? 15 : 12, 4, 1.8), pt.accent);
        eyes(
          p,
          [
            [6, crouch ? 9 : 6],
            [12, crouch ? 9 : 6],
          ],
          pt,
          true,
        );
      });
      break;
    case 'wisp':
      F((p, k) => {
        for (let i = 0; i < 9; i++) {
          const y = 18 - i * 1.6;
          const x = 10 + Math.sin(i * 0.9 + k * 2) * (3 - i * 0.2);
          fill(p, new Mask().ellipse(x, y, 4 - i * 0.35, 2), pt.hide[Math.min(pt.hide.length - 1, 2 + (i >> 1))]);
        }
        fill(p, new Mask().ellipse(10, 13, 2.6, 2.6), WHITE);
        p.set(9, 12, pt.eye[3]).set(11, 12, pt.eye[3]);
      });
      break;
    case 'orb':
      F((p, k) => {
        shade(p, new Mask().ellipse(10, 10, (4 + k) * s, (4 + k) * s), [...pt.hide.slice(2), WHITE]);
        for (let a = 0; a < 6; a++) p.set(10 + Math.round(Math.cos(a + k) * 7 * s), 10 + Math.round(Math.sin(a + k) * 7 * s), pt.accent[3]);
      });
      break;
    case 'slab':
      F((p) => {
        shade(p, new Mask().rect(0, 0, 20, 8), pt.hide, { light: [0, -1] });
        p.rect(0, 0, 20, 1, pt.hide[pt.hide.length - 1]);
        for (let x = 2; x < 20; x += 6) p.rect(x, 3, 2, 2, pt.accent[3]);
        p.line(4, 8, 2, 13, pt.hide[1]).line(15, 8, 17, 13, pt.hide[1]);
        fill(p, new Mask().ellipse(10, 11, 3, 2.5), pt.eye[2]);
      }, 1);
      break;
    case 'critter':
      F((p, k) => {
        const m = new Mask()
          .ellipse(10, 13 - k, 6 * s, 5 * s)
          .ellipse(6, 7 - k, 1.6, 3)
          .ellipse(14, 7 - k, 1.6, 3);
        shade(p, m, pt.hide, { dither: true, seed });
        p.set(4 + k * 2, 19, pt.hide[0]).set(15 - k * 2, 19, pt.hide[0]);
        eyes(
          p,
          [
            [7, 11 - k],
            [11, 11 - k],
          ],
          pt,
          true,
        );
        p.set(10, 14 - k, pt.accent[3]);
      });
      break;
    case 'manta':
      F((p, k) => {
        const m = new Mask().poly([
          [10, 6],
          [19, k ? 6 : 12],
          [13, 13],
          [10, 15],
          [7, 13],
          [1, k ? 6 : 12],
        ]);
        shade(p, m, pt.hide, { light: [0, -1] });
        p.line(10, 15, 10, 19, pt.accent[2]);
        eyes(
          p,
          [
            [8, 9],
            [11, 9],
          ],
          pt,
        );
      });
      break;
    case 'worm':
      F((p, k) => {
        for (let i = 0; i < 5; i++) {
          const y = 18 - i * 3.2;
          const x = 10 + Math.sin(i * 0.9 + k * 1.7) * 3;
          shade(p, new Mask().ellipse(x, y, 3.6 - i * 0.15, 2.4), i % 2 ? pt.hide : pt.accent);
        }
        p.set(10 + Math.sin(4 * 0.9 + k * 1.7) * 3, 4, OUTLINE);
        eyes(p, [[Math.round(10 + Math.sin(3.6 + k * 1.7) * 3) - 1, 3]], pt);
      });
      break;
    case 'turret':
      F((p, k) => {
        shade(p, new Mask().rect(3, 12, 14, 8).ellipse(10, 12, 7, 5), pt.hide, { light: [-1, -1] });
        p.line(10, 10, 10 + (k ? 6 : 3), k ? 3 : 2, pt.accent[3]).line(11, 10, 11 + (k ? 6 : 3), k ? 3 : 2, pt.accent[2]);
        fill(p, new Mask().ellipse(10, 14, 2, 2), pt.eye[k ? 3 : 1]);
      });
      break;
    case 'urchin':
      F((p, k) => {
        for (let a = 0; a < 12; a++) {
          const ang = (a / 12) * Math.PI * 2 + k * 0.26;
          p.line(10, 10, 10 + Math.cos(ang) * 9 * s, 10 + Math.sin(ang) * 9 * s, pt.accent[2 + (a % 2)]);
        }
        shade(p, new Mask().ellipse(10, 10, 5 * s, 5 * s), pt.hide);
        eyes(p, [[9, 9]], pt);
      });
      break;
    case 'mimic':
      F((p, k) => {
        // a gem, until it opens its mouth
        const m = new Mask().poly([
          [10, 3 + k * 2],
          [16, 8],
          [10, 17],
          [4, 8],
        ]);
        shade(p, m, pt.accent);
        if (k) {
          fill(p, new Mask().rect(5, 8, 10, 3), OUTLINE);
          for (let x = 5; x < 15; x += 2) p.set(x, 8, WHITE).set(x + 1, 10, WHITE);
          p.set(8, 6, pt.eye[3]).set(12, 6, pt.eye[3]);
        } else p.set(8, 6, WHITE);
      });
      break;
    case 'plate':
      F((p, k) => {
        // a full block of armor (solid monsters collide by their pixels, so no gaps)
        shade(p, new Mask().rect(0, 0, 20, 20), pt.hide, { light: [-1, -1] });
        p.rect(0, 0, 20, 1, pt.hide[pt.hide.length - 1]).rect(0, 0, 1, 20, pt.hide[pt.hide.length - 1]);
        for (const [x, y] of [
          [3, 3],
          [16, 3],
          [3, 16],
          [16, 16],
        ])
          p.set(x, y, pt.accent[3]);
        const crack = new Mask().line(10, 2, 8, 9, 1).line(8, 9, 12, 13, 1).line(12, 13, 9, 18, 1);
        if (look.spikes) fill(p, crack, pt.accent[k ? 4 : 2]);
        else fill(p, new Mask().rect(7, 7, 6, 6), pt.eye[k ? 3 : 1]);
      });
      break;
    case 'egg':
      F((p, k) => {
        shade(p, new Mask().ellipse(10, 11, 5.5 * s, 7 * s), pt.hide);
        for (let i = 0; i < 4; i++) p.set(7 + r() * 6, 7 + r() * 8, pt.accent[3]);
        if (k) p.line(7, 9, 9, 11, OUTLINE).line(9, 11, 11, 9, OUTLINE).line(11, 9, 13, 11, OUTLINE);
      });
      break;
  }
  return frames.map((f) => f.map((_x, _y, c) => (c === CLEAR ? CLEAR : c)));
}
