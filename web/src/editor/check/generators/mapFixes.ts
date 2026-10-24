// Content generators for the map: a ladder (a column of up-gravity blocks) out of a pit to the
// first floor beside its rim, and a one-block gap where a wall or lock shuts the hero in. They
// work on a map's cells and block set and return the cells to change.
import { BACKBL, type Block } from '../../../formats/blocks';
import { MLEN, MWID } from '../../../formats/map';

const open = (b: Block | undefined) => !!b && b.solid !== 15;

/**
 * Cells for a ladder from `cell` straight up to the first height where the hero can step off
 * sideways onto a floor (an open cell beside it with something solid under it), and one
 * above that so the hero clears the rim. Undefined when no such height is in the column.
 */
export function ladderCells(blocks: Uint8Array, bg: Block[], cell: number): number[] | undefined {
  const x = cell % MLEN;
  let y = Math.floor(cell / MLEN);
  const at = (cx: number, cy: number) => (cx < 0 || cy < 0 || cx >= MLEN || cy >= MWID ? undefined : bg[blocks[cy * MLEN + cx]]);
  const out: number[] = [];
  for (; y > 1; y--) {
    if (!open(at(x, y))) return undefined;
    out.push(y * MLEN + x);
    for (const dx of [-1, 1]) {
      const side = at(x + dx, y - 1);
      const under = at(x + dx, y);
      if (open(side) && open(at(x + dx, y - 2)) && under && under.solid & 1 && y < Math.floor(cell / MLEN)) return out;
    }
  }
  return undefined;
}

/** A block to climb with: one the set already has that pulls up and isn't solid, else a new one. */
export function ladderBlock(bg: Block[], used: Uint32Array, air: number): { n: number; make?: Block } | undefined {
  for (let n = 0; n < BACKBL; n++) if (used[n] && bg[n].grav === 1 && !bg[n].solid && !bg[n].chHitPt) return { n };
  // a free slot: on no map of this set, with nothing drawn and no settings
  for (let n = BACKBL - 1; n > 0; n--) {
    const b = bg[n];
    if (used[n] || b.solid || b.grav || b.effect || b.scorePts || b.chHitPt || b.pixels.some((p) => p !== b.pixels[0])) continue;
    const base = bg[air];
    const pixels = base.pixels.slice();
    // two rails and rungs in color 0, or 15 where the air is color 0 (black and white in most palettes)
    const rail = pixels[0] === 0 ? 15 : 0;
    for (let y = 0; y < 20; y++) {
      pixels[y * 20 + 4] = pixels[y * 20 + 15] = rail;
      if (y % 5 === 2) for (let x = 4; x <= 15; x++) pixels[y * 20 + x] = rail;
    }
    return {
      n,
      make: {
        ...base,
        pixels,
        grav: 1,
        solid: 0,
        nextBl: n,
        touchBl: n,
        ntime: 0,
        birthTime: 0,
        birthMon: 0,
        chHitPt: 0,
        scorePts: 0,
        effect: 0,
        eamt: 0,
        obj: 0,
      },
    };
  }
  return undefined;
}

/** The scene's plain air: the open, harmless block the map uses most. */
export function airBlock(bg: Block[], used: Uint32Array): number {
  let best = 0;
  for (let n = 0; n < BACKBL; n++) {
    const b = bg[n];
    if (!b.solid && !b.chHitPt && !b.scorePts && !b.effect && used[n] > used[best]) best = n;
  }
  return best;
}
