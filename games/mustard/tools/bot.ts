// A play-testing bot for GameSim, for a seed that hops: walks to a column (hopping over what's
// in the way), hops straight or sideways and steers while it falls, climbs and pushes roots,
// and waits. Moving monsters (the peacock, crows, beetles) are handled by trying a stretch
// again from a snapshot after a wait (route.ts, carefully()). The moves are kit/hopBot.ts's.
import { HopBot } from '../../kit/hopBot';
import { SCAN } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import type { GameSim } from './sim';

export type { Dir } from '../../kit/hopBot';

/** The seed's bot: its keys, its map origin, and its faith meter for BOT_HURT. */
export class Bot extends HopBot<GameSim, typeof SCAN> {
  constructor(sim: GameSim) {
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'faith', n: 21 } });
  }
}
