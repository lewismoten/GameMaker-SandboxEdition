// The bot's way through dream.ts: Teddy stays on the spot while the world runs by, and the
// bot reacts the way a player watching the path does. Everything comes at the same speed, so
// how far off a thing is says when to move: a hop (Up held) when a ball or a puddle is
// `HOP.at` pixels off, playing dead (4 held) from when a branch is `FLAT.at` off until it has
// gone by, and a hop for a treat floating in alone. At the end the path carries him off.
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { SCAN } from '../../src/ids';
import { END, LANE } from '../../src/levels/dreamTiles';

/** When to move, in pixels between a thing and Teddy, and how long to hold the key. */
export const HOP = { at: 32, hold: 8 };
export const FLAT = { at: 32 };
export const GRAB = { at: 20, hold: 4 };

/** The things on the path: their names and how far ahead of Teddy each is, in pixels. */
const ahead = (s: Sim, names: string[]) =>
  s.w.mm.flatMap((m, i) => (names.includes(s.scene.names?.[m.monnum] ?? '') ? [s.w.mi[i].curx[0] * 20 + s.w.mi[i].curx[1] - s.pos.x] : []));
const within = (s: Sim, names: string[], lo: number, hi: number) => ahead(s, names).some((d) => d > lo && d <= hi);

function runOnTheSpot(): Order {
  let sim: Sim | undefined;
  let held: { key: 'up' | 'dead'; until: number } | undefined;
  return {
    until: 'the dream run ends',
    maxTicks: END + 200,
    check: (s) => {
      if (s !== sim) [sim, held] = [s, undefined];
      if (held?.key === 'dead') {
        // flat until the branch has gone over
        if (within(s, ['branch'], -24, FLAT.at)) return false;
        s.release(SCAN.dead);
        held = undefined;
      }
      if (held) {
        if (s.ticks >= held.until) {
          s.release(SCAN[held.key]);
          held = undefined;
        }
        return false;
      }
      if (s.ticks >= END || s.pos.by !== LANE || s.pos.y % 20) return false;
      if (within(s, ['branch'], 0, FLAT.at)) {
        s.press(SCAN.dead);
        held = { key: 'dead', until: 0 };
      } else if (within(s, ['ball', 'puddle'], 0, HOP.at)) {
        s.press(SCAN.up);
        held = { key: 'up', until: s.ticks + HOP.hold };
      } else if (within(s, ['treatRun'], 0, GRAB.at)) {
        s.press(SCAN.up);
        held = { key: 'up', until: s.ticks + GRAB.hold };
      }
      return false;
    },
  };
}

export const route: Order[] = [runOnTheSpot()];
