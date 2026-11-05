// Mac test for the Pocket Player's play loop (src/gmcore.h). It reads the same data files the board
// gets, replays a key script, and prints the character's state after every tick, so
// web/scripts/pocketHostCheck.ts can compare it with the real engine.
//   hosttest <data dir> <game id> <key script>     key script lines: "K <tick> <scan, +128 for a release>", "R <seed>", "T <ticks>"
// Build: c++ -std=c++17 -O1 -I../src hosttest.cpp -o hosttest
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "gmcfg.h"
#include "stdiolines.h"
#include "pcspeaker.h"

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

// FNV hash of one effect's 36 frequencies (72 bytes), as the web check computes from the .snd file.
static uint32_t tuneHash(const uint8_t* t) {
  uint32_t h = 2166136261u;
  for (int i = 0; i < 72; i++) h = (h ^ t[i]) * 16777619u;
  return h;
}

// Plays one effect through the board's Speaker model (pcspeaker.h), polling every 250 us as the 1 ms task
// would (finer here), and checks every step starts within the polling slack of its time (n / 145.6 s)
// and holds the frequency PLAYGAME would sound. Returns the number of wrong steps.
static int tuneTiming(const uint8_t* tune) {
  Speaker sp;
  sp.start(tune, 1000);
  int bad = 0, seen = 0, f = 0;
  for (uint32_t us = 1000; us < 1000 + 300000 && (sp.on || seen == 0); us += 250) {
    if (!sp.update(us, f)) continue;
    int step = seen++;
    if (step < NUMFREQ) {
      int want = tune[step * 2] | (tune[step * 2 + 1] << 8);
      want = want < 20 ? 0 : want > 20000 ? 20000 : want;
      uint32_t due = 1000 + (uint32_t)((uint64_t)step * 10000000ull / TICK_RATE_X10);
      if (f != want || us < due || us > due + 500) bad++;
    }
  }
  return bad + (seen == NUMFREQ + 1 ? 0 : 1);
}

int main(int argc, char** argv) {
  if (argc < 4) return 2;
  dir = argv[1];
  static World w;
  std::vector<uint8_t> cfgText = slurp(dir + "/" + argv[2] + ".cfg");
  cfgText.push_back(0);
  if (!parseCfg((const char*)cfgText.data(), w, cfg)) return 2;
  assets.attach(w, cfg, readFile, inflateRaw);
  linesDir = dir;
  assets.lines = &stdioLines;
  snprintf(assets.cfgName, sizeof assets.cfgName, "%s.cfg", argv[2]);
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
    unsigned seed;
    if (sscanf(line, "R %u", &seed) == 1) w.seed = seed;
  }
  fclose(f);
  w.begin();
  size_t e = 0;
  int timed = 0, timedBad = 0;
  for (int t = 1; t <= maxTick; t++) {
    while (e < evs.size() && evs[e].tick == t) {
      if (evs[e].key >= 256) w.dropSlot = evs[e].key - 256;  // the picker's choice, ahead of the D press
      else w.key(evs[e].key & 127, !(evs[e].key & 128));
      e++;
    }
    char code = w.tick();
    printf("S %d %c %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %u\n", t, code ? code : '-', w.level, w.cx[0], w.cx[1], w.cy[0], w.cy[1],
           w.cseq, w.cframe, w.mx, w.my, w.sc.nx, w.sc.ny, w.sc.lsx, w.sc.lsy, w.score, w.nextx, w.nexty, w.scrx, w.scry, w.hitpts, w.lives, msum(w), frameHash(w));
    // The effects started this tick: Q <tick> <effect> <hash of its 36 frequencies>
    for (int q = 0; q < w.nsnd; q++) {
      const uint8_t* tune = w.snd + w.sndQ[q] * 72;
      printf("Q %d %d %u\n", t, w.sndQ[q], tuneHash(tune));
      if (timed < 40 && !(timed++ % 1)) timedBad += tuneTiming(tune);
    }
    w.nsnd = 0;
    if (code == 'W') break;
  }
  printf("Z %d %d\n", timed, timedBad);
  return 0;
}
