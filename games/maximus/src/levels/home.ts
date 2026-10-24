// Maxima Station's training deck: the first scene. One long deck that teaches by doing:
// walk, hop the crates, climb the ledges, shoot the practice drones, grab credits, pay
// the credit door, ride the lift, and walk into the airlock to reach the pod.
import { Grid, H, W } from './mapkit';
import type { SetBuilder } from '../blocks/blockset';
import type { MonsterSet } from '../characters/bestiary';
import type { PlanetResult } from './planet';

export function homeMap(s: SetBuilder, ms: MonsterSet): PlanetResult {
  const id = (n: string) => s.id(n);
  const g = new Grid();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, id('hull'));
  const floor = 52; // deck plates on this row; Max stands on row 51
  const top = 42;
  const L = 6;
  const R = 92;
  for (let y = top; y < floor; y++) for (let x = L; x < R; x++) g.set(x, y, (x * 7 + y) % 13 === 0 ? id('panel:1') : id('panel:0'));
  for (let x = L - 1; x <= R; x++) g.set(x, floor, id('deck:plate'));
  for (let y = top - 1; y <= floor; y++) {
    g.set(L - 1, y, id('wall:1'));
    g.set(R, y, id('wall:1'));
  }
  // windows onto space along the top
  for (let x = L + 2; x < R - 2; x += 6) g.set(x, top, id(`window:${x % 3}`));
  for (let x = L + 5; x < R; x += 12) g.set(x, top, id('light'));
  const y = floor - 1;
  const info = (x: number, k: string) => g.set(x, y - 3, id(`info:${k}`));
  // 1. quarters: walk
  const arrive = { x: L + 3, y };
  g.set(L + 1, y, id('plant'));
  g.set(L + 1, y - 1, id('console:0'));
  info(L + 4, 'walk');
  // 2. hop the crates
  info(L + 10, 'hop');
  g.set(L + 13, y, id('crate:0'));
  g.set(L + 16, y, id('crate:1'));
  g.set(L + 16, y - 1, id('crate:0'));
  g.set(L + 19, y, id('crate:0'));
  g.set(L + 19, y - 1, id('crate:1'));
  g.set(L + 19, y - 2, id('crate:0'));
  g.set(L + 19, y - 3, id('p:gem'));
  // 3. credits and pickups
  info(L + 22, 'pick');
  g.set(L + 24, y, id('p:credit'));
  g.set(L + 26, y, id('p:credit'));
  g.set(L + 28, y - 4, id('p:credit'));
  for (let x = L + 27; x <= L + 29; x++) g.set(x, y - 3, id('deck:grate'));
  // 4. the practice range: shoot the drones
  info(L + 32, 'fire');
  g.place(ms.index.get('Repair Drone')!, L + 40, y - 4);
  g.place(ms.index.get('Deck Rat')!, L + 37, y);
  g.place(ms.index.get('Crawler')!, L + 42, y);
  g.set(L + 44, y - 5, id('p:heart'));
  // Mystery Robot Joe keeps count at the practice range
  g.set(L + 31, y, id('joe'));
  // up under the windows past the range, for a courier who jets up to look: a tin heart, and a
  // painted Easter egg over the steam pipe
  g.set(L + 47, top + 1, id('tinHeart'));
  g.set(L + 58, top + 1, id('easterEgg'));
  // 5. crouch under the steam pipe (a low gap: roll through or hop over)
  for (let x = L + 53; x <= L + 55; x++) g.set(x, y - 2, id('pipe:wall'));
  g.set(L + 54, y, id('p:credit'));
  g.set(L + 34, y, id('p:credit'));
  g.set(L + 48, y, id('p:credit'));
  g.set(L + 57, y, id('p:credit'));
  // 6. the credit door (10 credits)
  info(L + 58, 'credit');
  g.set(L + 61, y, id('door'));
  g.set(L + 61, y - 1, id('door'));
  for (let yy = top; yy < y - 1; yy++) g.set(L + 61, yy, id('wall:0'));
  // 7. the lift up to the pod bay (the deck ends in a wall: up is the only way on)
  for (let yy = top + 1; yy <= y; yy++) g.set(L + 66, yy, id('lift'));
  for (let x = L + 67; x <= R; x++) for (let yy = top + 3; yy <= floor; yy++) g.set(x, yy, id('hull'));
  for (let x = L + 67; x < R; x++) g.set(x, top + 3, id('deck:plate'));
  for (let x = L + 67; x < R; x++) for (let yy = top - 3; yy < top + 3; yy++) g.set(x, yy, (x + yy) % 9 === 0 ? id('panel:1') : id('panel:2'));
  for (let x = L + 67; x <= R; x++) g.set(x, top - 4, id('hull'));
  info(L + 64, 'down');
  const uy = top + 2;
  const sign = (x: number, k: string) => g.set(x, uy - 3, id(`info:${k}`));
  sign(L + 70, 'shard');
  sign(L + 76, 'help');
  for (let x = L + 69; x <= L + 80; x += 4) g.set(x, uy, id('console:1'));
  g.set(R - 6, uy, id('p:medkit'));
  // Will the playwright, visiting, between the pod bay's consoles
  g.set(L + 75, uy, id('will'));
  // pod bay: the airlock
  const uplink = { x: R - 2, y: uy };
  g.set(uplink.x, uplink.y, id('airlock'), true);
  g.set(uplink.x, uplink.y - 1, id('airlock'), true);
  return { grid: g, arrive, uplink, vault: undefined, ground: [], caveFloor: [], sky: [], caveAir: [], ceilings: [], surfaceH: [], treasure: [] };
}
