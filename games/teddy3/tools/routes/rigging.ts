// The bot's way through rigging.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { CTR, SCAN } from '../../src/ids';
import { RIGGING } from '../../src/levels/rigging';
import { ROWS } from '../../src/levels/riggingTiles';
import { spots } from './pies';
import { at } from './helpers';

/** Standing on catwalk `row` (or higher up). */
const upOn = (row: number): Order => ({ until: `up on row ${row}`, maxTicks: 90, check: (s) => s.pos.by <= row - 1 && s.pos.y % 20 === 0 });
/** A balloon up to catwalk `row`. */
const balloonTo = (row: number): Order[] => [{ trick: 'five', after: 10 }, upOn(row)];
/** A SQUAWK once a pigeon is `d` pixels away or nearer (the squawk goes by a far one). */
const squawkAt = (d: number): Order[] => [
  { until: 'a pigeon comes near', maxTicks: 120, check: (s) => spots(s, 'pigeon').some((p) => p.y === s.pos.y && Math.abs(p.x - s.pos.x) <= d) },
  { trick: 'space', after: 12 },
];

/**
 * Walks to column `goal` (either way) under swinging sandbags: flat on his back (4) while a
 * `bag` at head height is within reach, walking on when it has swung clear. (An until order
 * that presses the keys itself, a tick at a time.)
 */
const underBags = (goal: number, bags: string[]): Order => {
  let sim: Sim | undefined;
  let flat = false;
  let done = false;
  return {
    until: `under the sandbags to ${goal}`,
    maxTicks: 600,
    check: (s) => {
      if (s !== sim) [sim, flat, done] = [s, false, false];
      if (done) return true;
      const dir = goal * 20 > s.pos.x ? SCAN.right : SCAN.left;
      const near = bags.some((name) => spots(s, name).some((p) => p.y === (s.pos.by - 1) * 20 && Math.abs(p.x - s.pos.x) <= 40));
      if (flat) {
        if (near) return false;
        s.release(SCAN.dead);
        flat = false;
      }
      if (near && s.pos.y % 20 === 0) {
        s.release(SCAN.right);
        s.release(SCAN.left);
        s.press(SCAN.dead);
        flat = true;
        return false;
      }
      if (Math.abs(s.pos.x - goal * 20) < 4 && s.pos.y % 20 === 0) {
        s.release(SCAN.right);
        s.release(SCAN.left);
        done = true;
        return true;
      }
      s.press(dir);
      return false;
    },
  };
};

const lifts = ['liftA', 'liftB'];

/** Until the pin has just gone back over Doc Leo toward Juggles (the longest lull). */
const pinGoneBack = (): Order => {
  let sim: Sim | undefined;
  let last = -1;
  let done = false;
  return {
    until: 'the pin has gone back by',
    maxTicks: 160,
    check: (s) => {
      if (s !== sim) [sim, last, done] = [s, -1, false];
      const x = spots(s, 'pin')[0]?.x ?? -1;
      done ||= x > last && last >= 0 && x > s.pos.x + 10 && x < s.pos.x + 40;
      last = x;
      return done;
    },
  };
};

export const route: Order[] = [
  // the ring
  { walk: RIGGING.lift1 },
  ...balloonTo(ROWS.t1),
  // along the bleachers under the low sandbag
  underBags(RIGGING.lift2, ['swingLow']),
  ...balloonTo(ROWS.t2),
  // the lift
  { walk: RIGGING.lift - 1 },
  { until: 'a lift plank comes level', maxTicks: 160, check: (s) => lifts.some((n) => at(s, n, RIGGING.lift, ROWS.t2)) },
  { walk: RIGGING.lift, maxTicks: 20, grab: false },
  { until: 'at the top of the shaft', maxTicks: 120, check: (s) => s.pos.by <= ROWS.t4 - 1 },
  { walk: RIGGING.lift - 2, maxTicks: 20, grab: false },
  // Juggles' catwalk: the pigeon, then a balloon between pins
  { walk: RIGGING.pigeon + 2 },
  ...squawkAt(40),
  { walk: RIGGING.lift3 },
  pinGoneBack(),
  ...balloonTo(ROWS.t5),
  // the plug, past the high sandbag, and back
  underBags(RIGGING.plug, ['swingHigh']),
  { trick: 'f', after: 8 },
  { until: 'has the plug', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  underBags(RIGGING.lift4, ['swingHigh']),
  ...balloonTo(ROWS.t6),
  { walk: RIGGING.outlet },
];
