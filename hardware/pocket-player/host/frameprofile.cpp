// Full software-render frame samples for every cfg level, independent of walkthrough reachability.
// frameprofile DATA ID [SAMPLES=180] [REPEATS=3]; CSV to stdout, diagnostics to stderr.
// No panel, color conversion, transport, controls, audio task, or artificial frame sleep is included.
#include <chrono>
#include <ctime>
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "gmcfg.h"
#include "stdiolines.h"

static std::string root;
static uint8_t* readFile(const char* name, size_t* n) {
  std::vector<uint8_t> v;
  if (!pakSlurp(root + "/" + name, v)) {
    FILE* f = fopen((root + "/" + name).c_str(), "rb");
    if (!f) return nullptr;
    uint8_t buf[4096]; size_t k;
    while ((k = fread(buf, 1, sizeof buf, f))) v.insert(v.end(), buf, buf + k);
    bool ok = !ferror(f); fclose(f); if (!ok) return nullptr;
  }
  uint8_t* p = (uint8_t*)malloc(v.size() + 1);
  if (!p) return nullptr;
  memcpy(p, v.data(), v.size()); *n = v.size(); return p;
}
static bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  z_stream z = {}; if (inflateInit2(&z, -15) != Z_OK) return false;
  z.next_in = (Bytef*)src; z.avail_in = (uInt)n; z.next_out = dst; z.avail_out = (uInt)cap;
  int r = inflate(&z, Z_FINISH); bool ok = r == Z_STREAM_END && z.total_out == cap;
  inflateEnd(&z); return ok;
}
static uint32_t render(const gm::World& w) {
  uint8_t row[gm::SIZEX]; uint32_t sum = 0;
  for (int y = 0; y < 196; y++) {
    w.renderRow(y, row);
    for (int x = 0; x < 312; x++) sum += row[x];
  }
  return sum;
}
static volatile uint32_t sink = 0; // make every software-render pixel observable under optimization
int main(int argc, char** argv) {
  if (argc < 3) return 2;
  int samples = argc > 3 ? atoi(argv[3]) : 180, repeats = argc > 4 ? atoi(argv[4]) : 3;
  if (samples < 1 || samples > 100000 || repeats < 1 || repeats > 100) return 2;
  root = argv[1]; linesDir = root; std::string name = std::string(argc > 5 ? argv[5] : argv[2]) + ".cfg";
  static gm::World w; gm::Cfg cfg; gm::Assets a;
  if (!gm::parseCfgFile(stdioLines, name.c_str(), w, cfg)) return 3;
  a.attach(w, cfg, readFile, inflateRaw); a.lines = &stdioLines;
  snprintf(a.cfgName, sizeof a.cfgName, "%s", name.c_str()); w.hold = true;
  using Clock = std::chrono::steady_clock;
  auto us = [](Clock::time_point x, Clock::time_point y) { return std::chrono::duration<double, std::micro>(y - x).count(); };
  printf("id,level,repeat,sample,tick_us,render_us,frame_us,cpu_us,event,checksum\n");
  for (int rep = 0; rep < repeats; rep++) {
    a.release(); a.heroChr[0] = 0; a.filesLevel = w.lvlIdx = -1;
    for (int lv = 0; lv < w.nlevels; lv++) {
      auto reset = [&]() {
        w.startGame(); w.seed = 12345; w.pendKind = 0;
        const gm::Level& info = w.levelAt(lv); int x = info.startX, y = info.startY;
        w.prevToX = x; w.prevToY = y;
        if (!w.enterLevel(lv, x, y)) return false;
        w.buildDrawList(); return true;
      };
      if (!reset()) { fprintf(stderr, "FAIL %s level=%d repeat=%d load\n", argv[2], lv, rep); a.release(); return 4; }
      for (int i = -30; i < samples; i++) {
        int phase = (i + 30) % 180;
        w.key(77, phase < 60); w.key(75, phase >= 60 && phase < 120); w.key(57, phase % 30 < 6);
        std::clock_t cpu0 = std::clock();
        auto t0 = Clock::now(); char event = w.tick(); auto t1 = Clock::now();
        uint32_t checksum = render(w); auto t2 = Clock::now(); sink = checksum;
        double cpuUs = (double)(std::clock() - cpu0) * 1000000.0 / CLOCKS_PER_SEC;
        w.nsnd = 0;
        if (i >= 0) printf("%s,%d,%d,%d,%.3f,%.3f,%.3f,%.3f,%c,%u\n", argv[2], lv, rep, i, us(t0,t1), us(t1,t2), us(t0,t2), cpuUs, event ? event : '-', checksum);
        // Keep sampling the selected level; never silently profile its linked destination.
        // A death/link/win resets outside the timed region. Loading/fades/cards are not frame time.
        if (event && !reset()) { fprintf(stderr, "FAIL reset %s level=%d\n", argv[2], lv); a.release(); return 5; }
      }
    }
  }
  a.release(); return 0;
}
