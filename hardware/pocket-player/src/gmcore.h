// The Game-Maker play loop for one character on one map, with no Arduino or display code in it, so
// the same file builds for the board and for the Mac test (host/hosttest.cpp). It is a port of the
// parts of web/packages/engine/src/engine (character.ts, keys.ts, touch.ts, scroll.ts, scene.ts,
// render.ts, monsters.ts), which themselves follow code/GM/PLAYGAME.C. Monsters are in gmmon.h (the
// rest of World's member functions). Sounds are events only: doSound queues the number of the effect
// (sndQ) for the board or the Mac test to play; it changes nothing in the play. Not ported: joystick.
// Names follow the TypeScript.
// Game ticks run at 18.2 Hz. Data comes from the game's real files: steps.bbl (blocks), hero.cbl
// (character blocks), hero.chr (sequences) and the .map files.
#pragma once
#include <stdint.h>
#include <string.h>

namespace gm {

constexpr int MLEN = 100, MWID = 100, BLEN = 20, BACKBL = 150, CHARBL = 50, MONBL = 100;
constexpr int MAXSEQ = 20, MAXFRAME = 10, MAXKEYS = 20, INF_REPEAT = 32767;
constexpr int SIZEX = 320, SIZEY = 200, SCRNBLEN = 16, SCRNBWID = 10;
constexpr int MAXGRAV = 11, GRAVSPEED = 1, SCROLLPERMOVE = 6, SCRSPDX = 40, SCRSPDY = 40, OFFSCRN = -100;
constexpr int SOLTOP = 1, SOLRIG = 2, SOLBOT = 4, SOLLEF = 8;
constexpr int HELPSOUND = 0, KILLSOUND = 1, ADDMONEYSOUND = 2, SUBMONEYSOUND = 3, ADDLIFESOUND = 4, ADDSCORESOUND = 5, SUBSCORESOUND = 6, ADDOTHERSOUND = 7,
              SUBOTHERSOUND = 8, LASTSND = 30;
constexpr int IDLESEQ = 0, DIESEQ = 1, HURTSEQ = 2, PICKUPSEQ = 3, DROPSEQ = 4;
constexpr int BLOCK_BYTES = 420, SEQ_BYTES = 185, FRAME_BYTES = 17;
constexpr int MAXINV = 10;
constexpr int MAXLINKS = 24, MAXLEVELS = 128;  // links per level; levels per game (a level's record is read from the .cfg when it is entered, see Assets::readInfo)
constexpr int LASTMM = 200, LASTMON = 64, LASTSL = 20, MAXMARCH = 10, MONSTER_BYTES = 300;
constexpr int ATTACKX = 8, ATTACKY = 5, CHARPOWER = 100, MAXMONSSHOWN = 50, MONMOVESPEED = 1;
constexpr int NORMALMOVEMENT = 0, ATTACKMOVEMENT = 1;

inline int u16(const uint8_t* p) { return p[0] | (p[1] << 8); }
inline int i16(const uint8_t* p) { return (int16_t)(p[0] | (p[1] << 8)); }
inline int wrap16(int v) { return (int16_t)v; }  // the C's 16 bit int
inline int sgn(int v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }

struct Frame { int x, y, orient, pic1, pic2, pause; };

// A block's attribute bytes (after the 400 pixels); see formats/blocks.ts readBlock.
struct Attr {
  int solid, scorePts, chHitPt, nextBl, ntime, touchBl, grav, obj, effect, eamt, birthMon, birthTime;
};

// minfo: one live monster (monsters.ts MonInfo). curx[0]/cury[0] is the map block, [1] the pixel offset.
struct MonInfo {
  int fromchar, deltaX, deltaY, curx[2], cury[2], targetX, targetY, offl, offs, curMarch, curPic, orient;
  int scrX, scrY, dest;
  uint32_t nextAni, nextMove, birthTime;
};
struct MonSlot { uint8_t monnum, curx, cury; };  // mm[]: the monster number of a slot (LASTMON: empty) and where it began
struct MonDraw { int16_t x, y; uint8_t pic, orient; };  // a monster sprite to draw this frame

struct Touch { int bx[6], by[6], num[6]; };

struct Link { int fromX, fromY, toLevel, toX, toY; };  // toLevel -1: the game is won
struct Level {
  int startX, startY;
  int scrollUp = 0xff, scrollDown = 0xff, scrollLeft = 0xff, scrollRight = 0xff;
  int nlinks;
  Link links[MAXLINKS];
};

struct Scroll {
  int nx, ny, totalx, totaly, distx, disty, inMotion, movx, movy, lsx, lsy;
  int bxD, bxC, bxI, byD, byC, byI;
  int maxX, minX, maxY, minY, upStop, downStop, leftStop, rightStop;
  int up, down, left, right;
};

struct KeyEnt { int key, seq, frame; };

// Fills the 10000 block numbers; mons (10000 monster slot numbers, LASTMM = none) and mm (LASTMM x 3 bytes)
// only for a level with monsters (the function returns with *hasMons set).
// Fills one level's record (start, scroll limits, links) from the game's .cfg.
typedef bool (*LevelInfo)(void* user, int level, Level& out);
typedef bool (*MapLoader)(void* user, int level, uint8_t* blocks, uint8_t* mons, uint8_t* mm, bool* hasMons);

struct World {
  // Assets (not owned).
  const uint8_t* bbl = nullptr;  // 150 x 420
  const uint8_t* cbl = nullptr;  // 50 x 420
  const uint8_t* chr = nullptr;  // hero.chr: 20 sequences of 185 bytes, then x, y, cframe, cseq, inv, meters
  const uint8_t* mon = nullptr;  // the .mon file: nmon records of 300 bytes
  const uint8_t* mbl = nullptr;  // monster blocks: nmbl x 420 bytes
  int nmon = 0, nmbl = 0;
  MapLoader loadMap = nullptr;
  void* loadUser = nullptr;
  // The level table is not held: only the level being played (levelAt), read from the .cfg by loadInfo when it changes.
  LevelInfo loadInfo = nullptr;
  void* infoUser = nullptr;
  Level lvl;
  int lvlIdx = -1;
  const Level& levelAt(int n) {
    if (lvlIdx != n) {
      lvl.startX = lvl.startY = lvl.nlinks = 0;
      lvl.scrollUp = lvl.scrollDown = lvl.scrollLeft = lvl.scrollRight = 0xff;
      if (loadInfo) loadInfo(infoUser, n, lvl);
      lvlIdx = n;
    }
    return lvl;
  }
  int nbl = BACKBL;  // blocks the game's .bbl holds (a smaller file than 150 blocks; the rest are empty)
  int nlevels = 0;

