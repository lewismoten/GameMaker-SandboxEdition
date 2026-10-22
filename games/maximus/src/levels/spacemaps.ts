// The space charts: the galaxy (home dock, five sector warps behind shard gates, and the
// Core sealed behind all ten) and the sector charts (a sun, its planets, a trading post,
// an asteroid belt, and the warp home).
import { rng } from '../../../kit/pixels';
import { Grid, W, H, reachable, wx, wy } from './mapkit';
import type { SetBuilder } from '../blocks/blockset';
import { WARES } from '../blocks/space';
import { tileNoise } from '../art/draw';

export interface P {
  x: number;
  y: number;
}

function starfield(g: Grid, s: SetBuilder, seed: number, nebulaAmount = 0.3): void {
  const r = rng(seed);
  const n = tileNoise(seed, 100, 5);
  const voids = [0, 1, 2, 3, 4, 5].map((k) => s.id(`void:${k}`));
  const nebs = [0, 1, 2, 3, 4, 5].map((k) => s.id(`neb:${k}`));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = n(x, y);
      const edge = 1 - nebulaAmount;
      if (v > edge) {
        // density rises toward the heart of each cloud, with a little dithered jitter
        const lvl = Math.min(5, Math.floor(((v - edge) / nebulaAmount) * 9 + (r() - 0.5) * 0.8));
        g.set(x, y, nebs[Math.max(0, lvl)]);
      } else {
        const k = r();
        g.set(x, y, voids[k < 0.45 ? 0 : k < 0.7 ? 1 : k < 0.85 ? 2 : k < 0.94 ? 3 : k < 0.98 ? 4 : 5]);
      }
    }
}

function put2x2(g: Grid, s: SetBuilder, name: string, x: number, y: number, lock = true): void {
  g.set(x, y, s.id(`${name}:tl`), lock);
  g.set(x + 1, y, s.id(`${name}:tr`), lock);
  g.set(x, y + 1, s.id(`${name}:bl`), lock);
  g.set(x + 1, y + 1, s.id(`${name}:br`), lock);
}

/** Asteroid ring of radius rad around (cx, cy), with an opening facing `gapDir` (radians). */
function asteroidWall(g: Grid, s: SetBuilder, cx: number, cy: number, rad: number, gapDir: number, gapHalf = 0.3): P[] {
  const r = rng(cx * 31 + cy);
  const rocks = [0, 1, 2, 3, 4].map((k) => s.id(`rock:${k}`));
  const cells: P[] = [];
  for (let a = 0; a < 360; a += 2) {
    const ang = (a * Math.PI) / 180;
    let d = ang - gapDir;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < gapHalf) continue;
    for (const dr of [0, 0.7]) {
      const x = wx(Math.round(cx + Math.cos(ang) * (rad + dr)));
      const y = wy(Math.round(cy + Math.sin(ang) * (rad + dr)));
      g.set(x, y, r() < 0.4 ? s.id('rock:big') : rocks[Math.floor(r() * rocks.length)], true);
      cells.push({ x, y });
    }
  }
  return cells;
}

/** A straight corridor of gates leading in toward (cx, cy) from direction `dir`. */
function gateCorridor(g: Grid, s: SetBuilder, cx: number, cy: number, dir: [number, number], from: number, gates: number[]): void {
  const [dx, dy] = dir;
  // two cells wide: perpendicular offset
  const px = dy !== 0 ? 1 : 0;
  const py = dx !== 0 ? 1 : 0;
  gates.forEach((shard, k) => {
    const d = from + k;
    const x = cx + dx * d;
    const y = cy + dy * d;
    g.set(x, y, s.id(`gate:${shard}`), true);
    g.set(x + px, y + py, s.id(`gate:${shard}`), true);
    // walls beside the corridor
    g.set(x - px, y - py, s.id('rock:big'), true);
    g.set(x + 2 * px, y + 2 * py, s.id('rock:big'), true);
  });
}

