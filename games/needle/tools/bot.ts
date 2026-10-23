// A play-testing bot for GameSim, for a camel that hops and crawls: walks to a column (hopping over what's
// in the way), hops straight or sideways and steers while it falls, crawls on its knees and climbs threads,
// and waits. Moving monsters (the rich man, dogs, melons) are handled by trying a stretch
// again from a snapshot after a wait (route.ts, carefully()). The moves are kit/hopBot.ts's.
import { HopBot, type Dir, type Result } from '../../kit/hopBot';
import { SCAN } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import type { GameSim } from './sim';

export type { Dir } from '../../kit/hopBot';

/** The camel's bot: its keys (BOT_TRACE lists Z and C too), its map origin, and its grace meter for BOT_HURT. */
export class Bot extends HopBot<GameSim, typeof SCAN> {
  constructor(sim: GameSim) {
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'grace', n: 20 }, traced: [72, 75, 77, 80, 16, 18, 44, 46] });
  }

  /** Crawls on his knees (Z or C) until the camel reaches level column `bx`. */
  async crawl(dir: Dir, bx: number, label = '', max = 400): Promise<Result> {
    const goal = bx * 20;
    const key = dir === 'left' ? 'z' : 'c';
    return this.until(key, () => (dir === 'right' ? this.px.x >= goal : this.px.x <= goal), label || `crawled ${dir} to ${bx}`, max);
  }
}