  // The scene.
  int level = 0;
  uint8_t map[MLEN * MWID];
  uint8_t blkmap[BACKBL + 1];
  uint32_t nxtchg[BACKBL + 1];
  // Monsters (monsters.ts, world.ts).
  bool noMons = true;
  uint8_t mapMon[MLEN * MWID];  // monster slot per cell
  MonSlot mm[LASTMM];
  MonInfo mi[LASTMM];
  int firstEmptyMM = 0, monsolid = 0, mmSolid = LASTMM;
  int nblkMon = 0, blkMonBl[BACKBL];
  uint32_t blkMonNext[BACKBL];
  uint8_t birthFlag[BACKBL + 1];
  uint32_t seed = 1, rngA = 1;
  int ndraw = 0;
  MonDraw draw[MAXMONSSHOWN];
  uint32_t clock = 1, gclk = 1;
  int mx = 0, my = 0;
  Scroll sc;
  bool doScroll = false;
  uint32_t gen = 0;  // counts changes to the drawn map (a coin gone, an animated block, a new level)
  int prevToX = 0, prevToY = 0;

  // The character: x[0]/y[0] the map block, x[1]/y[1] the pixel offset in it.
  int cx[2], cy[2], cframe = 0, cseq = 0;
  int8_t seqon[MAXSEQ];
  int inv[MAXINV];  // carried object blocks; BACKBL = free slot, BACKBL + 1 = not set up yet
  int meter[30];
  int hitpts = -1, lives = -1, score = 0;
  bool update = false, topthere = false, bottomthere = false;
  int curtop = CHARBL, curbottom = CHARBL;
  int nextx = OFFSCRN, nexty = OFFSCRN, scrx = OFFSCRN, scry = OFFSCRN, oldx = OFFSCRN, oldy = OFFSCRN;
  int netx = 5, nety = 0, gravx = 0, gravy = 0;
  uint32_t nextAni = 0;

  // Keys.
  uint8_t keydn[128];
  KeyEnt keystack[MAXKEYS + 1];
  int keystkptr = 0, curkey = 0;
  bool held[128];
  int pending[16];
  int npending = 0;
  uint32_t ticks = 0;
  bool won = false;
  // Sound events: the .snd table of the level (30 effects of 36 little endian u16 frequencies; null: the level has none)
  // and the effects started since the last takeSound, in order (the last one is the one heard).
  const uint8_t* snd = nullptr;
  uint8_t sndQ[8];
  int nsnd = 0;

  // ---- data access --------------------------------------------------------------------------
  const uint8_t* seqRaw(int s) const { return chr + s * SEQ_BYTES; }
  int seqKey(int s) const { return u16(seqRaw(s) + 170); }
  int seqSound(int s) const { return (int8_t)seqRaw(s)[172]; }
  int seqBloc(int s) const { return seqRaw(s)[174]; }
  int seqGround(int s) const { return (int8_t)seqRaw(s)[175]; }
  int seqNorepeat(int s) const { return (int8_t)seqRaw(s)[178]; }
  int seqMomentum(int s) const { return (int8_t)seqRaw(s)[179]; }

  Attr attr(int b) const { return attrOf(bbl, nbl, b); }
  static Attr attrOf(const uint8_t* base, int n, int b) {
    Attr a;
    if (b < 0 || b >= n) {
      a = {0, 0, 0, b, 0, b, 0, 0, 0, 0, 0, 0};  // the empty block (padBlocks)
      return a;
    }
    const uint8_t* p = base + b * BLOCK_BYTES + 400;
    a.birthMon = p[0];
    a.birthTime = i16(p + 1);
    a.solid = p[5];
    a.scorePts = i16(p + 7);
    a.chHitPt = i16(p + 9);
    a.nextBl = p[11];
    a.ntime = i16(p + 12);
    a.touchBl = p[14];
    a.grav = (int8_t)p[15];
    a.obj = p[16];
    a.effect = p[17];
    a.eamt = i16(p + 18);
    return a;
  }

  // CHRFRAME with the original's out of range behavior: frame -1 reads the 17 bytes before the
  // sequence's first frame, which is the tail of the previous sequence record.
  Frame currentFrame() const {
    Frame f;
    const uint8_t* s = seqRaw(cseq);
    if (cframe >= MAXFRAME) {
      const uint8_t* l = s + (MAXFRAME - 1) * FRAME_BYTES;
      return {i16(l), i16(l + 2), u16(l + 4), u16(l + 6), CHARBL + 1, u16(l + 10)};
    }
    if (cframe < 0 && cseq == 0) return {0, 0, 0, 0, 0, 0};
    const uint8_t* p = s + cframe * FRAME_BYTES;
    f = {i16(p), i16(p + 2), u16(p + 4), u16(p + 6), u16(p + 8), u16(p + 10)};
    return f;
  }

  int mapBlock(int x, int y) const { return map[y * MLEN + x]; }
  int shown(int b) const { return blkmap[b]; }

  // ---- keys (keys.ts) -----------------------------------------------------------------------
  void cleanKeyStack() {
    int to = 0;
    for (int from = 0; from < keystkptr; from++)
      if (keystack[from].key != 0xff) keystack[to++] = keystack[from];
    keystkptr = to;
  }
  void pushKey() {
    if (keystkptr >= MAXKEYS + 1) cleanKeyStack();
    if (keystkptr >= MAXKEYS + 1) keystkptr = MAXKEYS;
    keystack[keystkptr] = {curkey, cseq, cframe};
    keystkptr++;
  }
  void popKey(int key) {
    for (int i = 0; i < keystkptr; i++)
      if (keystack[i].key == key) keystack[i].key = 0xff;
    while (keystkptr > 0 && keystack[keystkptr - 1].key == 0xff) keystkptr--;
    if (keystkptr == 0) {
      curkey = 0;
      cseq = IDLESEQ;
      cframe = 0;
    } else {
      KeyEnt top = keystack[keystkptr - 1];
      curkey = top.key;
      cseq = top.seq;
      cframe = top.frame;
      keystkptr--;
      if (cseq == IDLESEQ) cframe = 0;
    }
    update = true;
    nextAni = clock;
  }
  void simKeyPress(int key) {
    if (key < 0x80) {
      if (keydn[key] == 0) {
        for (int loop = 0; loop < MAXSEQ; loop++) {
          if ((seqKey(loop) >> 8) != key) continue;
          if (cseq != DIESEQ && !seqGround(cseq) && meter[loop] > 0 && seqon[loop] && keystkptr < MAXKEYS) {
            keystack[keystkptr] = {curkey, cseq, cframe};
            keystkptr++;
            if (keystkptr >= MAXKEYS) cleanKeyStack();
            cseq = loop;
            cframe = -1;
            nextAni = clock;
            curkey = key;
            break;
          }
        }
        keydn[key] = 1;
      }
      return;
    }
    key &= 127;
    if (keydn[key] == 0) return;
    keydn[key] = 0;
    for (int i = 0; i < keystkptr; i++)
      if (keystack[i].key == key) keystack[i].key = 0xff;
    if (key == curkey && keystkptr > 0 && !seqGround(cseq)) {
      while (keystkptr > 0 && keystack[keystkptr - 1].key == 0xff) keystkptr--;
      KeyEnt top = keystack[keystkptr > 0 ? keystkptr - 1 : 0];
      curkey = top.key;
      cseq = top.seq;
      cframe = top.frame;
      update = true;
      nextAni = clock;
      keystkptr = keystkptr > 0 ? keystkptr - 1 : 0;
    }
    if (cseq == IDLESEQ) cframe = 0;
  }
  void resetKeys() {
    memset(keydn, 0, sizeof keydn);
    for (auto& k : keystack) k = {0xff, 0, 0};
    keystkptr = 0;
    curkey = 0;
  }

