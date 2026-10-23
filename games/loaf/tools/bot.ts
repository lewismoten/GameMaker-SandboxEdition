// A play-testing bot for GameSim, for a loaf that rises: walks to a column (hopping over what's
// in the way), hops straight or sideways and steers while it falls, climbs the weave,
// and waits. Moving monsters (the peacock, crows, beetles) are handled by trying a stretch
// again from a snapshot after a wait (route.ts, carefully()). The moves are kit/hopBot.ts's;
// when patient, the loaf lets a basket's song finish before it hops or gathers the next one.
import { HopBot, type Dir, type Result } from '../../kit/hopBot';
import { BASKETS, SCAN } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import type { GameSim } from './sim';

export type { Dir } from '../../kit/hopBot';

/** The loaf's bot: its keys, its map origin, and its crumbs meter for BOT_HURT. */
export class Bot extends HopBot<GameSim, typeof SCAN> {
  /** Let a clip that is playing (a basket's "twelve baskets full") finish before a hop's puff. */
  patient = false;

  constructor(sim: GameSim) {
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'crumbs', n: 20 } });
  }

  /** When patient: stands still until the playing clip ends (keys let go). */
  async letClipFinish(): Promise<Result> {
    if (!this.patient || this.sim.clipTicksLeft <= 0) return undefined;
    return (await this.sim.waitForClip()) ?? undefined;
  }

  /** An empty basket (one that sings when gathered) within a step of the loaf's side, or under that step. */
  basketAhead(dir: Dir): boolean {
    const p = this.px;
    const x = Math.floor((dir === 'right' ? p.x + 20 + 4 : p.x - 4) / 20);
    // its rows, and the row under its feet (a basket at the end of a branch is gathered from above)
    const ys = [Math.floor(p.y / 20), Math.ceil(p.y / 20), Math.ceil(p.y / 20) + 1];
    return ys.some((y) => {
      const b = this.sim.shown(x + ORIGIN, y + ORIGIN);
      return b.effect === BASKETS && b.eamt > 0;
    });
  }

  /** The next basket would sing over this one: wait for it, then roll on. */
  protected override async beforeStep(dir: Dir): Promise<Result> {
    if (!(this.patient && this.sim.clipTicksLeft > 0 && this.basketAhead(dir))) return undefined;
    const rc = await this.letClipFinish();
    if (rc) return rc;
    this.sim.press(SCAN[dir]);
    return undefined;
  }

  /** A hop's puff waits for the song; a walk's hop takes up its direction again after. */
  protected override async beforeHop(dir?: Dir): Promise<Result> {
    const rc = await this.letClipFinish();
    if (rc) return rc;
    if (dir) this.sim.press(SCAN[dir]);
    return undefined;
  }
}
