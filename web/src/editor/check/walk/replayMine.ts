// Replays one of the author's kept plays (mine.ts) on the level check's simulator, from wherever
// the walkthrough has got to: Make a walkthrough (autoWalk.ts) uses the take when it still
// reaches an exit, and lets the bot play the scene when it doesn't.
import type { Game } from '../../../formats/game';
import { decodeKeys } from '../../../walkthrough/format';
import type { Entry } from '../explore';
import { SceneSim, TICKS_PER_SECOND, type FileSource } from '../sim';
import type { Replay } from './autoWalk';

/** How long a take may go on after its last key before it is given up on (the hero walking on to a link). */
const AFTER_TICKS = Math.round(20 * TICKS_PER_SECOND);

/**
 * Plays a take's keys from the scene's entry (every monster moving, the monsters' numbers
 * seeded as the walkthrough seeds them) until the hero takes a link: the same Replay the bot's
 * paths give, or undefined if the hero dies or no link is taken in time.
 */
export async function replayMine(game: Game, files: FileSource, scene: number, entry: Entry, keys: string, seed = 1): Promise<Replay | undefined> {
  const sim = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev, seed);
  const events: { tick: number; key: number }[] = [];
  let t = 0;
  for (const k of decodeKeys(keys)) events.push({ tick: (t += k.delta), key: k.key });
  const last = events.length ? events[events.length - 1].tick : 0;
  let next = 0;
  for (let tick = 1; tick <= last + AFTER_TICKS; tick++) {
    // a key is pressed before the tick it was applied on (as replayPath records them)
    for (; next < events.length && events[next].tick <= tick; next++) {
      const k = events[next].key;
      if (k < 0x80) sim.press(k);
      else sim.release(k & 0x7f);
    }
    const r = await sim.tick();
    if (r === 'dead') return undefined;
    if (r) {
      const ci = sim.w.ci;
      return {
        link: r.link,
        events: events.slice(0, next),
        ticks: tick,
        ci: { ...ci, inv: ci.inv.slice(), meter: ci.meter.slice(), seqon: ci.seqon.slice() },
        clock: sim.w.clock,
        world: sim.w,
      };
    }
  }
  return undefined;
}
