// Derelict stations for STATION.BBL: a lattice of rooms joined by doorways, lift shafts
// and crawl corridors, with conveyor decks, laser gates on a shared clock, acid sumps,
// reactor halls, a vault, and the airlock you came in by.
import { rng } from '../kit/pixels';
import { Grid, H, W, reachable, wx } from './mapkit';
import type { SetBuilder } from './blockset';
import type { PlanetResult, PlanetSpec, Run, Spot } from './planet';

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'hall' | 'lab' | 'reactor' | 'cargo' | 'garden' | 'window' | 'sump' | 'vault' | 'dock';
}

export function stationPlanet(spec: PlanetSpec, s: SetBuilder, opts: { home?: boolean } = {}): PlanetResult {
  const r = rng(spec.seed);
  const id = (n: string) => s.id(n);
  const pickOne = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const g = new Grid();
  // outer space beyond the hull, hull everywhere else
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, id('hull'));
  // a lattice of cells 12 wide, 11 tall; rooms fill most cells
  const CW = 12;
  const CH = 11;
  const cols = 8;
  const rows = 8;
  const ox = 2;
  const oy = 6;
  const rooms: Room[][] = [];
  const kinds: Room['kind'][] = ['hall', 'hall', 'lab', 'cargo', 'garden', 'window', 'sump', 'reactor'];
  for (let cy = 0; cy < rows; cy++) {
    rooms.push([]);
    for (let cx = 0; cx < cols; cx++) {
      const w = 7 + Math.floor(r() * 4);
      const h = 5 + Math.floor(r() * 4);
      const x = ox + cx * CW + Math.floor((CW - w) / 2);
      const y = oy + cy * CH + (CH - h - 1);
      rooms[cy].push({ x, y, w, h, kind: pickOne(kinds) });
    }
  }
  const dock = rooms[rows - 2][1];
  dock.kind = 'dock';
  const vaultRoom = rooms[1][cols - 2];
  vaultRoom.kind = 'vault';
  const panels = [id('panel:0'), id('panel:0'), id('panel:0'), id('panel:1'), id('panel:2'), id('panel:0'), id('panel:3')];
  const carveRoom = (rm: Room) => {
    for (let y = rm.y; y < rm.y + rm.h; y++)
      for (let x = rm.x; x < rm.x + rm.w; x++) g.set(x, y, rm.kind === 'window' && y < rm.y + 2 && x % 3 === 1 ? id(`window:${x % 3}`) : pickOne(panels));
    // floor
    for (let x = rm.x - 1; x <= rm.x + rm.w; x++) g.set(x, rm.y + rm.h, id('deck:plate'));
  };
  rooms.flat().forEach(carveRoom);
  // connections: horizontal doorways between neighbours, vertical lift shafts
  const ground: Run[] = [];
  const caveFloor: Run[] = [];
  const sky: Spot[] = [];
  const caveAir: Spot[] = [];
  const ceilings: Spot[] = [];
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++) {
      const a = rooms[cy][cx];
      if (cx < cols - 1) {
        const b = rooms[cy][cx + 1];
        // corridor at the lower of the two floors, two tall
        const fy = Math.max(a.y + a.h, b.y + b.h) - 1;
        for (let x = a.x + a.w - 1; x <= b.x; x++) {
          g.set(x, fy, pickOne(panels));
          g.set(x, fy - 1, pickOne(panels));
          g.set(x, fy + 1, id('deck:plate'));
        }
        // step up into the higher room: a short lift
        for (const rm of [a, b]) if (rm.y + rm.h - 1 < fy) for (let y = rm.y + rm.h - 1; y <= fy; y++) g.set(rm === a ? rm.x + rm.w - 1 : rm.x, y, id('lift'));
      }
      if (cy < rows - 1 && (cx + cy) % 3 !== 1) {
        const b = rooms[cy + 1][cx];
        // a two-wide shaft: a lift up one side, an open drop down the other
        const sx = Math.max(a.x, b.x) + 1 + Math.floor(r() * 2);
        for (let y = a.y; y <= b.y + b.h - 1; y++) {
          g.set(sx, y, id('lift'));
          if (y >= a.y + a.h) g.set(sx + 1, y, pickOne(panels));
        }
      }
    }
  // dress the rooms
  for (const rm of rooms.flat()) {
    const fy = rm.y + rm.h - 1; // standing row
    const cells = Array.from({ length: rm.w }, (_, i) => rm.x + i).filter((x) => g.get(x, fy) !== id('lift'));
    const free = (x: number) => panels.includes(g.get(x, fy)) && panels.includes(g.get(x, fy - 1));
    switch (rm.kind) {
      case 'lab':
        for (const x of cells) if (free(x) && r() < 0.35) g.set(x, fy, id(`console:${x % 3}`));
        break;
      case 'cargo':
        for (const x of cells)
          if (free(x) && r() < 0.3) {
            g.set(x, fy, id(`crate:${x & 1}`));
            if (r() < 0.4 && free(x)) g.set(x, fy - 1, id('crate:0'));
          }
        break;
      case 'garden':
        for (const x of cells) if (free(x) && r() < 0.4) g.set(x, fy, id('plant'));
        g.set(rm.x + 1, rm.y, id('light'));
        break;
      case 'reactor': {
        const cx = rm.x + Math.floor(rm.w / 2) - 1;
        const cy = rm.y + Math.floor(rm.h / 2) - 1;
        g.set(cx, cy, id('reactor:0'));
        g.set(cx + 1, cy, id('reactor:1'));
        g.set(cx, cy + 1, id('reactor:2'));
        g.set(cx + 1, cy + 1, id('reactor:3'));
        for (let x = rm.x; x < rm.x + rm.w; x++) if (g.get(x, rm.y + rm.h) === id('deck:plate') && r() < 0.5) g.set(x, rm.y + rm.h, id('zap'));
        break;
      }
      case 'sump':
        for (let x = rm.x + 1; x < rm.x + rm.w - 1; x++) {
          g.set(x, fy, id('acid'));
        }
        // a timed bridge over the sump
        for (let x = rm.x + 1; x < rm.x + rm.w - 1; x++) g.set(x, fy - 2, id('plat:on'));
        break;
      case 'hall': {
        // conveyor decks and a laser gate
        const dir = r() < 0.5 ? 'belt:r' : 'belt:l';
        if (rm.w > 7) for (let x = rm.x + 2; x < rm.x + rm.w - 2; x++) g.set(x, rm.y + rm.h, id(dir));
        if (r() < 0.5) {
          const lx = rm.x + Math.floor(rm.w / 2);
          for (let y = rm.y; y < rm.y + rm.h; y++) g.set(lx, y, id('laser:v'));
        }
        break;
      }
      case 'window':
        if (r() < 0.6) for (let x = rm.x + 1; x < rm.x + rm.w - 1; x += 3) g.set(x, fy - 2, id('deck:girder'));
        break;
      default:
        break;
    }
    if (rm.kind !== 'vault' && rm.kind !== 'dock') {
      if (rm.w >= 5) ground.push({ x0: rm.x + 1, x1: rm.x + rm.w - 2, y: fy });
      sky.push({ x: rm.x + Math.floor(rm.w / 2), y: rm.y + 1 });
      ceilings.push({ x: rm.x + 1 + Math.floor(r() * (rm.w - 2)), y: rm.y });
      if (r() < 0.3) g.set(rm.x + rm.w - 2, rm.y + 1, id('vent'));
      if (r() < 0.25) g.set(rm.x + 1, rm.y + 1, id('pipe:v'));
    }
  }
  // the dock: airlock out, arrival point, and on the training deck, the info panels
  const fy = dock.y + dock.h - 1;
  const arrive = { x: dock.x + 2, y: fy };
  const uplink = { x: dock.x, y: fy };
  for (let x = dock.x; x < dock.x + dock.w; x++) {
    g.set(x, fy, id('panel:0'), true);
    g.set(x, fy - 1, id('panel:0'), true);
  }
  g.set(uplink.x, uplink.y, id('airlock'), true);
  g.set(uplink.x, uplink.y - 1, id('airlock'), true);
  if (opts.home) {
    const info = ['walk', 'hop', 'fire', 'pick', 'down', 'credit', 'shard', 'help'];
    info.forEach((k, i) => {
      const room = rooms[rows - 2][Math.min(cols - 1, 1 + Math.floor(i / 2))];
      g.set(room.x + 1 + (i % 2) * 3, room.y + 1, id(`info:${k}`), true);
    });
  }
  // the vault, sealed with a credit door and a force field
  {
    const v = vaultRoom;
    const vy = v.y + v.h - 1;
    for (let y = v.y; y <= vy; y++) {
      g.set(v.x - 1, y, id('wall:2'), true);
      g.set(v.x + v.w, y, id('wall:2'), true);
    }
    g.set(v.x - 1, vy, id('door'), true);
    g.set(v.x - 1, vy - 1, id('door'), true);
    g.set(v.x + v.w, vy, id('field:on'), true);
    g.set(v.x + v.w, vy - 1, id('field:on'), true);
    const prize = spec.shard !== undefined ? id(`shard:${spec.shard}`) : spec.module !== undefined ? id(`module:${spec.module}`) : id('p:oneup');
    const mid = v.x + Math.floor(v.w / 2);
    g.set(mid, vy, prize, true);
    g.set(mid - 2, vy, id('p:gem'), true);
    g.set(mid + 2, vy, id('p:credit'), true);
    // any lift into the vault would bypass the door: plug them
    for (let x = v.x; x < v.x + v.w; x++) {
      if (g.get(x, v.y + v.h) === id('lift')) g.set(x, v.y + v.h, id('deck:plate'), true);
      if (g.get(x, v.y - 1) === id('lift')) g.set(x, v.y - 1, id('hull'), true);
      for (let y = v.y; y <= vy; y++) if (g.get(x, y) === id('lift')) g.set(x, y, id('panel:0'), true);
    }
  }
  // pickups
  const treasure: Spot[] = [];
  for (const run of ground) {
    if (r() < 0.45) {
      const x = run.x0 + Math.floor(r() * (run.x1 - run.x0 + 1));
      if (panels.includes(g.get(x, run.y)))
        g.set(x, run.y, id(`p:${pickOne(['credit', 'credit', 'gem', 'heart', 'plasma', 'nova', 'shield', 'mines', 'medkit', 'flak'])}`));
    }
  }
  const vault = { x: vaultRoom.x + Math.floor(vaultRoom.w / 2), y: vaultRoom.y + vaultRoom.h - 1 };
  // connectivity check helper output (callers verify)
  void reachable;
  void caveFloor;
  void caveAir;
  return { grid: g, arrive, uplink, vault, ground, caveFloor, sky, caveAir, ceilings, surfaceH: [], treasure };
}

export { wx };
