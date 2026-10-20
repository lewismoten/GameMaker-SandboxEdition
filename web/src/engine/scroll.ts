// Map scrolling from code/GM/PLAYGAME.C. The original scrolled VGA memory in 4 pixel
// steps plus 0..3 pixel hardware panning (LittleShift); this port keeps the same
// bookkeeping and simply redraws the view from it.
import { inScreenBounds } from './touch';
import { BLEN, LASTMM, LASTMON, MLEN, MWID, OFFSCRN, SCROLLPERMOVE, SCRSPDX, SCRSPDY, SIZEX, SIZEY, sign, type BresScroll, type Coord, type World } from './world';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../formats/blocks';

/** Scene setup: Scroll.up/down/left/right are stored mirrored in the .gam file. */
export function initScroll(w: World, s: { up: number; down: number; left: number; right: number }): void {
  const sc = w.scroll;
  Object.assign(sc, {
    nx: 0,
    ny: 0,
    totalx: 0,
    totaly: 0,
    distx: 0,
    disty: 0,
    inMotion: 0,
    movx: 0,
    movy: 0,
    littleShiftx: 0,
    littleShifty: 0,
    bx: { dscroll: 0, ctr: 0, iters: 0 },
    by: { dscroll: 0, ctr: 0, iters: 0 },
  });
  sc.up = s.down;
  sc.down = s.up;
  sc.left = s.right;
  sc.right = s.left;
  sc.maxX = SIZEX / 3;
  sc.minX = -SIZEX / 3;
  sc.maxY = 60;
  sc.minY = -60;
  sc.upStop = Math.trunc(-SIZEY / 6);
  sc.downStop = Math.trunc(SIZEY / 6);
  sc.leftStop = -SIZEX / 4;
  sc.rightStop = SIZEX / 4;
}

/** ChangeScroll: decide scrolling speed from how far the character is from center. */
export function changeScroll(w: World): number {
  const sc = w.scroll;
  sc.totalx = sc.totaly = 0;
  const tmx = w.ci.nextx + BLEN / 2 - SIZEX / 2;
  const tmy = w.ci.nexty + BLEN / 2 - SIZEY / 2;
  sc.distx = tmx;
  sc.disty = tmy;
  if (sc.left === 0xff && tmx > sc.maxX) sc.inMotion |= SOLLEF;
  if (sc.right === 0xff && tmx < sc.minX) sc.inMotion |= SOLRIG;
  if (sc.up === 0xff && tmy > sc.maxY) sc.inMotion |= SOLTOP;
  if (sc.down === 0xff && tmy < sc.minY) sc.inMotion |= SOLBOT;

  if (sc.inMotion & SOLLEF) {
    if (tmx < sc.leftStop) sc.inMotion &= ~SOLLEF;
    else sc.totalx = Math.trunc(((tmx - sc.leftStop) * SCRSPDX) / (sc.maxX - sc.leftStop));
  }
  if (sc.inMotion & SOLRIG) {
    if (tmx > sc.rightStop) sc.inMotion &= ~SOLRIG;
    else sc.totalx = -Math.trunc(((-tmx + sc.rightStop) * SCRSPDX) / (sc.rightStop - sc.minX));
  }
  if (sc.inMotion & SOLTOP) {
    if (tmy < sc.upStop) sc.inMotion &= ~SOLTOP;
    else sc.totaly = Math.trunc(((tmy - sc.upStop) * SCRSPDY) / (sc.maxY - sc.upStop));
  }
  if (sc.inMotion & SOLBOT) {
    if (tmy > sc.downStop) sc.inMotion &= ~SOLBOT;
    else sc.totaly = -Math.trunc(((-tmy + sc.downStop) * SCRSPDY) / (sc.downStop - sc.minY));
  }
  sc.totalx = Math.max(-28, Math.min(28, sc.totalx));
  sc.totaly = Math.max(-28, Math.min(28, sc.totaly));
  sc.bx = { dscroll: sc.totalx, ctr: 0, iters: SCROLLPERMOVE };
  sc.by = { dscroll: sc.totaly, ctr: 0, iters: SCROLLPERMOVE };
  return sc.inMotion;
}

