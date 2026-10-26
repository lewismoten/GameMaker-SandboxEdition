// SKY.BBL: the Cloud Lane, one screen seen from behind Grandpa's flying CitiCar. The whole
// screen is painted as one picture in perspective (skyView.ts) and cut into blocks; cells that
// come out alike share a block. Then the tricks, all plain block timers:
//  - the cloud sea's bands: every all-cloud cell below the horizon is one ring of 8 blocks
//    (4 light, then 4 in shadow). A row's cells enter the ring at a later block the nearer it is,
//    so a light band starts at the horizon and sweeps down toward the car, faster as it comes;
//  - clouds in the sky: a ring that grows a cloud in 4 steps, then rests as plain sky; each
//    cloud on the map enters the ring at a different block, so they puff up at different times;
//  - the sign counts SKYWAY 9 MI down to 1, a mile every MILE ticks, then flashes 0 MI;
//  - the Skyway's towers grow on the horizon as the miles go by;
//  - the row above the car is a wall of look-alikes, so the car's forward push holds it there.
//    At OPEN_AT the wall over the right lane turns into a lit ramp that pulls up, onto the link;
//  - off the right edge of the screen, where no one sees them, each lane has a chain of spawner
//    blocks, one per entry in cloudWaves.ts, each giving birth once; and two give birth to the
//    dashes between the lanes every few ticks, forever.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, SOLID } from './book';
import { C, PAL } from '../art/pal';
import { text } from '../art/font';
import { GRAV } from './shared';
import { eggPic } from './egg';
import { T, shadeAt } from '../art/draw';
import { EXIT_COL, HORIZON, HORIZON_ROW, VX, WALL_ROW, CAR_ROW, LANE_COLS, halfWidth } from '../art/skyView';
import { MILE, MILES, OPEN_AT, WAVES, type Lane } from '../levels/cloudWaves';
import { CTR, EGG_BLOCK, SKYMON } from '../ids';
import { spawnChains } from '../../../kit/road3d';

const R = PAL.r;
const W = 320;
const H = 200;
/** Screen columns and rows of the view (the map's top-left corner is the screen's). */
const COLS = 16;
const ROWS = 10;

/** The cloud bands' ring: 2 light blocks, then 6 in shadow, a tick each. */
const BAND_RING = 8;
const BAND_LIGHT = 2;
const BAND_TICKS = 1;
/**
 * Where each row below the horizon enters the band ring (rows 4 to 9). Row 4 lights a tick
 * after the scene starts, row 5 two ticks later, then a row a tick: a stripe of light runs
 * from the horizon to the bottom of the screen, picking up speed, every 8 ticks.
 */
const BAND_ENTRY = [7, 5, 4, 3, 2, 1];

/** The sky cloud's ring: 4 sizes, then a rest as plain sky. */
const CLOUD_TICKS = [3, 3, 2, 2, 14];
/** Clouds in the sky: [column of the left half, row, entry into the ring]. */
const SKY_CLOUDS: [number, number, number][] = [
  [4, 0, 0],
  [13, 0, 3],
  [7, 1, 4],
  [11, 1, 2],
];

/** Ticks between the dashes on the lane lines. */
export const DASH_EVERY = 8;
/** Where the spawners sit, off the right edge: lane k's at (SPAWN_COL + k, HORIZON_ROW); the dashes' below. */
export const SPAWN_COL = 18;
export const DASH_SPAWN: [number, number][] = [
  [18, 5],
  [20, 5],
];

/** The rail along each edge of the lane, wider as it comes nearer. */
const railWidth = (y: number) => 1.2 + (y - HORIZON) / 45;

/** Which part of the picture a pixel is in, below the horizon. */
function partAt(x: number, y: number): 'road' | 'rail' | 'cloud' {
  const d = Math.abs(x + 0.5 - VX) - halfWidth(y + 0.5);
  if (d < 0) return 'road';
  if (d < railWidth(y)) return 'rail';
  return 'cloud';
}

// ------------------------------------------------------------------ the pictures
const SKY = () => C('sky', 4);

