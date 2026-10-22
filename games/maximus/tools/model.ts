// A look-ahead copy of the live world: the bot clones the engine's World as it stands and
// plays candidate key plans on the copy with the engine's own movement, monster and touch
// code (the body of playScene's tick, as tools/sim.ts copies it), to see which plan gets
// closest to the goal without getting hurt. Only the copy is ever changed; the keys the
// bot then presses on the real engine are what the walkthrough records. The copy's monsters
// draw their own random numbers, so it is a forecast, not a replay.
import { moveChars } from '../../../web/src/engine/character';
import { simKeyPress } from '../../../web/src/engine/keys';
import { blockBirthMonsters, moveAllMonsters } from '../../../web/src/engine/monsters';
import { updateCharDrawState } from '../../../web/src/engine/render';
import { changeScroll, drawScroll } from '../../../web/src/engine/scroll';
import { getTouchBlocks } from '../../../web/src/engine/touch';
import { BACKBL, LASTMM, bgBlock, type World } from '../../../web/src/engine/world';
import { rng } from '../../kit/pixels';

/** Fields the engine never changes while playing: shared, not copied. */
const SHARED = new Set(['palette', 'bg', 'mblk', 'cblk', 'mon']);

let seedCounter = 1;

/** A deep copy of plain data (arrays, typed arrays, objects), faster than structuredClone for many small objects. */
function copy<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  if (ArrayBuffer.isView(v)) return (v as unknown as Uint8Array).slice() as unknown as T;
  if (Array.isArray(v)) return v.map(copy) as unknown as T;
  const o: Record<string, unknown> = {};
  for (const k in v) o[k] = copy((v as Record<string, unknown>)[k]);
  return o as T;
}

export function cloneWorld(w: World): World {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(w)) {
    if (typeof v === 'function') out[k] = v;
    else if (SHARED.has(k) || v === undefined || v === null || typeof v !== 'object') out[k] = v;
    else if (k === 'sound') out[k] = { play: () => true };
    else if (k === 'chr') {
      // the character's sequences stay as they are; its position and state are copied
      const c: Record<string, unknown> = {};
      for (const [ck, cv] of Object.entries(v as object)) c[ck] = ck === 'sequences' ? cv : copy(cv);
      out[k] = c;
    } else out[k] = copy(v);
  }
  out.rand = rng(seedCounter++);
  out.joystick = undefined;
  return out as unknown as World;
}

export interface Forecast {
  w: World;
  dead: boolean;
  /** Link cells touched (map cells), in order. */
  touched: (x: number, y: number) => boolean;
  link: boolean;
  doScroll: boolean;
  pending: number[];
}

export function forecast(w: World, doScroll: boolean, isLink: (x: number, y: number) => boolean): Forecast {
  return { w: cloneWorld(w), dead: false, touched: isLink, link: false, doScroll, pending: [] };
}

/** One game tick on the copy, with `keys` (scan, bit 7 released) becoming pending now. */
export async function step(f: Forecast, keys: number[]): Promise<void> {
  const w = f.w;
  for (let i = 0; i < 8; i++) if (f.doScroll) drawScroll(w);
  w.clock++;
  if (!w.noMons) {
    blockBirthMonsters(w);
    moveAllMonsters(w);
  }
  f.pending.push(...keys);
  const chr = w.chr;
  if (f.pending.length && (!chr.sequences[chr.cseq].ground || chr.cframe === 0)) for (const k of f.pending.splice(0)) simKeyPress(w, k);
  let guard = 0;
  do {
    if (await moveChars(w, async () => -1)) f.dead = true;
  } while (w.chr.cframe === -1 && !f.dead && guard++ < 50);
  for (let lp = 0; lp < BACKBL; lp++) {
    const tmap = w.blkmap[lp];
    const b = bgBlock(w, tmap);
    if (w.nxtchg[lp] <= w.clock && b.nextBl !== tmap) {
      w.blkmap[lp] = b.nextBl;
      w.nxtchg[lp] = b.ntime <= 0 ? 0 : w.nxtchg[lp] + bgBlock(w, w.blkmap[lp]).ntime;
    }
  }
  updateCharDrawState(w);
  f.doScroll = changeScroll(w) !== 0;
  w.monsolid = 0;
  w.mmSolid = LASTMM;
  if (getTouchBlocks(w).blks.some(([x, y]) => f.touched(x, y))) f.link = true;
}