  // ---- touch (touch.ts) ---------------------------------------------------------------------
  Touch getTouch() const {
    Touch t;
    for (int i = 0; i < 6; i++) { t.bx[i] = MLEN; t.by[i] = MWID; t.num[i] = BACKBL; }
    auto cell = [&](int i, int x, int y) { t.bx[i] = x; t.by[i] = y; t.num[i] = blkmap[mapBlock(x, y)]; };
    int x0 = cx[0], y0 = cy[0];
    if (topthere) {
      int top = y0 - 1 < 0 ? y0 - 1 + MWID : y0 - 1;
      cell(0, x0, top);
      if (cx[1] > 0) cell(1, (x0 + 1) % MLEN, top);
    }
    cell(2, x0, y0);
    if (cx[1] > 0) cell(3, (x0 + 1) % MLEN, y0);
    if (cy[1] > 0) cell(4, x0, (y0 + 1) % MWID);
    if (cx[1] > 0 && cy[1] > 0) cell(5, (x0 + 1) % MLEN, (y0 + 1) % MWID);
    return t;
  }

  // onscrn: is map cell (x, y) inside the screen bounds.
  bool onscrn(int x, int y) const {
    int rx = x - mx;
    if (mx > x) rx += MLEN;
    rx = rx * BLEN - sc.nx;
    int ry = y - my;
    if (my > y) ry += MWID;
    ry = ry * BLEN - sc.ny;
    return rx >= 1 && ry >= 1 && rx <= SIZEX - BLEN && ry <= SIZEY - BLEN;
  }

  // DoSound: queues effect n (false when n is out of range or the level has no .snd, as the engine's play()).
  bool doSound(int n) {
    if (n < 0 || n >= LASTSND || !snd) return false;
    if (nsnd < 8) sndQ[nsnd++] = (uint8_t)n;
    return true;
  }
  // DoBlockTouchChar. 0: refused (a counter is empty), 1: done, 2: done and an effect started.
  int doBlockTouchChar(const Attr& b) {
    bool snded = false;
    if ((b.effect >= 20 || b.effect == 3) && meter[b.effect] + b.eamt <= 0) return 0;
    if (cseq != DIESEQ) {
      if (b.chHitPt <= 0) hitpts = wrap16(hitpts + b.chHitPt);
      else if ((uint16_t)(hitpts + b.chHitPt) < INF_REPEAT) hitpts = wrap16(hitpts + b.chHitPt);
      else hitpts = INF_REPEAT - 1;
      if (b.chHitPt > 0) snded = doSound(HELPSOUND);
      else if (b.chHitPt < 0 && cseq != HURTSEQ) {
        pushKey();
        nextAni = clock;
        cseq = HURTSEQ;
        cframe = -1;
        curkey = 0xff;
        if (seqSound(HURTSEQ) >= 0 && seqSound(HURTSEQ) < LASTSND) snded = doSound(seqSound(HURTSEQ));
      }
      if (hitpts <= 0) {
        nextAni = clock;
        cseq = DIESEQ;
        cframe = -1;
        curkey = 0;
      }
    }
    if (b.effect == 1) {
      if (b.eamt > 0) snded = doSound(ADDLIFESOUND);
      lives = wrap16(lives + b.eamt);
    }
    if (b.effect > 2 && meter[b.effect] != INF_REPEAT && b.effect < 30) {
      if (!snded) {
        if (b.effect == 3) {
          if (b.eamt > 0) snded = doSound(ADDMONEYSOUND);
          else if (b.eamt < 0) snded = doSound(SUBMONEYSOUND);
        } else if (b.eamt > 0) snded = doSound(ADDOTHERSOUND);
        else if (b.eamt < 0) snded = doSound(SUBOTHERSOUND);
      }
      int m = meter[b.effect];
      if ((uint16_t)(m + b.eamt) < INF_REPEAT) {
        if (m + b.eamt < -1 * (INF_REPEAT - 128)) meter[b.effect] = -1 * (INF_REPEAT - 128);
        else meter[b.effect] = wrap16(m + b.eamt);
      } else meter[b.effect] = INF_REPEAT - 1;
    }
    score += b.scorePts;
    if (!snded) {
      if (b.scorePts > 0) snded = doSound(ADDSCORESOUND);
      else if (b.scorePts < 0) snded = doSound(SUBSCORESOUND);
    }
    return snded ? 2 : 1;
  }

  // checkseq_fortie: turns on/off every sequence tied to `block`.
  void checkSeqForTie(int block, bool setting) {
    for (int i = 0; i < MAXSEQ; i++) if (seqBloc(i) == block) seqon[i] = setting;
  }
  // really_checktouch for one cell: false when refused (a counter is empty).
  bool reallyCheckTouch(int x, int y, int bnum) {
    if (x == MLEN) return true;
    Attr b = attr(bnum);
    if (!doBlockTouchChar(b)) return false;
    if (bnum != b.touchBl && onscrn(x, y)) { map[y * MLEN + x] = (uint8_t)b.touchBl; gen++; }
    return true;
  }
  // PickupBloc: takes the first touched object block whose touch isn't refused into the next free slot.
  bool pickupBlock() {
    if (inv[MAXINV - 1] != BACKBL) return false;
    int spot = 0;
    while (spot < MAXINV && inv[spot] != BACKBL) spot++;
    Touch t = getTouch();
    for (int j = 0; j < 6; j++) {
      if (t.bx[j] == MLEN || !attr(t.num[j]).obj) continue;
      if (reallyCheckTouch(t.bx[j], t.by[j], t.num[j])) {
        inv[spot] = t.num[j];
        checkSeqForTie(t.num[j], true);
        return true;
      }
    }
    return false;
  }
  // DropBloc: puts the carried block in place `dropSlot` (chosen on the picker; -1 = Esc) at the character's
  // cell and closes the gap. Returns true when something was dropped.
  int dropSlot = -1;
  bool dropBlock() {
    topthere = false;
    bottomthere = false;
    int chosen = dropSlot;
    dropSlot = -1;
    bool dropped = false;
    if (chosen >= 0 && chosen < MAXINV && inv[chosen] != BACKBL) {
      map[cy[0] * MLEN + cx[0]] = (uint8_t)inv[chosen];
      gen++;
      checkSeqForTie(inv[chosen], false);
      for (int i = chosen; i < MAXINV - 1; i++) inv[i] = inv[i + 1];
      inv[MAXINV - 1] = BACKBL;
      dropped = true;
    }
    keydn[seqKey(DROPSEQ) >> 8] = 0;
    return dropped;
  }