/** Puffs of cloud, the same in every band cell (so every row can share one ring): in sunlight, or in shadow. */
function cloudTile(light: boolean): Pixels {
  const p = new Pixels(20, 20);
  const r = rng(41);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sky'), light ? 5 : 4, light ? 6 : 5, light ? 0.5 : 0.75, x, y));
  for (let i = 0; i < 5; i++) {
    const cx = r() * 20;
    const cy = 3 + r() * 14;
    const rx = 3 + r() * 3;
    for (let y = Math.floor(cy - 3); y <= cy + 2; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / 2.6;
        if (nx * nx + ny * ny > 1) continue;
        const top = ny < -0.2;
        p.set((x + 20) % 20, y, light ? (top ? C('gray', 7) : C('sky', 7)) : top ? C('sky', 7) : C('sky', 6));
      }
  }
  return p;
}

/** The lane's surface: darker far off, lighter near (dithered in a pattern that repeats every block). */
const roadShade = (x: number, y: number) => shadeAt(R('purple'), 0, 2.4, (y - HORIZON - 20) / (H - HORIZON - 20), x, y);

/** The horizon's haze and the cloud sea under it, and the lane with its rails, as one picture. */
function basePicture(): Pixels {
  const p = new Pixels(W, H);
  const shadow = cloudTile(false);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (y < 40) p.set(x, y, SKY());
      else if (y < HORIZON) p.set(x, y, shadeAt(R('sky'), 4, 7, ((y - 40) / 20) ** 1.4, x, y));
      else if (y < HORIZON + 20) {
        // far off, the lane is a thread and the clouds are haze
        const part = partAt(x, y);
        p.set(x, y, part === 'road' ? C('purple', 0) : part === 'rail' ? C('pink', 4) : shadeAt(R('sky'), 6, 7, 1 - (y - HORIZON) / 30, x, y));
      } else {
        const part = partAt(x, y);
        // the lane's surface is one shade per block row, so every all-lane block of a row is the same block
        if (part === 'road') p.set(x, y, roadShade(x, y));
        else if (part === 'rail') p.set(x, y, Math.abs(x + 0.5 - VX) - halfWidth(y + 0.5) < railWidth(y) / 2 ? C('pink', 5) : C('pink', 3));
        // beside the rails, the clouds lie in the lane's shadow (the bands' shadowed blocks)
        else p.set(x, y, shadow.get(x % 20, y % 20));
      }
    }
  // a thin bright line where the sky meets the clouds
  for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - VX) > 1) p.set(x, HORIZON, C('gray', 7));
  return p;
}

/** The Skyway's towers on the horizon, over the exit ramp: small at first, bigger with each third of the trip. */
function skyline(stage: number): Pixels {
  const p = new Pixels(60, 20);
  const s = [0.35, 0.65, 1][stage];
  // the far towers: chrome and pink, with a deck across them
  const towers: [number, number, number, string][] = [
    [8, 4, 11, 'chrome'],
    [16, 5, 17, 'pink'],
    [25, 4, 13, 'teal'],
    [33, 6, 19, 'chrome'],
    [43, 4, 12, 'purple'],
    [51, 5, 15, 'pink'],
  ];
  for (const [cx, w, h, ramp] of towers) {
    const hh = Math.max(1, Math.round(h * s));
    const ww = Math.max(1, Math.round(w * Math.max(0.5, s)));
    const x0 = Math.round(30 + (cx - 30) * Math.max(0.55, s) - ww / 2);
    for (let y = 20 - hh; y < 20; y++) for (let x = x0; x < x0 + ww; x++) p.set(x, y, x === x0 ? C(ramp, 5) : x === x0 + ww - 1 ? C(ramp, 1) : C(ramp, 3));
    if (s > 0.5) p.set(x0 + Math.floor(ww / 2), 20 - hh - 1, C('red', 4));
  }
  if (s > 0.5) {
    const dy = 20 - Math.round(8 * s);
    const x0 = Math.round(30 - 26 * s);
    p.rect(x0, dy, Math.round(52 * s), 1, C('gray', 7)).rect(x0, dy + 1, Math.round(52 * s), 1, C('chrome', 2));
  }
  return p;
}

