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

/**
 * Whether holding a key, or two together, for 1 to 24 ticks (the first then let go, the other
 * held on a while) brings the hero to rest alive on one of the `way` cells, or to a link.
 */
export async function frees(sim: SceneSim, keys: number[], way: Set<number>): Promise<boolean> {
  const w = sim.w;
  const snap = sim.snapshot();
  try {
    for (const k1 of keys)
      for (const k2 of [0, ...keys.filter((k) => k !== k1)])
        for (const hold of [1, 3, 6, 12, 24]) {
          sim.restore(snap);
          sim.hold(k2 ? [k2, k1] : [k1]);
          for (let t = 0; t < 100; t++) {
            if (t === hold) sim.hold(k2 ? [k2] : []);
            if (t === hold + 40) sim.hold([]);
            const r = await sim.tick();
            if (r === 'dead' || w.chr.cseq === DIESEQ) break;
            if (r) return true;
            if (w.ci.gravy === 0 && t > hold && way.has(w.chr.y[0] * 100 + w.chr.x[0])) return true;
          }
        }
    return false;
  } finally {
    sim.restore(snap);
  }
}
