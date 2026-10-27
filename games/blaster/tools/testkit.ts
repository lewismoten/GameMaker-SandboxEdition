// A leg in the headless simulator, and where the bot should head in a boss arena.
import { DIAG_DRIFT, DRIFT } from '../src/ids';
import { buildPalette } from '../src/art/pal';
import { buildBusShip, buildDiagShip, buildDownShip, buildLeftShip, buildShip, buildSideShip, shipBlocks } from '../src/characters/ship';
import { scrollOf } from '../src/game';
import { Sim } from './sim';
import type { CharInfo } from '../../../web/src/engine/world';
import { MLEN } from '../../../web/src/formats/map';
import { ROWS, TOP } from '../src/stages/sideLeg';
import { buildLeg, startOf, type Leg } from '../src/stages/stage';

export function simOf(l: Leg, seed = 1, ci?: CharInfo): Sim {
  const cb = shipBlocks(buildPalette('board'));
  const b = buildLeg(l);
  return new Sim(
    {
      map: b.map,
      bbl: b.bbl,
      mbl: b.mbl,
      mon: b.mon,
      chr:
        l.kind === 'diag'
          ? buildDiagShip(cb, DIAG_DRIFT)
          : l.kind === 'side'
            ? buildSideShip(cb, DRIFT)
            : l.kind === 'left'
              ? buildLeftShip(cb, DRIFT)
              : l.kind === 'down'
                ? buildDownShip(cb, DRIFT)
                : l.kind === 'bus'
                  ? buildBusShip(cb)
                  : buildShip(cb, l.kind === 'boss' ? 0 : DRIFT),
      cbl: cb.build(undefined, true),
      start: startOf(l),
      links: l.grid.links,
      scroll: scrollOf(l),
      names: l.kit.beasts.names,
    },
    ci,
    seed,
  );
}

/** In an arena: wait under the boss's weak points, then make for the way out once it is open. */
export function arenaGoal(s: Sim): { x: number; y: number } {
  const links = s.scene.links;
  const parts = s.live().filter((m) => /^head|^core|^part/.test(m.name));
  const lx = (links.reduce((n, l) => n + l.x, 0) / links.length) * 20;
  const ly = links[0].y * 20;
  return parts.length ? { x: lx - 10 + Math.sin(s.ticks / 9) * 30, y: ly + 5 * 20 } : { x: lx - 10, y: ly };
}

/** How long the bot may take on a leg: a diagonal leg is several laps of the map. */
export const maxTicksOf = (l: Leg): number => (l.kind === 'boss' ? 2400 : l.kind === 'diag' ? 4000 : 1600);

/**
 * The walkthrough's pilot on a diagonal leg: keep to the middle of the lane at cruising speed
 * (the goal is where the drift alone would take it, so it only speeds up or brakes to dodge),
 * and at the last shortcut cross to the next lane down on purpose, sliding along the lane's
 * lower edge until the way opens; the earlier ones it rides past, so the walkthrough shows a
 * lap and a kink as well as a shortcut. Returns a goal for fly().
 */
export function diagGoal(l: Leg): (s: Sim) => { x: number; y: number } {
  const { track, shortcuts } = l.diag!;
  const { pitch, lanes, kink, board } = track;
  const mid = board + (pitch - board) / 2;
  return (s) => {
    const lap = 100 * 20;
    const cx = (s.pos.x + 10) % lap;
    const cy = (s.pos.y + 10) % lap;
    const flat = Math.floor(cx / 20) >= kink;
    const T = (((flat ? cy / 20 + kink : (cx + cy) / 20) % (lanes * pitch)) + lanes * pitch) % (lanes * pitch);
    const lane = Math.floor(T / pitch);
    let across = mid - (T - lane * pitch);
    const bx = Math.floor(cx / 20);
    for (const [k, x0, n] of shortcuts.slice(-1)) if (lane === track.laneOfLap(k) && bx >= x0 - 8 && bx < x0 + n - 6) across += pitch;
    // ahead along the lane, and across it by `across` (t grows right and down)
    const ahead = DIAG_DRIFT * 10;
    return flat ? { x: s.pos.x + ahead, y: s.pos.y + across * 20 } : { x: s.pos.x + ahead + across * 10, y: s.pos.y - ahead + across * 10 };
  };
}

