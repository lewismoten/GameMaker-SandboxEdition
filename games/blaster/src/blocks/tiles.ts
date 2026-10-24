// The background blocks every stage has, drawn in that stage's colors on its own floor:
// turret mounts (which secretly give birth to the bullets), virus hatches, firewall
// fences, pickups on their pads, data-stream currents (gravity blocks), raised panels,
// and the gate at the end of the stage.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, shadeAt } from '../art/draw';
import { HURT } from '../characters/sharedMonsters';
import { SEQ } from '../ids';
import type { Pal } from '../art/pal';

export interface StageArt {
  pal: Pal;
  /** An opaque 20x20 floor tile, variant v. */
  floor(v: number): Pixels;
  /** The wall at the left or right edge of the screen (the ship can't get there). */
  edge(side: 'L' | 'R', v: number): Pixels;
  floors: number;
  edges: number;
}

const copy = (p: Pixels) => {
  const q = new Pixels(20, 20);
  q.px.set(p.px);
  return q;
};

/** The firing direction of a turret mount, as a barrel vector. */
const AIM: Record<string, [number, number]> = { L: [-0.6, 0.8], D: [0, 1], R: [0.6, 0.8] };

function mount(a: StageArt, kind: 'L' | 'D' | 'R' | 'S' | 'F'): Pixels {
  const p = a.pal;
  const t = copy(a.floor(0));
  // the socket
  blob(t, 9.5, 9.5, 8, 8, p.r('deep'), 0, 3, 0.8);
  blob(t, 9.5, 9.5, 5.5, 5.5, p.r('deep'), 0, 1, -0.6);
  if (kind === 'S') {
    blob(t, 9.5, 9.5, 4, 4, p.r('virus'), 1, 5);
    t.set(8, 8, p.c('virus', 5));
  } else if (kind === 'F') {
    t.rect(7, 9, 2, 8, p.c('steel', 3)).rect(11, 9, 2, 8, p.c('steel', 3));
    t.rect(7, 16, 2, 1, p.c('pink', 3)).rect(11, 16, 2, 1, p.c('pink', 3));
    blob(t, 9.5, 9.5, 3, 3, p.r('steel'), 1, 5);
  } else {
    const [dx, dy] = AIM[kind];
    for (let k = 0; k < 9; k++) {
      const x = 9.5 + dx * k;
      const y = 9.5 + dy * k;
      t.rect(Math.round(x - 1), Math.round(y - 1), 3, 3, p.c('steel', k > 6 ? 1 : 3));
      t.set(Math.round(x - dy), Math.round(y + dx * 0.5), p.c('steel', 5));
    }
    t.rect(Math.round(9 + dx * 8), Math.round(9 + dy * 8), 2, 2, p.c('pink', 3));
    blob(t, 9.5, 9.5, 3, 3, p.r('steel'), 1, 5);
  }
  return t;
}

function hatch(a: StageArt, open: boolean): Pixels {
  const p = a.pal;
  const t = copy(a.floor(0));
  bevel(t, 1, 1, 18, 18, p.r('deep'), 2, 2);
  if (open) {
    t.rect(4, 4, 12, 12, p.c('ink', 0));
    blob(t, 10, 10, 5, 5, p.r('virus'), 0, 3, 0.5);
    for (let i = 0; i < 6; i++) t.set(6 + ((i * 5) % 9), 6 + ((i * 3) % 8), p.c('virus', 5));
  } else {
    for (let y = 4; y < 16; y += 3) t.rect(4, y, 12, 2, p.c('deep', 3)).rect(4, y + 2, 12, 1, p.c('deep', 1));
    t.rect(9, 4, 2, 12, p.c('trim', 2));
  }
  for (const [x, y] of [
    [2, 2],
    [17, 2],
    [2, 17],
    [17, 17],
  ])
    t.set(x, y, p.c('trim', 5));
  return t;
}

