// A play-testing bot for GameSim with a person's timing: it walks to a column (hopping what
// blocks it), hops and steers (kit/hopBot.ts), climbs, reaches up (Space) and squirts the oil
// can the way a person does, a tick or two after seeing what it reacts to, never on the frame
// it changes, and never two different keys closer together than a few ticks.
import { HopBot } from '@lewismoten/gamemaker-sandbox-tools/kit/hopBot';
import { rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { CTR, SCAN } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import type { GameSim } from './sim';

export type { Dir } from '@lewismoten/gamemaker-sandbox-tools/kit/hopBot';

export class Bot extends HopBot<GameSim, typeof SCAN> {
  /** The bot's hand: a reaction of 1 to 3 ticks, seeded so a run is the same every time. */
  readonly hand: () => number;

  constructor(sim: GameSim, seed = 1) {
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'hits', n: CTR.hits }, traced: [72, 75, 77, 80, 16, 18, 57] });
    this.hand = rng(seed * 7919 + 13);
  }

  /** A person's reaction: 1 to 3 ticks. */
  react(): Promise<string | undefined> {
    return this.wait(1 + Math.floor(this.hand() * 3));
  }

  /** The block shown at level (x, y). */
  shown(x: number, y: number) {
    return this.sim.shown(x + ORIGIN, y + ORIGIN);
  }

  /** The number of the block shown at level (x, y) (an animation's frame is its own block). */
  shownNum(x: number, y: number): number {
    return this.sim.w.blkmap[this.sim.blockAt(x + ORIGIN, y + ORIGIN)] ?? 0;
  }

  /** A counter as F2 shows it. */
  count(n: number): number {
    return this.sim.meter(n) - 1;
  }

  /** One press of `key` for one tick, then let go and keep hands still `rest` ticks. */
  async tap(key: keyof typeof SCAN, rest = 3): Promise<string | undefined> {
    this.sim.press(SCAN[key]);
    const r = await this.tick();
    this.sim.release(SCAN[key]);
    if (r) return r;
    return this.wait(rest);
  }
}