/**
 * The pilot on a side leg: cruise ahead, and keep within the run of rows that stays open over
 * the next few columns nearest the ship (over a card, under a cable). Where the way ahead is
 * clear it has no reason to climb or dive; where it isn't, it heads for the middle of that run.
 * Returns a goal for fly(). `dir` -1 and `top`: a band flown leftward, its top at that row.
 */
export function sideGoal(s: Sim, dir: 1 | -1 = 1, top = TOP): { x: number; y: number } {
  const w = s.w;
  const p = s.pos;
  const col = Math.floor(p.x / 20);
  const solid = (x: number, y: number) => (w.bg[w.blkmap[w.map[y * MLEN + ((x + MLEN) % MLEN)]]].solid ?? 0) !== 0;
  const open = (y: number) => {
    for (let k = 0; k <= 2; k++) if (solid(col + k * dir, y)) return false;
    return true;
  };
  // the runs of open rows, and the one nearest the ship
  let best: [number, number] | undefined;
  let far = Infinity;
  for (let y = top; y < top + ROWS; y++) {
    if (!open(y) || (y > top && open(y - 1))) continue;
    let end = y;
    while (end + 1 < top + ROWS && open(end + 1)) end++;
    const lo = y * 20;
    const hi = end * 20;
    const d = p.y < lo ? lo - p.y : p.y > hi ? p.y - hi : 0;
    if (d < far) {
      far = d;
      best = [lo, hi];
    }
  }
  // clear ahead where it is: no reason to climb or dive; else for the middle of the run
  const clear = best && p.y >= best[0] && p.y <= best[1];
  return { x: p.x + DRIFT * 10 * dir, y: !best || clear ? p.y : (best[0] + best[1]) / 2 };
}

/** The goal fly() steers for on a leg, if any. */
export function goalOf(l: Leg): ((s: Sim) => { x: number; y: number }) | undefined {
  if (l.kind === 'left') {
    const top = startOf(l).y - 5;
    return (s) => sideGoal(s, -1, top);
  }
  return l.kind === 'boss' ? arenaGoal : l.kind === 'side' ? (s) => sideGoal(s) : undefined;
}

/**
 * Two legs can share a map (stages/turned.ts), each in its own lane: a strip's columns or a
 * band's rows, which its screen never leaves. Watches a leg's flight for a monster placed
 * outside its lane that wanders into it (the other leg's virus, read with this leg's .mon).
 * Returns what it saw, as log lines; none is the pass.
 */
export function watchLanes(sim: Sim, l: Leg): () => string[] {
  const at = startOf(l);
  const byCol = l.kind === 'scroll' || l.kind === 'down';
  const byRow = l.kind === 'side' || l.kind === 'left';
  if (!byCol && !byRow) return () => [];
  const lo = byCol ? at.x - 8 : at.y - 5;
  const hi = lo + (byCol ? 15 : 9);
  const inLane = (m: { x: number; y: number }) => {
    const v = byCol ? m.x : m.y;
    return v >= lo && v <= hi;
  };
  const foreign = new Map<number, number>(
    sim
      .live()
      .filter((m) => !inLane(m))
      .map((m) => [m.slot, sim.w.mm[m.slot].monnum]),
  );
  const seen: string[] = [];
  const tick = sim.tick.bind(sim);
  sim.tick = async () => {
    await tick();
    for (const [slot, monnum] of foreign) {
      if (sim.w.mm[slot].monnum !== monnum) {
        foreign.delete(slot);
        continue;
      }
      const m = sim.live().find((x) => x.slot === slot);
      if (m && inLane(m)) {
        seen.push(`t${sim.ticks}: ${m.name} from another lane at ${m.x},${m.y}`);
        foreign.delete(slot);
      }
    }
  };
  return () => seen;
}
