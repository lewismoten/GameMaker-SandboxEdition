// Mac test for the Pocket Player's play loop (src/gmcore.h). It reads the same data files the board
// gets, replays a key script, and prints the character's state after every tick, so
// web/scripts/pocketHostCheck.ts can compare it with the real engine.
//   hosttest <data dir> <game id> <key script>     key script lines: "K <tick> <scan, +128 for a release>"
// Build: c++ -std=c++17 -O1 -I../src hosttest.cpp -o hosttest
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "gmcfg.h"

using namespace gm;

static std::string dir;
static Cfg cfg;
static Assets assets;

static std::vector<uint8_t> slurp(const std::string& path) {
  std::vector<uint8_t> v;
  FILE* f = fopen(path.c_str(), "rb");
  if (!f) { fprintf(stderr, "cannot open %s\n", path.c_str()); exit(2); }
  uint8_t buf[4096];
  size_t n;
  while ((n = fread(buf, 1, sizeof buf, f)) > 0) v.insert(v.end(), buf, buf + n);
  fclose(f);
  return v;
}

static bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  z_stream z = {};
  if (inflateInit2(&z, -15) != Z_OK) return false;
  z.next_in = (Bytef*)src; z.avail_in = (uInt)n; z.next_out = dst; z.avail_out = (uInt)cap;
  int r = inflate(&z, Z_FINISH);
  bool ok = r == Z_STREAM_END && z.total_out == cap;
  inflateEnd(&z);
  return ok;
}

static uint8_t* readFile(const char* name, size_t* n) {
  std::vector<uint8_t> v = slurp(dir + "/" + name);
  uint8_t* p = (uint8_t*)malloc(v.size() + 1);
  memcpy(p, v.data(), v.size());
  *n = v.size();
  return p;
}

// The visible part of the game screen (CropScreen: 312 x 196) as a hash, row by row.
static uint32_t frameHash(const World& w) {
  uint32_t h = 2166136261u;
  uint8_t row[SIZEX];
  for (int y = 0; y < 196; y++) {
    w.renderRow(y, row);
    for (int x = 0; x < 312; x++) h = (h ^ row[x]) * 16777619u;
  }
  return h;
}

static int msum(const World& w) {
  int32_t a = 0;
  for (int i = 0; i < 30; i++) a += w.meter[i];
  return a;
}

int main(int argc, char** argv) {
  if (argc < 4) return 2;
  dir = argv[1];
  static World w;
  std::vector<uint8_t> cfgText = slurp(dir + "/" + argv[2] + ".cfg");
  cfgText.push_back(0);
  if (!parseCfg((const char*)cfgText.data(), w, cfg)) return 2;
  assets.attach(w, cfg, readFile, inflateRaw);
  struct Ev { int tick, key; };
  std::vector<Ev> evs;
  FILE* f = fopen(argv[3], "r");
  if (!f) return 2;
  char line[64];
  int maxTick = 0;
  while (fgets(line, sizeof line, f)) {
    int t, k;
    if (sscanf(line, "K %d %d", &t, &k) == 2) evs.push_back({t, k});
    if (sscanf(line, "T %d", &t) == 1) maxTick = t;
  }
  fclose(f);
  w.begin();
  size_t e = 0;
  for (int t = 1; t <= maxTick; t++) {
    while (e < evs.size() && evs[e].tick == t) {
      if (evs[e].key >= 256) w.dropSlot = evs[e].key - 256;  // the picker's choice, ahead of the D press
      else w.key(evs[e].key & 127, !(evs[e].key & 128));
      e++;
    }
    char code = w.tick();
    printf("S %d %c %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %u\n", t, code ? code : '-', w.level, w.cx[0], w.cx[1], w.cy[0], w.cy[1],
           w.cseq, w.cframe, w.mx, w.my, w.sc.nx, w.sc.ny, w.sc.lsx, w.sc.lsy, w.score, w.nextx, w.nexty, w.scrx, w.scry, w.hitpts, w.lives, msum(w), frameHash(w));
    if (code == 'W') break;
  }
  return 0;
}
