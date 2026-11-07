// Deterministic failures at the platform reader seams; no SD controller or panel is emulated.
// Build with ASan/UBSan and zlib; run with a data folder and game id (default first-steps).
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "gmcards.h"
#include "stdiolines.h"

static std::string root;
static int fault = 0, calls = 0, failAt = 1;
static uint8_t* reader(const char* name, size_t* n) {
  calls++;
  if (calls == failAt && fault == 1) return nullptr; // unavailable media / failed open
  std::vector<uint8_t> v;
  if (!pakSlurp(root + "/" + name, v)) {
    FILE* f = fopen((root + "/" + name).c_str(), "rb");
    if (!f) return nullptr;
    uint8_t buf[4096]; size_t k;
    while ((k = fread(buf, 1, sizeof buf, f))) v.insert(v.end(), buf, buf + k);
    bool ok = !ferror(f); fclose(f); if (!ok) return nullptr;
  }
  if (calls == failAt) {
    if (fault == 2) v.resize(v.size() > 3 ? 3 : 0); // short packed read
    if (fault == 3 && v.size() > 4) v.resize(v.size() - 1); // truncated deflate
    if (fault == 4 && v.size() > 4) v[4] = 0xff; // invalid deflate block
    if (fault == 5 && v.size() >= 4) v[3] = 0x7f; // excessive raw size
  }
  uint8_t* p = (uint8_t*)malloc(v.size() + 1);
  assert(p); memcpy(p, v.data(), v.size()); *n = v.size(); return p;
}
static bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  z_stream z = {}; if (inflateInit2(&z, -15) != Z_OK) return false;
  z.next_in = (Bytef*)src; z.avail_in = (uInt)n; z.next_out = dst; z.avail_out = (uInt)cap;
  int r = inflate(&z, Z_FINISH); bool ok = r == Z_STREAM_END && z.total_out == cap;
  inflateEnd(&z); return ok;
}
static uint8_t* rangeRead(size_t off, size_t len) {
  if (fault == 1 || fault == 2) return nullptr; // adapter must reject a failed/short exact range
  FILE* f = fopen((root + "/cards.pak").c_str(), "rb"); if (!f) return nullptr;
  uint8_t* p = (uint8_t*)malloc(len + 1); assert(p);
  bool ok = off <= 0x7fffffff && fseek(f, (long)off, SEEK_SET) == 0 && fread(p, 1, len, f) == len;
  fclose(f); if (!ok) { free(p); return nullptr; }
  if (fault == 3 && len > 4) memset(p + 4, 0xff, len - 4);
  if (fault == 4 && len >= 4) p[3] = 0x7f;
  return p;
}
static void* unavailable(void*, const char*) { return nullptr; }
static bool noLine(void*, char*, int) { assert(false); return false; }
static void noClose(void*) { assert(false); }
int main(int argc, char** argv) {
  assert(argc >= 2); root = argv[1]; linesDir = root;
  std::string id = argc > 2 ? argv[2] : "first-steps", name = id + ".cfg";
  static gm::World w; gm::Cfg cfg; gm::Assets a;
  gm::Lines missing = {unavailable, noLine, noClose, nullptr};
  assert(!gm::parseCfgFile(missing, name.c_str(), w, cfg));
  puts("PASS cfg unavailable/open failure");
  assert(gm::parseCfgFile(stdioLines, name.c_str(), w, cfg));
  a.attach(w, cfg, reader, inflateRaw); a.lines = &stdioLines;
  snprintf(a.cfgName, sizeof a.cfgName, "%s", name.c_str());
  assert(w.begin()); int normalCalls = calls; a.release();
  // Every mandatory asset read, after successful initial load (removed card at the next load).
  // Sound is optional by design, so its failed read is permitted, but must not retain a stale pointer.
  for (int mode = 1; mode <= 5; mode++) for (int at = 1; at <= normalCalls; at++) {
    fault = 0; calls = 0; a.filesLevel = w.lvlIdx = -1; assert(w.begin());
    a.release(); fault = mode; failAt = at; calls = 0;
    bool ok = w.begin();
    if (ok) assert(w.snd == nullptr); // only optional sound may be dropped
    a.release(); a.release(); // safe cleanup after any partial load, including retry
    fault = 0; calls = 0; assert(w.begin()); a.release();
    printf("PASS asset mode=%d read=%d outcome=%s retry=ok\n", mode, at, ok ? "optional-sound" : "rejected");
  }
  fault = 0; gm::Card cards[10];
  int count = gm::cardsOfFile(stdioLines, name.c_str(), "i0", cards, 10);
  int checked = 0;
  for (int i = 0; i < count; i++) if (cards[i].kind == 'g') {
    uint8_t* p = gm::loadPicture(a, rangeRead, cards[i].file); assert(p); free(p);
    for (fault = 1; fault <= 4; fault++) { p = gm::loadPicture(a, rangeRead, cards[i].file); assert(!p); }
    fault = 0; p = gm::loadPicture(a, rangeRead, cards[i].file); assert(p); free(p); checked++;
  }
  assert(checked > 0); puts("PASS card unavailable/open, short exact range, invalid deflate, excessive length; retry=ok");
  return 0;
}
