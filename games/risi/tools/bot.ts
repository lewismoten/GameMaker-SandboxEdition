// A play-testing bot for GameSim, for a hero who hops: walks to a column (hopping over what's
// in the way), hops straight or sideways and steers while it falls, rides the steam and drums, climbs the ladders,
// and waits. Moving monsters (the clouds, the horde, the mice, the decrees) are handled by trying a stretch
// again from a snapshot after a wait (route.ts, carefully()). The moves are kit/hopBot.ts's.
import { HopBot } from '../../kit/hopBot';
import { SCAN } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import type { GameSim } from './sim';

export type { Dir } from '../../kit/hopBot';

/** The hero's bot: its keys, its map origin, and its air meter for BOT_HURT. */
export class Bot extends HopBot<GameSim, typeof SCAN> {
  constructor(sim: GameSim) {
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'air', n: 20 } });
  }
}
