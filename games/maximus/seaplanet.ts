// Ocean worlds for OCEAN.BBL: a strip of sky, the rolling surface, then a deep water
// column over reefs, kelp forests, trenches and wrecks, down to a sunken temple.
import { rng } from '../kit/pixels';
import { Grid, H, W, reachable, wave1d, wx } from './mapkit';
import type { SetBuilder } from './blockset';
import type { PlanetResult, PlanetSpec, Run, Spot } from './planet';

const SURFACE = 12;
const FLOOR_BOTTOM = 85;

export function oceanPlanet(spec: PlanetSpec, s: SetBuilder): PlanetResult {
  const r = rng(spec.seed);
  const id = (n: string) => s.id(n);
  const pickOne = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const g = new Grid();
  const n = wave1d(spec.seed + 5, [
    [1, 6 + r() * 4],
    [3, 3 + r() * 3],
    [6, 1 + r() * 2],
    [11, r()],
  ]);
  const floor = Array.from({ length: W }, (_, x) => Math.round(50 + n(x) * 1.4));
  // a trench or two plunging toward the abyss
  for (let k = 0; k < 2; k++) {
    const tx = Math.floor(r() * W);
    const w = 3 + Math.floor(r() * 4);
    for (let i = -w; i <= w; i++) floor[wx(tx + i)] = Math.max(floor[wx(tx + i)], 80 - Math.abs(i));
  }
  const waterAt = (y: number) => id(`water:${Math.max(0, Math.min(7, Math.floor((y - SURFACE - 1) / 9)))}`);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let b: number;
      if (y === 0 || y >= 95) b = id('ceiling');
      else if (y < SURFACE) b = id('air');
      else if (y === SURFACE) b = id('surf:0');
      else if (y < floor[x]) b = waterAt(y);
      else if (y === floor[x]) b = pickOne([id('sand:top0'), id('sand:top1'), id('sand:top2'), id('sand:top3')]);
      else if (y < floor[x] + 4) b = pickOne([id('sand:0'), id('sand:1'), id('sand:2'), id('sand:3')]);
      else if (y < FLOOR_BOTTOM - 6) b = pickOne([id('reef:0'), id('reef:1'), id('reef:2'), id('reef:3'), id('reef:4')]);
      else if (y < FLOOR_BOTTOM + 4) b = pickOne([id('abyss:0'), id('abyss:1')]);
      else b = id('bedrock');
      g.set(x, y, b);
    }
  // reef towers: pillars of rock rising from the floor toward the light, with ledges
  const trench = floor.indexOf(Math.max(...floor));
  for (let k = 0; k < 5; k++) {
    const tx = Math.floor(r() * W);
    const top = SURFACE + 7 + Math.floor(r() * 12);
    if (Math.min(Math.abs(tx - trench), W - Math.abs(tx - trench)) < 10) continue;
    const wdt = 2 + Math.floor(r() * 2);
    for (let i = 0; i < wdt; i++) {
      const x = wx(tx + i);
      for (let y = top + (i === 0 || i === wdt - 1 ? 1 : 0); y < floor[x]; y++) g.set(x, y, pickOne([id('reef:0'), id('reef:1'), id('reef:3'), id('reef:4')]));
    }
    // ledges out from the tower every few rows
    for (let y = top + 3; y < Math.min(...[0, 1].map((i) => floor[wx(tx + i)])) - 2; y += 5 + Math.floor(r() * 3)) {
      const side = r() < 0.5 ? -1 : wdt;
      g.set(tx + side, y, id('reef:ledge'));
      g.set(tx + side + (side < 0 ? -1 : 1), y, id('reef:ledge'));
    }
  }
  // clouds and an island or two
  for (let k = 0; k < 6; k++) g.set(Math.floor(r() * W), 3 + Math.floor(r() * 6), id('air:cloud'));
  const islandX = Math.floor(r() * W);
  for (let i = 0; i < 5; i++) {
    g.set(islandX + i, SURFACE, id('island'));
    g.set(islandX + i, SURFACE - 1, i === 0 || i === 4 ? id('air') : id('island'));
    for (let y = SURFACE + 1; y < floor[wx(islandX + i)]; y++) if (y < SURFACE + 4) g.set(islandX + i, y, pickOne([id('sand:0'), id('reef:0')]));
  }
  g.set(islandX + 2, SURFACE - 2, id('palm'));

  // arrival: just under the waves, away from the island; the uplink buoy beside it
  let ax = wx(islandX + 40);
  const ay = SURFACE + 1;
  const arrive = { x: ax, y: ay };
  const uplink = { x: wx(ax - 3), y: SURFACE };
  g.set(uplink.x, uplink.y, id('uplink'), true);
  g.set(ax + 1, SURFACE, id('raft'), true);

  // caves into the reef
  const carved: Spot[] = [];
  for (let k = 0; k < 6; k++) {
    let cx = r() * W;
    let cy = floor[Math.floor(cx)] + 4 + r() * 10;
    let dir = r() < 0.5 ? 0 : Math.PI;
    for (let i = 0; i < 25 + r() * 40; i++) {
      for (let yy = Math.floor(cy - 1); yy <= cy + 1; yy++)
        for (let xx = Math.floor(cx - 1); xx <= cx + 1; xx++) {
          if (yy < floor[wx(xx)] + 1 || yy > FLOOR_BOTTOM) continue;
          g.set(xx, yy, id('water:dark'));
          carved.push({ x: wx(xx), y: yy });
        }
      dir += (r() - 0.5) * 0.7;
      cx += Math.cos(dir) * 1.2;
      cy += Math.sin(dir) * 0.6;
      cy = Math.max(floor[wx(Math.floor(cx))] + 2, Math.min(FLOOR_BOTTOM - 1, cy));
    }
  }
  // the sunken temple: deep, in the floor, under the deepest trench
  let deepest = 0;
  for (let x = 0; x < W; x++) if (floor[x] > floor[deepest]) deepest = x;
  const vx = deepest;
  const vy = Math.min(FLOOR_BOTTOM - 1, floor[deepest] + 6);
  for (let yy = vy - 5; yy <= vy + 1; yy++)
    for (let xx = vx - 6; xx <= vx + 6; xx++) {
      const edge = yy === vy - 5 || yy === vy + 1 || Math.abs(xx - vx) === 6;
      g.set(xx, yy, edge ? id('ruin:wall') : id('water:dark'), true);
    }
  // its entrance shaft from the trench floor
  for (let yy = floor[deepest]; yy <= vy - 5; yy++) {
    g.set(vx, yy, id('water:7'), true);
    g.set(vx + 1, yy, id('water:7'), true);
  }
  g.set(vx, vy - 5, id('field:on'), true);
  g.set(vx + 1, vy - 5, id('door'), true);
  g.set(vx - 3, vy, id('pillar'), true);
  g.set(vx - 3, vy - 1, id('pillar:top'), true);
  g.set(vx + 3, vy, id('statue'), true);
  const prize = spec.shard !== undefined ? id(`shard:${spec.shard}`) : spec.module !== undefined ? id(`module:${spec.module}`) : id('p:oneup');
  g.set(vx, vy, prize, true);
  g.set(vx - 1, vy, id('pearl'), true);
  g.set(vx + 1, vy, id('p:gem'), true);
  const vault = { x: vx, y: vy };

  // floor life: kelp forests, coral, shells; hazards
  const ground: Run[] = [];
  const ceilings: Spot[] = [];
  let run = -1;
  for (let x = 0; x <= W; x++) {
    const fx = wx(x);
    const y = floor[fx] - 1;
    const flat = x < W && run >= 0 && floor[fx] === floor[run];
    if (run >= 0 && !flat) {
      if (x - run >= 3) ground.push({ x0: run, x1: x - 1, y: floor[run] - 1 });
      run = -1;
    }
    if (run < 0 && x < W) run = x;
    if (x >= W || g.isLocked(fx, y)) continue;
    const k = r();
    if (k < 0.12) {
      const h = 2 + Math.floor(r() * 5);
      const red = r() < 0.25;
      for (let i = 0; i < h; i++) g.set(fx, y - i, id(i === h - 1 ? (red ? 'kelp:top3' : i % 2 ? 'kelp:top2' : 'kelp:top') : red ? 'kelp:mid3' : 'kelp:mid'));
    } else if (k < 0.24) g.set(fx, y, id(`coral:${Math.floor(r() * 10)}`));
    else if (k < 0.28)
      g.set(fx, y, id(y > 70 ? pickOne(['coral:deep', 'glowstone:0', 'glowstone:1', 'chimney:0']) : pickOne(['shell', 'bigshell', 'weed:0', 'weed:1'])));
    else if (k < 0.31) g.set(fx, y, id(pickOne(['rocks', 'skullrock', 'rocks'])));
    else if (k < 0.315) g.set(fx, y, id(pickOne(['anchor', 'lamp', 'obelisk', 'statue:2', 'chest'])));
    else if (k < 0.31 + 0.015 * spec.level) g.set(fx, y, id('anemone'));
    else if (k < 0.35 + 0.01 * spec.level) g.set(fx, y, id('urchins'));
    else if (k < 0.37) g.set(fx, y, id('bones'));
  }
  // a wreck on the bottom
  {
    let wxp = wx(ax + 25 + Math.floor(r() * 30));
    const nearVault = (x: number) => Math.min(Math.abs(x - vx), W - Math.abs(x - vx)) < 12;
    for (let t = 0; t < 20 && nearVault(wxp); t++) wxp = wx(wxp + 13);
    const base = Math.min(...[0, 1, 2, 3, 4, 5].map((i) => floor[wx(wxp + i)])) - 1;
    for (let i = 0; i < 6; i++) {
      g.set(wxp + i, base, id(i === 5 ? 'wreck:4' : i === 2 ? 'wreck:3' : `wreck:${i % 3}`));
      g.set(wxp + i, base - 1, i === 0 || i === 5 ? waterAt(base - 1) : id(i === 3 ? 'wreck:3' : 'wreck:1'));
      for (let y = base + 1; y < floor[wx(wxp + i)]; y++) g.set(wxp + i, y, id('wreck:0'));
    }
    g.set(wxp + 2, base, id('p:credit'));
    g.set(wxp + 4, base - 2, id('cannon'));
    g.set(wxp + 1, base - 2, id('grate'));
    g.set(wxp + 3, base - 1, id('p:gem'));
  }
  // currents and bubble columns
  for (let k = 0; k < 3; k++) {
    const cy = SURFACE + 8 + Math.floor(r() * 30);
    const cx = Math.floor(r() * W);
    const dir = r() < 0.5 ? 'r' : 'l';
    for (let i = 0; i < 16; i++) if (g.get(cx + i, cy) === waterAt(cy) && !g.isLocked(cx + i, cy)) g.set(cx + i, cy, id(`current:${dir}`));
  }
  for (let k = 0; k < 4; k++) {
    const bx = Math.floor(r() * W);
    if (Math.abs(bx - ax) < 6) continue;
    g.set(bx, floor[bx], id('vent'));
    const hot = r() < 0.4;
    for (let y = floor[bx] - 1; y > SURFACE + 2; y--) if (!g.isLocked(bx, y)) g.set(bx, y, id(hot && y > floor[bx] - 4 ? 'hotwater' : 'bubbles'));
  }
  // life in the open water: fish schools, plankton blooms, bubbles; old sea mines
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(r() * W);
    const y = SURFACE + 3 + Math.floor(r() * (floor[x] - SURFACE - 5));
    if (g.get(x, y) !== waterAt(y) || g.isLocked(x, y) || Math.abs(x - ax) < 5) continue;
    g.set(x, y, id(k < 14 ? 'fishschool' : k < 26 ? 'plankton:0' : k < 34 ? 'bubble' : 'seamine'));
  }
  // an old pipeline across the floor and a sunken arch
  {
    const px = Math.floor(r() * W);
    for (let i = 0; i < 18; i++) {
      const x = wx(px + i);
      if (g.isLocked(x, floor[x] - 1)) continue;
      g.set(x, floor[x] - 1, id('pipe:h'));
    }
    const ax2 = wx(px + 30);
    const fy = floor[ax2] - 1;
    if (!g.isLocked(ax2, fy) && floor[wx(ax2 + 2)] - 1 === fy) {
      g.set(ax2, fy, id('arch:l'));
      g.set(ax2, fy - 1, id('arch:l'));
      g.set(ax2 + 1, fy - 1, id('arch:m'));
      g.set(ax2 + 2, fy, id('arch:r'));
      g.set(ax2 + 2, fy - 1, id('arch:r'));
    }
  }
  // treasure scattered in the water and the caves
  const treasure: Spot[] = [];
  const sky: Spot[] = [];
  const caveAir: Spot[] = [];
  for (let k = 0; k < 30; k++) {
    const x = Math.floor(r() * W);
    const y = SURFACE + 3 + Math.floor(r() * (floor[x] - SURFACE - 4));
    if (g.get(x, y) !== waterAt(y) || Math.abs(x - ax) < 4) continue;
    if (k < 14) g.set(x, y, id(`p:${pickOne(['credit', 'credit', 'gem', 'heart'])}`));
    else sky.push({ x, y });
  }
  for (let k = 0; k < carved.length; k += 9) {
    const c = carved[k];
    if (g.get(c.x, c.y) !== id('water:dark')) continue;
    if (k % 27 === 0) g.set(c.x, c.y, id(`p:${pickOne(['credit', 'gem', 'plasma', 'nova', 'shield', 'mines', 'medkit', 'flak', 'heart'])}`));
    else caveAir.push(c);
  }
  // join any sealed pocket (caves can be cut off by the floor)
  for (let guard = 0; guard < 30; guard++) {
    const seen = reachable(g, s.blocks, arrive.x, arrive.y, { tall: false, pass: (b) => b === id('door') || b === id('field:on') || b === id('field:off') });
    const lost = carved.find((c) => !seen[c.y * W + c.x] && g.get(c.x, c.y) === id('water:dark'));
    if (!lost) break;
    for (let y = lost.y; y >= floor[lost.x]; y--) if (!g.isLocked(lost.x, y)) g.set(lost.x, y, id('water:dark'));
  }
  void ax;
  return { grid: g, arrive, uplink, vault, ground, caveFloor: [], sky, caveAir, ceilings, surfaceH: floor, treasure };
}
