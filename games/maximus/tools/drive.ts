// The bot's hands: flying the pod across a space chart, swimming the diving bell, walking and
// jet-hopping the courier through a planet's caves. seek() works on a Driver (tools/live.ts:
// the real engine, a tick at a time): it steers by a breadth-first distance field toward its
// goal, choosing its keys by playing candidate plans ahead on a copy of the live world
// (tools/model.ts). It never touches the world itself: only keys.
import { SCAN } from '../src/ids';
import type { Driver } from './live';

export interface P {
  x: number;
  y: number;
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;
export const idx = (x: number, y: number) => ((y + 100) % 100) * 100 + ((x + 100) % 100);
export const wrap = (d: number) => (d > 50 ? d - 100 : d < -50 ? d + 100 : d);

/** Distances to `goal` over cells `open` says a body can be in (wrapping, as the maps do). */
export function field(goal: P | P[], open: (x: number, y: number) => boolean): Int32Array {
  const dist = new Int32Array(10000).fill(-1);
  const q: number[] = [];
  for (const g of Array.isArray(goal) ? goal : [goal]) {
    dist[idx(g.x, g.y)] = 0;
    q.push(idx(g.x, g.y));
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    const x = i % 100;
    const y = Math.floor(i / 100);
    for (const [dx, dy] of DIRS) {
      const j = idx(x + dx, y + dy);
      if (dist[j] >= 0 || !open(x + dx, y + dy)) continue;
      dist[j] = dist[i] + 1;
      q.push(j);
    }
  }
  return dist;
}

export interface SeekOpts {
  maxTicks?: number;
  /** Blocks the route may pass through (doors, fields). */
  passable?: (b: number) => boolean;
  /** Map cells of links that must not be touched (another planet, the way home). */
  avoid?: (x: number, y: number) => boolean;
  /** Done when this says so (checked every tick on the live world). */
  done?: () => boolean;
  /** Body height in cells (the courier is two). */
  tall?: number;
  /** The plans to try: 'walk' (courier: left/right, jet taps, fire) or 'fly' (pod/sub: one thrust key). */
  mode?: 'walk' | 'fly';
  /** The courier's weapon keys for the plans that shoot (default: the blaster, and the Plasma Lance while it has ammunition to spare). */
  fireKeys?: number[];
  /** Plasma bolts to keep (for the Guardian). */
  plasmaReserve?: number;
  /** false: the body moves only while a key is held (the diving bell), so plans can be shorter. */
  momentum?: boolean;
  log?: (m: string) => void;
}

type Plan = { held: number[][]; name: string };

const JETS: Record<string, (t: number) => boolean> = {
  '': () => false,
  '3': (t) => t % 3 === 0,
  '^': (t) => t === 0,
  '^^': (t) => t === 0 || t === 4,
};

/** The courier's plans: a way to walk, a jet rhythm, maybe a shot; long plans change direction halfway. */
function walkPlans(H: number, long = false, fireKeys: number[] = [SCAN.space]): Plan[] {
  const plans: Plan[] = [];
  const hs = [0, SCAN.right, SCAN.left];
  const name = (h: number) => (h === SCAN.right ? 'R' : h === SCAN.left ? 'L' : '-');
  for (const h1 of hs)
    for (const h2 of long ? hs : [h1])
      for (const [jn, jet] of Object.entries(JETS))
        for (const fire of long ? [0] : [0, ...fireKeys]) {
          const held: number[][] = [];
          for (let t = 0; t < H; t++) {
            const k: number[] = [];
            const h = t < (long ? 12 : H) ? h1 : h2;
            if (h) k.push(h);
            if (jet(long && t >= 12 ? t - 12 : t)) k.push(SCAN.up);
            if (fire && t === 0) k.push(fire);
            held.push(k);
          }
          plans.push({ held, name: `${name(h1)}${long ? name(h2) : ''}${jn}${fire === SCAN.space ? 'F' : fire ? 'Z' : ''}` });
        }
  return plans;
}

/** Plans made of random four-tick moves (a way to walk or a thrust, a jet tap), for getting unstuck. */
function randomPlans(n: number, H: number, walk: boolean, rand: () => number): Plan[] {
  const plans: Plan[] = [];
  const moves = walk ? [0, SCAN.right, SCAN.left] : [0, SCAN.right, SCAN.left, SCAN.up, SCAN.down];
  for (let p = 0; p < n; p++) {
    const held: number[][] = [];
    let h = 0;
    let jet = false;
    for (let t = 0; t < H; t++) {
      if (t % 4 === 0) {
        h = moves[Math.floor(rand() * moves.length)];
        jet = walk && rand() < 0.5;
      }
      const k: number[] = h ? [h] : [];
      if (jet && t % 4 === 0) k.push(SCAN.up);
      held.push(k);
    }
    plans.push({ held, name: `rnd${p}` });
  }
  return plans;
}

function flyPlans(H: number): Plan[] {
  const plans: Plan[] = [];
  const dirs = [0, SCAN.right, SCAN.left, SCAN.up, SCAN.down];
  for (const a of dirs)
    for (const b of dirs) {
      const held: number[][] = [];
      for (let t = 0; t < H; t++) {
        const k = t < H / 2 ? a : b;
        held.push(k ? [k] : []);
      }
      plans.push({ held, name: `${a}/${b}` });
    }
  // and a shot first, then one way
  for (const a of dirs) plans.push({ held: Array.from({ length: H }, (_, t) => (t === 0 ? [SCAN.space] : a ? [a] : [])), name: `F/${a}` });
  return plans;
}

/**
 * Model-predictive steering: every few ticks, copy the live world (model.ts), play each
 * candidate plan on the copy for a short horizon, and press the keys of the plan that ends
 * nearest the goal (by the route's distance field) for the least damage, never dying or
 * touching a link it should not.
 */
export async function seek(d: Driver, goal: P | P[], opts: SeekOpts = {}): Promise<{ arrived: boolean; ticks: number; best: number }> {
  const { forecast, step } = await import('./model');
  const goals = Array.isArray(goal) ? goal : [goal];
  const tall = opts.tall ?? 2;
  const mode = opts.mode ?? 'walk';
  const passable = opts.passable ?? (() => false);
  const avoid = opts.avoid ?? (() => false);
  const bbl = d.scene.bbl;
  const map = d.w.map;
  /** A hazard that blinks (a laser, a field on the clock) is safe part of the time: the plans time it. */
  const blinks = (n: number) => {
    for (let k = 0, m = bbl[n].nextBl; k < 8 && m !== n && bbl[m]; k++, m = bbl[m].nextBl) if (bbl[m].chHitPt >= 0 && !(bbl[m].solid & 14)) return true;
    return false;
  };
  const openCell = (x: number, y: number) => {
    const n = map[idx(x, y)];
    if (passable(n)) return true;
    const b = bbl[n];
    if (b.chHitPt < 0) return blinks(n) && !avoid(x, y);
    if (avoid(x, y)) return false;
    return (b.solid & 14) === 0 || b.solid === 1;
  };
  // cells where the bot got stuck (engine quirks a distance field can't see): routed around
  const traps = new Set<number>();
  const fits = (x: number, y: number) => {
    if (traps.has(idx(x, y))) return false;
    for (let k = 0; k < tall; k++) if (!openCell(x, y - k)) return false;
    return true;
  };
  let dist = field(goals, fits);
  /** Beside a door or field (waiting for it is not being stuck). */
  const nearGate = (w: { chr: { x: number[]; y: number[] } }) => {
    const c = w.chr;
    for (let dy = -2; dy <= 1; dy++) for (let dx = -1; dx <= 2; dx++) if (passable(map[idx(c.x[0] + dx, c.y[0] + dy)])) return true;
    return false;
  };
  const H = mode === 'walk' ? 14 : tall === 1 && opts.momentum === false ? 12 : 24;
  const E = 4;
  const lance = d.w.ci.seqon[10] && d.w.ci.meter[10] > (opts.plasmaReserve ?? 12);
  const plans = mode === 'walk' ? walkPlans(H, false, opts.fireKeys ?? (lance ? [SCAN.space, SCAN.z] : [SCAN.space])) : flyPlans(H);
  const longPlans = mode === 'walk' ? walkPlans(30, true) : flyPlans(40);
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const cellOf = (w: { chr: { x: number[]; y: number[] } }) => {
    const c = w.chr;
    return { x: (c.x[0] + (c.x[1] > 10 ? 1 : 0)) % 100, y: (c.y[0] + (c.y[1] > 10 ? 1 : 0)) % 100 };
  };
  const distOf = (w: { chr: { x: number[]; y: number[] } }) => {
    const c = cellOf(w);
    const v = dist[idx(c.x, c.y)];
    return v < 0 ? 400 : v;
  };
  /** Route distance in pixels from the body's exact position: via the best neighboring cell. */
  const smooth = (w: { chr: { x: number[]; y: number[] } }) => {
    const c = w.chr;
    const px = c.x[0] * 20 + c.x[1] + 10;
    const py = c.y[0] * 20 + c.y[1] + 10;
    const cx = Math.floor(px / 20);
    const cy = Math.floor(py / 20);
    let best = Infinity;
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const v = dist[idx(cx + dx, cy + dy)];
      if (v < 0) continue;
      const e = Math.hypot((cx + dx) * 20 + 10 - px, (cy + dy) * 20 + 10 - py);
      best = Math.min(best, v * 20 + e);
    }
    return best === Infinity ? 8000 : best;
  };
  const isGoal = (w: { chr: { x: number[]; y: number[] } }) => {
    const c = w.chr;
    const xs = [c.x[0], c.x[1] > 0 ? c.x[0] + 1 : c.x[0]];
    const ys = [c.y[0], c.y[1] > 0 ? c.y[0] + 1 : c.y[0]];
    if (tall > 1) ys.push(c.y[0] - 1);
    return goals.some((g) => xs.some((x) => x % 100 === g.x) && ys.some((y) => (y + 100) % 100 === g.y));
  };
  const held = new Set<number>();
  const apply = (want: number[]) => {
    const evs: number[] = [];
    for (const k of [...held]) if (!want.includes(k)) {
      held.delete(k);
      d.release(k);
      evs.push(k | 0x80);
    }
    for (const k of want) if (!held.has(k)) {
      held.add(k);
      d.press(k);
      evs.push(k);
    }
    return evs;
  };
  {
    // no route at all from here: say so at once rather than wander
    const c = d.w.chr;
    let any = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dist[idx(c.x[0] + dx, c.y[0] + dy)] >= 0) any = true;
    if (!any) {
      opts.log?.(`    seek: no route from ${c.x[0]},${c.y[0]} to ${goals.map((g) => `${g.x},${g.y}`).join(' ')}`);
      return { arrived: false, ticks: 0, best: 400 };
    }
  }
  let best = 1e9;
  let t = 0;
  let arrived = false;
  let replanAt = 0;
  const maxTicks = opts.maxTicks ?? 6000;
  let chosen: Plan | undefined;
  let ci = 0;
  let bestSmooth = Infinity;
  let lastGain = 0;
  let stuck = 0;
  let expect = '';
  for (; t < maxTicks; t++) {
    if (d.link >= 0 || d.dead) break;
    if (opts.done?.() || isGoal(d.w)) {
      arrived = true;
      break;
    }
    const now = smooth(d.w);
    if (now < bestSmooth - 4) {
      bestSmooth = now;
      lastGain = t;
      stuck = 0;
    } else if (t - lastGain > 40 && stuck === 0) {
      // no headway: look further ahead, with plans that change their mind halfway
      stuck = 1;
      replanAt = t;
    } else if (t - lastGain > 100 && stuck === 1) {
      // still none: try wandering plans
      stuck = 2;
      replanAt = t;
    } else if (t - lastGain > 220 && !nearGate(d.w)) {
      // and still none: the next step of the route must be a trap (an engine quirk a distance
      // field can't see), so route around it, unless that leaves no route at all
      const c = cellOf(d.w);
      let nx = -1;
      let ny = -1;
      let bd = dist[idx(c.x, c.y)];
      for (const [dx, dy] of DIRS) {
        const v = dist[idx(c.x + dx, c.y + dy)];
        if (v >= 0 && (bd < 0 || v < bd)) {
          bd = v;
          nx = c.x + dx;
          ny = c.y + dy;
        }
      }
      if (nx >= 0) {
        traps.add(idx(nx, ny));
        const next = field(goals, fits);
        if (next[idx(c.x, c.y)] >= 0 || [...DIRS].some(([dx, dy]) => next[idx(c.x + dx, c.y + dy)] >= 0)) {
          dist = next;
          opts.log?.(`    seek: stuck at ${c.x},${c.y}, routing around ${nx},${ny}`);
        } else traps.delete(idx(nx, ny));
      }
      bestSmooth = smooth(d.w);
      lastGain = t;
      stuck = 0;
    }
    best = Math.min(best, distOf(d.w));
    if (opts.log && t % 100 === 0) opts.log(`    seek t${t} at ${d.w.chr.x[0]},${d.w.chr.y[0]} dist ${distOf(d.w)} hp ${d.w.ci.hitpts} plan ${chosen?.name}`);
    if (expect && t >= replanAt) {
      const got = `${d.w.chr.x[0]}+${d.w.chr.x[1]},${d.w.chr.y[0]}+${d.w.chr.y[1]} hp ${d.w.ci.hitpts}`;
      if (got !== expect) opts.log?.(`    forecast miss at t${t}: expected ${expect}, got ${got}`);
      expect = '';
    }
    if (t >= replanAt || !chosen) {
      // try every plan from the keys held now
      let bestCost = Infinity;
      const tryPlans = stuck === 2 ? randomPlans(40, 40, mode === 'walk', rand) : stuck === 1 ? longPlans : plans;
      const HH = tryPlans[0].held.length;
      for (const p of tryPlans) {
        const f = forecast(d.w, true, avoid);
        const h0 = new Set(held);
        const hp0 = f.w.ci.hitpts;
        let cost = 0;
        let reached = -1;
        for (let s = 0; s < HH; s++) {
          const want = p.held[s];
          const evs: number[] = [];
          for (const k of [...h0]) if (!want.includes(k)) {
            h0.delete(k);
            evs.push(k | 0x80);
          }
          for (const k of want) if (!h0.has(k)) {
            h0.add(k);
            evs.push(k);
          }
          await step(f, evs);
          if (f.dead || f.link) break;
          if (isGoal(f.w)) {
            reached = s;
            break;
          }
        }
        if (f.dead) cost += 1e6;
        if (f.link) cost += 1e5;
        const lost = Math.max(0, hp0 - f.w.ci.hitpts);
        cost += lost * (hp0 < 50 ? 16 : 8);
        if (reached >= 0) cost += reached - 1000;
        else cost += smooth(f.w);
        if (process.env.MAXIMUS_PLAN_LOG && t >= Number(process.env.MAXIMUS_PLAN_LOG) && t < Number(process.env.MAXIMUS_PLAN_LOG) + 60) opts.log?.(`      t${t} ${p.name} cost ${cost.toFixed(0)} lost ${lost} dist ${reached >= 0 ? 'goal' : smooth(f.w).toFixed(0)}`);
        if (cost < bestCost) {
          bestCost = cost;
          chosen = p;
        }
      }
      ci = 0;
      replanAt = t + (stuck === 2 ? 10 : E);
      if (process.env.MAXIMUS_CHECK_FORECAST) {
        // forecast the ticks about to be played, to compare with what the engine does
        const f = forecast(d.w, true, avoid);
        const h0 = new Set(held);
        for (let s2 = 0; s2 < replanAt - t; s2++) {
          const want = chosen!.held[s2] ?? [];
          const evs: number[] = [];
          for (const k of [...h0]) if (!want.includes(k)) (h0.delete(k), evs.push(k | 0x80));
          for (const k of want) if (!h0.has(k)) (h0.add(k), evs.push(k));
          await step(f, evs);
        }
        expect = `${f.w.chr.x[0]}+${f.w.chr.x[1]},${f.w.chr.y[0]}+${f.w.chr.y[1]} hp ${f.w.ci.hitpts}`;
      }
    }
    apply(chosen!.held[ci++] ?? []);
    await d.tick();
  }
  apply([]);
  return { arrived, ticks: t, best };
}
