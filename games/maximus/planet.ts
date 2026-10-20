// Procedural planets for SURFACE.BBL: a seeded, wrap-around world. Walk east long enough
// and you are home again (Game-Maker maps wrap; Maximus makes every planet a little
// globe). Sky on top, a crust of soil and rock, worm-eaten caves, floating islands,
// lakes of whatever the palette says the liquid is, ruins and a vault deep down.
import { rng } from '../kit/pixels';
import type { Block } from '../../web/src/formats/blocks';
import { Grid, H, W, reachable, wave1d, wx, wy } from './mapkit';
import type { SetBuilder } from './blockset';
import { OPEN_AIR_PICKUPS } from './surface';
import type { PickupId } from './items';

export interface Spot {
  x: number;
  y: number;
}
export interface Run {
  x0: number;
  x1: number;
  y: number;
}

export interface PlanetSpec {
  seed: number;
  /** 1..5: sector difficulty */
  level: number;
  shard?: number;
  module?: number;
  /** Extra hazards etc. */
  features?: { lakes?: boolean; islands?: number; winds?: boolean; fields?: boolean; caves?: number; ruins?: boolean };
}

export interface PlanetResult {
  grid: Grid;
  arrive: Spot;
  uplink: Spot;
  vault?: Spot;
  /** Where monsters can go, by how they move. */
  ground: Run[];
  caveFloor: Run[];
  sky: Spot[];
  caveAir: Spot[];
  ceilings: Spot[];
  surfaceH: number[];
  treasure: Spot[];
}

const CEIL_TOP = 0;
const BEDROCK = 88;