function post(a: StageArt, side: 'L' | 'R'): Pixels {
  const p = a.pal;
  const t = copy(a.floor(1));
  const x = side === 'L' ? 4 : 6;
  bevel(t, x, 3, 10, 14, p.r('trim'), 2, 1);
  blob(t, x + 5, 10, 3, 3, p.r('glow'), 1, 4);
  t.rect(side === 'L' ? 14 : 0, 9, 6, 2, p.c('glow', 2));
  return t;
}

function beam(a: StageArt, on: boolean, phase: number): Pixels {
  const p = a.pal;
  const t = copy(a.floor(2));
  if (on) {
    // a heat haze over the whole cell: the ship is burned anywhere in it, so it all looks hot
    for (let y = 1; y < 19; y++) for (let x = (y + phase) % 3; x < 20; x += 3) t.set(x, y, p.c('glow', 1));
    for (let x = 0; x < 20; x++) {
      const y = 10 + Math.round(Math.sin(x * 0.9 + phase) * 2);
      t.rect(x, y - 1, 1, 3, p.c('glow', 2));
      t.set(x, y, p.c('glow', 4));
    }
    t.rect(0, 9, 20, 1, p.c('glow', 3));
  } else {
    for (let x = 0; x < 20; x += 4) t.set(x + phase, 10, p.c('glow', 1));
  }
  return t;
}

function gap(a: StageArt): Pixels {
  const p = a.pal;
  const t = copy(a.floor(2));
  for (let x = 0; x < 20; x++) if (x < 4 || x > 15) t.set(x, 10, p.c('glow', 1));
  for (let i = 0; i < 6; i++) t.set(4 + ((i * 7) % 12), 8 + ((i * 3) % 5), p.c('grey', 2));
  return t;
}

export function pad(a: StageArt): Pixels {
  const p = a.pal;
  const t = copy(a.floor(0));
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const d = Math.hypot(x - 9.5, y - 9.5);
      if (d > 7.5 && d < 9) t.set(x, y, p.c('deep', 2));
      if (d >= 9 && d < 9.8) t.set(x, y, p.c('trim', 1));
    }
  return t;
}

type PickupKind = 'nova' | 'repair' | 'life' | 'bit';

function pickup(a: StageArt, kind: PickupKind, k: number): Pixels {
  const p = a.pal;
  const t = pad(a);
  const glow = k ? 1 : 0;
  if (kind === 'nova') {
    blob(t, 9.5, 9.5, 7, 7, p.r('gold'), 0 + glow, 4);
    const N = ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'];
    t.draw(7, 7, N, { X: p.c('red', 1) });
  } else if (kind === 'repair') {
    blob(t, 9.5, 9.5, 7, 7, p.r('slime'), 1 + glow, 5);
    t.rect(8, 5, 4, 10, p.c('grey', 7)).rect(5, 8, 10, 4, p.c('grey', 7));
    t.rect(9, 6, 2, 8, p.c('red', 2)).rect(6, 9, 8, 2, p.c('red', 2));
  } else if (kind === 'life') {
    blob(t, 9.5, 9.5, 7, 7, p.r('cyan'), 1 + glow, 5);
    t.draw(5, 4, ['....XX....', '...XccX...', '..XXccXX..', '.XXXXXXXX.', 'XXXXXXXXXX', 'X.XX..XX.X', '..X....X..'], {
      X: p.c('steel', 6),
      c: p.c('cyan', 1),
    });
    t.draw(7, 12, ['1.U.P'], { '1': p.c('ink', 0), U: p.c('ink', 0), P: p.c('ink', 0) });
  } else {
    // a loose byte of good data
    bevel(t, 5, 5, 10, 10, p.r('cyan'), 2 + glow, 1);
    t.draw(7, 7, ['X.XX', 'XXX.', '.X.X', 'XX.X', 'X..X'].slice(0, 5), { X: p.c('ink', 0) });
  }
  return t;
}