  void checkTouch() {
    Touch t = getTouch();
    for (int l = 0; l < 6; l++) {
      Attr b = attr(t.num[l]);
      if (b.obj) continue;
      if (t.bx[l] == MLEN) continue;
      if (!doBlockTouchChar(b)) continue;
      if (t.num[l] != b.touchBl && onscrn(t.bx[l], t.by[l])) { map[t.by[l] * MLEN + t.bx[l]] = (uint8_t)b.touchBl; gen++; }
    }
  }

  // ---- solids (character.ts chk*) -----------------------------------------------------------
  int sol(int n) const { return n >= BACKBL ? 0 : attr(n).solid; }

  int chkLefts(const Touch& t) {
    int spots[4] = {0, 0, 0, 0};
    int twohigh = t.bx[0] != MLEN ? 0 : 2;
    if (t.num[twohigh + 1] != BACKBL) spots[1] |= sol(t.num[twohigh + 1]) & SOLBOT;
    spots[0] |= sol(t.num[twohigh]) & SOLRIG;
    if (twohigh == 0) spots[0] |= sol(t.num[2]) & SOLRIG;
    if (t.num[4] != BACKBL) {
      if (t.num[5] != BACKBL) spots[3] |= sol(t.num[5]) & SOLTOP;
      if (!(spots[3] & SOLTOP)) spots[2] |= sol(t.num[4]) & SOLRIG;
    }
    if ((spots[0] & SOLRIG) && !(spots[2] & SOLRIG) && cy[1] > (BLEN * 2) / 4) cy[1] = BLEN;
    if (!(spots[0] & SOLRIG) && (spots[2] & SOLRIG) && cy[1] < BLEN / 2) cy[1] = 0;
    return ((spots[0] & SOLRIG) || (spots[2] & SOLRIG)) ? SOLLEF : 0;
  }
  int chkRights(const Touch& t) {
    int spots[4] = {0, 0, 0, 0};
    int twohigh = t.bx[0] != MLEN ? 0 : 2;
    if (t.num[twohigh + 1] != BACKBL) {
      if (t.num[twohigh] != BACKBL) spots[0] |= sol(t.num[twohigh]) & SOLBOT;
      if (!(spots[0] & SOLBOT)) spots[1] |= sol(t.num[twohigh + 1]) & SOLLEF;
    }
    if (twohigh == 0) spots[1] |= sol(t.num[3]) & SOLLEF;
    if (t.num[5] != BACKBL) {
      if (t.num[4] != BACKBL) spots[2] |= sol(t.num[4]) & SOLTOP;
      if (!(spots[2] & SOLTOP)) spots[3] |= sol(t.num[5]) & SOLLEF;
    }
    if ((spots[1] & SOLLEF) && !(spots[3] & SOLLEF) && cy[1] > (BLEN * 2) / 4) cy[1] = BLEN;
    if (!(spots[1] & SOLLEF) && (spots[3] & SOLLEF) && cy[1] < BLEN / 2) cy[1] = 0;
    return ((spots[1] & SOLLEF) || (spots[3] & SOLLEF)) ? SOLRIG : 0;
  }
  int chkUps(const Touch& t) {
    int spots[4] = {0, 0, 0, 0};
    int twohigh = t.bx[0] != MLEN ? 0 : 2;
    if (t.num[twohigh] != BACKBL) {
      if (t.num[4] != BACKBL) spots[2] |= sol(t.num[4]) & SOLRIG;
      if (!(spots[2] & SOLRIG)) spots[0] |= sol(t.num[twohigh]) & SOLBOT;
    }
    if (t.num[twohigh + 1] != BACKBL) {
      if (t.num[5] != BACKBL) spots[3] |= sol(t.num[5]) & SOLLEF;
      if (!(spots[3] & SOLLEF)) spots[1] |= sol(t.num[twohigh + 1]) & SOLBOT;
    }
    if ((spots[0] & SOLBOT) && !(spots[1] & SOLBOT) && cx[1] > (BLEN * 2) / 4) cx[1] = BLEN;
    if (!(spots[0] & SOLBOT) && (spots[1] & SOLBOT) && cx[1] < BLEN / 2) cx[1] = 0;
    return ((spots[0] & SOLBOT) || (spots[1] & SOLBOT)) ? SOLTOP : 0;
  }
  int chkDowns(const Touch& t) {
    int spots[4] = {0, 0, 0, 0};
    int twohigh = t.bx[0] != MLEN ? 0 : 2;
    if (t.num[4] != BACKBL) {
      spots[2] |= sol(t.num[4]) & SOLRIG;
      if (t.num[twohigh] != BACKBL) spots[0] |= sol(t.num[twohigh]) & SOLRIG;
      if (!((spots[2] & SOLRIG) && (spots[0] & SOLRIG))) spots[2] |= sol(t.num[4]) & SOLTOP;
    }
    if (t.num[5] != BACKBL) {
      if (t.num[twohigh + 1] != BACKBL) spots[1] |= sol(t.num[twohigh + 1]) & SOLLEF;
      spots[3] |= sol(t.num[5]) & SOLLEF;
      // The TypeScript port keeps the C's `a & b & c & d` here: a bit test of both sides' LEFT bits.
      if (!(spots[1] & SOLLEF & spots[3] & SOLLEF)) spots[3] |= sol(t.num[5]) & SOLTOP;
    }
    if ((spots[2] & SOLTOP) && !(spots[3] & SOLTOP) && cx[1] > (BLEN * 2) / 4) cx[1] = BLEN;
    if (!(spots[2] & SOLTOP) && (spots[3] & SOLTOP) && cx[1] < BLEN / 2) cx[1] = 0;
    return ((spots[2] & SOLTOP) || (spots[3] & SOLTOP)) ? SOLBOT : 0;
  }
  int chkSolids(int dx, int dy, const Touch& t) {
    int r = 0;
    if (dy > 0) r = chkDowns(t);
    if (dy < 0) r = chkUps(t);
    if (dx > 0) r |= chkRights(t);
    if (dx < 0) r |= chkLefts(t);
    return r;
  }

