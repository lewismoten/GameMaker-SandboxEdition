// The wind model that worked out level 2's leaf paths when the game was built (never in the game itself: the game has
// no random and no physics, only monsters that walk a path of up to ten corners). Each leaf is simulated one game tick
// at a time, in pixels:
//
//   gravity   pulls it down, but a leaf gliding sideways gets lift and falls slower; at the end of a swing, with no
//             speed across, it even climbs a little (the swoop and rise of a real falling leaf)
//   drag      pulls its speed toward the speed of the air around it, quickly, because a leaf is light
//   sway      the air it swings through: a side-to-side push that comes and goes every couple of seconds
//   wind      a breeze to the right that rises and falls by itself (smooth noise: the same seed always gives the same
//             wind), and a gust lifts as well as pushes
//
// The flight is then cut to corners: the points where it turns most, rounded to whole blocks (a path corner is a
// whole number of blocks from the last), each segment given the speed in pixels a tick that keeps its timing.
import { MAXMARCH, type March } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';

const B = 20; // pixels in a block

/** One leaf's character and the air it falls through. Speeds are in pixels a tick (18.2 ticks a second). */
export interface Flight {
  /** Fastest fall, gravity against drag. */
  fall: number;
  /** How fast its speed follows the air (a part of the difference each tick). */
  drag: number;
  /** The sway: side speed and the ticks a whole swing (there and back) takes, and where in it the leaf starts. */
  sway: number;
  swing: number;
  phase: number;
  /** The breeze: its calm speed, how much a gust adds, and how many ticks a gust lasts. */
  breeze: number;
  gust: number;
  gustTicks: number;
  /** Which stretch of the wind the leaf meets (a seed for the noise). */
  seed: number;
}

/** Smooth noise between 0 and 1: values at whole numbers from a hash, eased between. Same input, same output. */
export function noise(t: number): number {
  const hash = (i: number) => {
    let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const i = Math.floor(t);
  const f = t - i;
  const e = f * f * (3 - 2 * f);
  return hash(i) * (1 - e) + hash(i + 1) * e;
}

/** The wind's speed to the right at tick `t` for a leaf meeting it at `seed`: calm breeze plus a gust that comes and goes. */
export function windAt(f: Flight, t: number): number {
  const n = 0.65 * noise(t / f.gustTicks + f.seed * 7.3) + 0.35 * noise((2.1 * t) / f.gustTicks + f.seed * 3.1 + 17);
  return f.breeze + f.gust * Math.max(0, (n - 0.35) / 0.65);
}

/** A point of a simulated flight: pixels from where the leaf let go, and the tick. */
export interface Point {
  x: number;
  y: number;
  t: number;
}

/** Simulates a leaf from its branch until it has fallen `drop` pixels; returns every tick's place (the last exactly at `drop`). */
export function simulate(f: Flight, drop: number, maxTicks = 2000): Point[] {
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  const out: Point[] = [{ x, y, t: 0 }];
  // the side speed the sway really reaches through the drag (a light leaf follows the air closely, a heavy one lags)
  const w0 = (2 * Math.PI) / f.swing;
  const reach = Math.max(0.001, (f.sway * f.drag) / Math.hypot(f.drag, w0));
  for (let t = 1; t <= maxTicks; t++) {
    const w = windAt(f, t);
    const lift = (windAt(f, t) - f.breeze) / Math.max(f.gust, 0.001); // 0 calm .. 1 in a full gust
    const swayNow = f.sway * Math.sin((2 * Math.PI * t) / f.swing + f.phase);
    vx += f.drag * (w + swayNow - vx);
    // how fast it glides through the air, as a part of its sway: gliding, it falls slowly; at the turn, it climbs
    const across = Math.min(1, Math.abs(vx - w) / reach);
    const pull = f.fall * (-0.3 + 1.7 * across * across) - 0.35 * lift * f.fall;
    vy += f.drag * (pull - vy);
    const nx = x + vx;
    const ny = y + vy;
    if (ny >= drop) {
      const k = (drop - y) / (ny - y);
      out.push({ x: x + vx * k, y: drop, t: t - 1 + k });
      return out;
    }
    x = nx;
    y = ny;
    out.push({ x, y, t });
  }
  throw new Error(`a leaf never landed (${drop} px in ${maxTicks} ticks)`);
}

/** Douglas-Peucker: the indexes of the points that keep the line within `tol` pixels of every point. */
function simplify(p: Point[], tol: number): number[] {
  const keep = new Set([0, p.length - 1]);
  const walk = (a: number, b: number) => {
    let worst = -1;
    let far = 0;
    const dx = p[b].x - p[a].x;
    const dy = p[b].y - p[a].y;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (p[i].x - p[a].x) - dx * (p[i].y - p[a].y)) / len;
      if (d > far) {
        far = d;
        worst = i;
      }
    }
    if (worst >= 0 && far > tol) {
      keep.add(worst);
      walk(a, worst);
      walk(worst, b);
    }
  };
  walk(0, p.length - 1);
  return [...keep].sort((a, b) => a - b);
}

