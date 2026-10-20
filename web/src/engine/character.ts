// Character movement from code/GM/PLAYGAME.C: movechars, gravity, solid block
// checks (chkdowns/ups/lefts/rights), OnGround, screen/map bounds, joystick,
// and picking up / dropping inventory blocks.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../formats/blocks';
import { DIESEQ, DROPSEQ, HURTSEQ, IDLESEQ, MAXFRAME, PICKUPSEQ, type Frame } from '../formats/character';
import { chrSeq, popKey, pushKey } from './keys';
import { charBirthMon } from './monsters';
import { checkSeqForTie, checkTouch, doSound, getTouchBlocks, reallyCheckTouch } from './touch';
import {
  BACKBL,
  BLEN,
  CHARBL,
  GRAVSPEED,
  INF_REPEAT,
  JSTICKKEY,
  LASTMM,
  LASTSND,
  MAXGRAV,
  MAXINV,
  MAXSEQ,
  MLEN,
  MONBL,
  MWID,
  SCRNBLEN,
  SCRNBWID,
  bgBlock,
  mapBlock,
  shownBlock,
  type TouchBlocks,
  type World,
} from './world';

/** Asks the player which inventory slot to drop; resolves -1 for Esc. */
export type DropPicker = () => Promise<number>;

/**
 * CHRFRAME with the original's out-of-range behavior: frame -1 read the 17 bytes
 * before the sequence's first frame (the tail of the previous sequence record).
 */
export function currentFrame(w: World): Frame {
  const { chr } = w;
  const seq = chr.sequences[chr.cseq] ?? chr.sequences[0];
  if (chr.cframe >= 0 && chr.cframe < MAXFRAME) return seq.frames[chr.cframe];
  if (chr.cframe >= MAXFRAME) return { ...seq.frames[MAXFRAME - 1], pic2: CHARBL + 1 };
  const prev = chr.sequences[chr.cseq - 1];
  if (!prev) return { x: 0, y: 0, orient: 0, pic1: 0, pic2: 0, pause: 0, extra: new Uint8Array(5) };
  const e = prev.frames[MAXFRAME - 1].extra;
  const b = (v: number) => v & 0xff;
  return {
    x: (e[3] | (e[4] << 8)) << 16 >> 16,
    y: (prev.key << 16) >> 16,
    orient: b(prev.sound) | (b(prev.on) << 8),
    pic1: b(prev.bloc) | (b(prev.ground) << 8),
    pic2: b(prev.jstkBut) | (b(prev.jstkMov) << 8),
    pause: b(prev.norepeat) | (b(prev.momentum) << 8),
    extra: new Uint8Array(5),
  };
}

function normalizeChr(w: World): void {
  const { chr } = w;
  while (chr.x[1] < 0) {
    chr.x[1] += BLEN;
    chr.x[0]--;
  }
  while (chr.x[1] >= BLEN) {
    chr.x[1] -= BLEN;
    chr.x[0]++;
  }
  while (chr.y[1] < 0) {
    chr.y[1] += BLEN;
    chr.y[0]--;
  }
  while (chr.y[1] >= BLEN) {
    chr.y[1] -= BLEN;
    chr.y[0]++;
  }
}

function chkMapBounds(w: World): void {
  const { chr } = w;
  if (chr.x[0] >= MLEN) chr.x[0] -= MLEN;
  if (chr.x[0] < 0) chr.x[0] += MLEN;
  if (chr.y[0] >= MWID) chr.y[0] -= MWID;
  if (chr.y[0] < 0) chr.y[0] += MWID;
}

