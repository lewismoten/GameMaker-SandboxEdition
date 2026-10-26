// Level 2: THE CLOUD LANE. The corner booth rang Grandpa's car phone, and every phone is a
// Teleport-A-Phone now: Dex lands in the driver's seat of Grandpa's flying CitiCar, 2,000
// feet up, with the Skyway nine miles off. One screen that never scrolls, seen from behind
// the car (sky.ts paints it in perspective; skyMonsters.ts sends the traffic down its lanes).
// The car only steers, and always pushes forward against a wall of look-alike lane; at 0 MI
// the wall over the right lane opens into the exit ramp, and the push carries it through.
import { LevelMap } from './mapkit';
import type { BlockSet } from '../blocks/book';
import { skyLayout } from '../blocks/sky';
import { CAR_ROW, EXIT_COL, HORIZON_ROW, LANE_COLS } from '../art/skyView';

export function cloudLane(set: BlockSet): LevelMap {
  const { grid, spawners, fill } = skyLayout();
  const m = new LevelMap(set, fill);
  grid.forEach((row, y) => row.forEach((name, x) => m.set_(x, y, name)));
  for (const [name, x, y] of spawners) m.set_(x, y, name);
  m.mark('start', LANE_COLS[1], CAR_ROW);
  m.mark('exit', EXIT_COL, HORIZON_ROW);
  return m;
}