/** A box of rock around a 2x2 warp at (wxp, wyp), opening in direction `dir` through shard gates. */
function gatedBox(g: Grid, s: SetBuilder, wxp: number, wyp: number, dir: [number, number], shards: number[]): void {
  for (let y = wyp - 3; y <= wyp + 4; y++)
    for (let x = wxp - 3; x <= wxp + 4; x++) {
      const edge = y === wyp - 3 || y === wyp + 4 || x === wxp - 3 || x === wxp + 4;
      if (edge) g.set(x, y, s.id('rock:big'), true);
      else if (!g.isLocked(x, y)) g.set(x, y, s.id('void:0'), true);
    }
  // the gate cells replace part of the wall, two wide, one layer per shard
  const [dx, dy] = dir;
  const ox = dx > 0 ? wxp + 4 : dx < 0 ? wxp - 3 : wxp;
  const oy = dy > 0 ? wyp + 4 : dy < 0 ? wyp - 3 : wyp;
  const px = dy !== 0 ? 1 : 0;
  const py = dx !== 0 ? 1 : 0;
  shards.forEach((shard, i) => {
    const gx = ox + dx * i;
    const gy = oy + dy * i;
    g.set(gx, gy, s.id(`gate:${shard}`), true);
    g.set(gx + px, gy + py, s.id(`gate:${shard}`), true);
    if (i > 0) {
      g.set(gx - px, gy - py, s.id('rock:big'), true);
      g.set(gx + 2 * px, gy + 2 * py, s.id('rock:big'), true);
    }
  });
}

export interface GalaxyResult {
  grid: Grid;
  arriveHome: P;
  dock: P;
  sectors: { warp: P; arrive: P }[];
  core: P;
  coreArrive: P;
  /** the beacon inside the knot where the chart's corners meet, and where the pod comes back out */
  knot: { beacon: P; out: P };
}

/** The galaxy: Core in the middle, sectors around it on a spiral. */
export function galaxyMap(s: SetBuilder): GalaxyResult {
  const g = new Grid();
  starfield(g, s, 4242, 0.38);
  const cx = 50;
  const cy = 50;
  // the Core: a black hole 3x3, ringed with asteroids, one corridor of ten gates from the south
  for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) g.set(cx - 1 + bx, cy - 1 + by, s.id(`core:${bx}${by}`), true);
  asteroidWall(g, s, cx, cy, 5, Math.PI / 2, 0.22);
  gateCorridor(g, s, cx, cy, [0, 1], 5, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  // clear a lane through the ring at the corridor
  g.set(cx, cy + 2, s.id('void:0'), true);
  g.set(cx + 1, cy + 2, s.id('void:0'), true);
  g.set(cx, cy + 3, s.id('void:0'), true);
  g.set(cx + 1, cy + 3, s.id('void:0'), true);
  g.set(cx, cy + 4, s.id('void:0'), true);
  g.set(cx + 1, cy + 4, s.id('void:0'), true);
  g.set(cx - 2, cy + 16, s.id('glyph:0'), true);
  const coreArrive = { x: cx + 3, y: cy + 17 };

  // home dock: a little station to the south-west, where the game starts
  const hx = 20;
  const hy = 82;
  for (let y = hy - 2; y <= hy + 2; y++) for (let x = hx - 3; x <= hx + 3; x++) g.set(x, y, s.id(`hull:${(x + y) & 3}`), true);
  g.set(hx, hy - 2, s.id('dock'), true);
  const dock = { x: hx, y: hy - 2 };
  const arriveHome = { x: hx, y: hy - 5 };
  g.set(hx + 1, hy - 2, s.id('hull:2'), true);
  g.set(hx - 4, hy - 3, s.id('buoy:0'), true);
  g.set(hx + 4, hy - 3, s.id('buoy:0'), true);
  // a trading post beside it
  WARES.forEach((w, k) => g.set(hx - 3 + k, hy + 3, s.id(`buy:${w.id}`), true));

  // five sector warps around the Core
  const sectors: { warp: P; arrive: P }[] = [];
  const angles = [200, 270, 340, 50, 130].map((d) => (d * Math.PI) / 180);
  const gateShards = [[], [0, 1], [2, 3], [4, 5], [6, 7]];
  angles.forEach((ang, k) => {
    const rad = 28 + k * 2;
    const wxp = wx(Math.round(cx + Math.cos(ang) * rad));
    const wyp = wy(Math.round(cy + Math.sin(ang) * rad));
    put2x2(g, s, 'warp0', wxp, wyp);
    g.set(wxp - 1, wyp - 1, s.id(`glyph:${k + 1}`), true);
    // enclosure with a gate corridor facing the Core
    const toCore = Math.atan2(cy - wyp, cx - wxp);
    const dirs: [number, number][] = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    const dir = dirs.reduce((best, d) => (Math.cos(toCore - Math.atan2(d[1], d[0])) > Math.cos(toCore - Math.atan2(best[1], best[0])) ? d : best));
    if (gateShards[k].length) gatedBox(g, s, wxp, wyp, dir, gateShards[k]);
    // arrival (coming back from the sector): just outside the enclosure toward the Core
    const [dx, dy] = dir;
    sectors.push({ warp: { x: wxp, y: wyp }, arrive: { x: wx(wxp + dx * 7), y: wy(wyp + dy * 7) } });
  });
  // scenery: a few comets and debris
  const r = rng(77);
  for (let k = 0; k < 14; k++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * H);
    if (!g.isLocked(x, y)) g.set(x, y, k % 3 ? s.id(`debris:${k % 3}`) : s.id('comet'));
  }
  // a knot of asteroids where the chart's four corners meet (the map wraps, so it sits
  // split across all four), as far from the Core as space goes. Its south face is only a
  // picture of rock; inside, something felt floats beside a beacon.
  const knot = [
    'r.RRRR.',
    'RRRBRRr',
    '.RREvR.',
    'rRvvvRr',
    '.RRFFRR',
    '..r..r.',
  ];
  const kx = 97;
  const ky = 96;
  const rocks = [0, 1, 2, 3, 4].map((k) => s.id(`rock:${k}`));
  let beacon: P = { x: 0, y: 0 };
  knot.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      const x = wx(kx + i);
      const y = wy(ky + j);
      if (ch === 'R') g.set(x, y, s.id('rock:big'), true);
      else if (ch === 'r') g.set(x, y, rocks[(i * 3 + j) % 5], true);
      else if (ch === 'F') g.set(x, y, s.id('rock:fake'), true);
      else if (ch === 'v') g.set(x, y, s.id('void:0'), true);
      else if (ch === 'E') g.set(x, y, s.id('egg'), true);
      else if (ch === 'B') {
        g.set(x, y, s.id('signal:0'), true);
        beacon = { x, y };
      }
    }),
  );
  const out = { x: wx(kx + 3), y: wy(ky + knot.length + 1) };
  return { grid: g, arriveHome, dock, sectors, core: { x: cx - 1, y: cy - 1 }, coreArrive, knot: { beacon, out } };
}