/** chkscrnbounds: keeps the character from walking off the visible map area. */
function chkScrnBounds(w: World, d: { tx: number; ty: number }): void {
  const { chr } = w;
  const nearest = (from: number, to: number, size: number) => {
    const t0 = from - to;
    const t1 = t0 > 0 ? -(size - from + to) : size - to + from;
    return Math.abs(t1) > Math.abs(t0) ? t0 : t1;
  };
  const tmx = -nearest(w.mx, chr.x[0], MLEN);
  const tmy = -nearest(w.my, chr.y[0], MWID);
  if (d.tx < 0) {
    if (tmx < 2 && chr.x[1] <= Math.abs(d.tx)) d.tx = -chr.x[1];
    if (tmx < 1) d.tx = 0;
  }
  if (tmx > SCRNBLEN - 2 && d.tx > 0) d.tx = 0;
  if (d.ty < 0) {
    if (tmy < 2 && chr.y[1] <= Math.abs(d.ty)) d.ty = -chr.y[1];
    if (tmy < 1) d.ty = 0;
  }
  if (tmy > SCRNBWID - 2 && d.ty > 0) d.ty = 0;
}

const solid = (w: World, n: number) => bgBlock(w, n).solid;

function chkLefts(w: World, t: TouchBlocks): number {
  const { chr } = w;
  const spots = [0, 0, 0, 0];
  const twohigh = t.blks[0][0] !== MLEN ? 0 : 2;
  if (t.blknum[twohigh + 1] !== BACKBL) spots[1] |= solid(w, t.blknum[twohigh + 1]) & SOLBOT;
  spots[0] |= solid(w, t.blknum[twohigh]) & SOLRIG;
  if (twohigh === 0) spots[0] |= solid(w, t.blknum[2]) & SOLRIG;
  if (t.blknum[4] !== BACKBL) {
    if (t.blknum[5] !== BACKBL) spots[3] |= solid(w, t.blknum[5]) & SOLTOP;
    if (!(spots[3] & SOLTOP)) spots[2] |= solid(w, t.blknum[4]) & SOLRIG;
  }
  if (spots[0] & SOLRIG && !(spots[2] & SOLRIG) && chr.y[1] > (BLEN * 2) / 4) chr.y[1] = BLEN;
  if (!(spots[0] & SOLRIG) && spots[2] & SOLRIG && chr.y[1] < BLEN / 2) chr.y[1] = 0;
  return spots[0] & SOLRIG || spots[2] & SOLRIG ? SOLLEF : 0;
}

function chkRights(w: World, t: TouchBlocks): number {
  const { chr } = w;
  const spots = [0, 0, 0, 0];
  const twohigh = t.blks[0][0] !== MLEN ? 0 : 2;
  if (t.blknum[twohigh + 1] !== BACKBL) {
    if (t.blknum[twohigh] !== BACKBL) spots[0] |= solid(w, t.blknum[twohigh]) & SOLBOT;
    if (!(spots[0] & SOLBOT)) spots[1] |= solid(w, t.blknum[twohigh + 1]) & SOLLEF;
  }
  if (twohigh === 0) spots[1] |= solid(w, t.blknum[3]) & SOLLEF;
  if (t.blknum[5] !== BACKBL) {
    if (t.blknum[4] !== BACKBL) spots[2] |= solid(w, t.blknum[4]) & SOLTOP;
    if (!(spots[2] & SOLTOP)) spots[3] |= solid(w, t.blknum[5]) & SOLLEF;
  }
  if (spots[1] & SOLLEF && !(spots[3] & SOLLEF) && chr.y[1] > (BLEN * 2) / 4) chr.y[1] = BLEN;
  if (!(spots[1] & SOLLEF) && spots[3] & SOLLEF && chr.y[1] < BLEN / 2) chr.y[1] = 0;
  return spots[1] & SOLLEF || spots[3] & SOLLEF ? SOLRIG : 0;
}

