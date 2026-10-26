// The bot's way through pies.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { CTR, SCAN } from '../../src/ids';
import { PIES } from '../../src/levels/pies';
import { BALCONY_ROW, LOOPS, STAGE_ROW } from '../../src/levels/piesTiles';

const loopTicks = (id: string) => LOOPS[id].frames.reduce((n, [, t]) => n + t, 0);

/** Where monster `name`s are, in pixels. */
export const spots = (s: Sim, name: string) =>
  s.w.mm.flatMap((m, i) =>
    s.scene.names?.[m.monnum] === name ? [{ x: s.w.mi[i].curx[0] * 20 + s.w.mi[i].curx[1], y: s.w.mi[i].cury[0] * 20 + s.w.mi[i].cury[1] }] : [],
  );
/** A `name` coming at Doc Leo from the right, `d` pixels or less from him. */
export const coming = (s: Sim, name: string, d: number) => spots(s, name).some((p) => p.x - s.pos.x <= d && p.x - s.pos.x > -12 && p.y >= (s.pos.by - 1) * 20);
/**
 * Walks right to column `goal` the way a player would through the pie practice: flat on his
 * back (4) while a `high` pie goes over, a hop over a `low` one skidding at his feet, walking
 * on in between. With `lull`, he waits at the goal until a volley has gone over him and
 * none is coming. `throwers` ([column, ticks between throws]) are not passed close by when a
 * throw is due (he waits for it and flops). (An until order that presses the keys itself, a tick at a time.)
 */
export const dodgeWalk = (goal: number, high: string[], low: string[] = [], lull = false, throwers: [number, number][] = []): Order => {
  let sim: Sim | undefined;
  let mode: 'walk' | 'flat' | 'hop' | 'done' = 'walk';
  let n = 0;
  const near = (s: Sim, names: string[], row: number, lo: number, hi: number) =>
    names.some((name) => spots(s, name).some((p) => p.y === row * 20 && p.x - s.pos.x > lo && p.x - s.pos.x <= hi));
  return {
    until: `dodged along to ${goal}`,
    maxTicks: 600,
    check: (s) => {
      if (s !== sim) [sim, mode, n] = [s, 'walk', 0];
      if (mode === 'done') return true;
      const ground = s.pos.y % 20 === 0;
      if (mode === 'flat') {
        if (near(s, high, s.pos.by - 1, -24, 40)) return false;
        s.release(SCAN.dead);
        mode = 'walk';
      }
      if (mode === 'hop') {
        if (++n === 5) s.release(SCAN.up);
        if (n < 8 || !ground) return false;
        mode = 'walk';
      }
      if (ground && near(s, high, s.pos.by - 1, -12, 36)) {
        s.release(SCAN.right);
        s.press(SCAN.dead);
        mode = 'flat';
        return false;
      }
      if (ground && near(s, low, s.pos.by, -4, 44)) {
        s.press(SCAN.right);
        s.press(SCAN.up);
        [mode, n] = ['hop', 0];
        return false;
      }
      if (s.pos.x >= goal * 20 && ground) {
        s.release(SCAN.right);
        const ahead = high.some((name) => spots(s, name).some((p) => p.x > s.pos.x - 12));
        const gone = high.some((name) => spots(s, name).some((p) => p.x <= s.pos.x - 12));
        if (lull && (ahead || !gone)) return false;
        mode = 'done';
        return true;
      }
      const due = throwers.some(([x, every]) => {
        const dx = x * 20 - s.pos.x;
        return dx <= 64 && dx > 16 && every - ((s.w.clock - 1) % every) <= (dx + 24) / 4 + 1;
      });
      if (due) s.release(SCAN.right);
      else s.press(SCAN.right);
      return false;
    },
  };
};

/** A SQUAWK once a pigeon is `d` pixels ahead or nearer (the squawk goes by a far one). */
const squawkAt = (d: number): Order[] => [
  { until: 'a pigeon comes near', maxTicks: 120, check: (s) => spots(s, 'pigeon').some((p) => p.y === s.pos.y && p.x - s.pos.x <= d && p.x > s.pos.x) },
  { trick: 'space', after: 12 },
];

export const route: Order[] = [
  dodgeWalk(26, ['pieTeach'], [], false, [[PIES.teach, loopTicks('teach')]]),
  { walk: 27 },
  ...squawkAt(22),
  { walk: 30 },
  ...squawkAt(22),
  dodgeWalk(45, ['pieHigh'], ['pieLow'], false, [[PIES.test, loopTicks('test') / 2]]),
  dodgeWalk(PIES.lift, ['pieVolley'], [], true),
  { trick: 'five', after: 10 },
  { until: 'up on the stage', maxTicks: 80, check: (s) => s.pos.by <= STAGE_ROW - 1 },
  dodgeWalk(PIES.lift2, ['pieVolley2'], [], true),
  { trick: 'five', after: 10 },
  { until: 'up on the balcony', maxTicks: 80, check: (s) => s.pos.by <= BALCONY_ROW - 1 },
  { walk: PIES.cake },
  { trick: 'f', after: 8 },
  { until: 'has the cake', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  { walk: PIES.flap },
];
