// A play-testing bot for GameSim with a person's timing: it walks to a column (hopping what
// blocks it), hops and steers (kit/hopBot.ts), and boops (Space) the way a person does, a
// tick or two after seeing a key light, never on the frame it lights.
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
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'found', n: CTR.found }, traced: [72, 75, 77, 80, 16, 18, 57] });
    this.hand = rng(seed * 7919 + 13);
  }

  /** The block shown at level (x, y). */
  shown(x: number, y: number) {
    return this.sim.shown(x + ORIGIN, y + ORIGIN);
  }

  /** One boop: Space for one tick, then let go (and at least two ticks before anything else). */
  async boop(): Promise<string | undefined> {
    this.sim.press(SCAN.space);
    const r = await this.tick();
    this.sim.release(SCAN.space);
    if (r) return r;
    return this.wait(2);
  }
}