function chkUps(w: World, t: TouchBlocks): number {
  const { chr } = w;
  const spots = [0, 0, 0, 0];
  const twohigh = t.blks[0][0] !== MLEN ? 0 : 2;
  if (t.blknum[twohigh] !== BACKBL) {
    if (t.blknum[4] !== BACKBL) spots[2] |= solid(w, t.blknum[4]) & SOLRIG;
    if (!(spots[2] & SOLRIG)) spots[0] |= solid(w, t.blknum[twohigh]) & SOLBOT;
  }
  if (t.blknum[twohigh + 1] !== BACKBL) {
    if (t.blknum[5] !== BACKBL) spots[3] |= solid(w, t.blknum[5]) & SOLLEF;
    if (!(spots[3] & SOLLEF)) spots[1] |= solid(w, t.blknum[twohigh + 1]) & SOLBOT;
  }
  if (spots[0] & SOLBOT && !(spots[1] & SOLBOT) && chr.x[1] > (BLEN * 2) / 4) chr.x[1] = BLEN;
  if (!(spots[0] & SOLBOT) && spots[1] & SOLBOT && chr.x[1] < BLEN / 2) chr.x[1] = 0;
  return spots[0] & SOLBOT || spots[1] & SOLBOT ? SOLTOP : 0;
}

function chkDowns(w: World, t: TouchBlocks): number {
  const { chr } = w;
  const spots = [0, 0, 0, 0];
  const twohigh = t.blks[0][0] !== MLEN ? 0 : 2;
  if (t.blknum[4] !== BACKBL) {
    spots[2] |= solid(w, t.blknum[4]) & SOLRIG;
    if (t.blknum[twohigh] !== BACKBL) spots[0] |= solid(w, t.blknum[twohigh]) & SOLRIG;
    if (!(spots[2] & SOLRIG && spots[0] & SOLRIG)) spots[2] |= solid(w, t.blknum[4]) & SOLTOP;
  }
  if (t.blknum[5] !== BACKBL) {
    if (t.blknum[twohigh + 1] !== BACKBL) spots[1] |= solid(w, t.blknum[twohigh + 1]) & SOLLEF;
    spots[3] |= solid(w, t.blknum[5]) & SOLLEF;
    if (!(spots[1] & SOLLEF & spots[3] & SOLLEF)) spots[3] |= solid(w, t.blknum[5]) & SOLTOP;
  }
  if (spots[2] & SOLTOP && !(spots[3] & SOLTOP) && chr.x[1] > (BLEN * 2) / 4) chr.x[1] = BLEN;
  if (!(spots[2] & SOLTOP) && spots[3] & SOLTOP && chr.x[1] < BLEN / 2) chr.x[1] = 0;
  return spots[2] & SOLTOP || spots[3] & SOLTOP ? SOLBOT : 0;
}

function chkSolids(w: World, dx: number, dy: number, t: TouchBlocks): number {
  let r = 0;
  if (dy > 0) r = chkDowns(w, t);
  if (dy < 0) r = chkUps(w, t);
  if (dx > 0) r |= chkRights(w, t);
  if (dx < 0) r |= chkLefts(w, t);
  return r;
}

/** The block whose gravity applies: the one the character is mostly on. */
function gravityBlock(w: World): number {
  const { chr } = w;
  let y = chr.y[0] + (chr.y[1] > BLEN / 2 ? 1 : 0);
  let x = chr.x[0] + (chr.x[1] > BLEN / 2 ? 1 : 0);
  if (y >= MWID) y -= MWID;
  if (x >= MLEN) x -= MLEN;
  return shownBlock(w, mapBlock(w, x, y)).grav;
}

function onGround(w: World, s: number): void {
  const { ci } = w;
  const gravdir = gravityBlock(w);
  if ((w.monsolid & SOLBOT || s & SOLBOT) && ci.gravy > 0) ci.gravy = 0;
  if ((w.monsolid & SOLTOP || s & SOLTOP) && ci.gravy < 0) ci.gravy = 0;
  if ((w.monsolid & SOLRIG || s & SOLRIG) && ci.gravx > 0) ci.gravx = 0;
  if ((w.monsolid & SOLLEF || s & SOLLEF) && ci.gravx < 0) ci.gravx = 0;
  if (!chrSeq(w).momentum) {
    if (!(gravdir & SOLBOT || gravdir & SOLTOP)) ci.gravy = Math.trunc((ci.gravy * 5) / 6);
    if (!(gravdir & SOLLEF || gravdir & SOLRIG)) ci.gravx = Math.trunc((ci.gravx * 5) / 6);
  }
}

