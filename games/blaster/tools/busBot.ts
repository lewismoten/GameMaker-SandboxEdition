// The data bus rides' pilot: it watches the traffic sliding down the three lanes, works out when
// each hazard will reach the ship's row, and steers (a tap a lane) to a lane that stays clear,
// going after good bytes and repairs when that lane is clear too, and keeping to the middle
// once the sign nears 0 so the push carries it into the chip. In The Year 2000!'s Cloud Lane
// pilot (games/year2000/tools/flyBot.ts) flies the same way.
import { LASTMON } from '../../../web/src/formats/monster';
import { SCAN } from '../src/ids';
import { openAt, type Ride } from '../src/bus/rides';
import { LANE_COLS, SHIP_ROW } from '../src/bus/view';
import type { Sim } from './sim';

/** The ship's row, in screen pixels (the screen's top is the map's). */
const SHIP_TOP = SHIP_ROW * 20;
/** Ticks for the ship to change one lane (four frames of 10 pixels). */
const LANE_TICKS = 4;
/** Traffic by monster name: its kind and lane (busMonsters.ts). */
const TRAFFIC = /^(irq|bits|foe|byte|fix)([012])$/;

/** Where a monster's top will be `dt` ticks on: a pixel a tick to y 80, two to 100, then four. */
function yAfter(y: number, dt: number): number {
  for (let t = 0; t < dt; t++) y += y < 80 ? 1 : y < 100 ? 2 : 4;
  return y;
}

/** Overlaps the ship's row (a near picture reaches down to its sprite's bottom). */
const onShipRow = (y: number) => y > SHIP_TOP - 18 && y < SHIP_TOP + 18;

type Seen = [lane: number, y: number, hurts: boolean];

export class BusBot {
  /** Lane changes so far. */
  moves = 0;
  /**
   * `notice`: how far down (screen y) traffic must be before the pilot sees it, and `calm`: how
   * many ticks it lets a choice settle before it looks again. Both make a slower, more human pilot.
   */
  constructor(
    readonly sim: Sim,
    readonly ride: Ride,
    readonly notice = 0,
    readonly calm = 0,
  ) {}

  private hold = 0;

  /** The ship's lane (0 left, 1 middle, 2 right), or a fraction between two. */
  lane(): number {
    return (this.sim.pos.x - LANE_COLS[0] * 20) / 40;
  }

  /** Traffic on screen that matters. */
  private traffic(): Seen[] {
    const w = this.sim.w;
    const out: Seen[] = [];
    w.mm.forEach(({ monnum }, i) => {
      if (monnum >= LASTMON) return;
      const m = TRAFFIC.exec(this.sim.scene.names[monnum] ?? '');
      if (!m) return;
      const y = w.mi[i].cury[0] * 20 + w.mi[i].cury[1];
      if (y < this.notice || y > 200) return;
      out.push([Number(m[2]), y, m[1] === 'irq' || m[1] === 'bits' || m[1] === 'foe']);
    });
    return out;
  }

  /** Is lane `l` free of hazards on the ship's row from `t0` to `t1` ticks from now? */
  private clear(l: number, t0: number, t1: number, t: Seen[]): boolean {
    return !t.some(([lane, y, hurts]) => hurts && lane === l && Array.from({ length: t1 - t0 + 1 }, (_, i) => yAfter(y, t0 + i)).some(onShipRow));
  }

  /** A prize in lane `l` that the ship would catch there. */
  private prize(l: number, t: Seen[]): boolean {
    return t.some(([lane, y, hurts]) => !hurts && lane === l && y < SHIP_TOP && y > 40);
  }

  /** One tick: pick a lane, tap toward it, play the tick. */
  async tick(): Promise<void> {
    const { sim } = this;
    sim.only(undefined);
    const here = this.lane();
    const settled = Number.isInteger(here) && sim.w.chr.cseq === 0;
    if (this.hold > 0) this.hold--;
    else if (settled) {
      const t = this.traffic();
      const late = sim.ticks > openAt(this.ride) - 60;
      let best = here;
      let bestScore = -Infinity;
      for (const target of [0, 1, 2]) {
        const d = Math.abs(target - here);
        // safe the whole way: each lane passed through while the ship crosses it, then the target for a while
        let ok = true;
        for (let j = 1; j < d; j++) {
          const lane = here + Math.sign(target - here) * j;
          if (!this.clear(lane, LANE_TICKS * j - LANE_TICKS, LANE_TICKS * j + 2, t)) ok = false;
        }
        if (!this.clear(target, Math.max(0, LANE_TICKS * d - LANE_TICKS), 40, t)) ok = false;
        if (!ok) continue;
        const score = -d * 2 + (this.prize(target, t) ? 3 : 0) + (late && target === 1 ? 10 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = target;
        }
      }
      if (best !== here) {
        sim.press(best > here ? SCAN.right : SCAN.left);
        this.moves++;
        this.hold = this.calm;
      }
    }
    await sim.tick();
  }
}

/**
 * Rides a data bus leg with the pilot, as fly() plays the others: `notice` and `calm` make it
 * slower and steadier (the walkthrough's pilot). Counts the energy lost to the hazards.
 */
export async function rideBus(
  sim: Sim,
  ride: Ride,
  o: { notice?: number; calm?: number } = {},
): Promise<{ ok: boolean; dead: boolean; ticks: number; hpLost: number; score: number; log: string[] }> {
  const bot = new BusBot(sim, ride, o.notice ?? 0, o.calm ?? 0);
  let lost = 0;
  let hp = sim.w.ci.hitpts;
  const log: string[] = [];
  while (sim.ticks < openAt(ride) + 300 && sim.link < 0 && !sim.dead) {
    await bot.tick();
    if (sim.w.ci.hitpts < hp) {
      lost += hp - sim.w.ci.hitpts;
      log.push(`t${sim.ticks} hit ${hp}->${sim.w.ci.hitpts} in lane ${bot.lane()}`);
    }
    hp = sim.w.ci.hitpts;
  }
  sim.only(undefined);
  log.push(`${bot.moves} lane changes, ${sim.link >= 0 ? 'into the chip' : sim.dead ? 'lost the ship' : 'still riding'} at tick ${sim.ticks}`);
  return { ok: sim.link >= 0, dead: sim.dead, ticks: sim.ticks, hpLost: lost, score: sim.w.ci.score, log };
}
