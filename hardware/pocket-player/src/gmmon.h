// Monster behavior for gmcore.h's World: a tick for tick port of web/packages/engine/src/engine/monsters.ts
// (itself PLAYGAME.C's moveallmons, MonEndPath, Bresenhams, ChkWalls, ChkMonChr, DoCollision, BirthMon, KillMon,
// BlocBirthMon, CharBirthMon). Monster records are read straight from the 300 byte .mon records (MON.H):
// power @8, thru @9, pic[21] (block, ticks) @10, newmon @98, upscore @99, activate @122, end @124, towards @126,
// close[2] @128, march[2][10] (x, y, speed, orient) @132.
#pragma once
#include <stdlib.h>
#include "gmcore.h"

namespace gm {

namespace mon {
inline int power(const uint8_t* p) { return p[8]; }
inline int thru(const uint8_t* p) { return (int8_t)p[9]; }
inline int pic(const uint8_t* p, int i) { return i16(p + 10 + i * 4); }
inline int picTime(const uint8_t* p, int i) { return i16(p + 12 + i * 4); }
inline int newmon(const uint8_t* p) { return (int8_t)p[98]; }
inline int upscore(const uint8_t* p) { return i16(p + 99); }
inline int activate(const uint8_t* p) { return i16(p + 122); }
inline int end(const uint8_t* p) { return i16(p + 124); }
inline int towards(const uint8_t* p) { return i16(p + 126); }
struct March { int x, y, pic, orient; };
// mon.march[p][i] including the original's reads just before the array (i = -1).
inline March marchAt(const uint8_t* p, int path, int i) {
  auto at = [&](int pa, int k) { const uint8_t* q = p + 132 + pa * 80 + k * 8; return March{i16(q), i16(q + 2), i16(q + 4), i16(q + 6)}; };
  if (i >= 0) return i < MAXMARCH && path >= 0 && path < 2 ? at(path, i) : March{0, 0, 0, 0};
  if (path == 1) return at(0, MAXMARCH - 1);
  return March{i16(p + 124), i16(p + 126), i16(p + 128), i16(p + 130)};  // { end, towards, close[0], close[1] }
}
inline void wrapXY(int& x, int& y) {
  if (y < 0) y += MWID; else if (y >= MWID) y -= MWID;
  if (x < 0) x += MLEN; else if (x >= MLEN) x -= MLEN;
}
}  // namespace mon

inline void World::resetMonInfo(int m) {
  MonInfo& i = mi[m];
  i.deltaX = i.deltaY = 0;
  i.scrX = i.scrY = OFFSCRN;
  i.curx[1] = 0;
  i.cury[1] = 0;
  i.curPic = -1;
  i.offl = -1;
  i.offs = 0;
  i.curMarch = NORMALMOVEMENT;
  i.orient = 0;
  i.dest = 0;
}

inline int World::monPicNum(int m) const {
  const MonInfo& i = mi[m];
  if (i.curPic >= 0 && i.curPic < LASTSL) {
    const uint8_t* mo = monAt(mm[m].monnum);
    int p = mo ? mon::pic(mo, i.curPic) : MONBL;
    return p < MONBL && p >= 0 ? p : MONBL;
  }
  return MONBL;
}

// BirthMon: puts monster `monNum` in slot m (or the first empty slot when m >= LASTMM).
inline int World::birthMon(int m, int monNum, int x, int y) {
  if (m >= LASTMM) {
    int t = firstEmptyMM;
    for (int n = 0; n <= LASTMM; n++) {
      if (t >= 0 && t < LASTMM && mm[t].monnum == LASTMON) { m = t; break; }
      t++;
      if (t >= LASTMM) t = 0;
    }
    firstEmptyMM = t > 0 ? t : 0;
  }
  if (m < LASTMM && m >= 0) {
    mm[m].monnum = (uint8_t)(monNum & 0xff);
    MonInfo& i = mi[m];
    i.birthTime = i.nextAni = i.nextMove = clock;
    i.curx[0] = x;
    i.cury[0] = y;
    i.targetX = x;
    i.targetY = y;
    return m;
  }
  return LASTMM;
}

// KillMon: true if the monster is gone (rather than transformed).
inline bool World::killMon(int m) {
  const uint8_t* mo = monAt(mm[m].monnum);
  if (!mo || mon::end(mo) == -2) return false;
  int nm = mon::newmon(mo);
  if (nm == LASTMON || nm < 0) {
    mm[m].monnum = LASTMON;
    if (m < firstEmptyMM) firstEmptyMM = m - 1 > 0 ? m - 1 : 0;
    return true;
  }
  MonInfo& i = mi[m];
  birthMon(m, nm, i.curx[0], i.cury[0]);
  i.offl = -1;
  i.curMarch = NORMALMOVEMENT;
  i.dest = 0;
  i.curPic = 0;
  if (i.fromchar > 0) i.fromchar++;
  return false;
}

// BlocBirthMon: blocks that give birth to monsters near the screen.
inline void World::blockBirthMonsters() {
  if (!nblkMon) return;
  memset(birthFlag, 0, sizeof birthFlag);
  bool any = false;
  for (int k = 0; k < nblkMon; k++) {
    if (blkMonNext[k] <= clock) {
      blkMonNext[k] += attr(blkMonBl[k]).birthTime;
      birthFlag[blkMonBl[k]] = 1;
      any = true;
    }
  }
  if (!any) return;
  for (int lx = mx - SCRNBLEN / 2; lx < mx + (SCRNBLEN * 3) / 2; lx++) {
    for (int ly = my - SCRNBWID / 2; ly < my + (SCRNBWID * 3) / 2; ly++) {
      int x = (lx + MLEN) % MLEN, y = (ly + MWID) % MWID;
      int tmap = blkmap[mapBlock(x, y)];
      if (!birthFlag[tmap]) continue;
      int slot = birthMon(LASTMM, attr(tmap).birthMon, x, y);
      if (slot < LASTMM) {
        mi[slot].fromchar = 0;
        resetMonInfo(slot);
      }
    }
  }
}

// CharBirthMon: a character frame that fires a monster (a shot, a bomb...).
inline void World::charBirthMon(int x, int y, int monNum) {
  int slot = birthMon(LASTMM, monNum, x, y);
  if (slot >= LASTMM) return;
  MonInfo& i = mi[slot];
  resetMonInfo(slot);
  i.fromchar = 1;
  i.curx[1] = cx[1];
  i.cury[1] = cy[1];
  i.offl = -1;
  const uint8_t* mo = monAt(monNum & 0xff);
  if (mo && mon::towards(mo) < 64) {
    i.deltaX = netx * BLEN;
    i.deltaY = nety * BLEN;
    int ax = netx < 0 ? -netx : netx, ay = nety < 0 ? -nety : nety;
    if (ax - ay > 0) i.orient = netx < 0 ? 4 : 0;
    else i.orient = nety < 0 ? 3 : 1;
  }
}

namespace monimpl {
// minfo::DistToPlace: shortest block distance to (x, y) across the map wrap, in pixels.
inline void distToPlace(MonInfo& i, int x, int y) {
  int dx = x - i.curx[0], dy = y - i.cury[0];
  if (dx > MLEN / 2) dx -= MLEN;
  if (dx < -MLEN / 2) dx += MLEN;
  if (dy > MWID / 2) dy -= MWID;
  if (dy < -MWID / 2) dy += MWID;
  i.deltaX = dx * BLEN;
  i.deltaY = dy * BLEN;
}
// minfo::Bresenhams: steps up to `speed` pixels along the line in delta; offl becomes -1 at the end.
inline void bresenhams(MonInfo& i, int speed, int& mvx, int& mvy) {
  mvx = mvy = 0;
  int ax = i.deltaX < 0 ? -i.deltaX : i.deltaX, ay = i.deltaY < 0 ? -i.deltaY : i.deltaY;
  if (ax >= ay) {
    for (int l = 0; l < speed; l++) {
      if (i.offl >= ax) { i.offl = -1; break; }
      i.offl++;
      mvx += sgn(i.deltaX);
      i.offs += ay;
      if (i.offs >= ax) { i.offs -= ax; mvy += sgn(i.deltaY); }
    }
  } else {
    for (int l = 0; l < speed; l++) {
      if (i.offl >= ay) { i.offl = -1; break; }
      i.offl++;
      i.offs += ax;
      mvy += sgn(i.deltaY);
      if (i.offs >= ay) { i.offs -= ay; mvx += sgn(i.deltaX); }
    }
  }
}
// PicChkTouch: pixel-exact overlap of two 20x20 sprites (255 = transparent), with the C's flat reads.
inline bool picChkTouch(int x1, int y1, const uint8_t* pic1, int x2, int y2, const uint8_t* pic2) {
  int dx = x2 > x1 ? x2 - x1 : x1 - x2, dy = y2 > y1 ? y2 - y1 : y1 - y2;
  x2 -= dx; x1 -= dx; y2 -= dy; y1 -= dy;
  if (dx > BLEN || dy > BLEN) return false;
  auto p1 = [&](int i) { return i >= 0 && i < 400 ? pic1[i] : 255; };
  auto p2 = [&](int i) { return i >= 0 && i < 400 ? pic2[i] : 255; };
  int c1, c2;
  if (x2 >= x1 && y2 >= y1) {
    c1 = BLEN * dy; c2 = 0;
    for (int ly = 0; ly < y1 + BLEN - y2; ly++) {
      c1 += dx;
      for (int lx = 0; lx < x1 + BLEN - x2; lx++, c1++, c2++) if (p1(c1) != 255 && p2(c2) != 255) return true;
      c2 += dx;
    }
    return false;
  }
  if (x2 >= x1 && y2 <= y1) {
    c1 = 0; c2 = dy * BLEN;
    for (int ly = 0; ly < y2 + BLEN - y1; ly++) {
      c1 += dx;
      for (int lx = 0; lx < x1 + BLEN - x2; lx++, c1++, c2++) if (p1(c1) != 255 && p2(c2) != 255) return true;
      c2 += dx;
    }
    return false;
  }
  if (x2 <= x1 && y2 >= y1) {
    c2 = 0; c1 = dy * BLEN;
    for (int ly = 0; ly < y1 + BLEN - y2; ly++) {
      c2 += dx;
      for (int lx = 0; lx < x2 + BLEN - x1; lx++, c1++, c2++) if (p1(c1) != 255 && p2(c2) != 255) return true;
      c1 += dx;
    }
    return false;
  }
  c2 = BLEN * dy; c1 = 0;
  for (int ly = 0; ly < y2 + BLEN - y1; ly++) {
    c2 += dx;
    for (int lx = 0; lx < x2 + BLEN - x1; lx++, c1++, c2++) if (p1(c1) != 255 && p2(c2) != 255) return true;
    c1 += dx;
  }
  return false;
}
inline const uint8_t* transparentPixels() {
  static uint8_t t[400];
  static bool init = false;
  if (!init) { memset(t, 255, sizeof t); init = true; }
  return t;
}
}  // namespace monimpl

// MonEndPath: the current path segment is done (offl == -1). Aims at the next corner; true if the monster was killed.
inline bool World::monEndPath(int m, const uint8_t* mo) {
  MonInfo& i = mi[m];
  if (i.dest == MAXMARCH || mon::marchAt(mo, i.curMarch, i.dest).pic == 0) {
    if (mon::end(mo) == -1 && i.curMarch == NORMALMOVEMENT && killMon(m)) return true;
    i.dest = 0;
    i.curMarch = NORMALMOVEMENT;
  }
  mon::March cur = mon::marchAt(mo, i.curMarch, i.dest);
  int tx = cur.x + i.curx[0], ty = cur.y + i.cury[0];
  if (i.dest != 0) {
    mon::March prev = mon::marchAt(mo, i.curMarch, i.dest - 1);
    tx -= prev.x;
    ty -= prev.y;
  }
  i.orient = cur.orient;
  mon::wrapXY(tx, ty);
  i.targetX = tx;
  i.targetY = ty;
  monimpl::distToPlace(i, tx, ty);
  i.offl = 0;
  i.offs = 0;
  i.dest++;
  return false;
}

// ChkMonChr: does monster slot m touch the character? Also sets monsolid pushing.
inline bool World::chkMonChr(int m) {
  const MonInfo& i = mi[m];
  if (i.scrX == OFFSCRN) return false;
  int lx = i.scrX < scrx ? i.scrX : scrx, ly = i.scrY < scry ? i.scrY : scry;
  int chx = scrx - lx, chy = scry - ly, mnx = i.scrX - lx, mny = i.scrY - ly;
  int maxx = chx > mnx ? chx : mnx, maxy = chy > mny ? chy : mny;
  bool retval = false;
  if (mnx <= chx + BLEN && mnx + BLEN >= chx && mny <= chy + BLEN && mny + BLEN * 2 >= chy) {
    int mons = monPicNum(m);
    if (mons >= MONBL) return false;
    // chrFrame: the sequence's frame with cframe clamped into 0..MAXFRAME-1
    const uint8_t* fp = seqRaw(cseq) + (cframe < 0 ? 0 : cframe >= MAXFRAME ? MAXFRAME - 1 : cframe) * FRAME_BYTES;
    int pic1 = u16(fp + 6), pic2 = u16(fp + 8);
    const uint8_t* mpix = mons < nmbl ? mbl + mons * BLOCK_BYTES : monimpl::transparentPixels();
    if (pic2 < CHARBL) retval = monimpl::picChkTouch(chx, chy, cbl + pic2 * BLOCK_BYTES, mnx, mny, mpix);
    if (pic1 < CHARBL) retval = monimpl::picChkTouch(chx, chy, cbl + pic1 * BLOCK_BYTES, mnx, mny + BLEN, mpix) || retval;
    if (retval) {
      mons = attrOf(mbl, nmbl, mons).solid;
      if (mons > 0) {
        if (maxx >= maxy) monsolid |= chx == 0 ? SOLRIG & mons : SOLLEF & mons;
        else monsolid |= chy == 0 ? SOLBOT & mons : SOLTOP & mons;
        mmSolid = m;
      }
    }
    if ((monsolid & SOLRIG) && (monsolid & SOLLEF)) monsolid |= chy == 0 ? SOLBOT & mons : SOLTOP & mons;
    if ((monsolid & SOLBOT) && (monsolid & SOLTOP)) monsolid |= chx == 0 ? SOLRIG & mons : SOLLEF & mons;
  }
  return retval;
}

// DoCollision: stronger monsters kill weaker ones they touch. Returns the survivor.
inline int World::doCollision(int m1, int m2, int where) {
  int n1 = mm[m1].monnum, n2 = mm[m2].monnum;
  if (n1 >= LASTMON || n2 >= LASTMON) return m2;
  const uint8_t* a1 = monAt(n1);
  const uint8_t* a2 = monAt(n2);
  if (!a1 || !a2) return m2;  // a monster outside the packed file never lives
  if (mon::power(a1) == mon::power(a2)) return m2;
  int addx = where & 1 ? BLEN : 0, addy = where & 2 ? BLEN : 0;
  int p1 = monPicNum(m1);
  if (p1 >= MONBL) return m2;
  int p2 = monPicNum(m2);
  if (p2 >= MONBL) return m1;
  MonInfo& a = mi[m1];
  MonInfo& b = mi[m2];
  const uint8_t* px1 = p1 < nmbl ? mbl + p1 * BLOCK_BYTES : monimpl::transparentPixels();
  const uint8_t* px2 = p2 < nmbl ? mbl + p2 * BLOCK_BYTES : monimpl::transparentPixels();
  if (!monimpl::picChkTouch(a.curx[1] + addx, a.cury[1] + addy, px1, b.curx[1], b.cury[1], px2)) return m2;
  if (mon::power(a1) < mon::power(a2)) {
    killMon(m1);
    if (b.fromchar > 0) {
      score += mon::upscore(a1);
      doSound(KILLSOUND);
      killMon(m2);
      return LASTMM;
    }
    return m2;
  }
  killMon(m2);
  if (a.fromchar > 0) {
    score += mon::upscore(a2);
    doSound(KILLSOUND);
    killMon(m1);
    return LASTMM;
  }
  return m1;
}

// moveallmons: animate and move every live monster one game tick.
inline void World::moveAllMonsters() {
  using namespace monimpl;
  for (int m = 0; m < LASTMM; m++) {
    int monNum = mm[m].monnum;
    if (monNum >= LASTMON) continue;
    const uint8_t* mo = monAt(monNum);
    MonInfo& i = mi[m];
    if (!mo) continue;

    if (clock >= i.nextAni) {
      i.curPic++;
      if (i.curPic >= LASTSL || mon::pic(mo, i.curPic) >= MONBL) i.curPic = mon::pic(mo, 0) < MONBL ? 0 : LASTSL;
      i.nextAni = i.curPic < LASTSL ? clock + mon::picTime(mo, i.curPic) : clock + 100000;
    }

    if (clock < i.nextMove) continue;
    int speed = (int)((int64_t)clock - (int64_t)i.nextMove + 1) / MONMOVESPEED;
    i.nextMove = clock + MONMOVESPEED;

    int act = mon::activate(mo), towards = mon::towards(mo);
    if (act != 0 && i.curMarch != ATTACKMOVEMENT && abs(i.curx[0] - cx[0]) < ATTACKX && abs(i.cury[0] - cy[0]) < ATTACKY) {
      i.curMarch = ATTACKMOVEMENT;
      i.dest = 1;
    }

    int mvx = 0, mvy = 0;
    if (i.curMarch == ATTACKMOVEMENT && act == 2) {
      mon::March c = mon::marchAt(mo, ATTACKMOVEMENT, i.dest);
      i.targetX = (c.x + cx[0] + MLEN) % MLEN;
      i.targetY = (c.y + cy[0] + MWID) % MWID;
      distToPlace(i, i.targetX, i.targetY);
      i.offl = 0;
      bresenhams(i, c.pic * speed, mvx, mvy);
      if (i.offl == -1) {
        i.dest++;
        i.offs = 0;
        if (i.dest == MAXMARCH || mon::marchAt(mo, ATTACKMOVEMENT, i.dest).pic == 0) {
          i.curMarch = NORMALMOVEMENT;
          i.dest = 0;
        } else i.orient = mon::marchAt(mo, ATTACKMOVEMENT, i.dest).orient;
      }
    } else if (towards == 0) {
      if (i.offl == -1 && monEndPath(m, mo)) continue;
      bresenhams(i, mon::marchAt(mo, i.curMarch, i.dest - 1).pic * speed, mvx, mvy);
    } else if (towards < 64) {
      if (!i.fromchar) {
        distToPlace(i, cx[0], cy[0]);
        i.deltaX += cx[1] - i.curx[1];
        i.deltaY += cy[1] - i.cury[1];
        if (towards < 0) { i.deltaX = -i.deltaX; i.deltaY = -i.deltaY; }
        if (i.deltaX < 0) i.orient |= 4;
        else i.orient = 0;
      }
      bresenhams(i, (towards < 0 ? -towards : towards) * speed, mvx, mvy);
    } else {
      if (i.curx[0] == i.targetX && i.cury[0] == i.targetY) {
        if (random(2)) i.targetX = (i.targetX + random(7) + 5) % MLEN;
        else {
          i.targetX -= random(7) + 5;
          if (i.targetX < 0) i.targetX += MLEN;
        }
        if (random(2)) i.targetY = (i.targetY + random(7) + 5) % MWID;
        else {
          i.targetY -= random(7) + 5;
          if (i.targetY < 0) i.targetY += MWID;
        }
        distToPlace(i, i.targetX, i.targetY);
        i.offl = 0;
        i.offs = 0;
      }
      bresenhams(i, (towards >> 6) * speed, mvx, mvy);
    }

    // `thru` means "stops on solid"; a monster the character fired dies on a wall.
    if (mon::thru(mo)) {
      // minfo::ChkWalls: the dominant axis first; temp carries over between the two checks.
      int tx = i.curx[0], ty = i.cury[0];
      bool blocked = false;
      auto solidAt = [&](int x, int y) { return attr(blkmap[mapBlock(x, y)]).solid; };
      auto horiz = [&]() {
        int chk, flag;
        if (i.curx[1] + mvx < 0) { tx--; chk = SOLRIG; flag = 1; }
        else { tx++; chk = SOLLEF; flag = 3; }
        mon::wrapXY(tx, ty);
        int walls = solidAt(tx, ty);
        if (i.cury[1] + mvy > BLEN / 4) walls |= solidAt(tx, (ty + 1) % MWID);
        if (i.cury[1] + mvy < -BLEN / 4) walls |= solidAt(tx, (ty - 1 + MWID) % MWID);
        if (walls & chk) {
          mvx = -i.curx[1];
          tx += flag == 1 ? 1 : -1;
          return true;
        }
        return false;
      };
      auto vert = [&]() {
        int chk, flag;
        if (i.cury[1] + mvy < 0) { ty--; chk = SOLBOT; flag = 1; }
        else { ty++; chk = SOLTOP; flag = 3; }
        mon::wrapXY(tx, ty);
        int walls = solidAt(tx, ty);
        if (i.curx[1] + mvx > BLEN / 4) walls |= solidAt((tx + 1) % MLEN, ty);
        if (i.curx[1] + mvx < -BLEN / 4) walls |= solidAt((tx - 1 + MLEN) % MLEN, ty);
        if (walls & chk) {
          mvy = -i.cury[1];
          ty += flag == 1 ? 1 : -1;
          return true;
        }
        return false;
      };
      int amx = mvx < 0 ? -mvx : mvx, amy = mvy < 0 ? -mvy : mvy;
      if (amx > amy) {
        blocked = horiz() || blocked;
        if (mvy) blocked = vert() || blocked;
      } else {
        if (mvy) blocked = vert() || blocked;
        if (mvx) blocked = horiz() || blocked;
      }
      if (blocked && i.fromchar > 0 && killMon(m)) continue;
    }

    if (mvx == 0 && mvy == 0) {
      i.targetX = i.curx[0];
      i.targetY = i.cury[0];
    } else {
      i.curx[1] += mvx;
      i.cury[1] += mvy;
    }

    {
      int idx = i.cury[0] * MLEN + i.curx[0];
      if (idx >= 0 && idx < MLEN * MWID && mapMon[idx] == m) mapMon[idx] = LASTMM;
    }

    while (i.curx[1] >= BLEN) { i.curx[1] -= BLEN; i.curx[0]++; }
    while (i.curx[1] < 0) { i.curx[1] += BLEN; i.curx[0]--; }
    while (i.cury[1] >= BLEN) { i.cury[1] -= BLEN; i.cury[0]++; }
    while (i.cury[1] < 0) { i.cury[1] += BLEN; i.cury[0]--; }
    if (i.curx[0] < 0) i.curx[0] += MLEN;
    if (i.cury[0] < 0) i.cury[0] += MWID;
    if (i.curx[0] >= MLEN) i.curx[0] -= MLEN;
    if (i.cury[0] >= MWID) i.cury[0] -= MWID;

    // calcDraw
    {
      int rx = i.curx[0] - mx;
      if (mx > i.curx[0]) rx += MLEN;
      rx = rx * BLEN - sc.nx;
      int ry = i.cury[0] - my;
      if (my > i.cury[0]) ry += MWID;
      ry = ry * BLEN - sc.ny;
      if (rx >= 1 && ry >= 1 && rx <= SIZEX - BLEN && ry <= SIZEY - BLEN) {
        i.scrX = rx + i.curx[1];
        i.scrY = ry + i.cury[1];
      } else i.scrX = i.scrY = OFFSCRN;
    }

    if (i.curPic >= 0 && i.curPic < LASTSL && chkMonChr(m) && i.fromchar != 1) {
      int p = monPicNum(m);
      int playSnd = doBlockTouchChar(attrOf(mbl, nmbl, p)) - 1;
      const uint8_t* now = monAt(mm[m].monnum);
      if (now && mon::power(now) < CHARPOWER && killMon(m)) {
        if (!playSnd) doSound(KILLSOUND);
        continue;
      }
    }

    int survivor = m;
    int x0 = i.curx[0], y0 = i.cury[0];
    static const int cells[4][3] = {{0, 0, 0}, {1, 0, 1}, {1, 1, 3}, {0, 1, 2}};
    for (auto& c : cells) {
      int idx = (y0 + c[1]) * MLEN + x0 + c[0];
      int other = idx >= 0 && idx < MLEN * MWID ? mapMon[idx] : LASTMM;
      if (other < LASTMM) survivor = doCollision(other, m, c[2]);
    }
    if (survivor < LASTMM) {
      int idx = mi[survivor].cury[0] * MLEN + mi[survivor].curx[0];
      if (idx >= 0 && idx < MLEN * MWID) mapMon[idx] = (uint8_t)survivor;
    }
    if (mon::end(mo) > 0 && (int64_t)i.birthTime + mon::end(mo) <= (int64_t)clock) killMon(m);
  }
}

// The monsters to draw this frame (render.ts renderWorld): at most MAXMONSSHOWN, in slot order.
inline void World::buildDrawList() {
  ndraw = 0;
  if (noMons) return;
  for (int m = 0; m < LASTMM && ndraw < MAXMONSSHOWN; m++) {
    const MonInfo& i = mi[m];
    if (mm[m].monnum >= LASTMON || i.curPic < 0 || i.curPic >= LASTSL) continue;
    int pic = monPicNum(m);
    if (!(i.scrX >= 1 && i.scrY >= 1 && i.scrX <= SIZEX - BLEN && i.scrY <= SIZEY - BLEN) || pic >= MONBL) continue;
    draw[ndraw++] = {(int16_t)i.scrX, (int16_t)i.scrY, (uint8_t)pic, (uint8_t)i.orient};
  }
}

}  // namespace gm
