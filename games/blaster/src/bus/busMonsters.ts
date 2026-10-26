// BUS<n>.MON: a data bus ride's traffic, prizes and lane pulses. Every one is born off the
// right edge of the screen by a spawner block (busBlocks.ts), and its path starts with one
// leap, 240 pixels in a tick, onto the vanishing point under the chip, so nothing is ever
// seen arriving from the side. From there it slides down its lane, faster as it comes nearer,
// showing its sizes in turn so it seems to grow as it approaches (kit/road3d.ts). It passes
// the ship's row, runs off the bottom and is gone. Everything here has the same power, so the
// traffic, the prizes and the pulses pass through one another; under 100, so a touch with the
// ship ends it: a hazard pops (after its bump), a prize sparkles.
import { growPics, laneSlide, leapTo, type RoadStep } from '../../../kit/road3d';
import { POWER } from '../ids';
import { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { busPictures } from './busSprites';
import { monName } from './busBlocks';
import { HAZARD, KINDS } from './rides';
import { DASH_SPAWN, HORIZON_ROW, SPAWN_COL, VP } from './view';

export function busBestiary(p: Pal, n: number): Bestiary {
  const b = new Bestiary();
  busPictures(b, p, n);
  for (const kind of KINDS)
    for (const lane of [0, 1, 2]) {
      const path: RoadStep[] = [leapTo([SPAWN_COL + lane, HORIZON_ROW], VP), ...laneSlide(lane - 1)];
      b.add(monName(kind, lane), { pics: growPics(kind), power: POWER.enemy, path, becomes: HAZARD(kind) ? 'pop' : 'sparkle', end: -1 });
    }
  // The pulses between the lanes ride the bus itself, so they come faster than the traffic.
  DASH_SPAWN.forEach(([sx, sy], i) => {
    const k = i ? 1 : -1;
    const side = i ? 'R' : 'L';
    b.add(`dash${side}`, {
      pics: [0, 1, 2, 3, 4].map((s) => [`pulse${side}${s}`, [4, 4, 5, 8, 200][s]] as [string, number]),
      power: POWER.enemy,
      path: [leapTo([sx, sy], VP), [k, 2, 3], [2 * k, 4, 6], [k, 2, 7]],
      end: -1,
    });
  });
  b.add('pop', {
    pics: [
      ['pop0', 3],
      ['pop1', 4],
    ],
    power: POWER.enemy,
    end: 7,
  });
  b.add('sparkle', {
    pics: [
      ['sparkle0', 3],
      ['sparkle1', 3],
    ],
    power: POWER.enemy,
    end: 6,
  });
  return b;
}
