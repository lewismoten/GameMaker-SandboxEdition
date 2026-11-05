// Reads one game's .cfg (written by web/scripts/pocketData.ts from the game's .gam and controls.json)
// and loads each level's files through a reader the platform gives (LittleFS on the board, stdio in the
// Mac test). Lines:
//   title <text>
//   level <map> <bbl> <cbl> <chr> <pal> <start x> <start y> <scroll up> <down> <left> <right> <blocks> [<mon> <mbl> <monsters> <monster blocks>]
//     (the last four only for a level that can have monsters: the .mon records, the monster blocks, how many of each)
//   cbln <level> <n>                 (the level's .cbl holds only hero blocks 0 to n - 1; none: all 50)
//   snd <level> <file>               (the level's PC speaker tunes: 30 effects of 36 frequencies, 2160 bytes packed; none: no sound)
//   link <level> <from x> <from y> <to level, -1 = the game is won> <to x> <to y>
//   key <scan code> <label>          (the keys the game uses, from controls.json)
//   ctr <counter> <label>            (counters 20 to 29 the game shows, from controls.json)
// Every file is packed (see Assets::readz). A map is the 100 x 100 block numbers (and, for a level with monsters,
// the 100 x 100 monster slot numbers and the 200 placed monsters as monster, x, y); a .bbl is cut after the
// last block the game uses (<blocks> of them, unused ones zero), a .mon after the last monster and a monster
// block file after the last picture. Files are named by content, so games share them.
#pragma once
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "gmcore.h"

