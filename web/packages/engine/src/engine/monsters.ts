// Monster behavior ported from code/GM/PLAYGAME.C: moveallmons (one tick of
// animation, movement, wall checks and collisions for every live monster slot),
// MonEndPath and minfo::Bresenhams (walking a march path), minfo::ChkWalls,
// ChkMonChr / PicChkTouch / DoCollision (pixel-exact touching), and
// BirthMon / KillMon / BlocBirthMon / CharBirthMon (creating and removing monsters).
// Positions are a map block plus a pixel offset inside it: curx[0]/cury[0] is the
// block, curx[1]/cury[1] the 0..BLEN-1 offset. The map wraps at MLEN x MWID.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, TRANSPARENT } from '../formats/blocks';
import { ATTACKMOVEMENT, LASTSL, MAXMARCH, NORMALMOVEMENT, type March, type Monster } from '../formats/monster';
import { chrFrame } from './keys';
import { doBlockTouchChar, doSound, KILLSOUND, onscrn } from './touch';
import {
  ATTACKX,
  ATTACKY,
  BACKBL,
  BLEN,
  CHARBL,
  CHARPOWER,
  LASTMM,
  LASTMON,
  MLEN,
  MONBL,
  MONMOVESPEED,
  MWID,
  OFFSCRN,
  SCRNBLEN,
  SCRNBWID,
  mapBlock,
  mapMonAt,
  random,
  setMapMon,
  shownBlock,
  sign,
  type Coord,
  type MonInfo,
  type World,
} from './world';

const NO_MARCH: March = { x: 0, y: 0, pic: 0, orient: 0 };

/** mon.march[p][i] including the original's reads just before the array (i = -1). */
function marchAt(m: Monster, p: number, i: number): March {
  if (i >= 0) return m.march[p]?.[i] ?? NO_MARCH;
  if (p === 1) return m.march[0][MAXMARCH - 1];
  // march[0][-1] overlaps { end, towards, close[0], close[1] }.
  return { x: m.end, y: m.towards, pic: m.close[0], orient: m.close[1] };
}

export function resetMonInfo(mi: MonInfo): void {
  mi.delta = { x: 0, y: 0 };
  mi.scrPos = { x: OFFSCRN, y: OFFSCRN };
  mi.oldPos = { ...mi.scrPos };
  mi.picDrawn = false;
  mi.curx[1] = 0;
  mi.cury[1] = 0;
  mi.curPic = -1;
  mi.offl = -1;
  mi.offs = 0;
  mi.curMarch = NORMALMOVEMENT;
  mi.orient = 0;
  mi.dest = 0;
}

export function monPicNum(w: World, mm: number): number {
  const mi = w.mi[mm];
  if (mi.curPic >= 0 && mi.curPic < LASTSL) {
    const mon = w.mon[w.mm[mm].monnum];
    const pic = mon?.pic[mi.curPic][0] ?? MONBL;
    return pic < MONBL && pic >= 0 ? pic : MONBL;
  }
  return MONBL;
}

/** minfo::CalcDraw */
export function calcDraw(w: World, mi: MonInfo): boolean {
  const ok = onscrn(w, mi.curx[0], mi.cury[0], mi.scrPos);
  if (ok) {
    mi.scrPos.x += mi.curx[1];
    mi.scrPos.y += mi.cury[1];
  }
  return ok;
}

/** minfo::DistToPlace: shortest block distance to (x, y) across the map wrap, in pixels. */
function distToPlace(mi: MonInfo, x: number, y: number): void {
  let dx = x - mi.curx[0];
  let dy = y - mi.cury[0];
  if (dx > MLEN / 2) dx -= MLEN;
  if (dx < -MLEN / 2) dx += MLEN;
  if (dy > MWID / 2) dy -= MWID;
  if (dy < -MWID / 2) dy += MWID;
  mi.delta = { x: dx * BLEN, y: dy * BLEN };
}

/**
 * minfo::Bresenhams: steps up to `speed` pixels along the line in mi.delta.
 * offl counts pixels walked on the major axis and offs is the error term; offl
 * becomes -1 once the end is reached, which is the "path segment done" signal.
 */
