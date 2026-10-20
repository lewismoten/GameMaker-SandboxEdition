// The end of the road: the Maelstrom (an asteroid storm packed with 200 monsters, every
// slot Game-Maker has), the Citadel around the Core, and the Heart itself.
import { rng } from '../kit/pixels';
import { Grid, W, H, wx, wy } from './mapkit';
import type { SetBuilder } from './blockset';
import type { MonsterSet } from './bestiary';
import type { P } from './spacemaps';

export interface MaelstromResult {
  grid: Grid;
  arrive: P;
  exitWarp: P;
  citadel: P;
  citadelArrive: P;
}

/** A storm of 200 tumbling rocks between the galaxy and the Citadel. */
export function maelstromMap(s: SetBuilder, ms: MonsterSet): MaelstromResult {
  const r = rng(9090);
  const g = new Grid();
  const voids = [0, 1, 2, 3].map((k) => s.id(`void:${k}`));
  const nebs = [0, 1, 2, 3, 4, 5].map((k) => s.id(`neb:${k}`));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, (x * 7 + y * 13) % 17 < 5 ? nebs[(x + y) % 6] : voids[Math.floor(r() * 4)]);
  // the route: from the warp at the bottom to the Citadel dock at the top; walls of rock
  // on both sides make a winding canyon the storm pours through
  const path: P[] = [];
  let cx = 50;
  for (let y = 92; y >= 8; y--) {
    cx += Math.round(Math.sin(y * 0.15) * 1.2 + (r() - 0.5) * 1.2);
    path.push({ x: wx(cx), y });
  }
  const rocks = [0, 1, 2, 3, 4].map((k) => s.id(`rock:${k}`));
  // everything outside the canyon is solid rock: the storm is the only way through
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = path.find((q) => q.y === y);
      let d = 99;
      let half = 0;
      if (p) {
        d = Math.abs(x - p.x);
        d = Math.min(d, W - d);
        half = 9 + Math.round(Math.sin(y * 0.3) * 3);
      }
      if (d > half + 2) g.set(x, y, s.id('rock:big'));
      else if (d > half) g.set(x, y, r() < 0.5 ? s.id('rock:big') : rocks[Math.floor(r() * 5)], true);
    }
  // open the start bay around the warp and the arrival point
  for (let y = 86; y <= 93; y++) for (let x = path[0].x - 8; x <= path[0].x + 8; x++) g.set(x, y, voids[(x + y) & 3]);
  const start = path[0];
  const end = path[path.length - 1];
  const exitWarp = { x: wx(start.x - 4), y: 90 };
  g.set(exitWarp.x, exitWarp.y, s.id('warp0:tl'), true);
  g.set(exitWarp.x + 1, exitWarp.y, s.id('warp0:tr'), true);
  g.set(exitWarp.x, exitWarp.y + 1, s.id('warp0:bl'), true);
  g.set(exitWarp.x + 1, exitWarp.y + 1, s.id('warp0:br'), true);
  const arrive = { x: start.x, y: 88 };
  // the Citadel dock at the top
  for (let y = end.y - 4; y <= end.y - 1; y++) for (let x = end.x - 3; x <= end.x + 3; x++) g.set(x, y, s.id(`hull:${(x + y) & 3}`), true);
  const citadel = { x: end.x, y: end.y - 1 };
  g.set(citadel.x, citadel.y, s.id('dock'), true);
  // supplies along the way
  for (let k = 0; k < 14; k++) {
    const p = path[8 + Math.floor((k * (path.length - 16)) / 14)];
    g.set(wx(p.x + Math.floor(r() * 9) - 4), p.y, s.id(k % 3 === 0 ? 'p:heart' : k % 3 === 1 ? 'p:credit' : 'p:gem'));
  }
  // the storm: all 200 monster slots, indestructible rocks and lightning (weapons are
  // useless here - there is no free slot left for a single bolt)
  const storm = ['Pebble', 'Asteroid', 'Boulder', 'Space Urchin', 'Ion Storm', 'Debris', 'Ice Comet', 'Star Whale'].map((n) => ms.index.get(n)!);
  const weights = [34, 40, 12, 12, 8, 66, 8, 2];
  const bag: number[] = [];
  storm.forEach((m, i) => {
    for (let k = 0; k < weights[i]; k++) bag.push(m);
  });
  let tries = 0;
  while (g.monsters.length < 200 && tries++ < 20000) {
    const p = path[10 + Math.floor(r() * (path.length - 14))];
    const x = wx(p.x + Math.floor(r() * 17) - 8);
    const y = wy(p.y + Math.floor(r() * 3) - 1);
    if (Math.abs(y - arrive.y) < 6) continue;
    const b = s.blocks[g.get(x, y)];
    if (b.solid || b.effect || b.chHitPt) continue;
    g.place(bag[Math.floor(r() * bag.length)], x, y);
  }
  return { grid: g, arrive, exitWarp, citadel, citadelArrive: { x: wx(end.x + 2), y: end.y + 1 } };
}

