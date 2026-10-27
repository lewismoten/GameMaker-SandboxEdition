// A course through the wrap: a level whose way runs on corner to corner through the map's edges,
// lap after lap, without ever coming back to a block it rode before (Virus Blaster's ribbon
// cable: a diagonal track whose every lap comes round the wrap as the next lane down). Found from
// the walkthrough's play: the hero's blocks tick by tick, unwrapped (x and y run on past 0 and
// 99). It is a course when its longest unbroken ride crosses the wrap twice or more one way
// (three laps) and at least once the other, and no block comes round again on another lap:
// Virus Blaster's corner-to-corner legs go three laps across and two or three down, Snowbound's
// sled run three down the map and two across. A lap racer or a planet comes back to its own
// blocks; a ship that only cuts across one corner of a wrapping starfield crosses each edge once.
// No DOM.
import { MLEN, MWID } from '../../formats/map';

/** The course as the hero rode it: unwrapped blocks, start to end, straightened to within a block (Douglas-Peucker). */
export type CoursePath = [number, number][];

/** More blocks than this between two ticks is a jump (a restart, a new scene), not a ride. */
const STEP = 4;
/** Laps (different x div 100, or y div 100) the ride must touch the way it goes most... */
const MIN_LAPS = 3;
/** ...and the other way: it crosses that edge too. */
const MIN_ACROSS = 2;
/** How far the straightened path may stray from the ride, in blocks. */
const TOLERANCE = 1;

const mod = (v: number, n: number) => ((v % n) + n) % n;
const near = (d: number, n: number) => mod(d + n / 2, n) - n / 2;

/** The rides in `track` (the hero's map blocks, a tick each), unwrapped: a jump starts a new one. */
function rides(track: readonly (readonly [number, number])[]): CoursePath[] {
  const out: CoursePath[] = [];
  let cur: CoursePath = [];
  let last: readonly [number, number] | undefined;
  for (const p of track) {
    const dx = last ? near(p[0] - last[0], MLEN) : 0;
    const dy = last ? near(p[1] - last[1], MWID) : 0;
    if (!last || Math.abs(dx) > STEP || Math.abs(dy) > STEP) {
      if (cur.length) out.push(cur);
      cur = [[p[0], p[1]]];
    } else {
      const [ux, uy] = cur[cur.length - 1];
      if (dx || dy) cur.push([ux + dx, uy + dy]);
    }
    last = p;
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Does the ride come back to a block on another lap? */
function comesRound(ride: CoursePath): boolean {
  const lap = new Map<number, string>();
  for (const [x, y] of ride) {
    const cell = mod(y, MWID) * MLEN + mod(x, MLEN);
    const k = `${Math.floor(x / MLEN)},${Math.floor(y / MWID)}`;
    const was = lap.get(cell);
    if (was === undefined) lap.set(cell, k);
    else if (was !== k) return true;
  }
  return false;
}

const laps = (ride: CoursePath, axis: 0 | 1) => new Set(ride.map((p) => Math.floor(p[axis] / (axis ? MWID : MLEN)))).size;

/** The ride straightened: only the corners that keep it within TOLERANCE of every block ridden. */
function straighten(ride: CoursePath): CoursePath {
  const keep = new Uint8Array(ride.length);
  keep[0] = keep[ride.length - 1] = 1;
  const todo: [number, number][] = [[0, ride.length - 1]];
  while (todo.length) {
    const [a, b] = todo.pop()!;
    const [ax, ay] = ride[a];
    const [bx, by] = ride[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let far = -1;
    let most = TOLERANCE;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = ride[i];
      const d = len === 1 && bx === ax && by === ay ? Math.hypot(px - ax, py - ay) : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (d > most) ((most = d), (far = i));
    }
    if (far >= 0) ((keep[far] = 1), todo.push([a, far], [far, b]));
  }
  return ride.filter((_, i) => keep[i]);
}

/** The course in `track` (the hero's blocks on one map, a tick each, as the engine has them), or undefined when the map isn't one. */
export function findCourse(track: readonly (readonly [number, number])[]): CoursePath | undefined {
  const ride = rides(track).reduce<CoursePath | undefined>((a, b) => (!a || b.length > a.length ? b : a), undefined);
  if (!ride) return undefined;
  const [lx, ly] = [laps(ride, 0), laps(ride, 1)];
  if (Math.max(lx, ly) < MIN_LAPS || Math.min(lx, ly) < MIN_ACROSS || comesRound(ride)) return undefined;
  return straighten(ride);
}