function bresenhams(mi: MonInfo, speed: number): Coord {
  const move = { x: 0, y: 0 };
  const ax = Math.abs(mi.delta.x);
  const ay = Math.abs(mi.delta.y);
  if (ax >= ay) {
    for (let l = 0; l < speed; l++) {
      if (mi.offl >= ax) {
        mi.offl = -1;
        break;
      }
      mi.offl++;
      move.x += sign(mi.delta.x);
      mi.offs += ay;
      if (mi.offs >= ax) {
        mi.offs -= ax;
        move.y += sign(mi.delta.y);
      }
    }
  } else {
    for (let l = 0; l < speed; l++) {
      if (mi.offl >= ay) {
        mi.offl = -1;
        break;
      }
      mi.offl++;
      mi.offs += ax;
      move.y += sign(mi.delta.y);
      if (mi.offs >= ay) {
        mi.offs -= ay;
        move.x += sign(mi.delta.x);
      }
    }
  }
  return move;
}

function wrap(c: Coord): void {
  if (c.y < 0) c.y += MWID;
  else if (c.y >= MWID) c.y -= MWID;
  if (c.x < 0) c.x += MLEN;
  else if (c.x >= MLEN) c.x -= MLEN;
}

const solidAt = (w: World, x: number, y: number) => shownBlock(w, mapBlock(w, x, y)).solid;

/**
 * minfo::ChkHorizWalls: looks at the block beside the monster in the direction it
 * moves (and the one above/below when it is more than BLEN/4 into it). A wall
 * there clamps the move so the monster stops flush with its current block.
 * The C also had a commented-out flag 2 case; only flags 1 and 3 exist.
 */
function chkHorizWalls(w: World, mi: MonInfo, move: Coord, temp: Coord): boolean {
  let chk: number;
  let flag: number;
  if (mi.curx[1] + move.x < 0) {
    temp.x--;
    chk = SOLRIG;
    flag = 1;
  } else {
    temp.x++;
    chk = SOLLEF;
    flag = 3;
  }
  wrap(temp);
  let walls = solidAt(w, temp.x, temp.y);
  if (mi.cury[1] + move.y > BLEN / 4) walls |= solidAt(w, temp.x, (temp.y + 1) % MWID);
  if (mi.cury[1] + move.y < -BLEN / 4) walls |= solidAt(w, temp.x, (temp.y - 1 + MWID) % MWID);
  if (walls & chk) {
    move.x = -mi.curx[1];
    temp.x += flag === 1 ? 1 : -1;
    return true;
  }
  return false;
}

/** minfo::ChkVertWalls: the vertical counterpart of chkHorizWalls. */
function chkVertWalls(w: World, mi: MonInfo, move: Coord, temp: Coord): boolean {
  let chk: number;
  let flag: number;
  if (mi.cury[1] + move.y < 0) {
    temp.y--;
    chk = SOLBOT;
    flag = 1;
  } else {
    temp.y++;
    chk = SOLTOP;
    flag = 3;
  }
  wrap(temp);
  let walls = solidAt(w, temp.x, temp.y);
  if (mi.curx[1] + move.x > BLEN / 4) walls |= solidAt(w, (temp.x + 1) % MLEN, temp.y);
  if (mi.curx[1] + move.x < -BLEN / 4) walls |= solidAt(w, (temp.x - 1 + MLEN) % MLEN, temp.y);
  if (walls & chk) {
    move.y = -mi.cury[1];
    temp.y += flag === 1 ? 1 : -1;
    return true;
  }
  return false;
}

/** minfo::ChkWalls: checks the dominant axis first; temp carries over between the two checks. */
function chkWalls(w: World, mi: MonInfo, move: Coord): boolean {
  const temp = { x: mi.curx[0], y: mi.cury[0] };
  let blocked = false;
  if (Math.abs(move.x) > Math.abs(move.y)) {
    blocked = chkHorizWalls(w, mi, move, temp) || blocked;
    if (move.y) blocked = chkVertWalls(w, mi, move, temp) || blocked;
  } else {
    if (move.y) blocked = chkVertWalls(w, mi, move, temp) || blocked;
    if (move.x) blocked = chkHorizWalls(w, mi, move, temp) || blocked;
  }
  return blocked;
}

