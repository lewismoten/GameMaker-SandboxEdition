// BUS<n>.BBL: a data bus ride, one screen seen from behind the BLASTER. The whole screen is
// painted as one picture in perspective (busArt.ts) and cut into blocks; cells that come out
// alike share a block. Then the tricks, all plain block timers, as in the Cloud Lane:
//  - the board's clock pulses: every all-board cell below the horizon is one ring of 8 blocks
//    (2 lit, then 6 dark). A row's cells enter the ring at a later block the nearer it is, so a
//    lit band starts at the horizon and sweeps down toward the ship, faster as it comes;
//  - the sign counts BUS cycles down to 1, a cycle every CYCLE ticks, then flashes 0;
//  - the bar beside it fills half a block at a time, full when the sign reads 0;
//  - the chip on the horizon grows in four steps as the cycles go by;
//  - the row above the ship is a wall of look-alikes, so the ship's forward push holds it
//    there. When the sign reads 0 the wall over the middle lane lights up and pulls up, onto
//    the link under the chip;
//  - off the right edge of the screen, where no one sees them, each lane has a chain of spawner
//    blocks, one per entry in the ride's timetable, each giving birth once (kit/road3d.ts); and
//    two give birth to the pulses on the lines between the lanes every few ticks, forever.
import { Pixels } from '../../../kit/pixels';
import { spawnChains } from '../../../kit/road3d';
import { BlockSet } from '../art/draw';
import type { Pal } from '../art/pal';
import { EGG_BLOCK, eggPic } from '../blocks/egg';
import { SOLID } from '../blocks/sideTiles';
import { barCell, basePicture, boardTile, exitLit, partAt, roadShade, signBoard, signDigit, skyAt } from './busArt';
import { chipArt, chipAt } from './busChip';
import { CYCLE, openAt, type Ride } from './rides';
import { COLS, DASH_EVERY, DASH_SPAWN, EXIT_COL, HORIZON, HORIZON_ROW, LANE_COLS, ROWS, SHIP_ROW, SPAWN_COL, VX, WALL_ROW } from './view';

/** The clock pulses' ring: 2 lit blocks, then 6 dark, a tick each. */
const BAND_RING = 8;
const BAND_LIT = 2;
/** Where each row below the horizon enters the ring (rows 4 to 9): a pulse runs down every 8 ticks, picking up speed. */
const BAND_ENTRY = [7, 5, 4, 3, 2, 1];
/** The chip's sizes as the ride goes on, a quarter of the way at a time. */
const CHIP_SCALES = [0.25, 0.45, 0.7, 1];
/** The chip's columns, over the vanishing point. */
const CHIP_COLS = [7, 8, 9];

/** What the level map puts in each cell of the screen, by block name, and the spawners off its edge. */
export interface BusLayout {
  grid: string[][];
  spawners: [string, number, number][];
  fill: string;
}

/** A monster's name in the ride's bestiary: a kind in a lane. */
export const monName = (kind: string, lane: number) => `${kind}${lane}`;