namespace gm {

constexpr int MAXKEYSET = 12;
struct KeyInfo { int scan; char label[16]; };
struct LevelFiles { char map[16], bbl[16], cbl[16], chr[16], pal[16], mon[16], mbl[16], snd[16]; int nbl, nmon, nmbl, ncbl; };  // ncbl: hero blocks kept (50, all of them, unless a `cbln` line says fewer)
struct Counter { int n; char label[20]; };
struct Cfg {
  char title[40];
  Counter ctr[6];
  int nctr = 0;
  KeyInfo keys[MAXKEYSET];
  int nkeys = 0;
};

// A line source the platform gives (the board reads a file of LittleFS or the card, the Mac test stdio). A .cfg is read line by line,
// never held: a game can have 100 levels, and the level table is not kept in memory (see Assets::readInfo).
struct Lines {
  void* (*open)(void* user, const char* name);                // null: could not open
  bool (*next)(void* h, char* line, int cap);                 // the next line without its newline (cut at cap - 1); false at the end
  void (*close)(void* h);
  void* user;
};

// A `level` line: the level's files and counts into L, its start and scroll limits into V (either may be null). False if it isn't one.
inline bool parseLevelLine(const char* line, LevelFiles* L, Level* V) {
  int a, b, c, d, e, f, g, nm = 0, nb = 0;
  char m[16], bb[16], cb[16], ch[16], pl[16], mo[16], mb[16];
  if (strncmp(line, "level ", 6) ||
      sscanf(line, "level %15s %15s %15s %15s %15s %d %d %d %d %d %d %d %15s %15s %d %d", m, bb, cb, ch, pl, &a, &b, &c, &d, &e, &f, &g, mo, mb, &nm, &nb) < 12)
    return false;
  if (L) {
    strcpy(L->map, m); strcpy(L->bbl, bb); strcpy(L->cbl, cb); strcpy(L->chr, ch); strcpy(L->pal, pl);
    L->nbl = g;
    bool withMons = nm > 0 && nb > 0;
    strcpy(L->mon, withMons ? mo : ""); strcpy(L->mbl, withMons ? mb : "");
    L->nmon = withMons ? nm : 0;
    L->nmbl = withMons ? nb : 0;
  }
  if (V) {
    V->startX = a; V->startY = b;
    V->scrollUp = c; V->scrollDown = d; V->scrollLeft = e; V->scrollRight = f;
  }
  return true;
}

// The header lines: title, key, ctr, and a count of the levels. The levels themselves are read one at a time (readLevelInfo).
inline void parseHeaderLine(const char* line, World& w, Cfg& cfg) {
  int a, h = 0;
  if (!strncmp(line, "title ", 6)) {
    strncpy(cfg.title, line + 6, sizeof cfg.title - 1);
    cfg.title[sizeof cfg.title - 1] = 0;
  } else if (!strncmp(line, "level ", 6)) {
    if (w.nlevels < MAXLEVELS && parseLevelLine(line, nullptr, nullptr)) w.nlevels++;
  } else if (!strncmp(line, "ctr ", 4) && sscanf(line, "ctr %d %n", &a, &h) >= 1 && cfg.nctr < 6) {
    Counter& k = cfg.ctr[cfg.nctr++];
    k.n = a;
    strncpy(k.label, line + h, sizeof k.label - 1);
    k.label[sizeof k.label - 1] = 0;
  } else if (!strncmp(line, "key ", 4) && sscanf(line, "key %d %n", &a, &h) >= 1 && cfg.nkeys < MAXKEYSET) {
    KeyInfo& k = cfg.keys[cfg.nkeys++];
    k.scan = a;
    strncpy(k.label, line + h, sizeof k.label - 1);
    k.label[sizeof k.label - 1] = 0;
  }
}
inline void resetHeader(World& w, Cfg& cfg) {
  w.nlevels = 0;
  cfg.nkeys = 0;
  cfg.nctr = 0;
  cfg.title[0] = 0;
}

// Reads the header of a .cfg from the text (the Mac tests) ...
inline bool parseCfg(const char* text, World& w, Cfg& cfg) {
  resetHeader(w, cfg);
  const char* p = text;
  while (*p) {
    char line[128];
    int n = 0;
    while (*p && *p != '\n' && n < 127) line[n++] = *p++;
    while (*p && *p != '\n') p++;
    if (*p == '\n') p++;
    line[n] = 0;
    parseHeaderLine(line, w, cfg);
  }
  return w.nlevels > 0;
}
// ... or line by line from a file (the board: a big game's .cfg is tens of KB).
inline bool parseCfgFile(const Lines& ln, const char* name, World& w, Cfg& cfg) {
  resetHeader(w, cfg);
  void* h = ln.open(ln.user, name);
  if (!h) return false;
  char line[128];
  while (ln.next(h, line, sizeof line)) parseHeaderLine(line, w, cfg);
  ln.close(h);
  return w.nlevels > 0;
}

// One level's record, found by reading the whole .cfg line by line: its `level` line (the level-th one), its `cbln` and `snd` lines and its
// `link` lines (the links of level n are every `link n ...` line, up to MAXLINKS). Links and cbln lines may follow all the level lines.
inline bool readLevelInfo(const Lines& ln, const char* name, int level, LevelFiles& L, Level& V) {
  void* h = ln.open(ln.user, name);
  if (!h) return false;
  memset(&L, 0, sizeof L);
  L.ncbl = 50;  // hero blocks kept: all of them unless a `cbln` line says fewer
  V.nlinks = 0;
  V.startX = V.startY = 0;
  V.scrollUp = V.scrollDown = V.scrollLeft = V.scrollRight = 0xff;
  char line[128];
  int idx = -1;
  bool got = false;
  while (ln.next(h, line, sizeof line)) {
    int a, b, c, d, e, f;
    char m[16];
    if (line[0] == 'l' && !strncmp(line, "level ", 6)) {
      if (parseLevelLine(line, nullptr, nullptr) && ++idx == level) got = parseLevelLine(line, &L, &V);
    } else if (!strncmp(line, "cbln ", 5)) {
      if (sscanf(line, "cbln %d %d", &a, &b) == 2 && a == level && b >= 1 && b <= 50) L.ncbl = b;
    } else if (!strncmp(line, "snd ", 4)) {
      if (sscanf(line, "snd %d %15s", &a, m) == 2 && a == level) strcpy(L.snd, m);
    } else if (!strncmp(line, "link ", 5)) {
      if (sscanf(line, "link %d %d %d %d %d %d", &a, &b, &c, &d, &e, &f) == 6 && a == level && V.nlinks < MAXLINKS) V.links[V.nlinks++] = {b, c, d, e, f};
    }
  }
  ln.close(h);
  return got;
}

typedef uint8_t* (*ReadFile)(const char* name, size_t* n);  // malloc'd; the caller frees
// Inflates raw deflate data (zlib on the Mac, the ESP32's ROM miniz on the board); false on any error.
typedef bool (*Inflate)(const uint8_t* src, size_t n, uint8_t* dst, size_t cap);

// Loads a level's files into the world (and the palette: 768 bytes, 6 bit VGA values), keeping the last
// ones when the next level uses the same file. It is the world's MapLoader (user = this).
struct Assets {
  World* w = nullptr;
  const Cfg* cfg = nullptr;
  const Lines* lines = nullptr;  // the .cfg's lines (null: the levels have no table to read)
  char cfgName[40] = "";  // "<file>.cfg"
  LevelFiles files;              // the level being entered: its file names and counts
  int filesLevel = -1;
  ReadFile read = nullptr;
  Inflate inflate = nullptr;
  uint8_t* bbl = nullptr; uint8_t* cbl = nullptr; uint8_t* chr = nullptr; uint8_t* mon = nullptr; uint8_t* mbl = nullptr; uint8_t* snd = nullptr;
  uint8_t pal[768];
  bool palChanged = false;
  void (*beforeLoad)(int level) = nullptr;  // called as a level's files are about to load (the board reads a card's files here)
  char bblName[16] = "", cblName[16] = "", chrName[16] = "", palName[16] = "", monName[16] = "", mblName[16] = "", sndName[16] = "";