/** MonInRange: within ATTACKX x ATTACKY blocks of the character, so the attack march starts. */
function monInRange(w: World, mm: number): boolean {
  const mi = w.mi[mm];
  return Math.abs(mi.curx[0] - w.chr.x[0]) < ATTACKX && Math.abs(mi.cury[0] - w.chr.y[0]) < ATTACKY;
}

/** BirthMon: puts monster `mon` in slot mm (or the first empty slot when mm >= LASTMM). */
export function birthMon(w: World, mm: number, mon: number, x: number, y: number): number {
  if (mm >= LASTMM) {
    // The C do/while scans every slot once, starting at FirstEmptyMM and wrapping.
    let t = w.firstEmptyMM;
    for (let n = 0; n <= LASTMM; n++) {
      if (t >= 0 && t < LASTMM && w.mm[t].monnum === LASTMON) {
        mm = t;
        break;
      }
      t++;
      if (t >= LASTMM) t = 0;
    }
    w.firstEmptyMM = Math.max(0, t);
  }
  if (mm < LASTMM && mm >= 0) {
    w.mm[mm].monnum = mon & 0xff;
    const mi = w.mi[mm];
    mi.birthTime = w.clock;
    mi.nextAni = w.clock;
    mi.nextMove = w.clock;
    mi.curx[0] = x;
    mi.cury[0] = y;
    mi.target = { x, y };
    return mm;
  }
  return LASTMM;
}

/** KillMon: returns true if the monster is gone (rather than transformed). */
function killMon(w: World, mm: number): boolean {
  const mon = w.mon[w.mm[mm].monnum];
  // end === -2 means the monster can never be killed.
  if (!mon || mon.end === -2) return false;
  if (mon.newmon === LASTMON || mon.newmon < 0) {
    w.mm[mm].monnum = LASTMON;
    if (mm < w.firstEmptyMM) w.firstEmptyMM = Math.max(0, mm - 1);
    return true;
  }
  // Transform into newmon in the same slot; offl = -1 makes the next tick start a new path.
  const mi = w.mi[mm];
  birthMon(w, mm, mon.newmon, mi.curx[0], mi.cury[0]);
  mi.offl = -1;
  mi.curMarch = NORMALMOVEMENT;
  mi.dest = 0;
  mi.curPic = 0;
  if (mi.fromchar > 0) mi.fromchar++;
  return false;
}

/** BlocBirthMon: blocks that give birth to monsters near the screen. */
export function blockBirthMonsters(w: World): void {
  // birthFlag stands in for the C's 0x4000 bit set in blks[0][n].Birthtime.
  w.birthFlag.fill(0);
  for (const b of w.blkMon) {
    if (b.nexttime <= w.clock) {
      b.nexttime += w.bg[b.blnum].birthTime;
      w.birthFlag[b.blnum] = 1;
    }
  }
  // Scan the screen plus half a screen on every side.
  for (let lx = w.mx - SCRNBLEN / 2; lx < w.mx + (SCRNBLEN * 3) / 2; lx++) {
    for (let ly = w.my - SCRNBWID / 2; ly < w.my + (SCRNBWID * 3) / 2; ly++) {
      const x = (lx + MLEN) % MLEN;
      const y = (ly + MWID) % MWID;
      const tmap = w.blkmap[mapBlock(w, x, y)] ?? BACKBL;
      if (!w.birthFlag[tmap]) continue;
      const slot = birthMon(w, LASTMM, w.bg[tmap].birthMon, x, y);
      if (slot < LASTMM) {
        w.mi[slot].fromchar = 0;
        resetMonInfo(w.mi[slot]);
      }
    }
  }
}