  void normalizeChr() {
    while (cx[1] < 0) { cx[1] += BLEN; cx[0]--; }
    while (cx[1] >= BLEN) { cx[1] -= BLEN; cx[0]++; }
    while (cy[1] < 0) { cy[1] += BLEN; cy[0]--; }
    while (cy[1] >= BLEN) { cy[1] -= BLEN; cy[0]++; }
  }
  void chkMapBounds() {
    if (cx[0] >= MLEN) cx[0] -= MLEN;
    if (cx[0] < 0) cx[0] += MLEN;
    if (cy[0] >= MWID) cy[0] -= MWID;
    if (cy[0] < 0) cy[0] += MWID;
  }
  static int nearest(int from, int to, int size) {
    int t0 = from - to;
    int t1 = t0 > 0 ? -(size - from + to) : size - to + from;
    return (t1 < 0 ? -t1 : t1) > (t0 < 0 ? -t0 : t0) ? t0 : t1;
  }
  void chkScrnBounds(int& dtx, int& dty) {
    int tmx = -nearest(mx, cx[0], MLEN);
    int tmy = -nearest(my, cy[0], MWID);
    if (dtx < 0) {
      if (tmx < 2 && cx[1] <= (dtx < 0 ? -dtx : dtx)) dtx = -cx[1];
      if (tmx < 1) dtx = 0;
    }
    if (tmx > SCRNBLEN - 2 && dtx > 0) dtx = 0;
    if (dty < 0) {
      if (tmy < 2 && cy[1] <= (dty < 0 ? -dty : dty)) dty = -cy[1];
      if (tmy < 1) dty = 0;
    }
    if (tmy > SCRNBWID - 2 && dty > 0) dty = 0;
  }

  int gravityBlock() const {
    int y = cy[0] + (cy[1] > BLEN / 2 ? 1 : 0);
    int x = cx[0] + (cx[1] > BLEN / 2 ? 1 : 0);
    if (y >= MWID) y -= MWID;
    if (x >= MLEN) x -= MLEN;
    return attr(blkmap[mapBlock(x, y)]).grav;
  }
  void onGround(int s) {
    int gravdir = gravityBlock();
    if (((monsolid & SOLBOT) || (s & SOLBOT)) && gravy > 0) gravy = 0;
    if (((monsolid & SOLTOP) || (s & SOLTOP)) && gravy < 0) gravy = 0;
    if (((monsolid & SOLRIG) || (s & SOLRIG)) && gravx > 0) gravx = 0;
    if (((monsolid & SOLLEF) || (s & SOLLEF)) && gravx < 0) gravx = 0;
    if (!seqMomentum(cseq)) {
      if (!(gravdir & SOLBOT || gravdir & SOLTOP)) gravy = gravy * 5 / 6;
      if (!(gravdir & SOLLEF || gravdir & SOLRIG)) gravx = gravx * 5 / 6;
    }
  }
  bool moveCharGrav() {
    if (clock < gclk + GRAVSPEED) return false;
    gclk = clock;
    int g = gravityBlock();
    if (g & 4) gravy += 1;
    if (g & 1) gravy -= 1;
    if (g & 2) gravx += 1;
    if (g & 8) gravx -= 1;
    bool moved = gravx != 0 || gravy != 0;
    int lim = MAXGRAV * 4;
    gravx = gravx > lim ? lim : gravx < -lim ? -lim : gravx;
    gravy = gravy > lim ? lim : gravy < -lim ? -lim : gravy;
    return moved;
  }

  void updateCharScreenPos() {
    int tx = mx < cx[0] ? (cx[0] - mx) * BLEN : (MLEN + (cx[0] - mx)) * BLEN;
    tx += cx[1];
    nextx = tx - sc.nx;
    int ty = my < cy[0] ? (cy[0] - my) * BLEN : (MWID + (cy[0] - my)) * BLEN;
    ty += cy[1];
    nexty = ty - sc.ny;
  }

  // moveChars: one tick of sequence animation and movement. Returns true when the character died.
  bool moveChars() {
    int tx = 0, ty = 0;
    bool charmoved = false;
    int zeroBefore = 0;
    scrx = nextx;
    scry = nexty;
    bool gravmoved = moveCharGrav();

    if (clock >= nextAni) {
      int oldframe = cframe, oldseq = cseq;
      if (cframe == -1) {
        if (meter[cseq] < INF_REPEAT && cseq > 4) meter[cseq]--;
        if ((cseq == DROPSEQ && !dropBlock()) || (cseq == PICKUPSEQ && !pickupBlock())) {  // nothing happened: back to idle
          cseq = IDLESEQ;
          keystkptr = 0;
          curkey = 0;
        }
        if (seqSound(cseq) >= 0 && seqSound(cseq) < LASTSND) doSound(seqSound(cseq));
      }
      int guard = 0;
      do {
        if (cframe == 0) zeroBefore++;
        cframe++;
        while ((currentFrame().pic2 == CHARBL + 1 || cframe >= MAXFRAME) && guard++ < 1000) {
          if (cseq == DIESEQ) {
            cframe--;
            return true;
          }
          if ((meter[cseq] <= 0 && cseq > 4) || cseq == HURTSEQ || cseq == DROPSEQ || cseq == PICKUPSEQ ||
              seqNorepeat(cseq) || keydn[seqKey(cseq) >> 8] == 0 || zeroBefore > 1) {
            popKey(curkey);
            zeroBefore = 0;
          } else {
            cframe = 0;
            if (meter[cseq] < INF_REPEAT && cseq > 4) meter[cseq]--;
            if (u16(seqRaw(cseq) + 8) == CHARBL + 1) {  // frame 0's pic2: an empty sequence
              // `s.frames[0].pic2 = 0` for idle writes into the data, as the C did.
              if (cseq == IDLESEQ) ((uint8_t*)seqRaw(cseq))[8] = 0, ((uint8_t*)seqRaw(cseq))[9] = 0;
              else popKey(curkey);
              zeroBefore = 0;
            }
          }
        }
        Frame f = currentFrame();
        nextAni = clock + f.pause;
        if (f.pic2 == MONBL && !noMons) {  // a frame that fires a monster (a shot, a bomb...)
          charBirthMon(cx[0], cy[0] + f.y / BLEN - 1, f.pic1);
          ty = 0;
        } else {
        curtop = f.pic1;
        curbottom = f.pic2;
        if (seqMomentum(cseq)) {
          gravx += f.x;
          gravy += f.y;
          if (f.x != 0 || f.y != 0) { netx = f.x; nety = f.y; }
          tx = 0;
          ty = 0;
        } else {
          tx = f.x;
          ty = f.y;
          if (tx != 0 || ty != 0) { charmoved = true; netx = tx; nety = ty; }
        }
        }
      } while (currentFrame().pic2 > CHARBL && guard++ < 1000);
      if (cseq != oldseq || cframe != oldframe) update = true;
    }

    tx += gravx;
    ty += gravy;

    if (charmoved || gravmoved || monsolid || update) {
      int ocx = cx[1], ocy = cy[1], ox = cx[0], oy = cy[0];
      int dtx = tx > MAXGRAV ? MAXGRAV : tx < -MAXGRAV ? -MAXGRAV : tx;
      int dty = ty > MAXGRAV ? MAXGRAV : ty < -MAXGRAV ? -MAXGRAV : ty;
      chkScrnBounds(dtx, dty);
      tx = dtx;
      ty = dty;

      cx[1] += tx;
      cy[1] += ty;
      normalizeChr();
      chkMapBounds();
      checkTouch();
      cx[1] = ocx;
      cy[1] = ocy;
      cx[0] = ox;
      cy[0] = oy;

      // A solid monster pushing from one side (chkMonChr set monsolid) puts the character in the cell next to it.
      if (!noMons && mmSolid < LASTMM) {
        const MonInfo& m = mi[mmSolid];
        if ((monsolid & SOLRIG) && !(monsolid & SOLLEF)) { cx[1] = m.curx[1]; cx[0] = m.curx[0] - 1; tx = 0; }
        if ((monsolid & SOLLEF) && !(monsolid & SOLRIG)) { cx[1] = m.curx[1]; cx[0] = m.curx[0] + 1; tx = 0; }
        if ((monsolid & SOLTOP) && !(monsolid & SOLBOT)) { cy[1] = m.cury[1]; cy[0] = m.cury[0] + 1; ty = 0; }
        if ((monsolid & SOLBOT) && !(monsolid & SOLTOP)) { cy[1] = m.cury[1]; cy[0] = m.cury[0] - 1; ty = 0; }
      }

      cx[1] += tx;
      normalizeChr();
      chkMapBounds();
      int r = chkSolids(tx, 0, getTouch());
      onGround(r);
      if (r & SOLRIG) cx[1] = 0;
      if (r & SOLLEF) { cx[0]++; cx[1] = 0; }

      cy[1] += ty;
      while (cy[1] < 0) { cy[1] += BLEN; cy[0]--; }
      while (cy[1] >= BLEN) { cy[1] -= BLEN; cy[0]++; }
      chkMapBounds();
      r = chkSolids(0, ty, getTouch());
      onGround(r);
      if (r & SOLBOT) cy[1] = 0;
      if (r & SOLTOP) { cy[0]++; cy[1] = 0; }
      updateCharScreenPos();
    }
    return false;
  }