export interface HeartResult {
  grid: Grid;
  arrive: P;
  back: P;
  exit: P;
}

/** The Heart: a long hall, the Guardian's armored face across it, the exit beyond. */
export function heartMap(s: SetBuilder, ms: MonsterSet): HeartResult {
  const r = rng(4747);
  const g = new Grid();
  const id = (n: string) => s.id(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, id('hull'));
  // the hall: rows 40..55, columns 10..90
  const top = 38;
  const floor = 56;
  for (let y = top; y < floor; y++) for (let x = 10; x < 90; x++) g.set(x, y, (x + y) % 11 === 0 ? id('panel:3') : id('panel:dark'));
  for (let x = 9; x <= 90; x++) g.set(x, floor, id('deck:plate'));
  // platforms up the walls
  for (let k = 0; k < 8; k++) {
    const px = 14 + k * 6;
    const py = floor - 3 - (k % 3) * 4;
    for (let i = 0; i < 3; i++) g.set(px + i, py, id('deck:grate'));
  }
  // reactor lights on the back wall
  for (const x of [20, 40, 60]) {
    g.set(x, top + 3, id('reactor:0'));
    g.set(x + 1, top + 3, id('reactor:1'));
    g.set(x, top + 4, id('reactor:2'));
    g.set(x + 1, top + 4, id('reactor:3'));
  }
  // nests that fire at you, and lasers on the shared clock
  for (const x of [30, 50, 68]) g.set(x, top, id('nest:0'));
  for (const x of [34, 56]) for (let y = top + 1; y < floor; y++) g.set(x, y, id('laser:v'));
  // supplies
  for (const x of [16, 26, 44, 52, 62]) g.set(x, floor - 1, id(['p:plasma', 'p:heart', 'p:plasma', 'p:shield', 'p:medkit'][x % 5]));
  g.set(22, floor - 1, id('p:plasma'));
  g.set(46, floor - 7, id('p:heart'));
  // entry and exit
  const arrive = { x: 13, y: floor - 1 };
  const back = { x: 11, y: floor - 1 };
  g.set(back.x, back.y, id('airlock'), true);
  g.set(back.x, back.y - 1, id('airlock'), true);
  const exit = { x: 86, y: floor - 1 };
  for (let y = top; y < floor; y++) g.set(87, y, id('wall:1'));
  g.set(exit.x, exit.y, id('teleport'), true);
  g.set(exit.x, exit.y - 1, id('teleport'), true);
  g.set(exit.x - 1, exit.y, id('p:oneup'), true);
  // the Guardian: a wall of armor plates across the whole hall at x 76..78; the Heart's
  // eye roams in front of it. Plasma cracks plates (twice each); the eye falls only to a
  // shield orb.
  const plate = ms.index.get('Guardian Plate')!;
  for (let y = top; y < floor; y++) for (let x = 76; x <= 78; x++) if ((x + y) % 2 === 0 || x === 77) g.place(plate, x, y);
  g.place(ms.index.get('Heart Eye')!, 70, 46);
  g.place(ms.index.get('Overseer')!, 60, 42);
  g.place(ms.index.get('Hunter-Killer')!, 50, 44);
  g.place(ms.index.get('Hunter-Killer')!, 40, 44);
  for (let k = 0; k < 6; k++) g.place(ms.index.get('Tesla Orb')!, 24 + k * 9, floor - 6 - (k % 2) * 4);
  void r;
  return { grid: g, arrive, back, exit };
}
