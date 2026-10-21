// Map scrolling from code/GM/PLAYGAME.C (ChangeScroll, DrawScroll, BresenhamScroll,
// ShiftEverything; the setup is in playscene). The original scrolled VGA memory in 4
// pixel steps plus 0..3 pixel hardware panning (LittleShift), drawing only the newly
// exposed edge strips; this port keeps the same bookkeeping and simply redraws the
// view from it.
//
// Timing: ChangeScroll runs once per 18.2 Hz game tick and picks a speed; DrawScroll
// runs on every 145.6 Hz timer interrupt and moves the view a little each time.
import { inScreenBounds } from './touch';
import { BLEN, LASTMM, LASTMON, MLEN, MWID, OFFSCRN, SCROLLPERMOVE, SCRSPDX, SCRSPDY, SIZEX, SIZEY, sign, type BresScroll, type Coord, type World } from './world';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../formats/blocks';

/**
 * Scene setup: Scroll.up/down/left/right are stored mirrored in the .gam file (the
 * flags here name the way the map moves, e.g. `left` lets the map slide left as the
 * character walks right). 0xff means that direction is allowed.
 */
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
  // Scrolling starts once the character is past maxX/minX (maxY/minY) from the center,
  // and stops only after it has come back past the opposite stop line, so the view
  // keeps moving until the character is a little beyond center the other way.
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
  // Distance of the character's center from the screen center.
  const tmx = w.ci.nextx + BLEN / 2 - SIZEX / 2;
  const tmy = w.ci.nexty + BLEN / 2 - SIZEY / 2;
  sc.distx = tmx;
  sc.disty = tmy;
  if (sc.left === 0xff && tmx > sc.maxX) sc.inMotion |= SOLLEF;
  if (sc.right === 0xff && tmx < sc.minX) sc.inMotion |= SOLRIG;
  if (sc.up === 0xff && tmy > sc.maxY) sc.inMotion |= SOLTOP;
  if (sc.down === 0xff && tmy < sc.minY) sc.inMotion |= SOLBOT;

  // Speed grows linearly from 0 at the stop line to SCRSPDX at maxX (the C's comment:
  // "really (X*MAXSPEED)/MAXX"), then is capped at 28 below.
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
  // Spread `totalx` pixels over SCROLLPERMOVE DrawScroll calls (Bresenham style).
  sc.bx = { dscroll: sc.totalx, ctr: 0, iters: SCROLLPERMOVE };
  sc.by = { dscroll: sc.totaly, ctr: 0, iters: SCROLLPERMOVE };
  return sc.inMotion;
}

/**
 * BresenhamScroll with speed 1 (DrawScroll passes 1; its `speed` argument is commented
 * out in the C). Returns the pixels to move this call, |dscroll|/iters on average.
 */
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

/**
 * ShiftEverything: keep sprite screen positions in step with the scrolled map. The C
 * also returned whether the character had to be redrawn; this port redraws every frame.
 */
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
  // A character standing still or moving with the shift rides along with the background.
  // One moving against it gets only small (< 4 pixel) moves folded in here; larger ones
  // are left to the character's own movement.
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
  // movx/movy collect pixels until whole 4 pixel steps can be taken (the VGA start
  // address moves in 4 pixel units); the loops always leave them in 0..3, which is the
  // hardware pan. A positive movx moves the map left, so sprites shift by -4.
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
  // nx/ny are the pixel offsets into the top-left map block (mx, my); carry whole
  // blocks into mx/my with map wrap-around.
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