/** The hologram sign, 3 blocks by 2: SKYWAY over the miles. */
function signBoard(): Pixels {
  const p = new Pixels(60, 40);
  p.rect(2, 2, 56, 36, C('green', 2)).frame(2, 2, 56, 36, C('gray', 7)).frame(3, 3, 54, 34, C('green', 4));
  text(p, 6, 7, 'SKYWAY', C('gray', 7));
  text(p, 42, 23, 'MI', C('gray', 7));
  // an arrow up and to the right: the Skyway is that way
  for (let i = 0; i < 6; i++) p.set(8 + i, 33 - i, C('gold', 5)).set(9 + i, 33 - i, C('gold', 5));
  p.rect(10, 27, 5, 1, C('gold', 5)).rect(14, 27, 1, 5, C('gold', 5));
  return p;
}

/** The sign's middle bottom block, with the miles left in big digits. */
function signDigit(board: Pixels, s: string, ink = C('gray', 7)): Pixels {
  const p = board.crop(20, 20, 20, 20);
  p.rect(0, 2, 20, 15, C('green', 2));
  text(p, 10 - s.length * 4, 3, s, ink, 1);
  text(p, 10 - s.length * 4 + 1, 3, s, ink, 1);
  // the digit, twice as tall as the letters
  const q = new Pixels(20, 20);
  q.px.set(p.px);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 20; x++) {
      const c = p.get(x, 3 + y);
      q.set(x, 3 + y * 2, c).set(x, 4 + y * 2, c);
    }
  return q;
}

/** A cloud in the sky, 2 blocks wide, at size 0 (a wisp) to 3 (big and close). */
function skyCloud(size: number): Pixels {
  const p = new Pixels(40, 20, SKY());
  if (size < 0) return p;
  const s = [0.3, 0.5, 0.75, 1][size];
  const puffs: [number, number, number][] = [
    [-9, 1, 6],
    [-3, -2, 7],
    [4, -1, 7],
    [10, 1, 6],
    [0, 3, 8],
  ];
  for (const [dx, dy, rad] of puffs) {
    const cx = 20 + dx * s * 1.3;
    const cy = 11 + dy * s;
    const rr = rad * s;
    for (let y = Math.floor(cy - rr); y <= cy + rr; y++)
      for (let x = Math.floor(cx - rr * 1.3); x <= cx + rr * 1.3; x++) {
        const nx = (x + 0.5 - cx) / (rr * 1.3);
        const ny = (y + 0.5 - cy) / rr;
        if (nx * nx + ny * ny > 1 || y < 0 || y > 19) continue;
        p.set(x, y, ny > 0.35 ? C('sky', 6) : C('gray', 7));
      }
  }
  return p;
}

/** The exit ramp, lit: a teal road peeling off the right lane toward the towers, with chevrons. */
function exitRamp(base: Pixels, cx: number, cy: number, k: number): Pixels {
  const p = base.crop(cx * 20, cy * 20, 20, 20);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const sy = cy * 20 + y;
      // the ramp's middle line runs from the right lane's middle (x 210 on row 5's top) up and right
      const mid = 210 + (100 - sy) * 0.35;
      const half = 4 + (sy - 60) * 0.12;
      const d = Math.abs(cx * 20 + x + 0.5 - mid);
      if (d < half) p.set(x, y, d > half - 1.5 ? C('neon', 3) : C('teal', 2));
    }
  // chevrons, marching up
  for (let i = 0; i < 2; i++) {
    const y0 = ((i * 10 + (k ? 5 : 0)) % 20) + 2;
    const sy = cy * 20 + y0;
    const mx = 210 + (100 - sy) * 0.35 - cx * 20;
    for (let j = 0; j < 3; j++) p.set(mx - j, y0 + j, C('gray', 7)).set(mx + j, y0 + j, C('gray', 7));
  }
  return p;
}

