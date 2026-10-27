// A data bus ride as a leg of its stage, played before the stage's first run: one screen
// that never scrolls, its blocks and traffic (busBlocks.ts, busMonsters.ts), the ship in the
// middle lane on its row, and the link under the chip that the way in opens onto.
import { Grid } from '../stages/mapkit';
import type { Leg, Stage } from '../stages/stage';
import { busSet } from './busBlocks';
import { busBestiary } from './busMonsters';
import { RIDES, type Ride } from './rides';
import { COLS, EXIT_COL, HORIZON_ROW, LANE_COLS, ROWS, SHIP_ROW } from './view';

export function busLeg(ride: Ride, s: Stage): Leg {
  const beasts = busBestiary(s.pal, ride.n);
  const { bs, layout } = busSet(s.pal, ride);
  const at = new Map(layout.spawners.map(([name, x, y]) => [`${x},${y}`, name]));
  const grid = new Grid(bs, beasts, s.art, 0, 1, ride.n, (x, y) => (x < COLS && y < ROWS ? layout.grid[y][x] : (at.get(`${x},${y}`) ?? layout.fill)));
  grid.linkAt(EXIT_COL, HORIZON_ROW);
  return {
    file: ride.file,
    kitFile: ride.file,
    title: ride.title,
    kind: 'bus',
    grid,
    kit: { bs, beasts },
    card: ride.card,
    start: { x: LANE_COLS[1], y: SHIP_ROW },
    cardView: { x: 0, y: 0 },
    bus: ride,
  };
}

/** A stage with its data bus ride in front of its first run (stages 2 to 5). */
export const withBus =
  (make: () => Stage): (() => Stage) =>
  () => {
    const s = make();
    const ride = RIDES.find((r) => r.n === s.n);
    if (ride) s.legs.unshift(busLeg(ride, s));
    return s;
  };