function current(a: StageArt, dir: 'L' | 'R', k: number): Pixels {
  const p = a.pal;
  const t = copy(a.floor(3));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y * 3) % 7 === 0) t.set(x, y, p.c('glow', 1));
  const off = k * 5;
  for (let c = 0; c < 2; c++) {
    const cx = ((c * 10 + off) % 20) + 2;
    for (let i = 0; i < 5; i++) {
      const x = dir === 'R' ? cx + i : cx + 4 - i;
      t.set(x, 5 + i, p.c('glow', 3)).set(x, 15 - i, p.c('glow', 3));
      t.set(x, 6 + i, p.c('glow', 2)).set(x, 14 - i, p.c('glow', 2));
    }
  }
  return t;
}

function gate(a: StageArt, k: number): Pixels {
  const p = a.pal;
  const t = new Pixels(20, 20, p.c('ink', 0));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) t.set(x, y, shadeAt(p.r('cyan'), 0, 5, ((y + k * 5) % 20) / 19, x, y));
  for (let x = 0; x < 20; x += 5) t.rect(x + k, 0, 1, 20, p.c('cyan', 5));
  return t;
}

function launch(a: StageArt): Pixels {
  const p = a.pal;
  const t = copy(a.floor(0));
  bevel(t, 0, 0, 20, 20, p.r('deep'), 2, 1);
  for (let y = 2; y < 20; y += 4) t.rect(8, y, 4, 2, p.c('glow', 3));
  return t;
}

/** Raised panel nine-slice part (r, c in 0..2). */
function plate(a: StageArt, r: number, c: number, ramp = 'deep', face = 2): Pixels {
  const p = a.pal;
  const t = new Pixels(20, 20);
  const R = p.r(ramp);
  const rnd = rng(r * 3 + c + 11);
  t.map((x, y) => shadeAt(R, face - 1, face, rnd() * 0.5 + (y / 40) * 0.5, x, y));
  if (r === 0) t.rect(0, 0, 20, 2, R[Math.min(R.length - 1, face + 2)]);
  if (r === 2) t.rect(0, 18, 20, 2, R[Math.max(0, face - 2)]).rect(0, 17, 20, 1, R[Math.max(0, face - 1)]);
  if (c === 0) t.rect(0, 0, 2, 20, R[Math.min(R.length - 1, face + 1)]);
  if (c === 2) t.rect(18, 0, 2, 20, R[Math.max(0, face - 2)]);
  if (r !== 1 && c !== 1) t.set(c === 0 ? 4 : 15, r === 0 ? 4 : 15, p.c('trim', 4));
  if (r === 1 && c === 1) for (let x = 3; x < 18; x += 4) t.set(x, 9, R[Math.max(0, face - 2)]);
  return t;
}

export interface TileOpts {
  /** Monster names for what the mounts and hatches give birth to. */
  mite: string;
  turretEvery?: number;
  seekerEvery?: number;
  flakEvery?: number;
  hatchOpen?: number;
  hatchShut?: number;
  hatchEvery?: number;
  fenceOn?: number;
  fenceOff?: number;
}

