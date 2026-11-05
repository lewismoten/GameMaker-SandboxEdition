// Overworld: smooth value noise gives the land's height and wetness (periodic when the map wraps, so
// the seam has nothing cut off); the lowest part becomes water, the highest mountains (rocks), the
// wet middle forest and the rest grass. Land the hero cannot reach (islands, pockets) is given back to
// the water. Three to five sites (towns, dungeon entrances, a castle) stand on open ground, each a
// cleared patch with a door block in the middle, and a road is cut between them (through forest, over
// mountains at a cost, never across water). Sites are proposals for scene links; nothing is linked here.
import { DECOR, DOORC, FLOOR, PATH, ROCK, TREE, WATER, closed, distances, newArea, type Area, type Stream } from './grid';
import { route } from './forest';
import type { SceneLink } from './town';

export const OVERWORLD_MIN = { w: 40, h: 40 };

export interface Overworld {
  area: Area;
  entry: number;
  exit: number;
  links: SceneLink[];
}

export interface OverworldUses {
  tree: boolean;
  rock: boolean;
  decor: boolean;
  /** The map wraps over its edges: the land lines up across the seam. */
  wrap: boolean;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise in 0..1 with lattice spacing `cs`; periodic over the area when `wrap`. */
function noise(w: number, h: number, r: Stream, cs: number, wrap: boolean): Float32Array {
  const gw = wrap ? Math.max(2, Math.round(w / cs)) : Math.ceil(w / cs) + 1,
    gh = wrap ? Math.max(2, Math.round(h / cs)) : Math.ceil(h / cs) + 1;
  const g = Array.from({ length: gw * gh }, () => r.next());
  const out = new Float32Array(w * h);
  const sx = wrap ? gw / w : 1 / cs,
    sy = wrap ? gh / h : 1 / cs;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const fx = x * sx,
        fy = y * sy;
      const x0 = Math.floor(fx),
        y0 = Math.floor(fy);
      const tx = smooth(fx - x0),
        ty = smooth(fy - y0);
      const v = (i: number, j: number) => g[(j % gh) * gw + (i % gw)];
      const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * tx,
        b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * tx;
      out[y * w + x] = a + (b - a) * ty;
    }
  return out;
}

/** The value below which `share` of the values lie. */
const quantile = (v: Float32Array, share: number) => [...v].sort((a, b) => a - b)[Math.floor(v.length * share)];

/** An overworld filling a w by h area (at least 40 by 40). */
export function overworld(w: number, h: number, r: Stream, u: OverworldUses): Overworld {
  const area = newArea(w, h, FLOOR);
  const at = (x: number, y: number) => y * w + x;
  const n1 = noise(w, h, r, 16, u.wrap),
    n2 = noise(w, h, r, 8, u.wrap),
    n3 = noise(w, h, r, 4, u.wrap);
  const height = n1.map((v, i) => v * 0.6 + n2[i] * 0.3 + n3[i] * 0.1);
  const wet = noise(w, h, r, 12, u.wrap);
  const seaAt = quantile(height, 0.24),
    peakAt = quantile(height, 0.93),
    forestAt = quantile(wet, 0.66);
  for (let i = 0; i < w * h; i++) {
    if (height[i] < seaAt) area.cells[i] = WATER;
    else if (u.rock && height[i] > peakAt) area.cells[i] = ROCK;
    else if (u.tree && wet[i] > forestAt) area.cells[i] = TREE;
    else if (u.decor && r.chance(0.04)) area.cells[i] = DECOR;
  }
  // forest and mountains still count as land the road can cross; only the biggest connected land stays
  const land = (c: number) => c !== WATER;
  const seen = new Int32Array(w * h).fill(-1);
  let best = -1,
    bestSize = 0,
    id = 0;
  for (let s = 0; s < w * h; s++) {
    if (!land(area.cells[s]) || seen[s] >= 0) continue;
    const stack = [s];
    seen[s] = id;
    let size = 0;
    while (stack.length) {
      const c = stack.pop()!;
      size++;
      const x = c % w,
        y = (c / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = at(nx, ny);
        if (seen[n] < 0 && land(area.cells[n])) ((seen[n] = id), stack.push(n));
      }
    }
    if (size > bestSize) ((best = id), (bestSize = size));
    id++;
  }
  for (let i = 0; i < w * h; i++) if (land(area.cells[i]) && seen[i] !== best) area.cells[i] = WATER;
  // sites: spaced out, away from the edge, with land (no water) all round
  const kinds: SceneLink['kind'][] = ['town', 'dungeon', 'castle', 'town', 'dungeon'];
  const want = w * h >= 3600 ? 5 : 4;
  const sites: number[] = [];
  const minGap = Math.max(10, Math.floor(Math.min(w, h) / 4));
  for (let tries = 0; tries < 4000 && sites.length < want; tries++) {
    const x = r.int(3, w - 4),
      y = r.int(3, h - 4);
    let ok = true;
    for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (area.cells[at(x + dx, y + dy)] === WATER) ok = false;
    if (ok && sites.every((s) => Math.abs((s % w) - x) + Math.abs(((s / w) | 0) - y) >= minGap)) sites.push(at(x, y));
  }
  // the first site is where the hero comes in: the westmost, so a road runs east
  sites.sort((a, b) => (a % w) - (b % w));
  for (const s of sites) {
    const sx = s % w,
      sy = (s / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) area.cells[at(sx + dx, sy + dy)] = FLOOR;
  }
  // roads: each site to the nearest one already joined, over land with trees and rocks passable at a cost
  const pass: Area = { w, h, cells: area.cells.map((c) => (c === WATER ? WATER : FLOOR)) };
  const cost = new Float32Array(w * h);
  for (let i = 0; i < cost.length; i++) cost[i] = area.cells[i] === ROCK ? 14 : area.cells[i] === TREE ? 4 : 1 + r.next() * 0.6;
  const joined = sites.length ? [sites[0]] : [];
  for (const s of sites.slice(1)) {
    const near = joined.reduce((a, b) => (Math.abs((a % w) - (s % w)) + Math.abs(((a / w) | 0) - ((s / w) | 0)) <= Math.abs((b % w) - (s % w)) + Math.abs(((b / w) | 0) - ((s / w) | 0)) ? a : b));
    for (const c of route(pass, near, s, cost)) {
      area.cells[c] = PATH;
      cost[c] = 0.2;
    }
    joined.push(s);
  }
  const links: SceneLink[] = [];
  const count: Record<string, number> = {};
  sites.forEach((s, i) => {
    area.cells[s] = DOORC;
    const kind = kinds[i % kinds.length];
    count[kind] = (count[kind] ?? 0) + 1;
    links.push({ cell: s, kind, label: `${kind[0].toUpperCase()}${kind.slice(1)} ${count[kind]}` });
  });
  // any road or clearing can leave a pocket of open land behind trees: reach is proven from the entry
  const entry = sites.length ? sites[0] + w : at(w >> 1, h >> 1);
  const d = distances(area, entry);
  for (let i = 0; i < d.length; i++) if (!closed(area.cells[i]) && d[i] < 0) area.cells[i] = WATER;
  const exit = sites.length > 1 ? sites[sites.length - 1] : entry;
  return { area, entry, exit, links };
}