/** MoveCharGrav: accelerate by the gravity of the block under the character. */
export function moveCharGrav(w: World, reset = false): boolean {
  if (reset) {
    w.gclk = w.clock;
    return true;
  }
  if (w.clock < w.gclk + GRAVSPEED) return false;
  w.gclk = w.clock;
  const { ci } = w;
  const g = gravityBlock(w);
  if (g & 4) ci.gravy += 1;
  if (g & 1) ci.gravy -= 1;
  if (g & 2) ci.gravx += 1;
  if (g & 8) ci.gravx -= 1;
  const moved = ci.gravx !== 0 || ci.gravy !== 0;
  const lim = MAXGRAV * 4;
  ci.gravx = Math.max(-lim, Math.min(lim, ci.gravx));
  ci.gravy = Math.max(-lim, Math.min(lim, ci.gravy));
  return moved;
}

/** HandleJStick: joystick directions/buttons can trigger sequences too. */
export function handleJoystick(w: World, reset = false): boolean {
  if (reset) {
    w.joyOldTime = w.clock;
    return false;
  }
  if (!w.jstickOn || !w.joystick || w.joyOldTime + 1 > w.clock) return false;
  w.joyOldTime = w.clock;
  const j = w.joystick();
  if (!j) return false;
  const { chr, ci } = w;
  if (j.pos === 0 && j.buttons === 0) {
    w.joyOldBut = 0;
    if (w.curkey === JSTICKKEY) popKey(w, JSTICKKEY);
    return false;
  }
  if (chr.cseq === DIESEQ) return false;
  for (let loop = 3; loop < MAXSEQ; loop++) {
    const s = chr.sequences[loop];
    if (
      s.jstkMov !== 0 &&
      (s.jstkMov === 9 || s.jstkMov === j.pos) &&
      !chrSeq(w).ground &&
      ci.meter[loop] > 0 &&
      ci.seqon[loop] &&
      (s.jstkBut === 0 || (j.buttons === 0 && s.jstkBut === 4) || (j.buttons !== w.joyOldBut && s.jstkBut === j.buttons))
    ) {
      w.joyOldBut = j.buttons;
      if (chr.cseq !== loop) {
        if (w.curkey !== JSTICKKEY) pushKey(w);
        w.curkey = JSTICKKEY;
        chr.cframe = -1;
        chr.cseq = loop;
        ci.nextAni = w.clock;
        if (s.sound < LASTSND && s.sound >= 0) doSound(w, s.sound);
        return true;
      }
      return false;
    }
  }
  return false;
}

function pickupBlock(w: World): boolean {
  const { ci } = w;
  if (ci.inv[MAXINV - 1] !== BACKBL) return false;
  let spot = 0;
  while (spot < MAXINV && ci.inv[spot] !== BACKBL) spot++;
  const t = getTouchBlocks(w);
  for (let j = 0; j < 6; j++) {
    if (t.blks[j][0] === MLEN || !bgBlock(w, t.blknum[j]).obj) continue;
    if (reallyCheckTouch(w, t.blks[j][0], t.blks[j][1], t.blknum[j]) !== 2) {
      ci.inv[spot] = t.blknum[j];
      checkSeqForTie(w, t.blknum[j], true);
      return true;
    }
  }
  return false;
}