// ------------------------------------------------------------------ the set
/** What the level map puts in each cell of the screen, by block name. */
export interface SkyLayout {
  grid: string[][];
  /** Off-screen spawner cells: [name, x, y]. */
  spawners: [string, number, number][];
  /** The blocks the screen's off-screen cells are filled with. */
  fill: string;
}

let layout: SkyLayout | undefined;

/** The layout of the last skySet() built (the set and the map are made together). */
export function skyLayout(): SkyLayout {
  if (!layout) throw new Error('skySet() first');
  return layout;
}

export function skySet(): BlockSet {
  const s = new BlockSet(150, false);
  const base = basePicture();
  const grid: string[][] = Array.from({ length: ROWS }, () => new Array<string>(COLS).fill(''));
  const cellPic = (cx: number, cy: number) => base.crop(cx * 20, cy * 20, 20, 20);

  // The plain sky, and the clouds that puff up in it.
  s.add('sky', new Pixels(20, 20, SKY()));
  for (let k = 0; k < 5; k++) {
    const pic = skyCloud(k < 4 ? k : -1);
    for (const half of [0, 1]) s.add(`sc${k}_${half}`, pic.crop(half * 20, 0, 20, 20), { next: `sc${(k + 1) % 5}_${half}`, ntime: CLOUD_TICKS[k] });
  }
  for (const [x, y, entry] of SKY_CLOUDS) {
    grid[y][x] = `sc${entry}_0`;
    grid[y][x + 1] = `sc${entry}_1`;
  }

  // The sign: SKYWAY, the miles left, MI.
  const board = signBoard();
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 3; i++) {
      if (i === 1 && j === 1) continue;
      s.add(`sign${j * 3 + i}`, board.crop(i * 20, j * 20, 20, 20));
      grid[j][i] = `sign${j * 3 + i}`;
    }
  for (let m = MILES; m >= 1; m--) s.add(`mi${m}`, signDigit(board, String(m)), { next: m > 1 ? `mi${m - 1}` : 'mi0', ntime: MILE });
  // 0 MI: the ramp is open; the 0 flashes gold and white
  s.add('mi0', signDigit(board, '0', C('gold', 5)), { next: 'mi0b', ntime: 4 });
  s.add('mi0b', signDigit(board, '0'), { next: 'mi0', ntime: 4 });
  grid[1][1] = `mi${MILES}`;
  for (const row of grid.slice(0, 2)) for (let x = 0; x < COLS; x++) row[x] ||= 'sky';

  // The horizon: haze, and the Skyway's towers growing over the ramp.
  const third = Math.round(OPEN_AT / 3);
  for (let x = 0; x < COLS; x++) if (!grid[2][x]) grid[2][x] = 'haze';
  s.add('haze', cellPic(0, 2));
  const towers = [0, 1, 2].map(skyline);
  for (let i = 0; i < 3; i++) {
    for (let st = 0; st < 3; st++) {
      const p = cellPic(EXIT_COL + i, 2).blit(towers[st].crop(i * 20, 0, 20, 20), 0, 0, 0);
      s.add(`towers${st}_${i}`, p, st < 2 ? { next: `towers${st + 1}_${i}`, ntime: third } : {});
    }
    grid[2][EXIT_COL + i] = `towers0_${i}`;
  }

  // Below the horizon: the lane, its rails, and the cloud sea's bands.
  const light = cloudTile(true);
  const dark = cloudTile(false);
  for (let k = 0; k < BAND_RING; k++) s.add(`band${k}`, k < BAND_LIGHT ? light : dark, { next: `band${(k + 1) % BAND_RING}`, ntime: BAND_TICKS });
  for (let cy = WALL_ROW; cy < ROWS; cy++) {
    const road = new Pixels(20, 20).map((x, y) => roadShade(x, cy * 20 + y));
    s.add(`road${cy}`, road, cy === WALL_ROW ? { solid: SOLID } : {});
  }
  s.add('horizonHaze', cellPic(0, HORIZON_ROW));
  for (let cy = HORIZON_ROW; cy < ROWS; cy++)
    for (let cx = 0; cx < COLS; cx++) {
      let parts = 0;
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const part = partAt(cx * 20 + x, cy * 20 + y);
          parts |= part === 'road' ? 1 : part === 'rail' ? 2 : 4;
        }
      const exit = cx === EXIT_COL && (cy === WALL_ROW || cy === HORIZON_ROW);
      if (exit) continue;
      if (parts === 1 && cy > HORIZON_ROW) grid[cy][cx] = `road${cy}`;
      else if (parts === 4) grid[cy][cx] = cy === HORIZON_ROW ? 'horizonHaze' : `band${BAND_ENTRY[cy - HORIZON_ROW - 1]}`;
      else {
        const name = `edge${cx}_${cy}`;
        // the wall row holds the car back; the cells beside its lanes keep it on the lane
        const solid =
          (cy === WALL_ROW && cx >= LANE_COLS[0] - 1 && cx <= LANE_COLS[2] + 1) || (cy === CAR_ROW && (cx === LANE_COLS[0] - 1 || cx === LANE_COLS[2] + 1));
        s.add(name, cellPic(cx, cy), solid ? { solid: SOLID } : {});
        grid[cy][cx] = name;
      }
    }

  // The exit: a wall like the rest until the sign reads 0 MI, then a lit ramp that pulls the car up onto the link.
  s.add('gate', cellPic(EXIT_COL, WALL_ROW), { solid: SOLID, next: 'gateOpen', ntime: OPEN_AT });
  s.add('gateOpen', exitRamp(base, EXIT_COL, WALL_ROW, 0), { grav: GRAV.up, next: 'gateOpen2', ntime: 3 });
  s.add('gateOpen2', exitRamp(base, EXIT_COL, WALL_ROW, 1), { grav: GRAV.up, next: 'gateOpen', ntime: 3 });
  s.add('exitDim', cellPic(EXIT_COL, HORIZON_ROW), { next: 'exitLit', ntime: OPEN_AT });
  s.add('exitLit', exitRamp(base, EXIT_COL, HORIZON_ROW, 0), { grav: GRAV.up, next: 'exitLit2', ntime: 3 });
  s.add('exitLit2', exitRamp(base, EXIT_COL, HORIZON_ROW, 1), { grav: GRAV.up, next: 'exitLit', ntime: 3 });
  grid[WALL_ROW][EXIT_COL] = 'gate';
  grid[HORIZON_ROW][EXIT_COL] = 'exitDim';

  // The spawners, off the right edge: one chain per lane, a block per entry in the timetable.
  const spawners: [string, number, number][] = [];
  const blank = new Pixels(20, 20, C('sky', 4));
  for (const chain of spawnChains(WAVES, [0, 1, 2])) {
    for (const b of chain.blocks) s.add(b.name, blank, { birthMon: SKYMON[b.kind][chain.lane as Lane], birthTime: b.birthTime, next: b.next, ntime: b.ntime });
    s.add(chain.end, blank);
    spawners.push([chain.first, SPAWN_COL + chain.lane, HORIZON_ROW]);
  }
  s.add('dashSpawnL', blank, { birthMon: SKYMON.dashL, birthTime: DASH_EVERY });
  s.add('dashSpawnR', blank, { birthMon: SKYMON.dashR, birthTime: DASH_EVERY });
  spawners.push(['dashSpawnL', ...DASH_SPAWN[0]], ['dashSpawnR', ...DASH_SPAWN[1]]);

  // the felt egg keeps its number in every set (the inventory holds block numbers); it is never on this map
  s.skipTo(EGG_BLOCK);
  s.add('egg', new Pixels(20, 20, SKY()).blit(eggPic(), 0, 0, T), { obj: true, effect: CTR.tomorrow, eamt: 1, score: 2000, touch: 'sky' });
  for (const row of grid) for (const n of row) if (!n || !s.has(n)) throw new Error(`sky: no block for a cell (${n})`);
  layout = { grid, spawners, fill: 'sky' };
  return s;
}
