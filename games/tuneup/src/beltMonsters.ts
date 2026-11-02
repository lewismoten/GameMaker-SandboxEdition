// The Beltway's monsters, in the shared monster set's free slots (MON.belt on). A car is born by
// the rear-view mirror's glass (beltway.ts) as a glint over its lane, and catches up there (GLINT
// ticks, its lifetime; no path, as a path starts over from wherever the monster is when it ends);
// then it becomes the passing car: a leap, 240 pixels in a tick, to the windshield's base in its
// lane, and away up the lane to the vanishing point, shrinking, where it dies (kit/road3d.ts, as
// In The Year 2000!'s Cloud Lane does it). Lane dashes and shoulder posts are born off the right
// edge, leap to the vanishing point and come the other way, growing, ending at the windshield's
// base. The EXIT sign leaps unseen from the mirror to the right shoulder, a fleck there, then a
// small sign stepping nearer, then the full sign, which stays. All have one power under 100, so
// they pass through one another, and none ever reaches the driver's row.
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { ROAD_LEAP } from '@lewismoten/gamemaker-sandbox-tools/kit/road3d';
import { MON } from './ids';
import { DIVIDER, GLINT, MIRROR, POST, SHIELD, SPAWN, TRACK } from './levels/beltwayPlan';

const POWER = 95;
/** The slots: a mirror glint and a passing car per lane and kind, the dashes and posts per side, the sign's stages. */
const LANES = [-1, 0, 1];
export const BELTMON = {
  mirror: (lane: number, kind: number) => MON.belt + (lane + 1) * 2 + kind,
  car: (lane: number, kind: number) => MON.belt + 6 + (lane + 1) * 2 + kind,
  dash: (side: number) => MON.belt + 12 + (side > 0 ? 1 : 0),
  post: (side: number) => MON.belt + 14 + (side > 0 ? 1 : 0),
  exit: (stage: number) => MON.belt + 16 + stage,
} as const;
/** Ticks the EXIT sign's fleck shows (then the small sign steps a block nearer at a pixel a tick). */
export const SIGN_STAGE = 30;

type Pt = [number, number];
/** Ticks to move from a to b at `speed` pixels a tick (PLAYGAME steps the longer axis). */
const ticks = (a: Pt, b: Pt, speed: number) => Math.ceil((Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 20) / speed);

/** A path through `pts` (block cells) from a monster born at `from`: a leap onto the first, then each at its speed. */
function path(from: Pt, pts: Pt[], speeds: number[]) {
  return [corner(pts[0][0] - from[0], pts[0][1] - from[1], ROAD_LEAP), ...pts.slice(1).map((p, i) => corner(p[0] - from[0], p[1] - from[1], speeds[i]))];
}

export function addBeltMonsters(out: Monster[], n: (name: string) => number): void {
  for (const lane of LANES)
    for (const kind of [0, 1]) {
      const glass: Pt = [MIRROR.cols[lane + 1], MIRROR.row];
      out[BELTMON.mirror(lane, kind)] = mon(
        [
          [n(`belt.mirror${kind}.0`), 20],
          [n(`belt.mirror${kind}.1`), 200],
        ],
        { power: POWER, thru: 0, end: GLINT, newmon: BELTMON.car(lane, kind) },
      );
      // away from the base: fast near, slower far, shrinking with each size in step
      const [base, mid, vp] = TRACK[lane];
      const near = ticks(base, mid, 4);
      const far = ticks(mid, vp, 2);
      out[BELTMON.car(lane, kind)] = mon(
        [
          [n(`belt.car${kind}.3`), near + 1],
          [n(`belt.car${kind}.2`), Math.ceil(far / 2)],
          [n(`belt.car${kind}.1`), Math.floor(far / 2)],
          [n(`belt.car${kind}.0`), 200],
        ],
        { power: POWER, thru: 0, end: -1, newmon: 64 },
        path(glass, [base, mid, vp], [4, 2]),
      );
    }
  // dashes and posts: from the vanishing point down their lines, growing
  const toward = (kind: 'dash' | 'post', side: number, at: Pt) => {
    const [vp, mid, base] = (kind === 'dash' ? DIVIDER : POST)[side];
    const far = ticks(vp, mid, 3);
    const near = ticks(mid, base, 6);
    return mon(
      [
        [n(`belt.${kind}${side}.2`), far + 1],
        [n(`belt.${kind}${side}.3`), Math.ceil(near / 2)],
        [n(`belt.${kind}${side}.4`), 200],
      ],
      { power: POWER, thru: 0, end: -1, newmon: 64 },
      path(at, [vp, mid, base], [3, 6]),
    );
  };
  [-1, 1].forEach((side, i) => {
    out[BELTMON.dash(side)] = toward('dash', side, [SPAWN.dashes[i], SPAWN.row]);
    out[BELTMON.post(side)] = toward('post', side, [SPAWN.posts[i], SPAWN.row]);
  });
  // the EXIT sign: unseen, a leap from the mirror (where it is born, in the middle lane's glass) to
  // beside the road's end; a fleck there; a small sign stepping a block nearer; then the full sign
  // A monster that dies at its path's end leaves what it becomes heading off by the path's first
  // corner again, so the leap is half the way: the unseen leaper goes half, the fleck the rest.
  // The small sign's step ends by its lifetime (its path would start over), not at the path's end.
  const sign: Pt = [SHIELD.vp[0] + 1, SHIELD.vp[1]];
  const from: Pt = [MIRROR.cols[1], MIRROR.row];
  const half: Pt = [(sign[0] - from[0]) / 2, (sign[1] - from[1]) / 2];
  if (!Number.isInteger(half[0]) || !Number.isInteger(half[1])) throw new Error('beltway: the EXIT sign leaps an odd number of blocks');
  out[BELTMON.exit(0)] = mon([[n('belt.none'), 200]], { power: POWER, thru: 0, end: -1, newmon: BELTMON.exit(1) }, [
    corner(half[0], half[1], Math.max(Math.abs(half[0]), Math.abs(half[1])) * 20),
  ]);
  out[BELTMON.exit(1)] = mon([[n('belt.exit0'), 200]], { power: POWER, thru: 0, end: SIGN_STAGE, newmon: BELTMON.exit(2) });
  out[BELTMON.exit(2)] = mon([[n('belt.exit1'), 200]], { power: POWER, thru: 0, end: 20, newmon: BELTMON.exit(3) }, [corner(0, 1, 1)]);
  out[BELTMON.exit(3)] = mon([[n('belt.exit2'), 200]], { power: POWER, thru: 0, end: -2, newmon: 64 });
}