function bresenhamScroll(b: BresScroll): number {
  let amt = 0;
  const a = Math.abs(b.dscroll);
  if (a > b.iters) {
    while (b.ctr < a) {
      amt += sign(b.dscroll);
      b.ctr += b.iters;
    }
    b.ctr -= a;
  } else {
    b.ctr += a;
    if (b.ctr >= b.iters) {
      b.ctr -= b.iters;
      amt += sign(b.dscroll);
    }
  }
  return amt;
}

/** ShiftEverything: keep sprite screen positions in step with the scrolled map. */
function shiftEverything(w: World, shift: Coord): void {
  for (let l = 0; l < LASTMM; l++) {
    if (w.mm[l].monnum >= LASTMON) continue;
    const mi = w.mi[l];
    if (mi.scrPos.x !== OFFSCRN) {
      mi.scrPos.x += shift.x;
      mi.scrPos.y += shift.y;
    }
    if (mi.oldPos.x !== OFFSCRN) {
      mi.oldPos.x += shift.x;
      mi.oldPos.y += shift.y;
      if (!inScreenBounds(mi.oldPos)) mi.oldPos = { x: OFFSCRN, y: OFFSCRN };
    }
  }
  const ci = w.ci;
  if (ci.nexty - ci.oldy === 0 || sign(shift.y) === sign(ci.nexty - ci.oldy)) {
    if (ci.scry !== OFFSCRN) ci.scry += shift.y;
  } else if (Math.abs(ci.nexty - ci.oldy) < 4) ci.scry += ci.nexty - ci.oldy + shift.y;
  if (ci.nextx - ci.oldx === 0 || sign(shift.x) === sign(ci.nextx - ci.oldx)) {
    if (ci.scrx !== OFFSCRN) ci.scrx += shift.x;
  } else if (Math.abs(ci.nextx - ci.oldx) < 4) ci.scrx += ci.nextx - ci.oldx + shift.x;
  if (ci.nextx !== OFFSCRN) {
    ci.nextx += shift.x;
    ci.nexty += shift.y;
  }
  if (ci.oldx !== OFFSCRN) {
    ci.oldx += shift.x;
    ci.oldy += shift.y;
  }
}

/** DrawScroll: one 1/145.6 s scroll step. */
export function drawScroll(w: World): void {
  const sc = w.scroll;
  sc.movx += bresenhamScroll(sc.bx);
  sc.movy += bresenhamScroll(sc.by);
  const shift = { x: 0, y: 0 };
  if (sc.movx < 0) {
    while (sc.movx < 0) {
      shift.x += 4;
      sc.movx += 4;
      sc.nx -= 4;
    }
  } else if (sc.movx > 0) {
    while (sc.movx > 3) {
      shift.x -= 4;
      sc.movx -= 4;
      sc.nx += 4;
    }
  }
  if (sc.movy < 0) {
    while (sc.movy < 0) {
      shift.y += 4;
      sc.movy += 4;
      sc.ny -= 4;
    }
  } else if (sc.movy > 0) {
    while (sc.movy > 3) {
      shift.y -= 4;
      sc.movy -= 4;
      sc.ny += 4;
    }
  }
  sc.littleShiftx = sc.movx & 3;
  sc.littleShifty = sc.movy & 3;
  if (sc.nx >= BLEN) {
    sc.nx -= BLEN;
    w.mx = (w.mx + 1) % MLEN;
  }
  if (sc.ny >= BLEN) {
    sc.ny -= BLEN;
    w.my = (w.my + 1) % MWID;
  }
  if (sc.nx < 0) {
    sc.nx += BLEN;
    w.mx = (w.mx - 1 + MLEN) % MLEN;
  }
  if (sc.ny < 0) {
    sc.ny += BLEN;
    w.my = (w.my - 1 + MWID) % MWID;
  }
  if (shift.x || shift.y) shiftEverything(w, shift);
}

export { SOLBOT, SOLTOP, SOLRIG };