  void changeBlocks() {
    for (int lp = 0; lp < BACKBL; lp++) {
      int tmap = blkmap[lp];
      Attr b = attr(tmap);
      if (nxtchg[lp] <= clock && b.nextBl != tmap) {
        blkmap[lp] = (uint8_t)b.nextBl;
        gen++;
        nxtchg[lp] = b.ntime <= 0 ? 0 : nxtchg[lp] + attr(blkmap[lp]).ntime;
      }
    }
  }

  void updateCharDrawState() {
    update = false;
    if (scrx > OFFSCRN) {
      oldx = scrx;
      oldy = scry;
      topthere = curtop < CHARBL;
      bottomthere = curbottom < CHARBL;
    }
  }

  // ---- scroll (scroll.ts) -------------------------------------------------------------------
  static int dosSpeed(int dist, int spd, int span, bool negate = false) {
    int p = wrap16(wrap16(dist) * spd);
    if (negate) p = wrap16(-p);
    return wrap16(p / wrap16(span));  // C division truncates toward zero, as Math.trunc does
  }
  void initScroll(int up, int down, int left, int right) {
    memset(&sc, 0, sizeof sc);
    sc.up = down;
    sc.down = up;
    sc.left = right;
    sc.right = left;
    sc.maxX = SIZEX / 3;
    sc.minX = -SIZEX / 3;
    sc.maxY = 60;
    sc.minY = -60;
    sc.upStop = -SIZEY / 6;
    sc.downStop = SIZEY / 6;
    sc.leftStop = -SIZEX / 4;
    sc.rightStop = SIZEX / 4;
  }
  int changeScroll() {
    sc.totalx = sc.totaly = 0;
    int tmx = nextx + BLEN / 2 - SIZEX / 2;
    int tmy = nexty + BLEN / 2 - SIZEY / 2;
    sc.distx = tmx;
    sc.disty = tmy;
    if (sc.left == 0xff && tmx > sc.maxX) sc.inMotion |= SOLLEF;
    if (sc.right == 0xff && tmx < sc.minX) sc.inMotion |= SOLRIG;
    if (sc.up == 0xff && tmy > sc.maxY) sc.inMotion |= SOLTOP;
    if (sc.down == 0xff && tmy < sc.minY) sc.inMotion |= SOLBOT;
    if (sc.inMotion & SOLLEF) {
      if (tmx < sc.leftStop) sc.inMotion &= ~SOLLEF;
      else sc.totalx = dosSpeed(tmx - sc.leftStop, SCRSPDX, sc.maxX - sc.leftStop);
    }
    if (sc.inMotion & SOLRIG) {
      if (tmx > sc.rightStop) sc.inMotion &= ~SOLRIG;
      else sc.totalx = dosSpeed(-tmx + sc.rightStop, SCRSPDX, sc.rightStop - sc.minX, true);
    }
    if (sc.inMotion & SOLTOP) {
      if (tmy < sc.upStop) sc.inMotion &= ~SOLTOP;
      else sc.totaly = dosSpeed(tmy - sc.upStop, SCRSPDY, sc.maxY - sc.upStop);
    }
    if (sc.inMotion & SOLBOT) {
      if (tmy > sc.downStop) sc.inMotion &= ~SOLBOT;
      else sc.totaly = dosSpeed(-tmy + sc.downStop, SCRSPDY, sc.downStop - sc.minY, true);
    }
    sc.totalx = sc.totalx > 28 ? 28 : sc.totalx < -28 ? -28 : sc.totalx;
    sc.totaly = sc.totaly > 28 ? 28 : sc.totaly < -28 ? -28 : sc.totaly;
    sc.bxD = sc.totalx; sc.bxC = 0; sc.bxI = SCROLLPERMOVE;
    sc.byD = sc.totaly; sc.byC = 0; sc.byI = SCROLLPERMOVE;
    return sc.inMotion;
  }
  static int bresenham(int& dscroll, int& ctr, int& iters) {
    int amt = 0;
    int a = dscroll < 0 ? -dscroll : dscroll;
    if (a > iters) {
      while (ctr < a) { amt += sgn(dscroll); ctr += iters; }
      ctr -= a;
    } else {
      ctr += a;
      if (ctr >= iters) { ctr -= iters; amt += sgn(dscroll); }
    }
    return amt;
  }
  // ShiftEverything: the monsters' and the character's screen positions follow the scrolled map.
  bool shiftEverything(int shx, int shy) {
    bool moveChar = false;
    for (int l = 0; l < LASTMM; l++) {
      if (mm[l].monnum >= LASTMON || mi[l].scrX == OFFSCRN) continue;
      mi[l].scrX += shx;
      mi[l].scrY += shy;
    }
    if (nexty - oldy == 0 || sgn(shy) == sgn(nexty - oldy)) {
      if (scry != OFFSCRN) scry += shy;
    } else {
      moveChar = true;
      int d = nexty - oldy;
      if ((d < 0 ? -d : d) < 4) scry += d + shy;
    }
    if (nextx - oldx == 0 || sgn(shx) == sgn(nextx - oldx)) {
      if (scrx != OFFSCRN) scrx += shx;
    } else {
      moveChar = true;
      int d = nextx - oldx;
      if ((d < 0 ? -d : d) < 4) scrx += d + shx;
    }
    if (nextx != OFFSCRN) { nextx += shx; nexty += shy; }
    if (oldx != OFFSCRN) { oldx += shx; oldy += shy; }
    return moveChar;
  }
  void drawScroll() {
    sc.movx += bresenham(sc.bxD, sc.bxC, sc.bxI);
    sc.movy += bresenham(sc.byD, sc.byC, sc.byI);
    int shx = 0, shy = 0;
    if (sc.movx < 0) {
      while (sc.movx < 0) { shx += 4; sc.movx += 4; sc.nx -= 4; }
    } else if (sc.movx > 0) {
      while (sc.movx > 3) { shx -= 4; sc.movx -= 4; sc.nx += 4; }
    }
    if (sc.movy < 0) {
      while (sc.movy < 0) { shy += 4; sc.movy += 4; sc.ny -= 4; }
    } else if (sc.movy > 0) {
      while (sc.movy > 3) { shy -= 4; sc.movy -= 4; sc.ny += 4; }
    }
    sc.lsx = sc.movx & 3;
    sc.lsy = sc.movy & 3;
    if (sc.nx >= BLEN) { sc.nx -= BLEN; mx = (mx + 1) % MLEN; }
    if (sc.ny >= BLEN) { sc.ny -= BLEN; my = (my + 1) % MWID; }
    if (sc.nx < 0) { sc.nx += BLEN; mx = (mx - 1 + MLEN) % MLEN; }
    if (sc.ny < 0) { sc.ny += BLEN; my = (my - 1 + MWID) % MWID; }
    bool moveChar = (shx || shy) ? shiftEverything(shx, shy) : false;
    if (moveChar || sc.lsx || sc.lsy) updateCharDrawState();
  }

