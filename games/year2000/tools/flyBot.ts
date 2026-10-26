// The Cloud Lane's bot: it watches the traffic sliding down the three lanes, works out when each
// car or truck will reach the CitiCar's row, and steers (a tap a lane) to a lane that stays
// clear, going after pages and pills when that lane is clear too, and keeping right once the
// sign gets near 0 MI so the push carries it up the exit ramp.
import type { Sim } from './sim';
import { SKYMON } from '../src/ids';
import { LANE_COLS } from '../src/art/skyView';
import { OPEN_AT } from '../src/levels/cloudWaves';

const SCAN = { left: 0x4b, right: 0x4d };
/** The car's row, in screen pixels (the screen's top is the map's). */
const CAR_TOP = 100;
/** Ticks for the car to change one lane (four frames of 10 pixels). */
const LANE_TICKS = 4;

/** What each monster number is: its lane and whether it hurts. */
const KIND = new Map<number, { lane: number; hurts: boolean }>();
for (const [kind, hurts] of [
  ['car', true],
  ['truck', true],
  ['page', false],
  ['pill', false],
] as const)
  SKYMON[kind].forEach((n, lane) => KIND.set(n, { lane, hurts }));

/** Where a monster's top will be `dt` ticks on: a pixel a tick to y 80, two to 100, then four. */
function yAfter(y: number, dt: number): number {
  for (let t = 0; t < dt; t++) y += y < 80 ? 1 : y < 100 ? 2 : 4;
  return y;
}

/** Overlaps the car's row (a near picture reaches down to its sprite's bottom). */
const onCarRow = (y: number) => y > CAR_TOP - 18 && y < CAR_TOP + 18;

export class FlyBot {
  log: string[] = [];
  /** Lanes chosen (for the log). */
  private moves = 0;
  private waiting = false;
  /** `notice`: how far down (screen y) traffic must be before the bot sees it: a slower player. */
  constructor(
    readonly sim: Sim,
    readonly notice = 0,
  ) {}

  /** The car's lane (0 left, 1 middle, 2 right), or a fraction between two. */
  lane(): number {
    return (this.sim.pos.x - LANE_COLS[0] * 20) / 40;
  }

  /** Monsters on screen that matter: [lane, top y, hurts]. */
  private traffic(): [number, number, boolean][] {
    const w = this.sim.w;
    const out: [number, number, boolean][] = [];
    w.mm.forEach((m, i) => {
      const k = KIND.get(m.monnum);
      if (!k) return;
      const y = w.mi[i].cury[0] * 20 + w.mi[i].cury[1];
      if (y < this.notice || y > 200) return;
      out.push([k.lane, y, k.hurts]);
    });
    return out;
  }

  /** Is lane `l` free of hurting traffic on the car's row from `t0` to `t1` ticks from now? */
  private clear(l: number, t0: number, t1: number, t: [number, number, boolean][]): boolean {
    return !t.some(([lane, y, hurts]) => hurts && lane === l && Array.from({ length: t1 - t0 + 1 }, (_, i) => yAfter(y, t0 + i)).some(onCarRow));
  }

  /** A prize in lane `l` that the car would catch there. */
  private prize(l: number, t: [number, number, boolean][]): boolean {
    return t.some(([lane, y, hurts]) => !hurts && lane === l && y < CAR_TOP && y > 40);
  }

  /** One tick: pick a lane, tap toward it, play the tick. */
  async tick(): Promise<void> {
    const { sim } = this;
    sim.release(SCAN.left);
    sim.release(SCAN.right);
    const here = this.lane();
    const settled = Number.isInteger(here) && sim.w.chr.cseq === 0;
    if (settled) {
      const t = this.traffic();
      const late = sim.ticks > OPEN_AT - 50;
      let best = here;
      let bestScore = -Infinity;
      for (const target of [0, 1, 2]) {
        const d = Math.abs(target - here);
        // safe the whole way: each lane passed through while the car crosses it, then the target for a while
        let ok = true;
        for (let j = 1; j < d; j++) {
          const lane = here + Math.sign(target - here) * j;
          if (!this.clear(lane, LANE_TICKS * j - LANE_TICKS, LANE_TICKS * j + 2, t)) ok = false;
        }
        if (!this.clear(target, Math.max(0, LANE_TICKS * d - LANE_TICKS), 40, t)) ok = false;
        if (!ok) continue;
        const score = -d * 2 + (this.prize(target, t) ? 3 : 0) + (late && target === 2 ? 10 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = target;
        }
      }
      // nowhere is clear for the next couple of seconds: hold on and look again next tick
      if (bestScore === -Infinity && !this.waiting) this.log.push(`tick ${sim.ticks}: waits in lane ${here} for a gap`);
      this.waiting = bestScore === -Infinity;
      if (best !== here) {
        sim.press(best > here ? SCAN.right : SCAN.left);
        this.moves++;
      }
    }
    await sim.tick();
  }

  /** Flies until the exit link or death; true at the exit. */
  async fly(maxTicks = OPEN_AT + 400): Promise<boolean> {
    while (this.sim.ticks < maxTicks && this.sim.link < 0 && !this.sim.dead) await this.tick();
    this.sim.releaseAll();
    this.log.push(`${this.moves} lane changes, ${this.sim.link >= 0 ? 'off the ramp' : this.sim.dead ? 'crashed' : 'still flying'} at tick ${this.sim.ticks}`);
    return this.sim.link >= 0;
  }
}
