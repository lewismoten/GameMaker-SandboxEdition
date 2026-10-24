// Whether the hero can get out of harm from where a scene sim is now: each of the level
// check's moves is played from here (the sim is put back afterwards), and one that brings
// half a second with no hit points lost, or a link, is a way out. PLAYGAME hurts on every tick
// of a touch, so being hurt for a while is no trap in itself; it is one when nothing gets away.
import { DIESEQ } from '../../formats/character';
import { driveMove } from './drive';
import type { Move } from './inputs';
import type { SceneSim } from './sim';

/** Ticks running without a hurt that count as away. */
export const CALM_TICKS = 9;

export async function getsAway(sim: SceneSim, moves: Move[]): Promise<boolean> {
  const w = sim.w;
  const snap = sim.snapshot();
  let away = false;
  for (const m of moves) {
    sim.restore(snap);
    let calm = 0;
    let dead = false;
    /** One tick: 'dead', 0 once away, else undefined. */
    const tick = async (): Promise<'dead' | 0 | undefined> => {
      const hp = w.ci.hitpts;
      const t = await sim.tick();
      if (t === 'dead' || w.chr.cseq === DIESEQ) return ((dead = true), 'dead');
      if (w.ci.hitpts < hp) calm = 0;
      else calm++;
      if (t || calm >= CALM_TICKS) return ((away = true), 0);
      return undefined;
    };
    await driveMove(sim, m, { tick });
    // a move that came to rest early: stand a moment more and see whether harm follows
    for (let t = 0; t < CALM_TICKS && !away && !dead; t++) await tick();
    if (away) break;
  }
  sim.restore(snap);
  return away;
}