  // ---- monsters (gmmon.h; monsters.ts) -------------------------------------------------------
  int random(int n) {  // the walkthrough runtime's mulberry32, floor(next() * n)
    rngA += 0x6d2b79f5u;
    uint32_t t = rngA;
    t = (t ^ (t >> 15)) * (t | 1);
    t ^= t + (t ^ (t >> 7)) * (t | 61);
    uint32_t r = t ^ (t >> 14);
    return (int)(((uint64_t)r * (uint64_t)n) >> 32);
  }
  const uint8_t* monAt(int n) const { return n >= 0 && n < nmon && mon ? mon + n * MONSTER_BYTES : nullptr; }
  void resetMonInfo(int m);
  int monPicNum(int m) const;
  int birthMon(int m, int monNum, int x, int y);
  bool killMon(int m);
  void blockBirthMonsters();
  void charBirthMon(int x, int y, int monNum);
  bool monEndPath(int m, const uint8_t* mo);
  bool chkMonChr(int m);
  int doCollision(int m1, int m2, int where);
  void moveAllMonsters();
  void buildDrawList();

  // ---- scenes (scene.ts, gameSim.ts) --------------------------------------------------------
  void startGame() {
    hitpts = -1;
    lives = -1;
    score = 0;
    for (int& m : meter) m = -1;
    for (int& v : inv) v = BACKBL + 1;
    clock = 1;
    gclk = 1;
    ticks = 0;
    won = false;
    npending = 0;
    memset(held, 0, sizeof held);
  }

  // Enters level `lv` with the character on block (sx, sy): loadscene + StartSceneInits + initScroll.
  bool enterLevel(int lv, int sx, int sy) {
    level = lv;
    gen++;
    bool hasMons = false;
    memset(mapMon, LASTMM, sizeof mapMon);
    for (auto& s : mm) s = {LASTMON, 0, 0};
    uint8_t mmBytes[LASTMM * 3];
    if (!loadMap || !loadMap(loadUser, lv, map, mapMon, mmBytes, &hasMons)) return false;
    noMons = !hasMons;
    if (hasMons)
      for (int l = 0; l < LASTMM; l++) mm[l] = {mmBytes[l * 3], mmBytes[l * 3 + 1], mmBytes[l * 3 + 2]};
    firstEmptyMM = 0; monsolid = 0; mmSolid = LASTMM;
    rngA = seed;
    // A meter of -20000 marks a sequence the previous character did not define.
    if (inv[0] == BACKBL + 1) for (int i = 0; i < MAXINV; i++) inv[i] = chr[3714 + i];
    for (int i = 0; i < MAXSEQ; i++) {
      seqon[i] = seqBloc(i) == BACKBL;
      if (meter[i] == -20000) meter[i] = i16(chr + 3724 + i * 2);
    }
    for (int i = 0; i < MAXINV; i++) for (int q = 0; q < MAXSEQ; q++) if (seqBloc(q) == inv[i]) seqon[q] = true;
    if (meter[0] == -1) {
      for (int i = 0; i < 5; i++) meter[i] = i16(chr + 3724 + i * 2);
      for (int i = 5; i < MAXSEQ; i++) meter[i] = seqKey(i) > 0 ? i16(chr + 3724 + i * 2) : -20000;
      for (int i = MAXSEQ; i < MAXSEQ + 10; i++) meter[i] = i16(chr + 3724 + i * 2);
    }
    cx[0] = sx; cy[0] = sy; cx[1] = 0; cy[1] = 0;
    cseq = 0; cframe = -1;
    if (hitpts == -1) hitpts = meter[0];
    if (lives == -1) lives = meter[1];
    netx = 5; nety = 0; gravx = 0; gravy = 0;
    scrx = oldx = nextx = OFFSCRN;
    scry = oldy = nexty = OFFSCRN;
    topthere = bottomthere = false;
    curtop = curbottom = CHARBL;
    nextAni = clock;
    mx = sx - SCRNBLEN / 2;
    my = sy - SCRNBWID / 2;
    if (mx < 0) mx += MLEN;
    if (my < 0) my += MWID;
    for (int l = 0; l < LASTMM; l++) {
      resetMonInfo(l);
      birthMon(l, mm[l].monnum, mm[l].curx, mm[l].cury);
      mi[l].fromchar = 0;
    }
    for (int l = 0; l < BACKBL; l++) {
      blkmap[l] = (uint8_t)l;
      nxtchg[l] = attr(l).ntime > 0 ? clock + attr(l).ntime : 0xffffffffu;
    }
    blkmap[BACKBL] = BACKBL;
    nxtchg[BACKBL] = 0xffffffffu;
    nblkMon = 0;
    if (!noMons)
      for (int l = 0; l < BACKBL; l++)
        if (attr(l).birthTime > 0) { blkMonBl[nblkMon] = l; blkMonNext[nblkMon++] = clock + attr(l).birthTime; }
    resetKeys();
    int k = seqKey(cseq);
    if (k >= 0 && k < 128) keydn[k] = 1;
    gclk = clock;
    {
      const Level& li = levelAt(lv);
      initScroll(li.scrollUp, li.scrollDown, li.scrollLeft, li.scrollRight);
    }
    doScroll = false;
    memset(held, 0, sizeof held);
    npending = 0;
    update = false;
    return true;
  }