export interface SectorResult {
  grid: Grid;
  arrive: P;
  warp: P;
  /** A shortcut warp to the next sector (or the Maelstrom), behind its shard gates. */
  jump: P;
  jumpArrive: P;
  planets: { at: P; back: P; design: number }[];
  open: P[];
}

/** A sector chart with `count` planets; `shards` lists which planet indexes hold a shard. */
export function sectorMap(s: SetBuilder, seed: number, count: number, designs: number[], shards: number[], jumpGates: number[]): SectorResult {
  const r = rng(seed);
  const g = new Grid();
  starfield(g, s, seed, 0.25 + r() * 0.2);
  const cx = 50;
  const cy = 50;
  put2x2(g, s, 'sun', cx, cy);
  // solar wind around the sun pushes outward
  for (let y = cy - 3; y <= cy + 4; y++)
    for (let x = cx - 3; x <= cx + 4; x++) {
      if (g.isLocked(x, y)) continue;
      const dx = x - cx - 0.5;
      const dy = y - cy - 0.5;
      g.set(x, y, Math.abs(dx) > Math.abs(dy) ? s.id(dx > 0 ? 'wind:r' : 'wind:l') : s.id(dy > 0 ? 'wind:d' : 'wind:u'), true);
    }
  // the warp home and the trading post, top-left
  const warp = { x: 12, y: 12 };
  put2x2(g, s, 'warp0', warp.x, warp.y);
  const arrive = { x: warp.x + 1, y: warp.y + 4 };
  const tx = 20;
  const ty = 16;
  for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + WARES.length; x++) g.set(x, y, s.id(`hull:${(x + y) & 3}`), true);
  WARES.forEach((w, k) => g.set(tx + k, ty + 2, s.id(`buy:${w.id}`), true));
  // the jump ring: a shortcut onward, bottom-right, sealed by the next sector's gates
  const jump = { x: 84, y: 84 };
  put2x2(g, s, 'warp1', jump.x, jump.y);
  gatedBox(g, s, jump.x, jump.y, [-1, 0], jumpGates);
  const jumpArrive = { x: jump.x - 6, y: jump.y };
  g.set(jump.x - 4, jump.y - 1, s.id('buoy:0'), true);
  // asteroid belt
  const belt = 22 + Math.floor(r() * 6);
  for (let a = 0; a < 360; a += 1.2) {
    if (r() < 0.55) continue;
    const ang = (a * Math.PI) / 180;
    const rr = belt + (r() - 0.5) * 3;
    const x = wx(Math.round(cx + Math.cos(ang) * rr));
    const y = wy(Math.round(cy + Math.sin(ang) * rr));
    if (!g.isLocked(x, y)) g.set(x, y, s.id(r() < 0.3 ? 'rock:big' : `rock:${Math.floor(r() * 5)}`));
  }
  // planets on orbits, spread around
  const planets: { at: P; back: P; design: number }[] = [];
  const taken: P[] = [{ x: cx, y: cy }, warp, { x: tx, y: ty }, { x: tx + 3, y: ty }, jump, { x: jump.x - 5, y: jump.y }];
  let tries = 0;
  while (planets.length < count && tries++ < 5000) {
    const orbit = 8 + Math.floor(r() * 38);
    const ang = r() * Math.PI * 2;
    const x = wx(Math.round(cx + Math.cos(ang) * orbit));
    const y = wy(Math.round(cy + Math.sin(ang) * orbit * 0.9));
    if (taken.some((t) => Math.min(Math.abs(t.x - x), W - Math.abs(t.x - x)) < 7 && Math.min(Math.abs(t.y - y), H - Math.abs(t.y - y)) < 7)) continue;
    if (Math.abs(orbit - belt) < 3) continue;
    taken.push({ x, y });
    const k = planets.length;
    // clear space around it
    for (let yy = y - 2; yy <= y + 3; yy++) for (let xx = x - 2; xx <= x + 3; xx++) if (!g.isLocked(xx, yy)) g.set(xx, yy, s.id('void:1'));
    put2x2(g, s, `planet${designs[k] % 9}`, x, y);
    if (shards.includes(k)) {
      g.set(x + 2, y - 1, s.id('signal:0'), true);
      g.set(x - 1, y + 2, s.id('signal:0'), true);
    }
    planets.push({ at: { x, y }, back: { x: wx(x), y: wy(y + 3) }, design: designs[k] });
  }
  if (planets.length < count) throw new Error(`sector ${seed}: placed ${planets.length} planets`);
  // floating crates
  const open: P[] = [];
  for (let k = 0; k < 400; k++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * H);
    if (!g.isLocked(x, y) && (s.family('void').includes(g.get(x, y)) || s.family('neb').includes(g.get(x, y)))) open.push({ x, y });
  }
  for (const p of open.slice(0, 26)) {
    const k = r();
    g.set(p.x, p.y, s.id(k < 0.5 ? 'p:credit' : k < 0.7 ? 'p:gem' : k < 0.8 ? 'p:heart' : k < 0.87 ? 'p:plasma' : k < 0.93 ? 'p:nova' : 'p:shield'));
  }
  for (const p of open.slice(26, 40)) g.set(p.x, p.y, s.id('mine'));
  for (const p of open.slice(40, 48)) g.set(p.x, p.y, s.id(`debris:${p.x % 3}`));
  for (const p of open.slice(48, 52)) g.set(p.x, p.y, s.id('satellite'));
  for (const p of open.slice(52, 55)) g.set(p.x, p.y, s.id('wreck'));
  g.set(warp.x - 1, warp.y + 2, s.id('buoy:0'), true);
  g.set(warp.x + 2, warp.y + 2, s.id('buoy:0'), true);
  // everything reachable?
  const seen = reachable(g, s.blocks, arrive.x, arrive.y, { tall: false });
  for (const p of planets)
    if (!seen[p.at.y * W + p.at.x] && !seen[p.back.y * W + p.back.x]) throw new Error(`sector ${seed}: planet at ${p.at.x},${p.at.y} cut off`);
  return { grid: g, arrive, warp, jump, jumpArrive, planets, open: open.slice(56) };
}
