// A play-testing bot for GameSim with a person's timing: it walks to a column (hopping what
// blocks it), hops and steers (kit/hopBot.ts), climbs, reaches up (Space) and squirts the oil
// can the way a person does, a tick or two after seeing what it reacts to, never on the frame
// it changes, and never two different keys closer together than a few ticks.
import { HopBot } from '@lewismoten/gamemaker-sandbox-tools/kit/hopBot';
import { rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { CTR, SCAN } from '../src/ids';
import { LEVELS } from '../src/levels/levels';
import { ORIGIN } from '../src/levels/maps';
import { rowOffset } from '../src/levels/stacks';
import type { GameSim } from './sim';

export type { Dir } from '@lewismoten/gamemaker-sandbox-tools/kit/hopBot';

export class Bot extends HopBot<GameSim, typeof SCAN> {
  /** The bot's hand: a reaction of 1 to 3 ticks, seeded so a run is the same every time. */
  readonly hand: () => number;

  /** Slower hands: ticks to rest after any tap at least (6 is about 300 ms at 18 ticks a second). */
  slowRest = 0;

  constructor(sim: GameSim, seed = 1) {
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'hits', n: CTR.hits }, traced: [72, 75, 77, 80, 16, 18, 57] });
    this.hand = rng(seed * 7919 + 13);
  }

  /** Rows down its map this scene is drawn (src/levels/stacks.ts); levels' scenes start at 2. */
  private get dy(): number {
    const l = LEVELS[this.sim.scene - 2];
    return l ? rowOffset(l.file) : 0;
  }

  /** The hero's position in level pixels, wherever on its map the scene is drawn. */
  override get px(): { x: number; y: number } {
    const p = super.px;
    return { x: p.x, y: p.y - this.dy * 20 };
  }

  /** A person's reaction: 1 to 3 ticks. */
  react(): Promise<string | undefined> {
    return this.wait(1 + Math.floor(this.hand() * 3));
  }

  /** The block shown at level (x, y). */
  shown(x: number, y: number) {
    return this.sim.shown(x + ORIGIN, y + ORIGIN + this.dy);
  }

  /** The number of the block shown at level (x, y) (an animation's frame is its own block). */
  shownNum(x: number, y: number): number {
    return this.sim.w.blkmap[this.sim.blockAt(x + ORIGIN, y + ORIGIN + this.dy)] ?? 0;
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
    return this.wait(Math.max(rest, this.slowRest));
  }
}