/** A path corner as the monster file keeps it: blocks from where the monster began (not from the last corner), a speed and a facing. */
export interface Corner {
  x: number;
  y: number;
  speed: number;
}

/**
 * Cuts a flight to at most ten corners in whole blocks, ending exactly `rows` blocks below where it began. Each segment
 * gets the speed (1 to 4 pixels a tick) closest to the time the leaf took over it.
 */
export function cornersOf(points: Point[], rows: number): Corner[] {
  for (let tol = 6; tol < 200; tol += 2) {
    const out: (Corner & { t: number })[] = [];
    for (const i of simplify(points, tol).slice(1)) {
      const p = points[i];
      const x = Math.round(p.x / B) || 0;
      const y = i === points.length - 1 ? rows : Math.min(rows - 1, Math.round(p.y / B));
      const prev = out[out.length - 1] ?? { x: 0, y: 0 };
      if (x === prev.x && y === prev.y) continue;
      // a corner on the straight line from the one before it to this one goes
      const before = out[out.length - 2] ?? { x: 0, y: 0 };
      const straight = (x - prev.x) * (prev.y - before.y) === (y - prev.y) * (prev.x - before.x);
      const onward = Math.sign(x - prev.x) === Math.sign(prev.x - before.x) && Math.sign(y - prev.y) === Math.sign(prev.y - before.y);
      if (out.length && straight && onward) out.pop();
      out.push({ x, y, speed: 0, t: p.t });
    }
    if (out.length > MAXMARCH) continue;
    // speeds from the timing of each segment
    let from = { x: 0, y: 0, t: 0 };
    for (const c of out) {
      const px = Math.max(Math.abs(c.x - from.x), Math.abs(c.y - from.y)) * B;
      c.speed = Math.min(4, Math.max(1, Math.round(px / Math.max(1, c.t - from.t))));
      from = c;
    }
    return out.map(({ x, y, speed }) => ({ x, y, speed }));
  }
  throw new Error('a flight would not fit in ten corners');
}

/** The corners as a monster's march, facing the way each segment goes across (flipped going left; a segment straight
 * down keeps the facing it had), so the leaf tips the way it swings. */
export function marchOf(corners: Corner[]): March[] {
  let x = 0;
  let orient = 0;
  return corners.map((c) => {
    if (c.x < x) orient = 4;
    else if (c.x > x) orient = 0;
    x = c.x;
    return { x: c.x, y: c.y, pic: c.speed, orient };
  });
}

/** Where a monster walking these corners is at every tick, in pixels from where it began (Bresenham, as the engine walks). */
export function walk(corners: Corner[]): Point[] {
  const out: Point[] = [{ x: 0, y: 0, t: 0 }];
  let x = 0;
  let y = 0;
  let t = 0;
  for (const c of corners) {
    const tx = c.x * B;
    const ty = c.y * B;
    const ax = Math.abs(tx - x);
    const ay = Math.abs(ty - y);
    const major = Math.max(ax, ay);
    const sx = Math.sign(tx - x);
    const sy = Math.sign(ty - y);
    const x0 = x;
    const y0 = y;
    for (let step = 1; step <= major; step++) {
      x = x0 + Math.round((sx * ax * step) / major);
      y = y0 + Math.round((sy * ay * step) / major);
      if (step % c.speed === 0 || step === major) out.push({ x, y, t: ++t });
    }
  }
  return out;
}
