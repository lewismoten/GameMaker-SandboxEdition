// A play-testing bot for GameSim, for a man who hops: walks to a column (hopping over what's
// in the way), hops straight or sideways and steers while it falls, declaims, and waits.
// Moving monsters (the foes, the buzzwords) are handled by trying a stretch
// again from a snapshot after a wait (route.ts, carefully()). The moves are kit/hopBot.ts's.
import { HopBot } from '../../kit/hopBot';
import { SCAN } from '../src/ids';
import { ORIGIN } from '../src/common/maps';
import type { GameSim } from './sim';

export type { Dir } from '../../kit/hopBot';

/** The poet's bot: its keys, its map origin, and its plot meter for BOT_HURT. */
export class Bot extends HopBot<GameSim, typeof SCAN> {
  constructor(sim: GameSim) {
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'plot', n: 21 } });
  }
}