  // The first level, from the start of the game.
  bool begin() {
    startGame();
    const Level& first = levelAt(0);
    int sx = first.startX, sy = first.startY;
    prevToX = sx;
    prevToY = sy;
    bool ok = enterLevel(0, sx, sy);
    buildDrawList();
    return ok;
  }

  void key(int scan, bool down) {
    scan &= 127;
    if (down == held[scan]) return;
    held[scan] = down;
    if (npending < 16) pending[npending++] = down ? scan : (scan | 0x80);
  }
  void releaseAll() {
    for (int k = 0; k < 128; k++) if (held[k]) key(k, false);
  }

  // One game tick (GameSim.tick). Returns 0, 'D' (died and restarted), 'L' (entered the next level)
  // or 'W' (the game is won).
  char tick() {
    char r = tickInner();
    buildDrawList();
    return r;
  }
  char tickInner() {
    if (won) return 'W';
    ticks++;
    clock++;
    for (int i = 0; i < 8; i++)
      if (doScroll) drawScroll();
    if (!noMons) {
      blockBirthMonsters();
      moveAllMonsters();
    }
    if (npending && (!seqGround(cseq) || cframe == 0)) {
      for (int i = 0; i < npending; i++) simKeyPress(pending[i]);
      npending = 0;
    }
    bool dead = false;
    int guard = 0;
    do {
      if (moveChars()) dead = true;
    } while (cframe == -1 && !dead && guard++ < 50);
    changeBlocks();
    updateCharDrawState();
    doScroll = changeScroll() != 0;
    monsolid = 0;
    mmSolid = LASTMM;
    Touch t = getTouch();
    const Level& L = levelAt(level);
    int taken = -1;
    for (int l = 0; l < L.nlinks && taken < 0; l++)
      for (int i = 0; i < 6; i++)
        if (L.links[l].fromX == t.bx[i] && L.links[l].fromY == t.by[i]) { taken = l; break; }
    if (dead) {
      if (hold) { pendKind = 'D'; return 'D'; }
      commit('D', level, 0, 0);
      return 'D';
    }
    if (taken >= 0) {
      const Link& k = L.links[taken];
      if (k.toLevel < 0) { won = true; return 'W'; }
      if (hold) { pendKind = 'L'; pendLevel = k.toLevel; pendX = k.toX; pendY = k.toY; return 'L'; }
      commit('L', k.toLevel, k.toX, k.toY);
      return 'L';
    }
    return 0;
  }
  // The level change a tick found: after a death ('D') the same level again, after a link ('L') the next.
  // With `hold` set, tick() stops at the change (the old level is still all there to fade out) and the
  // board calls finish() once it has shown what goes between levels; without it tick() does both.
  bool hold = false;
  char pendKind = 0;
  int pendLevel = 0, pendX = 0, pendY = 0;
  bool finish() {
    char k = pendKind;
    pendKind = 0;
    return k ? commit(k, k == 'D' ? level : pendLevel, pendX, pendY) : true;
  }
  bool commit(char kind, int lv, int x, int y) {
    if (kind == 'D') {
      if (lives > 0) lives--;
      hitpts = -1;
      return enterLevel(lv, prevToX, prevToY);
    }
    prevToX = x;
    prevToY = y;
    return enterLevel(lv, x, y);
  }

  // ---- drawing (render.ts renderWorld, one row at a time) ------------------------------------
  // The palette indices of row `gy` (0..199) of the 320 wide game screen into out[320].
  void renderRow(int gy, uint8_t* out) const {
    int ox = sc.nx + sc.lsx, oy = sc.ny + sc.lsy;
    int yy = gy + oy;
    int by = yy / BLEN, wy = yy % BLEN;
    int cellY = (my + by) % MWID;
    int x = 0;
    int xx = ox;
    while (x < SIZEX) {
      int bx = xx / BLEN, wx = xx % BLEN;
      int n = BLEN - wx;
      if (x + n > SIZEX) n = SIZEX - x;
      int b = blkmap[map[cellY * MLEN + (mx + bx) % MLEN]];
      const uint8_t* src = b < nbl ? bbl + b * BLOCK_BYTES + wy * BLEN + wx : nullptr;
      if (src) memcpy(out + x, src, n);
      else memset(out + x, 0, n);
      x += n;
      xx += n;
    }
    for (int i = 0; i < ndraw; i++) {
      const MonDraw& d = draw[i];
      if (d.pic < nmbl && gy >= d.y - sc.lsy && gy < d.y - sc.lsy + BLEN) sprite(out, gy, d.x - sc.lsx, d.y - sc.lsy, d.orient, mbl + d.pic * BLOCK_BYTES);
    }
    if (scrx > OFFSCRN) {
      int orient = currentFrame().orient;
      if (curtop < CHARBL) sprite(out, gy, scrx - sc.lsx, scry - BLEN - sc.lsy, orient & 15, cbl + curtop * BLOCK_BYTES);
      if (curbottom < CHARBL) sprite(out, gy, scrx - sc.lsx, scry - sc.lsy, orient >> 4, cbl + curbottom * BLOCK_BYTES);
    }
  }
  static int orientIndex(int orient, int x, int y) {
    constexpr int L = BLEN - 1;
    int o = orient & 0xff;
    switch (o > 7 ? 7 : o) {
      case 1: return (L - x) * BLEN + y;
      case 2: return (L - y) * BLEN + (L - x);
      case 3: return x * BLEN + (L - y);
      case 4: return y * BLEN + (L - x);
      case 5: return x * BLEN + y;
      case 6: return (L - y) * BLEN + x;
      case 7: return (L - x) * BLEN + (L - y);
      default: return y * BLEN + x;
    }
  }
  void sprite(uint8_t* out, int gy, int sx, int sy, int orient, const uint8_t* px) const {
    int wy = gy - sy;
    if (wy < 0 || wy >= BLEN) return;
    for (int wx = 0; wx < BLEN; wx++) {
      int X = sx + wx;
      if (X < 0 || X >= SIZEX) continue;
      uint8_t v = px[orientIndex(orient, wx, wy)];
      if (v != 255) out[X] = v;
    }
  }
};

}  // namespace gm

#include "gmmon.h"
