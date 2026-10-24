// The walkthrough's detour for a board's gold screw: a player sees the screw on the board and
// rolls over for it on the way. Tries a there-and-back trip from every point of the board's
// solution (the shortest path over plain board, crossing as few wires as it can, and around a
// cell that zapped an earlier try) and keeps the
// one that costs the least time and still reaches the outlet alive. The solution itself (and
// the hint book that prints it) stays as it is; only the walkthrough takes the detour.
import type { CharInfo } from '../../../web/src/engine/world';
import type { Board } from '../src/levels/board';
import type { BlockSet } from '../src/blocks/sets';
import type { Character } from '../../../web/src/formats/character';
import { playSolution, type Played } from './verify';

const STEP: Record<string, [number, number]> = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const BACK: Record<string, string> = { U: 'D', D: 'U', L: 'R', R: 'L' };
/** Shortest moves from `from` to `to` over open board ('.', '$', '@') around `live`; a wire cell costs ten. */
function path(rows: string[], from: [number, number], to: [number, number], wires: Set<string>, live: Set<string>): string | undefined {
  const key = (x: number, y: number) => `${x},${y}`;
  const best = new Map<string, { cost: number; prev: string; move: string }>([[key(...from), { cost: 0, prev: '', move: '' }]]);
  const open: [number, number, number][] = [[0, ...from]];
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [cost, x, y] = open.shift()!;
    const here = key(x, y);
    if (cost > best.get(here)!.cost) continue;
    if (x === to[0] && y === to[1]) {
      let out = '';
      for (let k = here; best.get(k)!.prev; k = best.get(k)!.prev) out = best.get(k)!.move + out;
      return out;
    }
    for (const m of 'UDLR') {
      const [dx, dy] = STEP[m];
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (live.has(k) || !'.$@'.includes(rows[ny]?.[nx] ?? '#')) continue;
      const c = cost + (wires.has(k) ? 10 : 1);
      if (best.has(k) && best.get(k)!.cost <= c) continue;
      best.set(k, { cost: c, prev: here, move: m });
      open.push([c, nx, ny]);
    }
  }
  return undefined;
}

export interface ScrewRun {
  moves: string;
  played: Played;
  /** Ticks the detour added (0 when the board has no screw or no detour works). */
  extra: number;
}

/** The board's solution with the cheapest detour that picks up its gold screw. */
export async function withScrew(b: Board, tiles: BlockSet, mb: BlockSet, cb: BlockSet, chr: Character, ci: CharInfo): Promise<ScrewRun> {
  const play = async (moves: string) => {
    const c = structuredClone(ci);
    return { ...(await playSolution(b, tiles, mb, cb, chr, moves, c)), score: c.score };
  };
  const solution = b.spec.solution.replace(/\s+/g, '');
  const base = await play(solution);
  const sy = b.spec.rows.findIndex((r) => r.includes('$'));
  if (sy < 0) return { moves: solution, played: base, extra: 0 };
  const screw: [number, number] = [b.spec.rows[sy].indexOf('$'), sy];
  const wires = new Set([...b.wireCells.values()].flat().map(([x, y]) => `${x},${y}`));
  let best: ScrewRun = { moves: solution, played: base, extra: 0 };
  let found = false;
  for (let k = 0; k <= solution.length; k++) {
    // never between a careful wait ('$') and the move it waits to make
    if (k > 0 && solution[k - 1] === '$') continue;
    const prefix = solution.slice(0, k);
    const at = prefix ? await play(prefix) : undefined;
    const m = at ? /stopped at (-?\d+),(-?\d+)/.exec(at.why) : undefined;
    if (at && !m) continue;
    const from: [number, number] = m ? [+m[1], +m[2]] : [b.start.x - b.ox, b.start.y - b.oy];
    // a trip that gets zapped tries again around the live cell that zapped it
    const live = new Set<string>();
    for (let tries = 0; tries < 6; tries++) {
      const go = path(b.spec.rows, from, screw, wires, live);
      if (go === undefined) break;
      const back = [...go]
        .reverse()
        .map((c) => BACK[c])
        .join('');
      const moves = prefix + go + back + solution.slice(k);
      // each move takes about six ticks: skip a trip that cannot beat the best one so far
      if (found && go.length * 2 * 6 >= best.extra + 12) break;
      const r = await play(moves);
      if (r.ok && r.score >= base.score + 500 && (!found || r.ticks - base.ticks < best.extra)) {
        best = { moves, played: r, extra: r.ticks - base.ticks };
        found = true;
      }
      const z = /zapped at (-?\d+),(-?\d+)/.exec(r.why);
      if (!z || live.has(`${z[1]},${z[2]}`)) break;
      live.add(`${z[1]},${z[2]}`);
    }
  }
  return best;
}