/** Adds the shared stage blocks to bs (the stage adds its floors, edges and landmarks first). */
export function addStageTiles(bs: BlockSet, a: StageArt, o: TileOpts): void {
  const T = o.turretEvery ?? 12;
  // a turret mount sweeps left - down - right, firing where it points at the end of each step
  bs.add('turL', mount(a, 'L'), { next: 'turD', ntime: T, birth: 'pelletL', birthTime: T });
  bs.add('turD', mount(a, 'D'), { next: 'turR', ntime: T, birth: 'pellet', birthTime: T });
  bs.add('turR', mount(a, 'R'), { next: 'turL', ntime: T, birth: 'pelletR', birthTime: T });
  // fixed mounts
  bs.add('turDown', mount(a, 'D'), { birth: 'pelletFast', birthTime: o.turretEvery ? o.turretEvery * 2 : 24 });
  bs.add('turS', mount(a, 'S'), { birth: 'seeker', birthTime: o.seekerEvery ?? 40 });
  bs.add('turF', mount(a, 'F'), { birth: 'flak', birthTime: o.flakEvery ?? 30 });
  // a virus hatch: shut, then open and spitting mites
  bs.add('hatch', hatch(a, false), { next: 'hatchO', ntime: o.hatchShut ?? 40 });
  bs.add('hatchO', hatch(a, true), { next: 'hatch', ntime: o.hatchOpen ?? 30, birth: o.mite, birthTime: o.hatchEvery ?? 10 });
  // firewall fences: two sets blinking out of step
  const on = o.fenceOn ?? 24;
  const off = o.fenceOff ?? 24;
  bs.add('postL', post(a, 'L'));
  bs.add('postR', post(a, 'R'));
  // flying into a live beam burns a hole in it (and some of the ship's energy)
  bs.add('beamGap', gap(a));
  bs.add('beamA', beam(a, true, 0), { next: 'beamA1', ntime: on, chHitPt: HURT.hazard, touch: 'beamGap' });
  bs.add('beamA1', beam(a, false, 0), { next: 'beamA', ntime: off });
  bs.add('beamB', beam(a, false, 2), { next: 'beamB1', ntime: off });
  bs.add('beamB1', beam(a, true, 2), { next: 'beamB', ntime: on, chHitPt: HURT.hazard, touch: 'beamGap' });
  bs.add('beamOn', beam(a, true, 1), { chHitPt: HURT.hazard, touch: 'beamGap' });
  // pickups
  bs.add('pad', pad(a));
  const pk = (kind: PickupKind, props: object) => {
    bs.add(`${kind}`, pickup(a, kind, 0), { next: `${kind}1`, ntime: 5, touch: 'pad', ...props });
    bs.add(`${kind}1`, pickup(a, kind, 1), { next: kind, ntime: 5, touch: 'pad', ...props });
  };
  pk('nova', { effect: SEQ.nova, eamt: 2 });
  pk('repair', { chHitPt: 10 });
  pk('life', { effect: 1, eamt: 1 });
  pk('bit', { scorePts: 50 });
  // data-stream currents push the ship sideways (gravity blocks; the floor around them has none)
  bs.add('curL', current(a, 'L', 0), { next: 'curL1', ntime: 2, grav: 8 });
  bs.add('curL1', current(a, 'L', 1), { next: 'curL', ntime: 2, grav: 8 });
  bs.add('curR', current(a, 'R', 0), { next: 'curR1', ntime: 2, grav: 2 });
  bs.add('curR1', current(a, 'R', 1), { next: 'curR', ntime: 2, grav: 2 });
  // the gate out and the launch pad
  for (let k = 0; k < 4; k++) bs.add(`gate${k}`, gate(a, k), { next: `gate${(k + 1) % 4}`, ntime: 2 });
  bs.add('launch', launch(a));
  // raised panels
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) bs.add(`pl${r}${c}`, plate(a, r, c));
  // solid wall (arenas only)
  bs.add('wall', plate(a, 1, 1, 'deep', 1), { solid: SOLTOP | SOLRIG | SOLBOT | SOLLEF });
}

export const PICKUPS = ['nova', 'repair', 'life', 'bit'] as const;

/** A big picture sliced into blocks named `${prefix}${row}${col}`. */
export function slices(bs: BlockSet, prefix: string, big: Pixels, props: object = {}): void {
  for (let r = 0; r < big.h / 20; r++) for (let c = 0; c < big.w / 20; c++) bs.add(`${prefix}${r}${c}`, big.crop(c * 20, r * 20, 20, 20), props);
}

/** A canvas w x h blocks covered in plain floor. */
export function onFloor(a: StageArt, w: number, h: number, v = 0): Pixels {
  const big = new Pixels(w * 20, h * 20);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) big.blit(a.floor(v), c * 20, r * 20);
  return big;
}