/** CharBirthMon: a character sequence frame that fires a monster (a shot, a bomb…). */
export function charBirthMon(w: World, x: number, y: number, monNum: number): void {
  const slot = birthMon(w, LASTMM, monNum, x, y);
  if (slot >= LASTMM) return;
  const mi = w.mi[slot];
  resetMonInfo(mi);
  mi.fromchar = 1;
  mi.curx[1] = w.chr.x[1];
  mi.cury[1] = w.chr.y[1];
  mi.offl = -1;
  const mon = w.mon[monNum & 0xff];
  // Path and chase monsters fly off in the character's last move direction (netx/nety).
  if (mon && mon.towards < 64) {
    const { netx, nety } = w.ci;
    mi.delta = { x: netx * BLEN, y: nety * BLEN };
    if (Math.abs(netx) - Math.abs(nety) > 0) mi.orient = netx < 0 ? 4 : 0;
    else mi.orient = nety < 0 ? 3 : 1;
  }
}

/**
 * MonEndPath: called when the current path segment is done (offl === -1). Aims
 * the monster at the next corner of its march; at the end of the march (dest
 * reached MAXMARCH or a corner with speed pic 0) it starts over at the normal
 * march, or dies there if end === -1. Returns true if the monster was killed.
 * dest is left pointing one past the segment being walked, hence dest - 1 in
 * moveAllMonsters.
 */
function monEndPath(w: World, mm: number, monNum: number): boolean {
  const mi = w.mi[mm];
  const mon = w.mon[monNum];
  if (mi.dest === MAXMARCH || marchAt(mon, mi.curMarch, mi.dest).pic === 0) {
    if (mon.end === -1 && mi.curMarch === NORMALMOVEMENT && killMon(w, mm)) return true;
    mi.dest = 0;
    mi.curMarch = NORMALMOVEMENT;
  }
  const cur = marchAt(mon, mi.curMarch, mi.dest);
  const target = { x: cur.x + mi.curx[0], y: cur.y + mi.cury[0] };
  if (mi.dest !== 0) {
    // Corners after the first are stored as offsets from the start; make them relative.
    const prev = marchAt(mon, mi.curMarch, mi.dest - 1);
    target.x -= prev.x;
    target.y -= prev.y;
  }
  mi.orient = cur.orient;
  wrap(target);
  mi.target = target;
  distToPlace(mi, target.x, target.y);
  mi.offl = 0;
  mi.offs = 0;
  mi.dest++;
  return false;
}

/**
 * PicChkTouch: pixel-exact overlap of two 20x20 sprites (255 = transparent).
 * Both positions are shifted so the overlap is measured from the nearer corner;
 * each of the four branches handles one relative placement of sprite 2.
 */
export function picChkTouch(x1: number, y1: number, pic1: Uint8Array, x2: number, y2: number, pic2: Uint8Array): boolean {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  x2 -= dx;
  x1 -= dx;
  y2 -= dy;
  y1 -= dy;
  if (dx > BLEN || dy > BLEN) return false;
  const p1 = (i: number) => (i >= 0 && i < pic1.length ? pic1[i] : TRANSPARENT);
  const p2 = (i: number) => (i >= 0 && i < pic2.length ? pic2[i] : TRANSPARENT);
  let c1: number;
  let c2: number;
  if (x2 >= x1 && y2 >= y1) {
    c1 = BLEN * dy;
    c2 = 0;
    for (let ly = 0; ly < y1 + BLEN - y2; ly++) {
      c1 += dx;
      for (let lx = 0; lx < x1 + BLEN - x2; lx++, c1++, c2++) if (p1(c1) !== TRANSPARENT && p2(c2) !== TRANSPARENT) return true;
      c2 += dx;
    }
    return false;
  }
  if (x2 >= x1 && y2 <= y1) {
    c1 = 0;
    c2 = dy * BLEN;
    for (let ly = 0; ly < y2 + BLEN - y1; ly++) {
      c1 += dx;
      for (let lx = 0; lx < x1 + BLEN - x2; lx++, c1++, c2++) if (p1(c1) !== TRANSPARENT && p2(c2) !== TRANSPARENT) return true;
      c2 += dx;
    }
    return false;
  }
  if (x2 <= x1 && y2 >= y1) {
    c2 = 0;
    c1 = dy * BLEN;
    for (let ly = 0; ly < y1 + BLEN - y2; ly++) {
      c2 += dx;
      for (let lx = 0; lx < x2 + BLEN - x1; lx++, c1++, c2++) if (p1(c1) !== TRANSPARENT && p2(c2) !== TRANSPARENT) return true;
      c1 += dx;
    }
    return false;
  }
  c2 = BLEN * dy;
  c1 = 0;
  for (let ly = 0; ly < y2 + BLEN - y1; ly++) {
    c2 += dx;
    for (let lx = 0; lx < x2 + BLEN - x1; lx++, c1++, c2++) if (p1(c1) !== TRANSPARENT && p2(c2) !== TRANSPARENT) return true;
    c1 += dx;
  }
  return false;
}

