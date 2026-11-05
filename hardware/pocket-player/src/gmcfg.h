// Reads one game's .cfg (written by web/scripts/pocketData.ts from the game's .gam and controls.json)
// and loads each level's files through a reader the platform gives (LittleFS on the board, stdio in the
// Mac test). Lines:
//   title <text>
//   level <map> <bbl> <cbl> <chr> <pal> <start x> <start y> <scroll up> <down> <left> <right> <blocks>
//   link <level> <from x> <from y> <to level, -1 = the game is won> <to x> <to y>
//   key <scan code> <label>          (the keys the game uses, from controls.json)
//   ctr <counter> <label>            (counters 20 to 29 the game shows, from controls.json)
// Every file is packed (see Assets::readz). A map is the 100 x 100 block numbers; a .bbl is cut after the
// last block the game uses (<blocks> of them, unused ones zero). Files are named by content, so games share them.
#pragma once
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "gmcore.h"

namespace gm {

constexpr int MAXKEYSET = 12;
struct KeyInfo { int scan; char label[16]; };
struct LevelFiles { char map[16], bbl[16], cbl[16], chr[16], pal[16]; int nbl; };
struct Counter { int n; char label[20]; };
struct Cfg {
  char title[40];
  Counter ctr[6];
  int nctr = 0;
  LevelFiles lv[MAXLEVELS];
  KeyInfo keys[MAXKEYSET];
  int nkeys = 0;
};

inline bool parseCfg(const char* text, World& w, Cfg& cfg) {
  w.nlevels = 0;
  cfg.nkeys = 0;
  cfg.nctr = 0;
  cfg.title[0] = 0;
  for (auto& l : w.levels) l.nlinks = 0;
  const char* p = text;
  while (*p) {
    char line[128];
    int n = 0;
    while (*p && *p != '\n' && n < 127) line[n++] = *p++;
    while (*p && *p != '\n') p++;
    if (*p == '\n') p++;
    line[n] = 0;
    int a, b, c, d, e, f, g, h = 0;
    char m[16], bb[16], cb[16], ch[16], pl[16];
    if (!strncmp(line, "title ", 6)) {
      strncpy(cfg.title, line + 6, sizeof cfg.title - 1);
      cfg.title[sizeof cfg.title - 1] = 0;
    } else if (sscanf(line, "level %15s %15s %15s %15s %15s %d %d %d %d %d %d %d", m, bb, cb, ch, pl, &a, &b, &c, &d, &e, &f, &g) == 12 &&
               w.nlevels < MAXLEVELS) {
      LevelFiles& L = cfg.lv[w.nlevels];
      strcpy(L.map, m); strcpy(L.bbl, bb); strcpy(L.cbl, cb); strcpy(L.chr, ch); strcpy(L.pal, pl);
      L.nbl = g;
      Level& V = w.levels[w.nlevels];
      V.startX = a; V.startY = b;
      V.scrollUp = c; V.scrollDown = d; V.scrollLeft = e; V.scrollRight = f;
      w.nlevels++;
    } else if (sscanf(line, "link %d %d %d %d %d %d", &a, &b, &c, &d, &e, &f) == 6 && a >= 0 && a < w.nlevels) {
      Level& L = w.levels[a];
      if (L.nlinks < MAXLINKS) L.links[L.nlinks++] = {b, c, d, e, f};
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
  return w.nlevels > 0;
}

typedef uint8_t* (*ReadFile)(const char* name, size_t* n);  // malloc'd; the caller frees
// Inflates raw deflate data (zlib on the Mac, the ESP32's ROM miniz on the board); false on any error.
typedef bool (*Inflate)(const uint8_t* src, size_t n, uint8_t* dst, size_t cap);

// Loads a level's files into the world (and the palette: 768 bytes, 6 bit VGA values), keeping the last
// ones when the next level uses the same file. It is the world's MapLoader (user = this).
struct Assets {
  World* w = nullptr;
  const Cfg* cfg = nullptr;
  ReadFile read = nullptr;
  Inflate inflate = nullptr;
  uint8_t* bbl = nullptr; uint8_t* cbl = nullptr; uint8_t* chr = nullptr;
  uint8_t pal[768];
  bool palChanged = false;
  char bblName[16] = "", cblName[16] = "", chrName[16] = "", palName[16] = "";

  void release() {
    free(bbl); free(cbl); free(chr);
    bbl = cbl = chr = nullptr;
    bblName[0] = cblName[0] = chrName[0] = palName[0] = 0;
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
  static bool load(void* user, int level, uint8_t* blocks) {
    Assets& a = *(Assets*)user;
    const LevelFiles& L = a.cfg->lv[level];
    if (!swap(a.bbl, a.bblName, L.bbl, (size_t)L.nbl * BLOCK_BYTES, a) ||
        !swap(a.cbl, a.cblName, L.cbl, 21000, a) ||
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
    size_t n = 0;
    uint8_t* m = a.readz(L.map, &n);
    if (!m) return false;
    bool ok = n == (size_t)MLEN * MWID;
    if (ok) memcpy(blocks, m, n);
    free(m);
    return ok;
  }
  void attach(World& world, const Cfg& c, ReadFile r, Inflate z) {
    w = &world; cfg = &c; read = r; inflate = z;
    world.loadMap = load;
    world.loadUser = this;
  }
};

}  // namespace gm
