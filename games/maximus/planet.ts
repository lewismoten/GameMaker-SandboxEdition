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
  /** The world's biome: decides what grows on it. */
  biome?: string;
  features?: { lakes?: boolean; islands?: number; winds?: boolean; fields?: boolean; caves?: number; ruins?: boolean; rover?: boolean };
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
  const f = { lakes: true, islands: 4, winds: false, fields: true, caves: 8, ruins: true, rover: false, ...spec.features };
  if (f.rover) Object.assign(f, { lakes: false, islands: 0, caves: 0 });

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
  // never a step of more than 3 between neighbours (hop height); 1 for rover worlds
  const maxStep = f.rover ? 1 : 3;
  for (let pass = 0; pass < 6; pass++) for (let i = 0; i < W; i++) h[i] = Math.max(h[i], Math.min(h[(i + 1) % W], h[(i + W - 1) % W]) - maxStep);
  // --- arrival: the first long flat stretch
  let ax = 8;
  let found = false;
  for (let i = 0; i < W && !found; i++) {
    const xs = (i + 6) % W;
    if ([0, 1, 2, 3, 4, 5, 6, 7].every((k) => h[(xs + k) % W] === h[xs])) {
      ax = wx(xs + 4);
      found = true;
    }
  }
  // no stretch long enough: flatten one
  if (!found) for (let k = -4; k <= 3; k++) h[wx(ax + k)] = h[ax];
  const ay = h[ax] - 1;
  const arrive = { x: ax, y: ay };
  // the uplink stands behind Max (players walk right, into the world, not back to orbit)
  const uplink = { x: wx(ax - 3), y: ay };

  // rover worlds keep their prize in a ruin on the surface, on flattened ground, round the far side
  const surfaceVault = f.rover ? wx(ax + 50) : -1;
  if (f.rover) for (let i = -6; i <= 6; i++) h[wx(surfaceVault + i)] = h[surfaceVault];

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
      else if (y < 70) b = r() < 0.015 ? pickOne([id('ore:0'), id('ore:1')]) : pickOne(fam('rock'));
      else if (y < BEDROCK) b = pickOne(fam('deep'));
      else b = id('bedrock');
      g.set(xx, y, b);
    }

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
  for (let k = 0; k < (f.rover ? 0 : 3 + Math.floor(r() * 4)); k++) {
    const cx = r() * W;
    const cy = 56 + r() * 24;
    carve(cx, cy, 4 + r() * 4, 2.5 + r() * 2);
    chambers.push({ x: Math.round(cx), y: Math.round(cy) });
  }
  // shafts from the surface (well away from the landing site)
  const shafts: number[] = [];
  for (let k = 0; k < (f.rover ? 0 : 3); k++) {
    let sx = wx(ax + 15 + k * 28 + Math.floor(r() * 10));
    shafts.push(sx);
    for (let yy = h[sx]; yy < 80; yy++) {
      for (let dx = -1; dx <= 1; dx++) carved[yy * W + wx(sx + dx)] = 1;
      if (r() < 0.12) sx = wx(sx + (r() < 0.5 ? -1 : 1));
    }
  }
  // the vault room (ruins, the shard or module waits inside)
  let vault: Spot | undefined;
  if (!f.rover) {
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
  const gatePass = (b: number) => b === id('door') || b === id('field:on') || b === id('field:on2') || b === id('field:off');
  const joinAll = () => {
    for (let guard = 0; guard < 40; guard++) {
      const seen = reachable(g, bbl, arrive.x, arrive.y, { pass: gatePass });
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
        const done = step > 3 && reachable(g, bbl, arrive.x, arrive.y, { pass: gatePass })[vy * W + wx(cx)];
        for (const oy of [0, -1]) {
          if (!isOpen(g.get(cx, vy + oy))) g.set(cx, vy + oy, pickOne(fam('cave')), true);
          carved[wy(vy + oy) * W + wx(cx)] = 1;
        }
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

  // --- rover worlds: the prize sits in a ruin on the surface; lifts climb every step
  if (f.rover) {
    const vx = surfaceVault;
    const vy = h[vx] - 1;
    vault = { x: vx, y: vy };
    for (let xx = vx - 4; xx <= vx + 4; xx++) {
      g.set(xx, vy - 3, id('ruin:block'), true);
      for (let yy = vy - 2; yy <= vy; yy++) g.set(xx, yy, id('air'), true);
    }
    for (const yy of [vy, vy - 1, vy - 2]) {
      g.set(vx - 4, yy, yy === vy - 2 ? id('ruin:block') : id('door'), true);
      g.set(vx + 4, yy, yy === vy - 2 ? id('ruin:block') : id('field:on'), true);
    }
    g.set(vx - 2, vy - 2, id('pillar:top'), true);
    g.set(vx + 2, vy - 2, id('pillar:top'), true);
    // lifts on both sides carry the rover over the roof (the vault is a side trip)
    for (let yy = vy - 5; yy <= vy; yy++) {
      g.set(vx - 5, yy, id('lift'), true);
      g.set(vx + 5, yy, id('lift'), true);
    }
    const prize = spec.shard !== undefined ? id(`shard:${spec.shard}`) : spec.module !== undefined ? id(`module:${spec.module}`) : id('p:oneup');
    g.set(vx, vy, prize, true);
    g.set(vx - 2, vy, id('p:gem'), true);
    g.set(vx + 2, vy, id('p:credit'), true);
    for (let xx = 0; xx < W; xx++) {
      const up = Math.min(h[(xx + 1) % W], h[(xx + W - 1) % W]);
      if (up < h[xx] && !g.isLocked(xx, h[xx] - 1)) for (let yy = up - 2; yy <= h[xx] - 1; yy++) if (!g.isLocked(xx, yy)) g.set(xx, yy, id('lift'));
    }
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
        else if (k < 0.13 + 0.02 * spec.level && !solidAt(xx, yy - 1) && !solidAt(xx, yy - 2) && !solidAt(xx, yy - 3)) g.set(xx, yy, id('spikes:cave'));
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
    const depth = spec.biome === 'lava' || spec.biome === 'toxic' ? 3 : 1;
    for (let i = 0; i < W; i++) if (h[i] >= Math.max(...h) - depth && Math.abs(i - ax) > 8 && Math.abs(i - ax) < W - 8) dips.push(i);
    for (const i of dips) {
      if (g.isLocked(i, h[i])) continue;
      g.set(i, h[i], id('liquid:top'));
      g.set(i, h[i] + 1, id('liquid'));
    }
  }

  // --- surface dressing
  const FLORA: Record<string, [string, number][]> = {
    verdant: [
      ['tree', 8],
      ['bush:0', 5],
      ['bush:1', 4],
      ['grass:0', 5],
      ['grass:1', 4],
      ['flowers', 5],
      ['sapling', 3],
      ['boulder', 2],
      ['pillar', 1],
    ],
    autumn: [
      ['tree', 9],
      ['bush:0', 4],
      ['stump', 4],
      ['grass:1', 4],
      ['mushroom', 3],
      ['sapling', 2],
      ['boulder', 2],
      ['pillar', 2],
    ],
    jungle: [
      ['tree', 14],
      ['bush:0', 6],
      ['bush:1', 6],
      ['flowers', 4],
      ['grass:0', 5],
      ['thorns', 2],
      ['totem', 1],
    ],
    desert: [
      ['cactus', 7],
      ['boulder', 4],
      ['skulls', 3],
      ['totem', 2],
      ['pillar', 3],
      ['grass:1', 2],
      ['thorns', 2],
    ],
    ice: [
      ['crystals', 6],
      ['boulder', 4],
      ['sapling', 3],
      ['tree', 2],
      ['totem', 1],
      ['skulls', 1],
    ],
    lava: [
      ['boulder', 6],
      ['crystals', 4],
      ['skulls', 3],
      ['totem', 2],
      ['stump', 2],
      ['thorns', 2],
    ],
    toxic: [
      ['mushroom', 5],
      ['thorns', 4],
      ['flowers', 4],
      ['bush:1', 4],
      ['grass:0', 3],
      ['skulls', 1],
    ],
    crystal: [
      ['crystals', 10],
      ['totem', 3],
      ['boulder', 3],
      ['pillar', 2],
      ['sapling', 1],
    ],
    fungal: [
      ['mushroom', 10],
      ['sapling', 3],
      ['bush:1', 3],
      ['flowers', 2],
      ['stump', 2],
    ],
    ash: [
      ['stump', 5],
      ['skulls', 4],
      ['boulder', 4],
      ['totem', 2],
      ['pillar', 2],
      ['thorns', 2],
    ],
  };
  const flora = FLORA[spec.biome ?? 'verdant'] ?? FLORA.verdant;
  const sky: Spot[] = [];
  const treasure: Spot[] = [];
  for (let xx = 0; xx < W; xx++) {
    const y = h[xx] - 1;
    const dist = Math.min(Math.abs(xx - ax), W - Math.abs(xx - ax));
    if (dist < 5 || g.get(xx, h[xx]) === id('liquid:top')) continue;
    if (fam('cave').includes(g.get(xx, y)) || g.get(xx, y) !== id('air')) continue;
    const flatRight = h[(xx + 1) % W] === h[xx] && g.get(xx + 1, y) === id('air');
    // what grows here depends on the world: a weighted pick from its flora
    const roll = r() * 100;
    let acc = 0;
    let what = '';
    for (const [name, wgt] of flora) {
      acc += wgt;
      if (roll < acc) {
        what = name;
        break;
      }
    }
    if (what === 'tree' && flatRight && dist > 6) {
      g.set(xx, y, id('tree:trunk'));
      g.set(xx, y - 1, id('tree:bl'));
      g.set(xx + 1, y - 1, id('tree:br'));
      g.set(xx, y - 2, id('tree:tl'));
      g.set(xx + 1, y - 2, id('tree:tr'));
      xx++;
    } else if (what === 'pillar' && f.ruins) {
      g.set(xx, y, id('pillar:base'));
      g.set(xx, y - 1, id('pillar:mid'));
      g.set(xx, y - 2, id('pillar:top'));
    } else if (what === 'thorns') {
      if (!f.rover) g.set(xx, y, id('thorns'));
    } else if (what && what !== 'tree' && what !== 'pillar') g.set(xx, y, id(what));
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
  g.set(ax + 2, ay, id('sign:right'), true);
  g.set(ax - 2, ay, id('air'), true);
  g.set(ax - 1, ay, id('air'), true);

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

  // --- features: nests, secret pockets, waterfalls, healing springs, sky winds, bridges
  const caveIds = fam('cave');
  const isCave = (xx: number, yy: number) => caveIds.includes(g.get(xx, yy));
  const plainRock = (xx: number, yy: number) =>
    !g.isLocked(xx, yy) && (fam('rock').includes(g.get(xx, yy)) || fam('deep').includes(g.get(xx, yy)) || fam('soil').includes(g.get(xx, yy)));
  // monster nests in cave walls, more on harder worlds
  let nests = 0;
  for (let t = 0; t < 4000 && nests < 2 + spec.level; t++) {
    const xx = Math.floor(r() * W);
    const yy = 50 + Math.floor(r() * 36);
    if (!plainRock(xx, yy)) continue;
    const side = isCave(xx - 1, yy) && isCave(xx - 1, yy - 1) ? -1 : isCave(xx + 1, yy) && isCave(xx + 1, yy - 1) ? 1 : 0;
    if (!side) continue;
    if (Math.min(Math.abs(xx - ax), W - Math.abs(xx - ax)) < 12) continue;
    g.set(xx, yy, id(`nest:${nests % 4}`), true);
    nests++;
  }
  // secret pockets behind fake rock or crystal glass, with a treasure inside
  let secrets = 0;
  for (let t = 0; t < 4000 && secrets < 3; t++) {
    const xx = Math.floor(r() * W);
    const yy = 48 + Math.floor(r() * 36);
    if (!isCave(xx, yy) || !isCave(xx, yy - 1) || !plainRock(xx, yy + 1)) continue;
    const dir = r() < 0.5 ? -1 : 1;
    // room for a 3x2 pocket in solid rock beside this cave cell
    const cells: [number, number][] = [];
    for (let i = 1; i <= 4; i++) for (const oy of [0, -1]) cells.push([xx + dir * i, yy + oy]);
    if (!cells.every(([cx, cy]) => plainRock(cx, cy) && plainRock(cx, cy - 1) && plainRock(cx, cy + 1))) continue;
    const seal = secrets % 2 === 0 ? id('fake') : id('glass');
    for (const oy of [0, -1]) g.set(xx + dir, yy + oy, seal, true);
    for (let i = 2; i <= 4; i++) for (const oy of [0, -1]) g.set(xx + dir * i, yy + oy, id('cave:0'), true);
    g.set(xx + dir * 3, yy, id(spec.level >= 3 && secrets === 0 ? 'pc:oneup' : 'pc:gem'), true);
    g.set(xx + dir * 4, yy, id('pc:credit'), true);
    g.set(xx + dir * 2, yy, id(['pc:plasma', 'pc:nova', 'pc:shield', 'pc:mines', 'pc:medkit', 'pc:flak'][Math.floor(r() * 6)]), true);
    secrets++;
  }
  // waterfalls from cave ceilings
  for (let t = 0, falls = 0; t < 3000 && falls < 3; t++) {
    const xx = Math.floor(r() * W);
    const yy = 48 + Math.floor(r() * 36);
    if (!plainRock(xx, yy - 1) || !isCave(xx, yy)) continue;
    let len = 0;
    while (isCave(xx, yy + len) && len < 8) len++;
    if (len < 3) continue;
    for (let i = 0; i < len; i++) g.set(xx, yy + i, id(`fall:${i % 3}`));
    falls++;
  }
  // a healing spring on a cave floor
  for (let t = 0; t < 2000; t++) {
    const run = caveFloor[Math.floor(r() * caveFloor.length)];
    if (!run) break;
    const xx = run.x0 + Math.floor(r() * (run.x1 - run.x0 + 1));
    if (!isCave(xx, run.y) || g.isLocked(xx, run.y)) continue;
    g.set(xx, run.y, id('heal'), true);
    break;
  }
  // high winds: bands of current across the upper sky
  if (!f.rover)
    for (let k = 0; k < 2; k++) {
      const wy0 = 12 + Math.floor(r() * 8);
      const wx0 = Math.floor(r() * W);
      const dir = r() < 0.5 ? 'wind:r' : 'wind:l';
      for (let i = 0; i < 14 + Math.floor(r() * 12); i++) if (g.get(wx0 + i, wy0) === id('air')) g.set(wx0 + i, wy0, id(dir));
    }
  // bridges over some lakes
  for (let xx = 0; xx < W; xx++) {
    if (g.get(xx, h[xx]) !== id('liquid:top') || r() < 0.5) continue;
    let e = xx;
    while (g.get(e, h[wx(e)]) === id('liquid:top') && e - xx < 12) e++;
    for (let i = xx - 1; i <= e; i++) if (g.get(i, h[wx(i)] - 1) === id('air')) g.set(i, h[wx(xx)] - 1, id('bridge'));
    xx = e;
  }

  return { grid: g, arrive, uplink, vault, ground, caveFloor, sky, caveAir, ceilings, surfaceH: h, treasure };
}

/** True if every cell the prize needs is reachable from the landing site. */
export function checkPlanet(p: PlanetResult, bbl: Block[], passable: (b: number) => boolean, tall = true): string[] {
  const seen = reachable(p.grid, bbl, p.arrive.x, p.arrive.y, { pass: passable, tall });
  const problems: string[] = [];
  if (!seen[p.uplink.y * W + p.uplink.x]) problems.push('uplink unreachable');
  if (p.vault && !seen[p.vault.y * W + p.vault.x]) problems.push('vault unreachable');
  return problems;
}