/** ChkMonChr: does monster slot mm touch the character? Also sets monsolid pushing. */
function chkMonChr(w: World, mm: number): boolean {
  const mi = w.mi[mm];
  const { ci } = w;
  // Compare in screen pixels; only monsters on screen can touch the character.
  if (mi.scrPos.x === OFFSCRN) return false;
  const lx = Math.min(mi.scrPos.x, ci.scrx);
  const ly = Math.min(mi.scrPos.y, ci.scry);
  const chr = { x: ci.scrx - lx, y: ci.scry - ly };
  const mon = { x: mi.scrPos.x - lx, y: mi.scrPos.y - ly };
  const maxx = { x: Math.max(chr.x, mon.x), y: Math.max(chr.y, mon.y) };
  let retval = false;
  // Bounding test; BLEN * 2 because the character is two blocks high.
  if (mon.x <= chr.x + BLEN && mon.x + BLEN >= chr.x && mon.y <= chr.y + BLEN && mon.y + BLEN * 2 >= chr.y) {
    let mons = monPicNum(w, mm);
    if (mons >= MONBL) return false;
    const frame = chrFrame(w);
    const mpix = w.mblk[mons].pixels;
    if (frame.pic2 < CHARBL) retval = picChkTouch(chr.x, chr.y, w.cblk[frame.pic2].pixels, mon.x, mon.y, mpix);
    if (frame.pic1 < CHARBL) retval = picChkTouch(chr.x, chr.y, w.cblk[frame.pic1].pixels, mon.x, mon.y + BLEN, mpix) || retval;
    if (retval) {
      mons = w.mblk[mons].solid;
      // A solid monster pushes the character along the axis it is farther apart on.
      if (mons > 0) {
        if (maxx.x >= maxx.y) w.monsolid |= chr.x === 0 ? SOLRIG & mons : SOLLEF & mons;
        else w.monsolid |= chr.y === 0 ? SOLBOT & mons : SOLTOP & mons;
        w.mmSolid = mm;
      }
    }
    // Squeezed from both sides by two monsters: push on the other axis instead.
    if (w.monsolid & SOLRIG && w.monsolid & SOLLEF) w.monsolid |= chr.y === 0 ? SOLBOT & mons : SOLTOP & mons;
    if (w.monsolid & SOLBOT && w.monsolid & SOLTOP) w.monsolid |= chr.x === 0 ? SOLRIG & mons : SOLLEF & mons;
  }
  return retval;
}

/** DoCollision: stronger monsters kill weaker ones they touch. Returns the survivor. */
function doCollision(w: World, mm1: number, mm2: number, where: number): number {
  const mon1 = w.mm[mm1].monnum;
  const mon2 = w.mm[mm2].monnum;
  if (mon1 >= LASTMON || mon2 >= LASTMON) return mm2;
  const m1 = w.mon[mon1];
  const m2 = w.mon[mon2];
  if (m1.power === m2.power) return mm2;
  // `where` says which neighboring cell mm1 is in (bit 1: x + 1, bit 2: y + 1).
  // A kill by a character-fired monster scores and uses up the shot too.
  const addx = where & 1 ? BLEN : 0;
  const addy = where & 2 ? BLEN : 0;
  const p1 = monPicNum(w, mm1);
  if (p1 >= MONBL) return mm2;
  const p2 = monPicNum(w, mm2);
  if (p2 >= MONBL) return mm1;
  const a = w.mi[mm1];
  const b = w.mi[mm2];
  if (!picChkTouch(a.curx[1] + addx, a.cury[1] + addy, w.mblk[p1].pixels, b.curx[1], b.cury[1], w.mblk[p2].pixels)) return mm2;
  if (m1.power < m2.power) {
    killMon(w, mm1);
    if (b.fromchar > 0) {
      w.ci.score += m1.upscore;
      doSound(w, KILLSOUND);
      killMon(w, mm2);
      return LASTMM;
    }
    return mm2;
  }
  killMon(w, mm2);
  if (a.fromchar > 0) {
    w.ci.score += m2.upscore;
    doSound(w, KILLSOUND);
    killMon(w, mm1);
    return LASTMM;
  }
  return mm1;
}

