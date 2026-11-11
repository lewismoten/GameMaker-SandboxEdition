// Possible passage and support states of touch/animation chains, including cycles.
import { SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

/** Optimistic terrain states guide a search; timing, prices, and actual touches remain engine decisions. */
export function terrainStates(bg: readonly Block[]): { passable: boolean[]; support: boolean[] } {
  const passable = bg.map((b) => b.solid !== 15 || !!b.obj);
  const support = bg.map((b) => !!(b.solid & SOLTOP));
  for (let changed = true; changed;) {
    changed = false;
    for (let n = 0; n < bg.length; n++) {
      const b = bg[n];
      for (const next of [b.touchBl, b.ntime > 0 ? b.nextBl : n]) {
        if (!passable[n] && passable[next]) {
          passable[n] = true;
          changed = true;
        }
        if (!support[n] && support[next]) {
          support[n] = true;
          changed = true;
        }
      }
    }
  }
  return { passable, support };
}