export function busSet(p: Pal, ride: Ride): { bs: BlockSet; layout: BusLayout } {
  const bs = new BlockSet(150, 'bbl');
  const open = openAt(ride);
  if (ride.waves.some(([tick]) => tick > open - 40)) throw new Error(`${ride.file}: traffic too close to the end of the ride`);
  const base = basePicture(p);
  const grid: string[][] = Array.from({ length: ROWS }, () => new Array<string>(COLS).fill(''));
  const cellPic = (cx: number, cy: number) => base.crop(cx * 20, cy * 20, 20, 20);

  // The dark inside of the case.
  bs.add(
    'sky',
    new Pixels(20, 20).map((x, y) => skyAt(p, x, y)),
  );

  // The sign: where to, BUS: and the cycles left.
  const board = signBoard(p, ride.dest);
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 3; i++) {
      if (i === 2 && j === 1) continue;
      bs.add(`sign${j * 3 + i}`, board.crop(i * 20, j * 20, 20, 20));
      grid[j][i] = `sign${j * 3 + i}`;
    }
  for (let m = ride.cycles; m >= 1; m--)
    bs.add(`cyc${m}`, signDigit(p, board, String(m), p.c('gray', 7)), { next: m > 1 ? `cyc${m - 1}` : 'cyc0', ntime: CYCLE });
  // 0: the way in is open; the 0 flashes
  bs.add('cyc0', signDigit(p, board, '0', p.c('glow', 4)), { next: 'cyc0b', ntime: 4 });
  bs.add('cyc0b', signDigit(p, board, '0', p.c('gray', 7)), { next: 'cyc0', ntime: 4 });
  grid[1][2] = `cyc${ride.cycles}`;

  // The bar: half a block every eighth of the ride.
  const step = Math.round(open / 8);
  bs.add('barL', barCell(p, 'L'));
  bs.add('barR', barCell(p, 'R'));
  bs.add('barHalf', barCell(p, 1), { next: 'barFull', ntime: step });
  bs.add('barFull', barCell(p, 2));
  for (let k = 0; k < 4; k++) {
    bs.add(`bar${k}`, barCell(p, 0), { next: 'barHalf', ntime: (2 * k + 1) * step });
    grid[0][11 + k] = `bar${k}`;
  }
  grid[0][10] = 'barL';
  grid[0][15] = 'barR';

  // Over the horizon: the far board, and the chip growing on it.
  bs.add('far', cellPic(0, 2));
  for (let x = 0; x < COLS; x++) grid[2][x] = 'far';
  const chip = chipArt(p, ride.n);
  const quarter = Math.round(open / 4);
  const stages = CHIP_SCALES.map((s) => chipAt(base.crop(0, 0, 320, 60), chip, s, VX, HORIZON));
  for (const cx of CHIP_COLS) {
    for (let st = 0; st < 4; st++)
      bs.add(`chip${st}_${cx}`, stages[st].crop(cx * 20, 40, 20, 20), st < 3 ? { next: `chip${st + 1}_${cx}`, ntime: quarter } : {});
    grid[2][cx] = `chip0_${cx}`;
  }
  for (const row of grid.slice(0, 2)) for (let x = 0; x < COLS; x++) row[x] ||= 'sky';

  // Below the horizon: the bus, its bundles of traces, and the board's clock pulses.
  const lit = boardTile(p, true);
  const dark = boardTile(p, false);
  for (let k = 0; k < BAND_RING; k++) bs.add(`band${k}`, k < BAND_LIT ? lit : dark, { next: `band${(k + 1) % BAND_RING}`, ntime: 1 });
  for (let cy = HORIZON_ROW + 1; cy < ROWS; cy++) {
    const road = new Pixels(20, 20).map((x, y) => roadShade(p, x, cy * 20 + y));
    bs.add(`road${cy}`, road, cy === WALL_ROW ? { solid: SOLID } : {});
  }
  bs.add('horizonBoard', cellPic(0, HORIZON_ROW));
  for (let cy = HORIZON_ROW; cy < ROWS; cy++)
    for (let cx = 0; cx < COLS; cx++) {
      if (cx === EXIT_COL && (cy === WALL_ROW || cy === HORIZON_ROW)) continue;
      let parts = 0;
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const part = partAt(cx * 20 + x, cy * 20 + y);
          parts |= part === 'road' ? 1 : part === 'board' ? 4 : 2;
        }
      if (parts === 1 && cy > HORIZON_ROW) grid[cy][cx] = `road${cy}`;
      else if (parts === 4) grid[cy][cx] = cy === HORIZON_ROW ? 'horizonBoard' : `band${BAND_ENTRY[cy - HORIZON_ROW - 1]}`;
      else {
        const name = `edge${cx}_${cy}`;
        // the wall row holds the ship back; the cells beside its lanes keep it on the bus
        const solid =
          (cy === WALL_ROW && cx >= LANE_COLS[0] - 1 && cx <= LANE_COLS[2] + 1) || (cy === SHIP_ROW && (cx === LANE_COLS[0] - 1 || cx === LANE_COLS[2] + 1));
        bs.add(name, cellPic(cx, cy), solid ? { solid: SOLID } : {});
        grid[cy][cx] = name;
      }
    }

  // The way in: a wall like the rest until the sign reads 0, then a lit lane that pulls the ship up onto the link.
  const UP = 1;
  bs.add('gate', cellPic(EXIT_COL, WALL_ROW), { solid: SOLID, next: 'gateOpen', ntime: open });
  bs.add('gateOpen', exitLit(p, base, EXIT_COL, WALL_ROW, 0), { grav: UP, next: 'gateOpen2', ntime: 3 });
  bs.add('gateOpen2', exitLit(p, base, EXIT_COL, WALL_ROW, 1), { grav: UP, next: 'gateOpen', ntime: 3 });
  bs.add('exitDim', cellPic(EXIT_COL, HORIZON_ROW), { next: 'exitLit', ntime: open });
  bs.add('exitLit', exitLit(p, base, EXIT_COL, HORIZON_ROW, 0), { grav: UP, next: 'exitLit2', ntime: 3 });
  bs.add('exitLit2', exitLit(p, base, EXIT_COL, HORIZON_ROW, 1), { grav: UP, next: 'exitLit', ntime: 3 });
  grid[WALL_ROW][EXIT_COL] = 'gate';
  grid[HORIZON_ROW][EXIT_COL] = 'exitDim';

  // The spawners, off the right edge: one chain per lane, a block per entry in the timetable.
  const spawners: [string, number, number][] = [];
  const blank = new Pixels(20, 20).map((x, y) => skyAt(p, x, y));
  for (const chain of spawnChains(ride.waves, [0, 1, 2])) {
    for (const b of chain.blocks) bs.add(b.name, blank, { birth: monName(b.kind, chain.lane), birthTime: b.birthTime, next: b.next, ntime: b.ntime });
    bs.add(chain.end, blank);
    spawners.push([chain.first, SPAWN_COL + chain.lane, HORIZON_ROW]);
  }
  bs.add('dashSpawnL', blank, { birth: 'dashL', birthTime: DASH_EVERY });
  bs.add('dashSpawnR', blank, { birth: 'dashR', birthTime: DASH_EVERY });
  spawners.push(['dashSpawnL', ...DASH_SPAWN[0]], ['dashSpawnR', ...DASH_SPAWN[1]]);

  // the felt egg keeps its number in every set (the inventory holds block numbers); it is never on this map
  bs.addAt(EGG_BLOCK, 'egg', eggPic(p, dark), { obj: 1 });
  for (const row of grid) for (const n of row) if (!n || !bs.has(n)) throw new Error(`${ride.file}: no block for a cell (${n})`);
  return { bs, layout: { grid, spawners, fill: 'sky' } };
}