  void release() {
    free(bbl); free(cbl); free(chr); free(mon); free(mbl); free(snd);
    bbl = cbl = chr = mon = mbl = snd = nullptr;
    bblName[0] = cblName[0] = chrName[0] = palName[0] = monName[0] = mblName[0] = sndName[0] = 0;
  }
  // A packed file: its length (4 bytes, little endian), then the raw deflate of it.
  uint8_t* readz(const char* name, size_t* n) const {
    size_t rn = 0;
    uint8_t* f = read(name, &rn);
    if (!f || rn < 5) { free(f); return nullptr; }
    size_t len = f[0] | (f[1] << 8) | (f[2] << 16) | ((size_t)f[3] << 24);
    uint8_t* out = len < (1u << 20) ? (uint8_t*)malloc(len + 1) : nullptr;
    bool ok = out && inflate(f + 4, rn - 4, out, len);
    free(f);
    if (!ok) { free(out); return nullptr; }
    *n = len;
    return out;
  }
  static bool swap(uint8_t*& slot, char* have, const char* want, size_t min, const Assets& a) {
    if (slot && !strcmp(have, want)) return true;
    free(slot);
    slot = nullptr;
    have[0] = 0;
    size_t n = 0;
    slot = a.readz(want, &n);
    if (!slot || n < min) { free(slot); slot = nullptr; return false; }
    strcpy(have, want);
    return true;
  }
  // Reads level `level`'s record from the .cfg into `files` and the world (once for a level: the board's prefetch and the load both ask).
  bool readInfo(int level) {
    if (filesLevel == level && w->lvlIdx == level) return true;
    filesLevel = -1;
    if (!lines || !readLevelInfo(*lines, cfgName, level, files, w->lvl)) return false;
    filesLevel = w->lvlIdx = level;
    return true;
  }
  static bool info(void* user, int level, Level&) { return ((Assets*)user)->readInfo(level); }
  static bool load(void* user, int level, uint8_t* blocks, uint8_t* mons, uint8_t* mmBytes, bool* hasMons) {
    Assets& a = *(Assets*)user;
    if (a.beforeLoad) a.beforeLoad(level);
    if (!a.readInfo(level)) return false;
    const LevelFiles& L = a.files;
    // The biggest first: the heap's one long free stretch (about 110 KB) must take the blocks, the monster pictures and the hero
    // blocks; what is left over is in pieces too small for them if the small files go in first.
    bool mons_ = L.nmon > 0;
    {  // the map first: its unpacked copy (10 or 20 KB) is gone again before the big buffers need the long free stretch
      size_t n = 0;
      uint8_t* m = a.readz(L.map, &n);
      if (!m) return false;
      size_t cells = (size_t)MLEN * MWID;
      bool ok = n == cells || (mons_ && n == cells * 2 + LASTMM * 3);
      if (ok) memcpy(blocks, m, cells);
      if (ok && mons_ && n > cells) {
        memcpy(mons, m + cells, cells);
        memcpy(mmBytes, m + cells * 2, LASTMM * 3);
        *hasMons = true;
      }
      free(m);
      if (!ok) return false;
    }
    if (!swap(a.bbl, a.bblName, L.bbl, (size_t)L.nbl * BLOCK_BYTES, a) ||
        (mons_ && !swap(a.mbl, a.mblName, L.mbl, (size_t)L.nmbl * BLOCK_BYTES, a)) ||
        !swap(a.cbl, a.cblName, L.cbl, (size_t)L.ncbl * BLOCK_BYTES, a) ||
        !swap(a.chr, a.chrName, L.chr, 3784, a))
      return false;
    if (strcmp(a.palName, L.pal)) {
      size_t n = 0;
      uint8_t* p = a.readz(L.pal, &n);
      if (!p || n < 768) { free(p); return false; }
      memcpy(a.pal, p, 768);
      free(p);
      strcpy(a.palName, L.pal);
      a.palChanged = true;
    }
    a.w->bbl = a.bbl; a.w->cbl = a.cbl; a.w->chr = a.chr; a.w->nbl = L.nbl;
    if (mons_) {
      if (!swap(a.mon, a.monName, L.mon, (size_t)L.nmon * MONSTER_BYTES, a)) return false;
    } else {
      free(a.mon); free(a.mbl);
      a.mon = a.mbl = nullptr;
      a.monName[0] = a.mblName[0] = 0;
    }
    if (L.snd[0] && swap(a.snd, a.sndName, L.snd, (size_t)LASTSND * 72, a)) a.w->snd = a.snd;
    else {
      free(a.snd);
      a.snd = nullptr;
      a.sndName[0] = 0;
      a.w->snd = nullptr;
    }
    a.w->mon = a.mon; a.w->mbl = a.mbl; a.w->nmon = mons_ ? L.nmon : 0; a.w->nmbl = mons_ ? L.nmbl : 0;
    return true;
  }
  void attach(World& world, const Cfg& c, ReadFile r, Inflate z) {
    w = &world; cfg = &c; read = r; inflate = z;
    world.loadMap = load;
    world.loadUser = this;
    world.loadInfo = info;
    world.infoUser = this;
    world.lvlIdx = filesLevel = -1;
  }
};

}  // namespace gm
