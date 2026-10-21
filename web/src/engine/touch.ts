// What happens when the character touches blocks, ported from code/GM/PLAYGAME.C:
// GetTouchbl (which map cells the character overlaps), DoBlockTouchChar (a block's
// or monster's effect on hit points, lives, counters and score, with its sound),
// CheckTouch / really_checktouch (applying touches and swapping in the block's
// touchbl), onscrn (map cell to screen position) and checkseq_fortie (sequences
// enabled by carrying a block). Also DoSound and the sound slot numbers.
import type { Block } from '../formats/blocks';
import { DIESEQ, HURTSEQ } from '../formats/character';
import { pushKey } from './keys';
import { BACKBL, BLEN, INF_REPEAT, LASTSND, MAXSEQ, MLEN, MWID, i16, mapBlock, shownBlock, u16, type Coord, type TouchBlocks, type World } from './world';

// Sound slots DoBlockTouchChar and moveallmons play.
export const HELPSOUND = 0;
export const KILLSOUND = 1;
export const ADDMONEYSOUND = 2;
export const SUBMONEYSOUND = 3;
export const ADDLIFESOUND = 4;
export const ADDSCORESOUND = 5;
export const SUBSCORESOUND = 6;
export const ADDOTHERSOUND = 7;
export const SUBOTHERSOUND = 8;

export function doSound(w: World, n: number): boolean {
  return n >= 0 && n < LASTSND ? w.sound.play(n) : false;
}

/** ScrnLowBnd/ScrnUpBnd ({1,1} to {SIZEX-BLEN,SIZEY-BLEN}): where a 20x20 sprite is considered on screen. */
export function inScreenBounds(p: Coord): boolean {
  return p.x >= 1 && p.y >= 1 && p.x <= 320 - BLEN && p.y <= 200 - BLEN;
}

/**
 * onscrn: screen position of map block (x, y); true if inside the screen bounds.
 * Cells left of / above the scroll origin (mx, my) are taken as wrapped around the map.
 */
export function onscrn(w: World, x: number, y: number, ret: Coord): boolean {
  ret.x = x - w.mx;
  if (w.mx > x) ret.x += MLEN;
  ret.x = ret.x * BLEN - w.scroll.nx;
  ret.y = y - w.my;
  if (w.my > y) ret.y += MWID;
  ret.y = ret.y * BLEN - w.scroll.ny;
  return inScreenBounds(ret);
}

/**
 * GetTouchbl: the up to 6 map cells the (two block high) character overlaps:
 * 0/1 the top row (only while the top half is drawn), 2/3 its own row, 4/5 the
 * row below, left then right. The right/lower cells count only when the pixel
 * offset is past 0. Unused cells keep x = MLEN and BACKBL; blknum is the
 * displayed variant (blkmap) of the map block.
 */
export function getTouchBlocks(w: World): TouchBlocks {
  const { chr, ci } = w;
  const t: TouchBlocks = { blks: Array.from({ length: 6 }, () => [MLEN, MWID] as [number, number]), blknum: new Array(6).fill(BACKBL) };
  const cell = (i: number, x: number, y: number) => {
    t.blks[i] = [x, y];
    t.blknum[i] = w.blkmap[mapBlock(w, x, y)] ?? BACKBL;
  };
  const x0 = chr.x[0];
  const y0 = chr.y[0];
  if (ci.topthere) {
    const top = y0 - 1 < 0 ? y0 - 1 + MWID : y0 - 1;
    cell(0, x0, top);
    if (chr.x[1] > 0) cell(1, (x0 + 1) % MLEN, top);
  }
  cell(2, x0, y0);
  if (chr.x[1] > 0) cell(3, (x0 + 1) % MLEN, y0);
  if (chr.y[1] > 0) cell(4, x0, (y0 + 1) % MWID);
  if (chr.x[1] > 0 && chr.y[1] > 0) cell(5, (x0 + 1) % MLEN, (y0 + 1) % MWID);
  return t;
}

/** checkseq_fortie: turns on/off every sequence tied to `block` (picked up or dropped). */
export function checkSeqForTie(w: World, block: number, setting: boolean): void {
  for (let i = 0; i < MAXSEQ; i++) if (w.chr.sequences[i].bloc === block) w.ci.seqon[i] = setting;
}

