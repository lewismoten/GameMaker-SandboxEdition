// SKY.MON: the Cloud Lane's traffic, prizes and lane dashes. Every one is born off the right
// edge of the screen by a spawner block (sky.ts), and its path starts with one leap, 240
// pixels in a tick, onto the vanishing point on the horizon, so nothing is ever seen
// arriving from the side. From there it slides down its lane line, faster as it comes nearer
// (a block in 20 ticks, the next in 10, then 4 pixels a tick), showing its sizes in turn so it
// seems to grow as it approaches. It passes the car's row, runs off the bottom and is gone.
// Everything here has the same power, so the traffic, the prizes and the dashes pass through
// one another; under 100, so a touch with the car ends it: a car or truck swerves off in a
// puff of cloud (after its bump), a prize sparkles.
import { emptyMonster, newMonsterSet, type Monster } from '../../../../web/src/formats/monster';
import type { BlockSet } from '../blocks/book';
import { SKYMON } from '../ids';
import { DASH_SPAWN, SPAWN_COL } from '../blocks/sky';
import { HORIZON_COLS, HORIZON_ROW } from '../art/skyView';
import { growPics, laneSlide, leapTo, roadCorners, type RoadCorner } from '../../../kit/road3d';

const POWER = 95;
/** The vanishing point's cell, where everything starts down its lane. */
const VP: [number, number] = [HORIZON_COLS[1], HORIZON_ROW];

export function buildSkyMonsters(mb: BlockSet): Monster[] {
  const set = newMonsterSet();
  const def = (n: number, pics: [string, number][], march: RoadCorner[], becomes: number = SKYMON.puff, end = -1) => {
    const mon = emptyMonster();
    mon.used = 1;
    mon.power = POWER;
    mon.thru = 0;
    pics.forEach(([name, t], i) => (mon.pic[i] = [mb.id(name), t]));
    mon.end = end;
    mon.newmon = becomes;
    march.forEach(([x, y, pic, orient], i) => (mon.march[0][i] = { x, y, pic, orient }));
    set[n] = mon;
  };
  for (const [kind, becomes] of [
    ['car', SKYMON.puff],
    ['truck', SKYMON.puff],
    ['page', SKYMON.sparkle],
    ['pill', SKYMON.sparkle],
  ] as const)
    for (const lane of [0, 1, 2]) {
      const k = lane - 1;
      // the spawner is at (SPAWN_COL + lane, HORIZON_ROW)
      // drawn as they are in every lane (mirrored, the trucks' lettering would read backward)
      def(SKYMON[kind][lane], growPics(kind), roadCorners([leapTo([SPAWN_COL + lane, HORIZON_ROW], VP), ...laneSlide(k)], 0), becomes);
    }
  // The dashes between the lanes ride the road itself, so they come faster than the traffic.
  const dashPics: [string, number][] = [
    ['dash0', 4],
    ['dash1', 4],
    ['dash2', 5],
    ['dash3', 8],
    ['dash4', 200],
  ];
  DASH_SPAWN.forEach(([sx, sy], i) => {
    const k = i ? 1 : -1;
    def(i ? SKYMON.dashR : SKYMON.dashL, dashPics, roadCorners([leapTo([sx, sy], VP), [k, 2, 3], [2 * k, 4, 6], [k, 2, 7]], k < 0 ? 4 : 0), SKYMON.none);
  });
  def(
    SKYMON.puff,
    [
      ['puff0', 3],
      ['puff1', 4],
    ],
    [],
    SKYMON.none,
    7,
  );
  def(
    SKYMON.sparkle,
    [
      ['sparkle0', 3],
      ['sparkle1', 3],
    ],
    [],
    SKYMON.none,
    6,
  );
  return set;
}
