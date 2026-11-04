// Reads data/steps.cfg, the small text file that says which map each level uses, where the hero
// starts and where the links go. web/scripts/pocketData.ts writes it from the game's steps.gam.
//   level <map file> <start x> <start y>
//   link <level> <from x> <from y> <to level, -1 = the game is won> <to x> <to y>
#pragma once
#include <stdio.h>
#include <string.h>
#include "gmcore.h"

namespace gm {

struct Cfg { char map[4][16]; };

inline bool parseCfg(const char* text, World& w, Cfg& cfg) {
  w.nlevels = 0;
  for (auto& l : w.levels) l.nlinks = 0;
  const char* p = text;
  while (*p) {
    char line[96];
    int n = 0;
    while (*p && *p != '\n' && n < 95) line[n++] = *p++;
    while (*p && *p != '\n') p++;
    if (*p == '\n') p++;
    line[n] = 0;
    char name[16];
    int a, b, c, d, e;
    if (sscanf(line, "level %15s %d %d", name, &a, &b) == 3 && w.nlevels < 4) {
      strcpy(cfg.map[w.nlevels], name);
      w.levels[w.nlevels].startX = a;
      w.levels[w.nlevels].startY = b;
      w.nlevels++;
    } else if (sscanf(line, "link %d %d %d %d %d %d", &a, &b, &c, &d, &e, &n) == 6 && a >= 0 && a < w.nlevels) {
      Level& L = w.levels[a];
      if (L.nlinks < MAXLINKS) L.links[L.nlinks++] = {b, c, d, e, n};
    }
  }
  return w.nlevels > 0;
}

}  // namespace gm