/**
 * DoBlockTouchChar: applies a block's (or monster block's) effects to the character.
 * Returns 0 when blocked by an empty counter, otherwise (sound played ? 2 : 1).
 * Effect 1 is lives and 3 is money; effects 3 and up are counters (ci.meter), and
 * 3 or 20 and up refuse the touch when they would leave the counter at 0 or less.
 * i16/u16 keep the C's 16-bit int wrap and its unsigned overflow checks.
 */
export function doBlockTouchChar(w: World, blk: Block): number {
  const { ci, chr } = w;
  let snded = false;
  if ((blk.effect >= 20 || blk.effect === 3) && ci.meter[blk.effect] + blk.eamt <= 0) return 0;

  // Hit points change only while not already dying (once per death).
  if (chr.cseq !== DIESEQ) {
    if (blk.chHitPt <= 0) ci.hitpts = i16(ci.hitpts + blk.chHitPt);
    else if (u16(ci.hitpts + blk.chHitPt) < INF_REPEAT) ci.hitpts = i16(ci.hitpts + blk.chHitPt);
    else ci.hitpts = INF_REPEAT - 1;

    if (blk.chHitPt > 0) snded = doSound(w, HELPSOUND);
    // Losing hit points starts the hurt sequence, saving the current one on the key stack.
    else if (blk.chHitPt < 0 && chr.cseq !== HURTSEQ) {
      pushKey(w);
      ci.nextAni = w.clock;
      chr.cseq = HURTSEQ;
      chr.cframe = -1;
      w.curkey = 0xff;
      if (chr.sequences[HURTSEQ].sound < LASTSND && chr.sequences[HURTSEQ].sound >= 0) snded = doSound(w, chr.sequences[HURTSEQ].sound);
    }
    if (ci.hitpts <= 0) {
      ci.nextAni = w.clock;
      chr.cseq = DIESEQ;
      chr.cframe = -1;
      w.curkey = 0;
    }
  }

  if (blk.effect === 1) {
    if (blk.eamt > 0) snded = doSound(w, ADDLIFESOUND);
    ci.lives = i16(ci.lives + blk.eamt);
  }

  // An INF_REPEAT counter is unlimited and never changes. The bounds check is this port's.
  if (blk.effect > 2 && ci.meter[blk.effect] !== INF_REPEAT && blk.effect < ci.meter.length) {
    if (!snded) {
      if (blk.effect === 3) {
        if (blk.eamt > 0) snded = doSound(w, ADDMONEYSOUND);
        else if (blk.eamt < 0) snded = doSound(w, SUBMONEYSOUND);
      } else if (blk.eamt > 0) snded = doSound(w, ADDOTHERSOUND);
      else if (blk.eamt < 0) snded = doSound(w, SUBOTHERSOUND);
    }
    const m = ci.meter[blk.effect];
    if (u16(m + blk.eamt) < INF_REPEAT) {
      if (m + blk.eamt < -1 * (INF_REPEAT - 128)) ci.meter[blk.effect] = -1 * (INF_REPEAT - 128);
      else ci.meter[blk.effect] = i16(m + blk.eamt);
    } else ci.meter[blk.effect] = INF_REPEAT - 1;
  }

  ci.score += blk.scorePts;
  if (!snded) {
    if (blk.scorePts > 0) snded = doSound(w, ADDSCORESOUND);
    else if (blk.scorePts < 0) snded = doSound(w, SUBSCORESOUND);
  }
  return snded ? 2 : 1;
}

/** really_checktouch: 2 = touch refused (counter empty), else true. x === MLEN is an unused touch cell. */
export function reallyCheckTouch(w: World, x: number, y: number, bnum: number): number {
  if (x === MLEN) return 1;
  const blk = w.bg[bnum] ?? w.bg[BACKBL];
  if (!doBlockTouchChar(w, blk)) return 2;
  if (bnum !== blk.touchBl) {
    const tmp = { x: 0, y: 0 };
    // Only blocks on screen are changed (the original redrew them as it went).
    if (onscrn(w, x, y, tmp)) w.map[y * MLEN + x] = blk.touchBl;
  }
  return 1;
}

/** CheckTouch: touches every overlapped cell except objects, which only PickupBloc takes. */
export function checkTouch(w: World): void {
  const t = getTouchBlocks(w);
  for (let l = 0; l < 6; l++) {
    const blk = w.bg[t.blknum[l]] ?? w.bg[BACKBL];
    if (!blk.obj) reallyCheckTouch(w, t.blks[l][0], t.blks[l][1], t.blknum[l]);
  }
}

export { shownBlock };
