// Effects painted over a vehicle or courier block: shield bubbles, tractor beams, speed
// streaks, charging sparkles, sonar rings, dust and splashes. They turn a handful of
// vehicle drawings into the full fifty character blocks of a .CBL.
import { Pixels, rng } from '../kit/pixels';
import { CLEAR, Mask, fill, outline, shade } from './src/art/draw';
import { OUTLINE, S, WHITE, shared } from './src/art/palette';

const copy = (p: Pixels) => {
  const q = new Pixels(p.w, p.h, CLEAR);
  q.px.set(p.px);
  return q;
};
const behind = (p: Pixels, x: number, y: number, c: number) => {
  if (p.get(x, y) === CLEAR) p.set(x, y, c);
};

export function shielded(p: Pixels, phase: number): Pixels {
  const q = copy(p);
  const v = shared.get('visor')!;
  for (let a = 0; a < 64; a++) {
    if ((a + phase * 3) % 8 < 2) continue;
    const t = (a / 64) * Math.PI * 2;
    q.set(10 + Math.cos(t) * 9.4, 10 + Math.sin(t) * 9.4, v[(a + phase) % 4]);
  }
  return q;
}

export function beam(p: Pixels, phase: number): Pixels {
  const q = copy(p);
  const g = shared.get('gold')!;
  for (let y = 12; y < 20; y++)
    for (let x = 10 - (y - 12) / 1.5; x <= 10 + (y - 12) / 1.5; x++)
      if ((Math.round(x) + y + phase) % 3 === 0) behind(q, Math.round(x), y, g[2 + ((y + phase) % 3)]);
  return q;
}

export function streak(p: Pixels, phase: number, left = false): Pixels {
  const q = copy(p);
  const v = shared.get('visor')!;
  for (const y of [5, 9, 13, 16]) {
    const len = 3 + ((y + phase) % 4);
    for (let i = 0; i < len; i++) behind(q, left ? 19 - i : i, y, v[i % 2 ? 1 : 2]);
  }
  return q;
}

export function charge(p: Pixels, phase: number, ramp = 'nova'): Pixels {
  const q = copy(p);
  const n = shared.get(ramp)!;
  const r = rng(40 + phase);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const d = 7 + r() * 3 - phase * 2;
    const x = 10 + Math.cos(a) * d;
    const y = 10 + Math.sin(a) * d;
    q.set(x, y, i % 3 ? n[3] : WHITE);
  }
  return q;
}

export function sparkles(p: Pixels, phase: number, ramp: string): Pixels {
  const q = copy(p);
  const n = shared.get(ramp)!;
  for (let i = 0; i < 6; i++) {
    const x = 3 + ((i * 7 + phase * 5) % 14);
    const y = 2 + ((i * 5 + phase * 3) % 14);
    behind(q, x, y, i % 2 ? WHITE : n[3]);
    behind(q, x + 1, y, n[2]);
  }
  return q;
}

export function dropping(p: Pixels, phase: number, what: 'mine' | 'cross'): Pixels {
  const q = copy(p);
  if (what === 'mine') {
    const m = new Mask().ellipse(15, 15 + phase, 2.2, 2.2);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (m.get(x, y)) behind(q, x, y, shared.get('metal')![2]);
    behind(q, 15, 13 + phase, S('heart', 3));
  } else {
    for (const [x, y] of [
      [15, 3],
      [15, 4],
      [15, 5],
      [14, 4],
      [16, 4],
    ])
      q.set(x, y - phase, S('heart', 3));
  }
  return q;
}

export function sonar(p: Pixels, phase: number): Pixels {
  const q = copy(p);
  const c = shared.get('cash')!;
  const rr = 4 + phase * 3;
  for (let a = 0; a < 48; a++) {
    const t = (a / 48) * Math.PI * 2;
    behind(q, 10 + Math.cos(t) * rr, 10 + Math.sin(t) * rr, c[3 - Math.min(2, phase)]);
  }
  return q;
}

export function dust(p: Pixels, phase: number): Pixels {
  const q = copy(p);
  const m = shared.get('metal')!;
  for (let i = 0; i < 5; i++) behind(q, 1 + i * 2 - phase, 18 - ((i + phase) % 3), m[2 + (i % 3)]);
  return q;
}

export function splash(p: Pixels, phase: number): Pixels {
  const q = copy(p);
  const v = shared.get('visor')!;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    behind(q, 10 + Math.cos(a) * (6 + phase * 2), 8 + Math.sin(a) * (4 + phase * 2), i % 2 ? WHITE : v[3]);
  }
  return q;
}

export function blink(p: Pixels, phase: number): Pixels {
  const q = copy(p);
  const lights = [S('heart', 3), S('cash', 3), S('gold', 4), S('visor', 3)];
  q.set(1, 1, lights[phase % 4]).set(18, 1, lights[(phase + 2) % 4]);
  return q;
}

/** Turns a sprite a quarter turn clockwise k times (tumbling wrecks). */
export function turn(p: Pixels, k: number): Pixels {
  let q = copy(p);
  for (let i = 0; i < k; i++) {
    const r = new Pixels(20, 20, CLEAR);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) r.set(19 - y, x, q.get(x, y));
    q = r;
  }
  return q;
}

/** A wisp of smoke from a damaged vehicle. */
export function smoke(p: Pixels, phase: number): Pixels {
  const q = copy(p);
  const m = shared.get('metal')!;
  const s = new Mask();
  for (let i = 0; i < 3; i++) s.ellipse(6 + i * 3 + phase, 4 - i * 1.5 - phase, 2 + i * 0.5, 1.6 + i * 0.4);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (s.get(x, y)) behind(q, x, y, m[1 + ((x + y) % 3)]);
  return q;
}

export { fill, outline, shade, OUTLINE };