async function dropBlock(w: World, pick: DropPicker): Promise<boolean> {
  const { ci, chr } = w;
  w.ci.topthere = false;
  w.ci.bottomthere = false;
  let dropped = false;
  for (;;) {
    const chosen = await pick();
    if (chosen < 0) break;
    if (ci.inv[chosen] === BACKBL) continue;
    w.map[chr.y[0] * MLEN + chr.x[0]] = ci.inv[chosen];
    checkSeqForTie(w, ci.inv[chosen], false);
    for (let i = chosen; i < MAXINV - 1; i++) ci.inv[i] = ci.inv[i + 1];
    ci.inv[MAXINV - 1] = BACKBL;
    dropped = true;
    break;
  }
  w.keydn[chr.sequences[DROPSEQ].key >> 8] = 0;
  return dropped;
}

/** movechars: one game tick of character animation and movement. Returns true when dead. */
export async function moveChars(w: World, pickDrop: DropPicker): Promise<boolean> {
  const { ci, chr } = w;
  let tx = 0;
  let ty = 0;
  let charmoved = false;
  let zeroBefore = 0;
  ci.scrx = ci.nextx;
  ci.scry = ci.nexty;
  const gravmoved = moveCharGrav(w);
  if (handleJoystick(w)) ci.update = true;

  if (w.clock >= ci.nextAni) {
    const oldframe = chr.cframe;
    const oldseq = chr.cseq;
    if (chr.cframe === -1) {
      if (ci.meter[chr.cseq] < INF_REPEAT && chr.cseq > 4) ci.meter[chr.cseq]--;
      if (chr.cseq === DROPSEQ && !(await dropBlock(w, pickDrop))) {
        chr.cseq = IDLESEQ;
        w.keystkptr = 0;
        w.curkey = 0;
      }
      if (chr.cseq === PICKUPSEQ && !pickupBlock(w)) {
        chr.cseq = IDLESEQ;
        w.keystkptr = 0;
        w.curkey = 0;
      }
      const snd = chrSeq(w).sound;
      if (snd < LASTSND && snd >= 0) doSound(w, snd);
    }
    let guard = 0;
    do {
      if (chr.cframe === 0) zeroBefore++;
      chr.cframe++;
      while ((currentFrame(w).pic2 === CHARBL + 1 || chr.cframe >= MAXFRAME) && guard++ < 1000) {
        if (chr.cseq === DIESEQ) {
          chr.cframe--;
          return true;
        }
        const s = chrSeq(w);
        if (
          (ci.meter[chr.cseq] <= 0 && chr.cseq > 4) ||
          chr.cseq === HURTSEQ ||
          chr.cseq === DROPSEQ ||
          chr.cseq === PICKUPSEQ ||
          s.norepeat ||
          (w.keydn[s.key >> 8] === 0 && w.curkey !== JSTICKKEY) ||
          zeroBefore > 1
        ) {
          popKey(w, w.curkey);
          zeroBefore = 0;
        } else {
          chr.cframe = 0;
          if (ci.meter[chr.cseq] < INF_REPEAT && chr.cseq > 4) ci.meter[chr.cseq]--;
          if (s.frames[0].pic2 === CHARBL + 1) {
            if (chr.cseq === IDLESEQ) s.frames[0].pic2 = 0;
            else popKey(w, w.curkey);
            zeroBefore = 0;
          }
        }
      }
      const f = currentFrame(w);
      ci.nextAni = w.clock + f.pause;
      if (f.pic2 === MONBL && !w.noMons) {
        charBirthMon(w, chr.x[0], chr.y[0] + Math.trunc(f.y / BLEN) - 1, f.pic1);
        ty = 0;
      } else {
        ci.curtop = f.pic1;
        ci.curbottom = f.pic2;
        if (chrSeq(w).momentum) {
          ci.gravx += f.x;
          ci.gravy += f.y;
          if (f.x !== 0 || f.y !== 0) {
            ci.netx = f.x;
            ci.nety = f.y;
          }
          tx = 0;
          ty = 0;
        } else {
          tx = f.x;
          ty = f.y;
          if (tx !== 0 || ty !== 0) {
            charmoved = true;
            ci.netx = tx;
            ci.nety = ty;
          }
        }
      }
    } while (currentFrame(w).pic2 > CHARBL && guard++ < 1000);
    if (chr.cseq !== oldseq || chr.cframe !== oldframe) ci.update = true;
  }

  tx += ci.gravx;
  ty += ci.gravy;

  if (charmoved || gravmoved || w.monsolid || ci.update) {
    const old = { cx: chr.x[1], cy: chr.y[1], x: chr.x[0], y: chr.y[0] };
    const d = { tx: Math.max(-MAXGRAV, Math.min(MAXGRAV, tx)), ty: Math.max(-MAXGRAV, Math.min(MAXGRAV, ty)) };
    chkScrnBounds(w, d);
    tx = d.tx;
    ty = d.ty;

    // Touch the blocks at the destination first (collecting, hurting…).
    chr.x[1] += tx;
    chr.y[1] += ty;
    normalizeChr(w);
    chkMapBounds(w);
    checkTouch(w);
    chr.x[1] = old.cx;
    chr.y[1] = old.cy;
    chr.x[0] = old.x;
    chr.y[0] = old.y;

    if (!w.noMons && w.mmSolid < LASTMM) {
      const m = w.mi[w.mmSolid];
      if (w.monsolid & SOLRIG && !(w.monsolid & SOLLEF)) {
        chr.x[1] = m.curx[1];
        chr.x[0] = m.curx[0] - 1;
        tx = 0;
      }
      if (w.monsolid & SOLLEF && !(w.monsolid & SOLRIG)) {
        chr.x[1] = m.curx[1];
        chr.x[0] = m.curx[0] + 1;
        tx = 0;
      }
      if (w.monsolid & SOLTOP && !(w.monsolid & SOLBOT)) {
        chr.y[1] = m.cury[1];
        chr.y[0] = m.cury[0] + 1;
        ty = 0;
      }
      if (w.monsolid & SOLBOT && !(w.monsolid & SOLTOP)) {
        chr.y[1] = m.cury[1];
        chr.y[0] = m.cury[0] - 1;
        ty = 0;
      }
    }

    // Move horizontally, then stop at solid blocks.
    chr.x[1] += tx;
    normalizeChr(w);
    chkMapBounds(w);
    let r = chkSolids(w, tx, 0, getTouchBlocks(w));
    onGround(w, r);
    if (r & SOLRIG) chr.x[1] = 0;
    if (r & SOLLEF) {
      chr.x[0]++;
      chr.x[1] = 0;
    }

    // Then vertically.
    chr.y[1] += ty;
    while (chr.y[1] < 0) {
      chr.y[1] += BLEN;
      chr.y[0]--;
    }
    while (chr.y[1] >= BLEN) {
      chr.y[1] -= BLEN;
      chr.y[0]++;
    }
    chkMapBounds(w);
    r = chkSolids(w, 0, ty, getTouchBlocks(w));
    onGround(w, r);
    if (r & SOLBOT) chr.y[1] = 0;
    if (r & SOLTOP) {
      chr.y[0]++;
      chr.y[1] = 0;
    }
    updateCharScreenPos(w);
  }
  return false;
}

/** Screen coordinates of the character's bottom block (nextx/nexty). */
export function updateCharScreenPos(w: World): void {
  const { chr, ci } = w;
  let tx = w.mx < chr.x[0] ? (chr.x[0] - w.mx) * BLEN : (MLEN + (chr.x[0] - w.mx)) * BLEN;
  tx += chr.x[1];
  ci.nextx = tx - w.scroll.nx;
  let ty = w.my < chr.y[0] ? (chr.y[0] - w.my) * BLEN : (MWID + (chr.y[0] - w.my)) * BLEN;
  ty += chr.y[1];
  ci.nexty = ty - w.scroll.ny;
}