/** moveallmons: animate and move every live monster one game tick. */
export function moveAllMonsters(w: World): void {
  const { clock, chr } = w;
  for (let mm = 0; mm < LASTMM; mm++) {
    const monNum = w.mm[mm].monnum;
    if (monNum >= LASTMON) continue;
    const mon = w.mon[monNum];
    const mi = w.mi[mm];
    if (!mon) continue;

    // Animation: step to the next picture, wrapping at LASTSL or an empty slot.
    // pic[n][1] is how many ticks that picture stays up.
    if (clock >= mi.nextAni) {
      mi.curPic++;
      if (mi.curPic >= LASTSL || mon.pic[mi.curPic][0] >= MONBL) mi.curPic = mon.pic[0][0] < MONBL ? 0 : LASTSL;
      mi.nextAni = mi.curPic < LASTSL ? clock + mon.pic[mi.curPic][1] : clock + 100000;
    }

    // Movement: speed is in pixels per tick times the ticks elapsed (MONMOVESPEED is 1).
    if (clock < mi.nextMove) continue;
    const speed = Math.trunc((clock - mi.nextMove + 1) / MONMOVESPEED);
    mi.nextMove = clock + MONMOVESPEED;

    if (mon.activate !== 0 && mi.curMarch !== ATTACKMOVEMENT && monInRange(w, mm)) {
      mi.curMarch = ATTACKMOVEMENT;
      mi.dest = 1;
    }

    // Four kinds of movement, as in moveallmons:
    // - attack march relative to the character (activate === 2): every corner is
    //   an offset from the character, re-aimed each tick;
    // - towards === 0: walk the march path, corner to corner (MonEndPath);
    // - towards < 64: chase (or flee when negative) the character at |towards| pixels a tick;
    // - towards >= 64: wander to random spots 5 to 11 blocks away at towards >> 6 pixels a tick.
    // A march corner's pic field holds the speed of the segment.
    let move: Coord;
    if (mi.curMarch === ATTACKMOVEMENT && mon.activate === 2) {
      const c = marchAt(mon, ATTACKMOVEMENT, mi.dest);
      mi.target = { x: (c.x + chr.x[0] + MLEN) % MLEN, y: (c.y + chr.y[0] + MWID) % MWID };
      distToPlace(mi, mi.target.x, mi.target.y);
      mi.offl = 0;
      move = bresenhams(mi, c.pic * speed);
      if (mi.offl === -1) {
        mi.dest++;
        mi.offs = 0;
        if (mi.dest === MAXMARCH || marchAt(mon, ATTACKMOVEMENT, mi.dest).pic === 0) {
          mi.curMarch = NORMALMOVEMENT;
          mi.dest = 0;
        } else mi.orient = marchAt(mon, ATTACKMOVEMENT, mi.dest).orient;
      }
    } else if (mon.towards === 0) {
      if (mi.offl === -1 && monEndPath(w, mm, monNum)) continue;
      move = bresenhams(mi, marchAt(mon, mi.curMarch, mi.dest - 1).pic * speed);
    } else if (mon.towards < 64) {
      // A monster fired by the character keeps the delta CharBirthMon gave it.
      if (!mi.fromchar) {
        distToPlace(mi, chr.x[0], chr.y[0]);
        mi.delta.x += chr.x[1] - mi.curx[1];
        mi.delta.y += chr.y[1] - mi.cury[1];
        if (mon.towards < 0) mi.delta = { x: -mi.delta.x, y: -mi.delta.y };
        if (mi.delta.x < 0) mi.orient |= 4;
        else mi.orient = 0;
      }
      move = bresenhams(mi, Math.abs(mon.towards) * speed);
    } else {
      if (mi.curx[0] === mi.target.x && mi.cury[0] === mi.target.y) {
        if (random(w, 2)) mi.target.x = (mi.target.x + random(w, 7) + 5) % MLEN;
        else {
          mi.target.x -= random(w, 7) + 5;
          if (mi.target.x < 0) mi.target.x += MLEN;
        }
        if (random(w, 2)) mi.target.y = (mi.target.y + random(w, 7) + 5) % MWID;
        else {
          mi.target.y -= random(w, 7) + 5;
          if (mi.target.y < 0) mi.target.y += MWID;
        }
        distToPlace(mi, mi.target.x, mi.target.y);
        mi.offl = 0;
        mi.offs = 0;
      }
      move = bresenhams(mi, (mon.towards >> 6) * speed);
    }

    // `thru` means "stops on solid" (MON.H); a monster the character fired dies on a wall.
    if (mon.thru && chkWalls(w, mi, move) && mi.fromchar > 0 && killMon(w, mm)) continue;

    // Stuck: a wandering monster picks a new random target next tick ("keep monsters moving").
    if (move.x === 0 && move.y === 0) mi.target = { x: mi.curx[0], y: mi.cury[0] };
    else {
      mi.curx[1] += move.x;
      mi.cury[1] += move.y;
    }

    // Take the monster out of the map's monster layer; it is put back below at its new cell.
    if (mapMonAt(w, mi.curx[0], mi.cury[0]) === mm) setMapMon(w, mi.curx[0], mi.cury[0], LASTMM);

    while (mi.curx[1] >= BLEN) {
      mi.curx[1] -= BLEN;
      mi.curx[0]++;
    }
    while (mi.curx[1] < 0) {
      mi.curx[1] += BLEN;
      mi.curx[0]--;
    }
    while (mi.cury[1] >= BLEN) {
      mi.cury[1] -= BLEN;
      mi.cury[0]++;
    }
    while (mi.cury[1] < 0) {
      mi.cury[1] += BLEN;
      mi.cury[0]--;
    }
    // The C compares cury[0] against MLEN here; MLEN === MWID so MWID is the same.
    if (mi.curx[0] < 0) mi.curx[0] += MLEN;
    if (mi.cury[0] < 0) mi.cury[0] += MWID;
    if (mi.curx[0] >= MLEN) mi.curx[0] -= MLEN;
    if (mi.cury[0] >= MWID) mi.cury[0] -= MWID;

    if (!calcDraw(w, mi)) mi.scrPos = { x: OFFSCRN, y: OFFSCRN };

    // Touching the character applies the monster block's effects; monsters weaker
    // than CHARPOWER die (or transform) on contact. fromchar === 1 is a monster the
    // character fired that hasn't transformed yet; it can't touch the character.
    if (mi.curPic >= 0 && mi.curPic < LASTSL && chkMonChr(w, mm) && mi.fromchar !== 1) {
      const pic = monPicNum(w, mm);
      const playSnd = doBlockTouchChar(w, w.mblk[pic]) - 1;
      if (w.mon[w.mm[mm].monnum]?.power < CHARPOWER && killMon(w, mm)) {
        if (!playSnd) doSound(w, KILLSOUND);
        continue;
      }
    }

    // Fight any monster registered in this cell or the three cells it may overlap.
    // The cells are not wrapped, like map[y][x + 1] in the C.
    let survivor = mm;
    const x0 = mi.curx[0];
    const y0 = mi.cury[0];
    for (const [dx, dy, where] of [
      [0, 0, 0],
      [1, 0, 1],
      [1, 1, 3],
      [0, 1, 2],
    ]) {
      const other = mapMonAt(w, x0 + dx, y0 + dy);
      if (other < LASTMM) survivor = doCollision(w, other, mm, where);
    }
    if (survivor < LASTMM) setMapMon(w, w.mi[survivor].curx[0], w.mi[survivor].cury[0], survivor);
    // end > 0 is a lifetime in ticks.
    if (mon.end > 0 && mi.birthTime + mon.end <= clock) killMon(w, mm);
  }
}