export function surfacePlanet(spec: PlanetSpec, s: SetBuilder): PlanetResult {
  const r = rng(spec.seed);
  const pickOne = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const id = (n: string) => s.id(n);
  const fam = (n: string) => (n === 'cave' ? [s.id('cave:0'), s.id('cave:1'), s.id('cave:2')] : s.family(n));
  const g = new Grid();
  const bbl = s.blocks;
  const f = { lakes: true, islands: 4, winds: false, fields: true, caves: 8, ruins: true, ...spec.features };

  // --- surface height: smooth periodic noise, flattened into walkable steps
  const n = wave1d(spec.seed, [
    [1, 4 + r() * 3],
    [2, 2 + r() * 3],
    [4, 1 + r() * 2],
    [7, r() * 1.5],
  ]);
  const raw = Array.from({ length: W }, (_, x) => 36 + n(x));
  const h: number[] = new Array(W);
  let x = 0;
  while (x < W) {
    const len = 3 + Math.floor(r() * 6);
    const level = Math.round(raw[x]);
    for (let k = 0; k < len && x < W; k++, x++) h[x] = level;
  }
  // never a step of more than 3 between neighbours (hop height)
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < W; i++) h[i] = Math.max(h[i], Math.min(h[(i + 1) % W], h[(i + W - 1) % W]) - 3);

  // --- sky and ground
  for (let y = 0; y < H; y++)
    for (let xx = 0; xx < W; xx++) {
      let b: number;
      if (y === CEIL_TOP || y >= 94) b = id('ceiling');
      else if (y <= 8) b = id(`sky:${y - 1}`);
      else if (y < h[xx]) b = id('air');
      else if (y === h[xx]) {
        const lH = h[(xx + W - 1) % W];
        const rH = h[(xx + 1) % W];
        b =
          lH > y
            ? id('top:left')
            : rH > y
              ? id('top:right')
              : pickOne(fam('top').filter((i) => i !== id('top:left') && i !== id('top:right') && i !== id('top:cave')));
      } else if (y < h[xx] + 4 + (xx % 3 === 0 ? 1 : 0)) b = pickOne(fam('soil'));
      else if (y < 70) b = r() < 0.04 ? pickOne([id('ore:0'), id('ore:1')]) : pickOne(fam('rock'));
      else if (y < BEDROCK) b = pickOne(fam('deep'));
      else b = id('bedrock');
      g.set(xx, y, b);
    }

  // --- arrival: the first long flat stretch
  let ax = 8;
  for (let i = 0; i < W; i++) {
    const xs = (i + 6) % W;
    if ([0, 1, 2, 3, 4, 5].every((k) => h[(xs + k) % W] === h[xs])) {
      ax = xs + 1;
      break;
    }
  }
  const ay = h[ax] - 1;
  const arrive = { x: ax, y: ay };
  const uplink = { x: wx(ax + 3), y: ay };

  // --- caves: worms and chambers, all joined to the surface
  const carved = new Uint8Array(W * H);
  const carve = (cx: number, cy: number, rx: number, ry: number) => {
    for (let yy = Math.floor(cy - ry); yy <= cy + ry; yy++)
      for (let xx = Math.floor(cx - rx); xx <= cx + rx; xx++) {
        if (yy < 44 && yy < h[wx(xx)] + 3) continue; // keep the crust near the surface
        if (yy >= BEDROCK - 1 || yy < 10) continue;
        if (((xx - cx) / (rx + 0.3)) ** 2 + ((yy - cy) / (ry + 0.3)) ** 2 > 1) continue;
        carved[wy(yy) * W + wx(xx)] = 1;
      }
  };
  const worms = f.caves;
  for (let k = 0; k < worms; k++) {
    let cx = r() * W;
    let cy = 50 + r() * 32;
    let dir = r() * Math.PI * 2;
    const len = 30 + r() * 70;
    for (let i = 0; i < len; i++) {
      carve(cx, cy, 1.6 + r() * 0.8, 1.3 + r() * 0.6);
      dir += (r() - 0.5) * 0.6;
      // stay mostly horizontal
      cx += Math.cos(dir) * 1.2;
      cy += Math.sin(dir) * 0.6;
      if (cy < 48) dir = Math.abs(dir) % Math.PI;
      if (cy > 84) dir = -Math.abs(dir) % Math.PI;
    }
  }
  const chambers: { x: number; y: number }[] = [];
  for (let k = 0; k < 3 + Math.floor(r() * 4); k++) {
    const cx = r() * W;
    const cy = 56 + r() * 24;
    carve(cx, cy, 4 + r() * 4, 2.5 + r() * 2);
    chambers.push({ x: Math.round(cx), y: Math.round(cy) });
  }
  // shafts from the surface (well away from the landing site)
  const shafts: number[] = [];
  for (let k = 0; k < 3; k++) {
    let sx = wx(ax + 15 + k * 28 + Math.floor(r() * 10));
    shafts.push(sx);
    for (let yy = h[sx]; yy < 80; yy++) {
      for (let dx = -1; dx <= 1; dx++) carved[yy * W + wx(sx + dx)] = 1;
      if (r() < 0.12) sx = wx(sx + (r() < 0.5 ? -1 : 1));
    }
  }
  // the vault room (ruins, the shard or module waits inside)
  let vault: Spot | undefined;
  {
    const vx = wx(ax + 45 + Math.floor(r() * 10));
    const vy = 70 + Math.floor(r() * 8);
    vault = { x: vx, y: vy };
    for (let yy = vy - 4; yy <= vy; yy++) for (let xx = vx - 5; xx <= vx + 5; xx++) carved[yy * W + wx(xx)] = 0;
  }
  for (let i = 0; i < W * H; i++) {
    if (!carved[i]) continue;
    const xx = i % W;
    const yy = Math.floor(i / W);
    g.set(xx, yy, pickOne(fam('cave')));
  }
  // join every pocket of open space to the landing site
  const isOpen = (b: number) => b === id('air') || fam('cave').includes(b);
  const joinAll = () => {
    for (let guard = 0; guard < 40; guard++) {
      const seen = reachable(g, bbl, arrive.x, arrive.y);
      let best: { i: number; d: number } | undefined;
      for (let i = 0; i < W * H; i++) {
        if (seen[i] || !carved[i]) continue;
        const xx = i % W;
        const yy = Math.floor(i / W);
        if (!isOpen(g.get(xx, yy)) || !isOpen(g.get(xx, yy - 1))) continue;
        best = { i, d: 0 };
        break;
      }
      if (!best) return;
      // tunnel from the pocket toward the nearest reached cell
      const px = best.i % W;
      const py = Math.floor(best.i / W);
      let target = { x: arrive.x, y: arrive.y, d: Infinity };
      for (let i = 0; i < W * H; i++) {
        if (!seen[i]) continue;
        const tx = i % W;
        const ty = Math.floor(i / W);
        let dx = Math.abs(tx - px);
        dx = Math.min(dx, W - dx);
        const d = dx + Math.abs(ty - py) * 1.5;
        if (d < target.d) target = { x: tx, y: ty, d };
      }
      let cx = px;
      let cy = py;
      for (let step = 0; step < 200 && !(cx === target.x && cy === target.y); step++) {
        let dx = target.x - cx;
        if (dx > W / 2) dx -= W;
        if (dx < -W / 2) dx += W;
        const dy = target.y - cy;
        if (Math.abs(dx) > Math.abs(dy)) cx = wx(cx + Math.sign(dx));
        else cy += Math.sign(dy);
        for (const [ox, oy] of [
          [0, 0],
          [0, -1],
          [0, -2],
          [1, 0],
          [1, -1],
          [-1, -1],
        ]) {
          const tx = wx(cx + ox);
          const ty = cy + oy;
          if (ty < 9 || ty >= BEDROCK - 1) continue;
          const cur = g.get(tx, ty);
          if (!isOpen(cur)) {
            g.set(tx, ty, ty < h[tx] ? id('air') : pickOne(fam('cave')));
            carved[ty * W + tx] = 1;
          }
        }
      }
    }
  };
  joinAll();

  // --- the vault: ruin walls, a credit door, the prize on a shrine
  if (vault) {
    const { x: vx, y: vy } = vault;
    for (let yy = vy - 5; yy <= vy + 1; yy++)
      for (let xx = vx - 6; xx <= vx + 6; xx++) {
        const edge = yy === vy - 5 || yy === vy + 1 || Math.abs(xx - vx) === 6;
        g.set(xx, yy, edge ? (yy === vy - 5 && xx % 3 === 0 ? id('ruin:wall') : id('ruin:block')) : pickOne(fam('cave')), true);
      }
    for (const dx of [-3, 3]) {
      g.set(vx + dx, vy - 4, id('pillar:top'), true);
    }
    // entrances: a door on the left wall, force fields on the right
    g.set(vx - 6, vy, id('door'), true);
    g.set(vx - 6, vy - 1, id('door'), true);
    g.set(vx + 6, vy, id('field:on'), true);
    g.set(vx + 6, vy - 1, id('field:on'), true);
    // corridors from both entrances out to the caves
    for (const [dir, ex] of [
      [-1, vx - 7],
      [1, vx + 7],
    ] as const) {
      let cx = ex;
      for (let step = 0; step < 30; step++) {
        const seen = g.get(cx, vy);
        const done = step > 3 && reachable(g, bbl, arrive.x, arrive.y)[vy * W + wx(cx)];
        for (const oy of [0, -1]) if (!isOpen(g.get(cx, vy + oy))) g.set(cx, vy + oy, pickOne(fam('cave')));
        if (done && seen !== undefined) break;
        cx = wx(cx + dir);
      }
    }
    joinAll();
    const prize = spec.shard !== undefined ? id(`shard:${spec.shard}`) : spec.module !== undefined ? id(`module:${spec.module}`) : id('pc:oneup');
    g.set(vx, vy, prize, true);
    g.set(vx - 2, vy, id('pc:gem'), true);
    g.set(vx + 2, vy, id('pc:credit'), true);
  }

  // --- cave dressing: stalactites, crystals, mushrooms, pools, spikes
  const caveFloor: Run[] = [];
  const caveAir: Spot[] = [];
  const ceilings: Spot[] = [];
  const solidAt = (xx: number, yy: number) => !isOpen(g.get(xx, yy)) && (bbl[g.get(xx, yy)].solid & 1) === 1;
  for (let yy = 40; yy < BEDROCK; yy++)
    for (let xx = 0; xx < W; xx++) {
      if (g.isLocked(xx, yy) || !fam('cave').includes(g.get(xx, yy))) continue;
      const below = solidAt(xx, yy + 1);
      const above = solidAt(xx, yy - 1);
      const near = Math.hypot(Math.min(Math.abs(xx - ax), W - Math.abs(xx - ax)), yy - ay) < 6;
      if (below && !near) {
        const k = r();
        if (k < 0.06) g.set(xx, yy, id('stal:up'));
        else if (k < 0.1) g.set(xx, yy, id('mushroom:cave'));
        else if (k < 0.13) g.set(xx, yy, id('crystals:cave'));
        else if (k < 0.13 + 0.02 * spec.level) g.set(xx, yy, id('spikes:cave'));
      } else if (above && !g.isLocked(xx, yy - 1)) {
        const k = r();
        if (k < 0.12 && !solidAt(xx, yy + 1) && !solidAt(xx, yy + 2)) g.set(xx, yy, id('stal:down'));
        else if (k < 0.16) g.set(xx, yy, id('cave:roots'));
        else if (k < 0.18) g.set(xx, yy, id('cave:glint'));
        ceilings.push({ x: xx, y: yy });
      } else if (!above && !below && r() < 0.05) caveAir.push({ x: xx, y: yy });
    }
  // floor runs in caves (for walkers)
  for (let yy = 40; yy < BEDROCK; yy++) {
    let start = -1;
    for (let xx = 0; xx <= W; xx++) {
      const okCell = xx < W && fam('cave').includes(g.get(xx, yy)) && fam('cave').includes(g.get(xx, yy - 1)) && solidAt(xx, yy + 1);
      if (okCell && start < 0) start = xx;
      if (!okCell && start >= 0) {
        if (xx - start >= 3) caveFloor.push({ x0: start, x1: xx - 1, y: yy });
        start = -1;
      }
    }
  }
  // lifts up the shafts
  for (const sx of shafts) {
    if (r() < 0.6) continue;
    for (let yy = h[sx] + 2; yy < 78; yy++) if (fam('cave').includes(g.get(sx, yy))) g.set(sx, yy, id('lift:cave'));
  }

  // --- lakes in the deepest dips
  const ground: Run[] = [];
  if (f.lakes) {
    const dips: number[] = [];
    for (let i = 0; i < W; i++) if (h[i] >= Math.max(...h) - 1 && Math.abs(i - ax) > 8 && Math.abs(i - ax) < W - 8) dips.push(i);
    for (const i of dips) {
      if (g.isLocked(i, h[i])) continue;
      g.set(i, h[i], id('liquid:top'));
      g.set(i, h[i] + 1, id('liquid'));
    }
  }

  // --- surface dressing
  const sky: Spot[] = [];
  const treasure: Spot[] = [];
  for (let xx = 0; xx < W; xx++) {
    const y = h[xx] - 1;
    const dist = Math.min(Math.abs(xx - ax), W - Math.abs(xx - ax));
    if (dist < 5 || g.get(xx, h[xx]) === id('liquid:top')) continue;
    if (fam('cave').includes(g.get(xx, y)) || g.get(xx, y) !== id('air')) continue;
    const k = r();
    const flatRight = h[(xx + 1) % W] === h[xx] && g.get(xx + 1, y) === id('air');
    if (k < 0.07 && flatRight && dist > 6) {
      g.set(xx, y, id('tree:trunk'));
      g.set(xx, y - 1, id('tree:bl'));
      g.set(xx + 1, y - 1, id('tree:br'));
      g.set(xx, y - 2, id('tree:tl'));
      g.set(xx + 1, y - 2, id('tree:tr'));
      xx++;
    } else if (k < 0.2) g.set(xx, y, pickOne([id('bush:0'), id('bush:1'), id('grass:0'), id('grass:1')]));
    else if (k < 0.24) g.set(xx, y, id('boulder'));
    else if (k < 0.27) g.set(xx, y, id('crystals'));
    else if (k < 0.29 && f.ruins) {
      g.set(xx, y, id('pillar:base'));
      g.set(xx, y - 1, id('pillar:mid'));
      g.set(xx, y - 2, id('pillar:top'));
    } else if (k < 0.31) g.set(xx, y, id('thorns'));
  }
  // ground runs (for walkers): flat stretches with air above
  {
    let start = -1;
    for (let xx = 0; xx <= W; xx++) {
      const same = xx < W && start >= 0 && h[xx] === h[start];
      if (start >= 0 && !same) {
        if (xx - start >= 3 && Math.min(Math.abs(start - ax), W - Math.abs(start - ax)) > 8) ground.push({ x0: start, x1: xx - 1, y: h[start] - 1 });
        start = -1;
      }
      if (start < 0 && xx < W) start = xx;
    }
  }
  // clouds and floating islands
  for (let k = 0; k < 10; k++) {
    const cx = Math.floor(r() * W);
    const cy = 10 + Math.floor(r() * 12);
    if (g.get(cx, cy) !== id('air')) continue;
    if (r() < 0.5) g.set(cx, cy, id('cloud:puff'));
    else if (g.get(cx + 1, cy) === id('air') && g.get(cx + 2, cy) === id('air')) {
      g.set(cx, cy, id('cloud:l'));
      g.set(cx + 1, cy, id('cloud:m'));
      g.set(cx + 2, cy, id('cloud:r'));
    }
  }
  for (let k = 0; k < f.islands; k++) {
    const ix = Math.floor(r() * W);
    const len = 4 + Math.floor(r() * 5);
    const iy = Math.min(...Array.from({ length: len }, (_, i) => h[wx(ix + i)])) - 6 - Math.floor(r() * 6);
    if (iy < 12) continue;
    if (Math.min(Math.abs(ix - ax), W - Math.abs(ix - ax)) < 6) continue;
    for (let i = 0; i < len; i++) {
      const b = i === 0 ? 'ledge:l' : i === len - 1 ? 'ledge:r' : 'ledge:m';
      g.set(ix + i, iy, id(b));
      if (i > 0 && i < len - 1) g.set(ix + i, iy + 1, id('island:under'));
    }
    for (let i = 1; i < len - 1; i++) if (r() < 0.5) treasure.push({ x: wx(ix + i), y: iy - 1 });
    sky.push({ x: wx(ix + Math.floor(len / 2)), y: iy - 3 });
  }
  for (let k = 0; k < 14; k++) {
    const sx = Math.floor(r() * W);
    const sy = 12 + Math.floor(r() * 16);
    if (g.get(sx, sy) === id('air') && sy < h[sx] - 3) sky.push({ x: sx, y: sy });
  }

  // --- landing site: pad under Max, the uplink beacon beside him
  g.set(ax, h[ax], id('pad'), true);
  g.set(ax + 1, h[ax], id('pad'), true);
  g.set(ax, ay, id('air'), true);
  g.set(ax, ay - 1, id('air'), true);
  g.set(uplink.x, uplink.y, id('uplink'), true);
  g.set(ax - 2, ay, id('sign:right'), true);

  // --- pickups: open air on islands and the surface, the rest in caves
  const pick = (ids: PickupId[]) => ids[Math.floor(r() * ids.length)];
  for (const t of treasure) if (g.get(t.x, t.y) === id('air')) g.set(t.x, t.y, id(`p:${pick(OPEN_AIR_PICKUPS.slice(0, 3))}`));
  for (const run of ground)
    if (r() < 0.25) {
      const tx = run.x0 + Math.floor(r() * (run.x1 - run.x0 + 1));
      if (g.get(tx, run.y) === id('air')) g.set(tx, run.y, id(`p:${pick(['credit', 'credit', 'gem'])}`));
    }
  const cavePick: PickupId[] = ['credit', 'credit', 'credit', 'gem', 'gem', 'heart', 'plasma', 'nova', 'shield', 'mines', 'medkit', 'flak'];
  let placed = 0;
  for (const run of caveFloor) {
    if (r() < 0.35) {
      const tx = run.x0 + Math.floor(r() * (run.x1 - run.x0 + 1));
      if (fam('cave').includes(g.get(tx, run.y))) {
        g.set(tx, run.y, id(`pc:${pick(cavePick)}`));
        placed++;
      }
    }
  }
  if (r() < 0.5 && caveFloor.length) {
    const run = caveFloor[Math.floor(r() * caveFloor.length)];
    g.set(run.x0, run.y, id('pc:oneup'));
  }

  return { grid: g, arrive, uplink, vault, ground, caveFloor, sky, caveAir, ceilings, surfaceH: h, treasure };
}

/** True if every cell the prize needs is reachable from the landing site. */
export function checkPlanet(p: PlanetResult, bbl: Block[], passable: (b: number) => boolean): string[] {
  const seen = reachable(p.grid, bbl, p.arrive.x, p.arrive.y, { pass: passable });
  const problems: string[] = [];
  if (!seen[p.uplink.y * W + p.uplink.x]) problems.push('uplink unreachable');
  if (p.vault && !seen[p.vault.y * W + p.vault.x]) problems.push('vault unreachable');
  return problems;
}
