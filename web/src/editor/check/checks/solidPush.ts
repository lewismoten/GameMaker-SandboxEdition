// The level check's solid-monster push checks, read from the files without playing. PLAYGAME's
// ChkMonChr puts a hero a solid monster touches in the cell next to it, on the side he is pushed
// out of, with no look at what is there (SOLBOT: on top of it; SOLTOP: under it; SOLLEF: to its
// right; SOLRIG: to its left), and stops his movement that way; inside a solid block he hangs. So:
// - a solid monster on the map's top or bottom row pushes the hero over the edge of the map;
// - a pacer whose path ends right against a solid block shoves a hero in the gap it left inside;
// - two solid pacers closing in on one spot pop the hero up or down out of the gap;
// - a monster that is both solid and hurts is the touch probe's usual sink and pin (landings.ts),
//   asked about here even when the probe found none.
// Paths are followed as engine/monsters.ts walks them (each corner an offset from the one before,
// Bresenham steps at the leg's speed, a "stops on solid" monster held at walls), from where the
// monster is placed, normal paths only, with the picture (and its solid sides) of every tick.
import { BLEN, MONBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../formats/blocks';
import { LASTMON, MAXMARCH, type Monster } from '../../../formats/monster';
import { MLEN, MWID } from '../../../formats/map';
import { at, type Finding } from '../findings';
import type { SceneData } from '../sceneData';
import { pictures } from './monsterChecks';

/** Ticks a path is followed for (about 55 seconds): enough for most rounds to meet. */
const TRACK = 1000;

interface Placed {
  n: number;
  m: Monster;
  /** Pixel positions, one a tick (unwrapped), from where it is placed. */
  track: { x: number; y: number }[];
  /** The solid sides of the picture it shows on each tick of the track. */
  sides: number[];
}

type Cells = (x: number, y: number) => boolean;

const wrapX = (c: number) => ((c % MLEN) + MLEN) % MLEN;
const wrapY = (c: number) => ((c % MWID) + MWID) % MWID;
const cellOf = (x: number, y: number) => wrapY(y) * MLEN + wrapX(x);

/** The cells a 20 x 20 picture at pixel (x, y) covers. */
function occupied(x: number, y: number): [number, number][] {
  const cx = Math.floor(x / BLEN);
  const cy = Math.floor(y / BLEN);
  const out: [number, number][] = [[cx, cy]];
  if (x % BLEN) out.push([cx + 1, cy]);
  if (y % BLEN) out.push([cx, cy + 1]);
  if (x % BLEN && y % BLEN) out.push([cx + 1, cy + 1]);
  return out;
}

/** Pixel positions a tick of a path monster from cell (x, y) (a "dies after its path" monster: one round). */
function marchTrack(m: Monster, x: number, y: number, stops?: Cells): { x: number; y: number }[] {
  const corners = m.march[0].slice(0, MAXMARCH);
  const legs = corners.findIndex((c) => !c.pic);
  const n = legs < 0 ? MAXMARCH : legs;
  let px = x * BLEN;
  let py = y * BLEN;
  const out = [{ x: px, y: py }];
  for (let round = 0; n && out.length < TRACK && !(round && m.end === -1); round++)
    for (let k = 0; k < n && out.length < TRACK; k++) {
      const dx = (corners[k].x - (k ? corners[k - 1].x : 0)) * BLEN;
      const dy = (corners[k].y - (k ? corners[k - 1].y : 0)) * BLEN;
      const v = Math.abs(corners[k].pic);
      const major = Math.max(Math.abs(dx), Math.abs(dy));
      // Bresenham walks the major axis v pixels a tick; a leg that ends on a whole tick waits one more
      const steps = Math.ceil(major / v) + (major % v === 0 ? 1 : 0);
      // measured from where the leg began, less what walls held back
      let ox = px;
      let oy = py;
      for (let s = 0; s < steps && out.length < TRACK; s++) {
        const done = Math.min(major, (s + 1) * v);
        const nx = major ? ox + Math.trunc((done * dx) / major) : px;
        const ny = major ? oy + Math.trunc((done * dy) / major) : py;
        if (stops && (nx !== px || ny !== py) && occupied(nx, ny).some(([cx, cy]) => stops(cx, cy))) {
          ox += px - nx;
          oy += py - ny;
        } else {
          px = nx;
          py = ny;
        }
        out.push({ x: px, y: py });
      }
    }
  return out;
}

/** The solid sides of the picture shown on each of `ticks` ticks (each picture for its ticks, at least one). */
function sidesByTick(d: SceneData, m: Monster, ticks: number): number[] {
  const round = pictures(m).flatMap((p, i) => new Array<number>(Math.max(1, m.pic[i][1])).fill(d.mbl[p]?.solid ?? 0));
  return Array.from({ length: ticks }, (_, t) => (round.length ? round[Math.max(0, t - 1) % round.length] : 0));
}

/** Map cells with any solid side, and open ones. */
function blocks(d: SceneData): { solid: Cells; open: Cells } {
  const solid = (x: number, y: number) => (d.bbl[d.map.blocks[cellOf(x, y)]]?.solid ?? 0) !== 0;
  return { solid, open: (x, y) => !solid(x, y) };
}

/** The scene's solid monsters (power 100 or more, so a touch doesn't use them up), each with its path followed. */
function solidMonsters(d: SceneData): Placed[] {
  const out: Placed[] = [];
  const { solid } = blocks(d);
  for (const p of d.map.monsters) {
    const m = p.monnum < LASTMON ? d.mon[p.monnum] : undefined;
    if (!m || m.power < 100 || !pictures(m).some((q) => d.mbl[q]?.solid)) continue;
    const track = m.towards === 0 ? marchTrack(m, p.curx, p.cury, m.thru ? solid : undefined) : [{ x: p.curx * BLEN, y: p.cury * BLEN }];
    out.push({ n: p.monnum, m, track, sides: sidesByTick(d, m, track.length) });
  }
  return out;
}

const monsterWhere = (d: SceneData, n: number, cells: number[]) => ({
  scene: d.scene,
  map: d.names.map,
  cell: cells[0],
  cells,
  monster: { file: d.names.mon ?? '', n },
});

/** Ticks of the track at a whole cell with two open cells `dy` and 2 `dy` from it (the hero fits over it, or under it). */
const roomAt = (p: Placed, open: Cells, dy: number) => (t: number) => {
  const { x, y } = p.track[t];
  return x % BLEN === 0 && y % BLEN === 0 && open(x / BLEN, y / BLEN + dy) && open(x / BLEN, y / BLEN + 2 * dy);
};

/**
 * Solid monsters on the map's top or bottom row: one the hero stands on (SOLBOT) that reaches the
 * top row lifts him over the edge, and one that pushes him under it (SOLTOP) on the bottom row
 * pushes him through it; he comes out on the far side of the map. Only where he can get to it.
 */
export function edgeRows(d: SceneData): Finding[] {
  const { open } = blocks(d);
  const out: Finding[] = [];
  const seen = new Set<number>();
  for (const p of solidMonsters(d)) {
    if (seen.has(p.n)) continue;
    const ticks = [...p.track.keys()];
    const edge = (row: number, side: number) => [
      ...new Set(
        ticks.flatMap((t) =>
          (p.sides[t] & side ? occupied(p.track[t].x, p.track[t].y).filter(([, cy]) => wrapY(cy) === row) : []).map(([cx, cy]) => cellOf(cx, cy)),
        ),
      ),
    ];
    const top = ticks.some(roomAt(p, open, -1)) ? edge(0, SOLBOT) : [];
    const cells = top.length ? top : ticks.some(roomAt(p, open, 1)) ? edge(MWID - 1, SOLTOP) : [];
    if (!cells.length) continue;
    seen.add(p.n);
    out.push({
      check: 'push-edge',
      severity: 'warning',
      title: `Solid monster ${p.n} goes along the map’s ${top.length ? 'top' : 'bottom'} row, at ${at(cells[0])}`,
      detail: `A solid monster puts the hero it touches next to it without looking at what is there, and the map wraps at its edges: ${top.length ? 'a hero on its back is lifted over the top edge' : 'a hero under it is pushed through the bottom edge'} and comes out at the far side of the map, often inside a wall, with the view racing round after him. Keep solid monsters a few rows in from the top and bottom of the map.`,
      where: monsterWhere(d, p.n, cells),
    });
  }
  return out;
}

/**
 * A pacer whose path stops right against a solid block, on a side it pushes from: a hero standing
 * in the gap it leaves when it walks away is shoved inside the block when it comes back. Sideways,
 * the gap is the last cell of its path; up, a hero riding it is lifted into the ceiling; down, a
 * hero under it is pushed into the floor.
 */
export function wallGaps(d: SceneData): Finding[] {
  const { solid, open } = blocks(d);
  const gravity = d.bbl.some((b) => b.grav !== 0);
  const found = new Map<number, number[]>();
  for (const p of solidMonsters(d)) {
    const t = p.track;
    if (p.m.towards !== 0 || t.length < 3) continue;
    const room = roomAt(p, open, -1);
    for (let i = 1; i + 1 < t.length; i++) {
      const sx = Math.sign(t[i].x - t[i - 1].x);
      const sy = Math.sign(t[i].y - t[i - 1].y);
      // a stop or a turn: its next step isn't the same way
      if ((!sx || Math.sign(t[i + 1].x - t[i].x) === sx) && (!sy || Math.sign(t[i + 1].y - t[i].y) === sy)) continue;
      const { x, y } = t[i];
      if (x % BLEN || y % BLEN) continue;
      const cx = x / BLEN;
      const cy = y / BLEN;
      // the sides it shows about then (it is still beside the block a tick or two either way)
      const side = p.sides.slice(Math.max(0, i - 2), i + 3).reduce((s, v) => s | v, 0);
      let hit: number | undefined;
      if (sx && !sy && side & (sx > 0 ? SOLLEF : SOLRIG)) {
        // pushed into the cell ahead (his feet or head in it), from its last cell, which he fits in
        const ahead = cx + sx;
        const fits = open(cx, cy) && open(cx, cy - 1) && (!gravity || solid(cx, cy + 1));
        if (fits && (solid(ahead, cy) || solid(ahead, cy - 1))) hit = cellOf(ahead, solid(ahead, cy) ? cy : cy - 1);
      } else if (sy < 0 && !sx && side & SOLBOT) {
        // lifted with his feet on the row over it and his head over that, having got on where its rise began
        let j = i;
        while (j > 0 && t[j - 1].y > t[j].y) j--;
        if (room(j) && (solid(cx, cy - 1) || solid(cx, cy - 2))) hit = cellOf(cx, solid(cx, cy - 1) ? cy - 1 : cy - 2);
      } else if (sy > 0 && !sx && side & SOLTOP) {
        // pushed under it, his feet in the row below it, from where it stops, which he fits in
        if (open(cx, cy) && open(cx, cy - 1) && solid(cx, cy + 1)) hit = cellOf(cx, cy + 1);
      }
      if (hit !== undefined) found.set(p.n, [...new Set([...(found.get(p.n) ?? []), hit])]);
    }
  }
  return [...found].map(([n, cells]) => ({
    check: 'push-gap',
    severity: 'warning',
    title: `Solid monster ${n} stops right against a solid block: a hero beside it is pushed inside, at ${at(cells[0])}`,
    detail:
      'A solid monster puts the hero it touches next to it without looking for walls. Where its path ends against a wall, floor or ceiling, a hero waiting in the gap it left (or riding it) is shoved into the block, where he sticks. End its path a block short, or leave an empty block between its path and the wall.',
    where: monsterWhere(d, n, cells),
  }));
}

/**
 * Two solid pacers whose paths bring them toward each other until the hero no longer fits between
 * (a block across, or two up and down, since he is two blocks tall), both showing a solid side
 * toward him. Squeezed from both sides, he is popped out on the other axis, into whatever is
 * there. Ones that move together, as a platform of several blocks does, never close in.
 */
export function squeezes(d: SceneData): Finding[] {
  const { open } = blocks(d);
  const list = solidMonsters(d).filter((p) => p.m.towards === 0 && p.track.length > 1);
  const out: Finding[] = [];
  const seen = new Set<string>();
  const spans = list.map(({ track }) => {
    const xs = track.map((q) => q.x);
    const ys = track.map((q) => q.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });
  const pad = 3 * BLEN;
  const near = (a: number, b: number) =>
    spans[a].x0 - pad <= spans[b].x1 && spans[b].x0 - pad <= spans[a].x1 && spans[a].y0 - pad <= spans[b].y1 && spans[b].y0 - pad <= spans[a].y1;
  for (let a = 0; a < list.length; a++)
    for (let b = a + 1; b < list.length; b++) {
      const A = list[a];
      const B = list[b];
      const key = `${Math.min(A.n, B.n)}:${Math.max(A.n, B.n)}`;
      if (seen.has(key) || !near(a, b)) continue;
      const ticks = Math.min(A.track.length, B.track.length);
      for (let t = 1; t < ticks; t++) {
        const [p, q, pp, pq] = [A.track[t], B.track[t], A.track[t - 1], B.track[t - 1]];
        let cell: number | undefined;
        // side by side on one row, closing to less than the hero's width apart
        if (Math.abs(p.y - q.y) < BLEN && Math.abs(pp.y - pq.y) < BLEN) {
          const [l, r, lp, rp, L, R] = p.x <= q.x ? [p, q, pp, pq, A, B] : [q, p, pq, pp, B, A];
          const gap = r.x - l.x - BLEN;
          const gx = Math.floor((l.x + BLEN) / BLEN);
          const gy = Math.round(l.y / BLEN);
          if (rp.x - lp.x - BLEN >= BLEN && gap >= 0 && gap < BLEN && L.sides[t] & SOLLEF && R.sides[t] & SOLRIG && open(gx, gy) && open(gx, gy - 1))
            cell = cellOf(gx, gy);
        }
        // one over the other, closing to less than his height apart
        if (cell === undefined && Math.abs(p.x - q.x) < BLEN && Math.abs(pp.x - pq.x) < BLEN) {
          const [u, o, up, op, U, O] = p.y <= q.y ? [p, q, pp, pq, A, B] : [q, p, pq, pp, B, A];
          const gap = o.y - u.y - BLEN;
          const gx = Math.round(u.x / BLEN);
          const gy = Math.floor((u.y + BLEN) / BLEN) + 1;
          if (op.y - up.y - BLEN >= 2 * BLEN && gap >= 0 && gap < 2 * BLEN && U.sides[t] & SOLTOP && O.sides[t] & SOLBOT && open(gx, gy) && open(gx, gy - 1))
            cell = cellOf(gx, gy);
        }
        if (cell === undefined) continue;
        seen.add(key);
        out.push({
          check: 'push-squeeze',
          severity: 'warning',
          title:
            A.n === B.n
              ? `Two copies of solid monster ${A.n} close in on the same spot, at ${at(cell)}`
              : `Solid monsters ${A.n} and ${B.n} close in on the same spot, at ${at(cell)}`,
          detail:
            'A hero caught between two solid monsters can’t be pushed both ways, so PLAYGAME pops him out up or down (or sideways, between one above and one below), without looking for the ceiling or the floor. Keep their paths a block apart, or time them so one has gone before the other comes.',
          where: monsterWhere(d, A.n, [cell]),
        });
        break;
      }
    }
  return out;
}

/**
 * Monsters that are solid and hurt on the same picture: each touch pushes as it hurts, so landing
 * on one can sink the hero into the floor and a push can pin him against a wall. The touch probe
 * (landings.ts) finds the ones that do; this asks about the rest. Monsters under power 100 are
 * used up by the first touch and are left out. Most such monsters never trap anyone, and the probe
 * finds the ones that do, so this is a note (info), with the one-click fix for a solid top.
 */
export function solidHurts(d: SceneData): Finding[] {
  const out: Finding[] = [];
  const used = new Set<number>();
  // placed monsters and what they become
  for (const p of d.map.monsters) for (let k = p.monnum; k < LASTMON && d.mon[k] && !used.has(k); k = d.mon[k].newmon) used.add(k);
  for (const k of [...used].sort((a, b) => a - b)) {
    const m = d.mon[k];
    if (m.power < 100) continue;
    const pics = [...new Set(pictures(m))].filter((p) => p < MONBL && d.mbl[p]?.solid && d.mbl[p].chHitPt < 0);
    if (!pics.length) continue;
    const top = pics.some((p) => d.mbl[p].solid & SOLTOP);
    const cells = d.map.monsters.filter((p) => p.monnum === k).map((p) => p.cury * MLEN + p.curx);
    const one = pics.length === 1;
    out.push({
      check: 'solid-hurt',
      severity: 'info',
      title: `Monster ${k} is solid and hurts`,
      detail: `${one ? 'Its picture' : 'Its pictures'} ${pics.join(', ')} ${one ? 'is' : 'are'} solid and ${one ? 'hurts' : 'hurt'}, so each touch pushes the hero as it hurts him. ${top ? 'Its solid top (SOLTOP) pushes a hero who lands on it down under it, into the floor. ' : ''}Near a wall it can shove him inside, and it can stay against him while his hit points run out. A hazard needs no solid sides: clear them, or keep only Bottom if it is meant to be stood on.`,
      where: { scene: d.scene, map: d.names.map, ...(cells.length ? { cell: cells[0], cells } : {}), monster: { file: d.names.mon ?? '', n: k } },
      ...(top ? { fix: 'no-soltop' as const } : {}),
    });
  }
  return out;
}

export const solidPushChecks = [edgeRows, wallGaps, squeezes, solidHurts];
