// Confirm suspected stuck areas and identify the source of harmful or repeating touches.
import { BLEN, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { LASTMM, LASTMON, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import type { Exploration } from './exploreTypes';
import type { SceneSim, Snap } from './sim';
import { driveMove } from './drive';
import { frees } from './escape';
import { canLeave, stuckAreas } from './stuck';

/**
 * Before an area is called a place to get stuck, the hero is taken to its way in again (the
 * moves that found it, replayed from the start) and every key, and every two keys together, is
 * held for a few lengths of time: a hop steered just so, or a key with a walk, may get him out
 * where the explorer's own moves didn't. Places of an area he gets out of are marked freed.
 */
export async function confirmStuck(ex: Exploration, sim: SceneSim, start: Snap, map: Uint8Array, bg: Block[]): Promise<void> {
  const areas = stuckAreas(ex, map, bg).slice(0, 12);
  if (!areas.length) return;
  const ok = canLeave(ex);
  // cells with a way out, but none of a stuck area's (a cell can be both, carrying a key or not)
  const trapped = new Set(areas.flatMap((a) => a.cells));
  const way = new Set(ex.places.flatMap((p, i) => (ok[i] && !trapped.has(p.cell) ? [p.cell] : [])));
  const keys = [...new Set(ex.moves.flatMap((m) => m.steps.flatMap((s) => s.keys)))];
  const tick = async () => {
    const t = await sim.tick();
    return t === 'dead' ? 'dead' : t ? t.link : undefined;
  };
  for (const a of areas) {
    const chain: number[] = [];
    for (let p = a.entry; ex.places[p].via; p = ex.places[p].via!.parent) chain.unshift(p);
    sim.restore(start);
    for (const p of chain) {
      const v = ex.places[p].via!;
      await driveMove(sim, ex.moves[v.move], { tick, limit: v.ticks });
    }
    if (await frees(sim, keys, way)) {
      const cells = new Set(a.cells);
      for (const p of ex.places) if (cells.has(p.cell)) p.freed = true;
    }
  }
}

/** What the hero is touching that would do this: a block in its cells, else the monster nearest. */
export function culprit(w: World, sim: SceneSim, what: 'hurt' | 'score' | 'heal'): string | undefined {
  const fits = (b: Block | undefined) => !!b && (what === 'hurt' ? b.chHitPt < 0 : what === 'heal' ? b.chHitPt > 0 : b.scorePts > 0);
  const cells = new Int32Array(6);
  const nt = sim.touching(cells);
  for (const c of cells.subarray(0, nt)) {
    const n = w.blkmap[w.map[c]];
    if (fits(w.bg[n])) return `block ${n}`;
  }
  const p = sim.px;
  let best: string | undefined;
  let bestD = Infinity;
  for (let l = 0; l < LASTMM; l++) {
    const mm = w.mm[l];
    if (mm.monnum >= LASTMON) continue;
    const mi = w.mi[l];
    const pic = mi.curPic >= 0 && mi.curPic < 20 ? w.mon[mm.monnum]?.pic[mi.curPic]?.[0] : undefined;
    if (pic === undefined || pic >= 100 || !fits(w.mblk[pic])) continue;
    const d = Math.abs(mi.curx[0] * BLEN + mi.curx[1] - p.x) + Math.abs(mi.cury[0] * BLEN + mi.cury[1] - p.y);
    if (d < bestD && d < BLEN * 3) {
      bestD = d;
      best = `monster ${mm.monnum}`;
    }
  }
  return best;
}
